// AUDITED 01/08/2025
import { supabase } from '@/lib/supabase';
import {
  MovieSchema,
  MovieInsertSchema,
  movieHelpers,
  type Movie,
  type TMDBMovie,
} from '@/schemas/movie.schema';

export const movieService = {
  // cacheMovie: Check if movie exists in Supabase, if not, insert it
  async cacheMovie(tmdbMovie: TMDBMovie): Promise<Movie> {
    const existingMovie = await this.getMovieByTmdbId(tmdbMovie.id);

    if (existingMovie) {
      if (this.shouldUpdateMovie(existingMovie)) {
        return this.updateMovie(existingMovie.id, tmdbMovie);
      }
      return existingMovie;
    }

    const movieData = MovieInsertSchema.parse({
      tmdb_id: tmdbMovie.id,
      title: tmdbMovie.title,
      poster_path: tmdbMovie.poster_path,
      backdrop_path: tmdbMovie.backdrop_path,
      overview: tmdbMovie.overview,
      release_date: tmdbMovie.release_date,
      vote_average: tmdbMovie.vote_average,
      genres: tmdbMovie.genres || [],
      original_language: tmdbMovie.original_language,
      original_title: tmdbMovie.original_title,
      popularity: tmdbMovie.popularity,
    });

    const { data, error } = await supabase
      .from('movies')
      .insert(movieData)
      .select()
      .single();

    if (error) throw error;
    return MovieSchema.parse(data);
  },

  // getMovie: Get movie from Supabase
  async getMovie(movieId: number): Promise<Movie | null> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return MovieSchema.parse(data);
  },

  // getMovieByTmdbId: Get movie from Supabase by TMDB ID
  async getMovieByTmdbId(tmdbId: number): Promise<Movie | null> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return MovieSchema.parse(data);
  },

  // updateMovie: Update movie in Supabase
  async updateMovie(movieId: number, tmdbMovie: TMDBMovie): Promise<Movie> {
    const updateData = {
      title: tmdbMovie.title,
      poster_path: tmdbMovie.poster_path,
      backdrop_path: tmdbMovie.backdrop_path,
      overview: tmdbMovie.overview,
      release_date: tmdbMovie.release_date,
      vote_average: tmdbMovie.vote_average,
      genres: tmdbMovie.genres || [],
      original_language: tmdbMovie.original_language,
      original_title: tmdbMovie.original_title,
      popularity: tmdbMovie.popularity,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movieId)
      .select()
      .single();

    if (error) throw error;
    return MovieSchema.parse(data);
  },

  // searchMovies: Search for movies in Supabase
  async searchMovies(query: string, limit = 10): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(limit)
      .order('popularity', { ascending: false });

    if (error) throw error;
    return data.map((movie) => MovieSchema.parse(movie));
  },

  // getMoviesByIds: Get movies from Supabase by IDs
  async getMoviesByIds(movieIds: number[]): Promise<Movie[]> {
    if (movieIds.length === 0) return [];

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .in('id', movieIds);

    if (error) throw error;
    return data.map((movie) => MovieSchema.parse(movie));
  },

  // getMoviesByTmdbIds: Get movies from Supabase by TMDB IDs
  async getMoviesByTmdbIds(tmdbIds: number[]): Promise<Movie[]> {
    if (tmdbIds.length === 0) return [];

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .in('tmdb_id', tmdbIds);

    if (error) throw error;
    return data.map((movie) => MovieSchema.parse(movie));
  },

  // cacheBatchMovies: Cache a batch of movies
  async cacheBatchMovies(tmdbMovies: TMDBMovie[]): Promise<Movie[]> {
    if (tmdbMovies.length === 0) return [];

    const tmdbIds = tmdbMovies.map((m) => m.id);
    const existingMovies = await this.getMoviesByTmdbIds(tmdbIds);
    const existingTmdbIds = new Set(existingMovies.map((m) => m.tmdb_id));

    const newMovies = tmdbMovies.filter((m) => !existingTmdbIds.has(m.id));

    if (newMovies.length === 0) return existingMovies;

    const movieData = newMovies.map((movie) =>
      MovieInsertSchema.parse({
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genres: movie.genres || [],
        original_language: movie.original_language,
        original_title: movie.original_title,
        popularity: movie.popularity,
      })
    );

    const { data, error } = await supabase
      .from('movies')
      .insert(movieData)
      .select();

    if (error) throw error;

    const insertedMovies = data.map((movie) => MovieSchema.parse(movie));
    return [...existingMovies, ...insertedMovies];
  },

  // getPopularMovies: Get popular movies from Supabase
  async getPopularMovies(limit = 20): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map((movie) => MovieSchema.parse(movie));
  },

  // getRecentMovies: Get recent movies from Supabase
  async getRecentMovies(days = 30, limit = 20): Promise<Movie[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .gte('release_date', daysAgo.toISOString().split('T')[0])
      .order('release_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map((movie) => MovieSchema.parse(movie));
  },

  // getMoviesByGenre: Get movies from Supabase by genre
  async getMoviesByGenre(genreName: string, limit = 20): Promise<Movie[]> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .limit(limit);

    if (error) throw error;

    // Filter by genre in memory (Supabase doesn't support JSON array queries well)
    const movies = data
      .map((movie) => MovieSchema.parse(movie))
      .filter((movie) =>
        movie.genres?.some(
          (genre) => genre.name.toLowerCase() === genreName.toLowerCase()
        )
      );

    return movies;
  },

  // shouldUpdateMovie: Helper to determine if movie data should be updated
  shouldUpdateMovie(movie: Movie): boolean {
    if (!movie.updated_at) return true;

    const lastUpdate = new Date(movie.updated_at);
    const daysSinceUpdate =
      (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    // Update if older than 7 days
    return daysSinceUpdate > 7;
  },

  // getEnrichedMovie: Get movie with additional computed properties (for UI)
  async getEnrichedMovie(movieId: number): Promise<
    | (Movie & {
        posterUrl: string | null;
        backdropUrl: string | null;
        displayTitle: string;
        releaseYear: number | null;
      })
    | null
  > {
    const movie = await this.getMovie(movieId);
    if (!movie) return null;

    return {
      ...movie,
      posterUrl: movieHelpers.getPosterUrl(movie),
      backdropUrl: movieHelpers.getBackdropUrl(movie),
      displayTitle: movieHelpers.getDisplayTitle(movie),
      releaseYear: movieHelpers.getReleaseYear(movie),
    };
  },

  // getCacheStats: Get basic stats about cached movies
  async getCacheStats(): Promise<{
    totalMovies: number;
    recentlyAdded: number;
    popularMovies: number;
  }> {
    const [totalResult, recentResult, popularResult] = await Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }),
      supabase
        .from('movies')
        .select('id', { count: 'exact', head: true })
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),
      supabase
        .from('movies')
        .select('id', { count: 'exact', head: true })
        .gte('vote_average', 7.5),
    ]);

    return {
      totalMovies: totalResult.count || 0,
      recentlyAdded: recentResult.count || 0,
      popularMovies: popularResult.count || 0,
    };
  },
};
