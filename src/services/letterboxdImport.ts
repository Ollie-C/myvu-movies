// NOT AUDITED

import Papa from 'papaparse';
import { tmdb } from '@/lib/api/tmdb';
import type { TMDBMovie } from '@/schemas/movie.schema';
import { movieService } from '@/services/supabase/movies.service';
import { supabase } from '@/lib/supabase';

export interface LetterboxdEntry {
  Name: string;
  Year: string;
  'Letterboxd URI': string;
  Rating: string;
  Rewatch: string;
  Tags: string;
  'Watched Date': string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  currentMovies: string[];
  errors: string[];
}

export interface ImportResult {
  successful: number;
  failed: number;
  errors: string[];
  debugInfo?: {
    totalParsed: number;
    duplicatesSkipped: number;
    apiFailures: number;
    dbFailures: number;
    totalBatches: number;
    avgBatchTime: number;
  };
}

export function parseLetterboxdCSV(csvContent: string): LetterboxdEntry[] {
  const parseResult = Papa.parse<LetterboxdEntry>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      const normalized = header.trim().replace(/"/g, '');
      const headerMap: Record<string, string> = {
        name: 'Name',
        year: 'Year',
        'letterboxd uri': 'Letterboxd URI',
        rating: 'Rating',
        rewatch: 'Rewatch',
        tags: 'Tags',
        'watched date': 'Watched Date',
      };
      return headerMap[normalized.toLowerCase()] || normalized;
    },
    transform: (value: string) => value.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing errors:', parseResult.errors);
  }

  const entries = parseResult.data.filter((entry) => {
    return entry.Name && entry.Name.trim() !== '';
  });

  return entries;
}

/**
 * Convert Letterboxd rating to 0-10 scale
 */
function convertRating(letterboxdRating: string): number {
  if (!letterboxdRating || letterboxdRating === '') return 0;

  // Letterboxd uses 0.5-5.0 star rating, convert to 0-10
  const stars = parseFloat(letterboxdRating);
  return stars * 2;
}

/**
 * Search for movie on TMDB using title and year
 */
async function findMovieOnTMDB(
  title: string,
  year: string
): Promise<TMDBMovie | null> {
  try {
    // First try with year
    const searchQuery = year ? `${title} ${year}` : title;
    const results = await tmdb.searchMovies(searchQuery);

    if (results.results.length === 0) {
      // Try without year if no results
      if (year) {
        const fallbackResults = await tmdb.searchMovies(title);
        if (fallbackResults.results.length > 0) {
          return fallbackResults.results[0];
        }
      }
      return null;
    }

    // Find best match (prefer exact year match)
    if (year) {
      const exactYearMatch = results.results.find((movie: TMDBMovie) =>
        movie.release_date?.startsWith(year)
      );
      if (exactYearMatch) return exactYearMatch;
    }

    // Return first result if no exact year match
    return results.results[0];
  } catch (error) {
    console.error(`Error searching for movie "${title}":`, error);
    return null;
  }
}

// Batch cache movies to reduce database queries
async function batchCacheMovies(movies: TMDBMovie[]) {
  if (movies.length === 0) return new Map();

  // Get existing movies in one query
  const tmdbIds = movies.map((m) => m.id);
  const { data: existingMovies } = await supabase
    .from('movies')
    .select('id, tmdb_id')
    .in('tmdb_id', tmdbIds);

  const existingMap = new Map(
    existingMovies?.map((m) => [m.tmdb_id, m.id]) || []
  );

  // Filter out movies that already exist
  const newMovies = movies.filter((m) => !existingMap.has(m.id));

  // Insert new movies in batch
  if (newMovies.length > 0) {
    const { data: insertedMovies } = await supabase
      .from('movies')
      .upsert(
        newMovies.map((movie) => ({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          overview: movie.overview,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          genres: movie.genres,
          original_language: movie.original_language,
          original_title: movie.original_title,
          popularity: movie.popularity,
        }))
      )
      .select('id, tmdb_id');

    // Add new movies to the map
    insertedMovies?.forEach((m) => existingMap.set(m.tmdb_id, m.id));
  }

  return existingMap;
}

