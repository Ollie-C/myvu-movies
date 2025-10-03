import Papa from 'papaparse';
import { tmdb } from '@/shared/lib/tmdb';
import type { TMDBMovie } from '@/features/movies/models/movie.schema';
import { movieService } from '@/features/movies/api/movies.service';
import { watchedMoviesService } from '@/features/watched-movies/api/watched-movies.service';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 250;
const RATING_MULTIPLIER = 2;

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

function convertRating(letterboxdRating: string): number {
  if (!letterboxdRating || letterboxdRating === '') return 0;

  const stars = parseFloat(letterboxdRating);
  return stars * RATING_MULTIPLIER;
}

async function findMovieOnTMDB(
  title: string,
  year: string
): Promise<TMDBMovie | null> {
  try {
    const searchQuery = year ? `${title} ${year}` : title;
    const results = await tmdb.searchMovies(searchQuery);

    if (results.results.length === 0) {
      if (year) {
        const fallbackResults = await tmdb.searchMovies(title);
        if (fallbackResults.results.length > 0) {
          return fallbackResults.results[0];
        }
      }
      return null;
    }

    if (year) {
      const exactYearMatch = results.results.find((movie: TMDBMovie) =>
        movie.release_date?.startsWith(year)
      );
      if (exactYearMatch) return exactYearMatch;
    }

    return results.results[0];
  } catch (error) {
    console.error(`Error searching for movie "${title}":`, error);
    return null;
  }
}

async function batchCacheMovies(movies: TMDBMovie[]) {
  if (movies.length === 0) return new Map();

  try {
    const cachedMovies = await movieService.cacheBatchMovies(movies);

    const movieMap = new Map(
      cachedMovies.map((movie) => [movie.tmdb_id, movie.id])
    );

    return movieMap;
  } catch (error) {
    console.error('Error caching movies:', error);
    throw error;
  }
}

async function batchCheckUserMovies(userId: string, movieIds: string[]) {
  if (movieIds.length === 0) return new Set();

  const { data: userMovies } = await watchedMoviesService.getWatchedMovies(
    userId,
    {
      limit: 1000,
      sortBy: 'watched_date',
      sortOrder: 'desc',
    }
  );

  const userMovieIds = userMovies
    .filter((movie) => movie.movie_id && movieIds.includes(movie.movie_id))
    .map((movie) => movie.movie_id!);

  return new Set(userMovieIds);
}

async function batchInsertUserMovies(
  userId: string,
  movies: Array<{ movieId: string; rating: number; watchedDate: string | null }>
) {
  if (movies.length === 0) return;

  const now = new Date().toISOString();

  for (const { movieId, rating, watchedDate } of movies) {
    try {
      await watchedMoviesService.markAsWatched(
        userId,
        movieId,
        watchedDate || now
      );

      if (rating > 0) {
        await watchedMoviesService.updateRating(userId, movieId, rating);
      }
    } catch (error) {
      console.error(`Failed to insert movie ${movieId}:`, error);
      throw error;
    }
  }
}

function createBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

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
  const moviePromises = batch.map((entry) =>
    findMovieOnTMDB(entry.Name, entry.Year)
  );
  const movieResults = await Promise.allSettled(moviePromises);

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

  const cachedMoviesMap = await batchCacheMovies(validMovies);

  const existingUserMoviesSet = await batchCheckUserMovies(
    userId,
    Array.from(cachedMoviesMap.values())
  );

  const moviesToInsert: Array<{
    movieId: string;
    rating: number;
    watchedDate: string | null;
  }> = [];
  const results = [];

  for (let i = 0; i < validEntries.length; i++) {
    const entry = validEntries[i];
    const movie = validMovies[i];

    if (processedMovieIds.has(movie.id)) {
      results.push({
        status: 'fulfilled',
        value: { success: true, duplicate: true, movie },
      });
      continue;
    }

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

    if (existingUserMoviesSet.has(cachedMovieId)) {
      results.push({
        status: 'fulfilled',
        value: { success: true, duplicate: true, movie },
      });
      continue;
    }

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

  if (moviesToInsert.length > 0) {
    await batchInsertUserMovies(userId, moviesToInsert);
  }

  let successful = 0;
  let failed = 0;
  let duplicates = 0;
  const errors: string[] = [];

  results.forEach((result) => {
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

export async function importFromLetterboxd(
  entries: LetterboxdEntry[],
  userId: string,
  onProgress?: (progress: ImportProgress) => void,
  concurrency: number = BATCH_SIZE
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

      result.successful += batchResult.successful;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);
      result.debugInfo!.duplicatesSkipped += batchResult.duplicates;

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

      onProgress?.(progress);

      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
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

export function validateLetterboxdCSV(csvContent: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const parseResult = Papa.parse(csvContent, {
      header: true,
      preview: 1,
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