// Batch check user movies to reduce database queries
async function batchCheckUserMovies(userId: string, movieIds: number[]) {
  if (movieIds.length === 0) return new Set();

  const { data: userMovies } = await supabase
    .from('user_movies')
    .select('movie_id')
    .eq('user_id', userId)
    .in('movie_id', movieIds);

  return new Set(userMovies?.map((um) => um.movie_id) || []);
}

// Batch insert user movies for import (optimized for new entries)
async function batchInsertUserMovies(
  userId: string,
  movies: Array<{ movieId: number; rating: number; watchedDate: string | null }>
) {
  if (movies.length === 0) return;

  const now = new Date().toISOString();
  const userMovies = movies.map(({ movieId, rating, watchedDate }) => ({
    user_id: userId,
    movie_id: movieId,
    rating: rating > 0 ? rating : null,
    watched: true,
    watched_date: watchedDate || now,
    watch_list: false,
    watchlist_added_date: null,
    notes: null,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase.from('user_movies').upsert(userMovies, {
    onConflict: 'user_id,movie_id',
  });

  if (error) throw error;
}

/**
 * Create batches of entries for concurrent processing
 */
function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Process a batch of movie entries with concurrency control
 */
async function processBatch(
  batch: LetterboxdEntry[],
  processedMovieIds: Set<number>,
  userId: string
): Promise<{
  successful: number;
  failed: number;
  duplicates: number;
  errors: string[];
}> {
  // First, find all movies on TMDB
  const moviePromises = batch.map((entry) =>
    findMovieOnTMDB(entry.Name, entry.Year)
  );
  const movieResults = await Promise.allSettled(moviePromises);

  // Filter out failed movie lookups
  const validMovies: TMDBMovie[] = [];
  const validEntries: LetterboxdEntry[] = [];

  movieResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      validMovies.push(result.value);
      validEntries.push(batch[index]);
    }
  });

  if (validMovies.length === 0) {
    return {
      successful: 0,
      failed: batch.length,
      duplicates: 0,
      errors: batch.map((entry, index) =>
        movieResults[index].status === 'rejected'
          ? `Movie not found: ${entry.Name} (${entry.Year})`
          : `Failed to find movie: ${entry.Name}`
      ),
    };
  }

  // Batch cache movies first
  const cachedMoviesMap = await batchCacheMovies(validMovies);

  // Then check user movies
  const existingUserMoviesSet = await batchCheckUserMovies(
    userId,
    Array.from(cachedMoviesMap.values())
  );

  // Process each entry to collect data for batch insertion
  const moviesToInsert: Array<{
    movieId: number;
    rating: number;
    watchedDate: string | null;
  }> = [];
  const results = [];

  for (let i = 0; i < validEntries.length; i++) {
    const entry = validEntries[i];
    const movie = validMovies[i];

    // Check for duplicates
    if (processedMovieIds.has(movie.id)) {
      results.push({
        status: 'fulfilled',
        value: { success: true, duplicate: true, movie },
      });
      continue;
    }

    // Get cached movie ID from the map
    const cachedMovieId = cachedMoviesMap.get(movie.id);
    if (!cachedMovieId) {
      results.push({
        status: 'fulfilled',
        value: {
          success: false,
          error: `Failed to cache movie: ${entry.Name}`,
        },
      });
      continue;
    }

    // Check if user already has this movie
    if (existingUserMoviesSet.has(cachedMovieId)) {
      results.push({
        status: 'fulfilled',
        value: { success: true, duplicate: true, movie },
      });
      continue;
    }

    // Collect data for batch insertion
    const rating = convertRating(entry.Rating);
    const watchedDate = entry['Watched Date']
      ? new Date(entry['Watched Date']).toISOString()
      : null;

    moviesToInsert.push({
      movieId: cachedMovieId,
      rating,
      watchedDate,
    });

    processedMovieIds.add(movie.id);

    results.push({
      status: 'fulfilled',
      value: { success: true, movie },
    });
  }

  // Batch insert all user movies at once
  if (moviesToInsert.length > 0) {
    await batchInsertUserMovies(userId, moviesToInsert);
  }

  let successful = 0;
  let failed = 0;
  let duplicates = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    const { success, error, duplicate } = result.value;
    if (success) {
      if (duplicate) {
        duplicates++;
      } else {
        successful++;
      }
    } else {
      failed++;
      if (error) errors.push(error);
    }
  });

  return { successful, failed, duplicates, errors };
}

/**
 * Import movies from Letterboxd entries with optimized batching and concurrency
 */
export async function importFromLetterboxd(
  entries: LetterboxdEntry[],
  userId: string,
  onProgress?: (progress: ImportProgress) => void,
  concurrency: number = 5
): Promise<ImportResult> {
  const startTime = Date.now();
  const batches = createBatches(entries, concurrency);
  const batchTimes: number[] = [];

  const result: ImportResult = {
    successful: 0,
    failed: 0,
    errors: [],
    debugInfo: {
      totalParsed: entries.length,
      duplicatesSkipped: 0,
      apiFailures: 0,
      dbFailures: 0,
      totalBatches: batches.length,
      avgBatchTime: 0,
    },
  };

  const progress: ImportProgress = {
    total: entries.length,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: batches.length,
    currentMovies: [],
    errors: [],
  };

  console.log(
    `Starting optimized import of ${entries.length} movies in ${batches.length} batches (concurrency: ${concurrency})`
  );

  const processedMovieIds = new Set<number>();

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchStartTime = Date.now();

    progress.currentBatch = i + 1;
    progress.currentMovies = batch.map((entry) => entry.Name);

    console.log(
      `Processing batch ${i + 1}/${batches.length} (${batch.length} movies)`
    );

    try {
      const batchResult = await processBatch(batch, processedMovieIds, userId);

      // Update results
      result.successful += batchResult.successful;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
      result.debugInfo!.duplicatesSkipped += batchResult.duplicates;

      // Update progress
      progress.processed += batch.length;
      progress.successful = result.successful;
      progress.failed = result.failed;
      progress.errors = result.errors;

      const batchTime = Date.now() - batchStartTime;
      batchTimes.push(batchTime);

      console.log(
        `Batch ${i + 1} completed in ${batchTime}ms: ${
          batchResult.successful
        } successful, ${batchResult.failed} failed, ${
          batchResult.duplicates
        } duplicates`
      );

      // Report progress
      onProgress?.(progress);

      // Small delay between batches to be respectful to the API
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.error(`Error processing batch ${i + 1}:`, error);
      const errorMsg = `Batch ${i + 1} failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
      result.errors.push(errorMsg);
      progress.errors.push(errorMsg);
      result.failed += batch.length;
      progress.failed = result.failed;
      progress.processed += batch.length;
    }
  }

  // Calculate average batch time
  if (batchTimes.length > 0) {
    result.debugInfo!.avgBatchTime =
      batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length;
  }

  const totalTime = Date.now() - startTime;
  console.log(`Import completed in ${totalTime}ms. Results:`, {
    successful: result.successful,
    failed: result.failed,
    duplicates: result.debugInfo!.duplicatesSkipped,
    avgBatchTime: Math.round(result.debugInfo!.avgBatchTime),
  });

  return result;
}

/**
 * Validate Letterboxd CSV format using papaparse
 */
export function validateLetterboxdCSV(csvContent: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Quick parse to check format
    const parseResult = Papa.parse(csvContent, {
      header: true,
      preview: 1, // Only parse first row to check headers
    });

    if (parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(
        (error) => error.type === 'Delimiter' || error.type === 'Quotes'
      );
      if (criticalErrors.length > 0) {
        return {
          valid: false,
          error: `CSV format error: ${criticalErrors[0].message}`,
        };
      }
    }

    if (!parseResult.meta.fields || parseResult.meta.fields.length === 0) {
      return {
        valid: false,
        error: 'CSV file appears to have no headers',
      };
    }

    // Check for required headers (case-insensitive)
    const headers = parseResult.meta.fields.map((h) => h.toLowerCase().trim());
    const hasNameColumn = headers.some((h) => h.includes('name'));

    if (!hasNameColumn) {
      return {
        valid: false,
        error:
          'Missing required column: Name. Make sure this is a Letterboxd export file.',
      };
    }

    if (parseResult.data.length === 0) {
      return {
        valid: false,
        error: 'CSV file appears to be empty or has no data rows',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid CSV format. Please check your file.',
    };
  }
}
