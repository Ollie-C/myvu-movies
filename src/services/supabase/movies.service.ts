import { supabase } from '@/lib/supabase';
import {
  MovieSchema,
  type Movie,
  type TMDBMovie,
} from '@/schemas/movie.schema';
import type { BaseMovieDetails } from '@/types/userMovie';
import { movieHelpers } from '@/schemas/movie.schema';

export const movieService = {
  async cacheMovie(tmdbMovie: TMDBMovie): Promise<Movie> {
    const existingMovie = await movieService.getMovieByTmdbId(tmdbMovie.id);

    if (existingMovie) {
      if (movieService.shouldUpdateMovie(existingMovie)) {
        return await movieService.updateMovie(existingMovie.id, tmdbMovie);
      }
      return existingMovie;
    }

    const movieData = movieHelpers.fromTMDB(tmdbMovie);

    const { data, error } = await supabase
      .from('movies')
      .insert(movieData)
      .select()
      .single();

    if (error) throw error;
    return MovieSchema.parse(data);
  },

  async cacheBatchMovies(tmdbMovies: TMDBMovie[]): Promise<Movie[]> {
    if (tmdbMovies.length === 0) return [];
    const tmdbIds = tmdbMovies.map((m) => m.id);

    const existingMovies = await this.getMoviesByTmdbIds(tmdbIds);
    const existingTmdbIds = new Set(existingMovies.map((m) => m.tmdb_id));

    const newMovies = tmdbMovies.filter((m) => !existingTmdbIds.has(m.id));
    if (newMovies.length === 0) return existingMovies;

    const movieData = newMovies.map((movie) => movieHelpers.fromTMDB(movie));

    const { data, error } = await supabase
      .from('movies')
      .insert(movieData)
      .select();

    if (error) throw error;

    const insertedMovies = (data || []).map((row) => MovieSchema.parse(row));
    return [...existingMovies, ...insertedMovies];
  },

  async updateMovie(movieId: string, tmdbMovie: TMDBMovie): Promise<Movie> {
    const updateData = movieHelpers.fromTMDB(tmdbMovie);

    const { data, error } = await supabase
      .from('movies')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', movieId)
      .select()
      .single();

    if (error) throw error;
    return MovieSchema.parse(data);
  },

  shouldUpdateMovie(movie: Movie): boolean {
    if (!movie.runtime || !movie.tagline) return true;
    if (!movie.updated_at) return true;

    const lastUpdate = new Date(movie.updated_at);
    const daysOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 7;
  },

  async getMovieRaw(movieId: string): Promise<Movie | null> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? MovieSchema.parse(data) : null;
  },

  async getMovieByTmdbId(tmdbId: number): Promise<Movie | null> {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? MovieSchema.parse(data) : null;
  },

  async getMoviesByIds(movieIds: string[]): Promise<Movie[]> {
    if (movieIds.length === 0) return [];
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .in('id', movieIds);
    if (error) throw error;
    return (data || []).map((row) => MovieSchema.parse(row));
  },

  async getMoviesByTmdbIds(tmdbIds: number[]): Promise<Movie[]> {
    if (tmdbIds.length === 0) return [];
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .in('tmdb_id', tmdbIds);
    if (error) throw error;
    return (data || []).map((row) => MovieSchema.parse(row));
  },

  async getMovieWithDetails(movieId: string): Promise<BaseMovieDetails | null> {
    const { data, error } = await supabase.rpc('get_movie_with_details', {
      movie_id_param: movieId,
    });
    if (error) throw error;
    return data ? (data as BaseMovieDetails) : null;
  },

  async getMovieWithDetailsByTmdbId(
    tmdbId: number
  ): Promise<BaseMovieDetails | null> {
    const { data, error } = await supabase.rpc('get_movie_with_details', {
      tmdb_id_param: tmdbId,
    });
    if (error) throw error;
    return data ? (data as BaseMovieDetails) : null;
  },

  async getMoviesWithDetailsByIds(
    movieIds: string[]
  ): Promise<BaseMovieDetails[]> {
    if (!movieIds?.length) return [];
    const { data, error } = await supabase.rpc('get_movies_with_details', {
      movie_ids_param: movieIds,
    });
    if (error) throw error;
    return (data || []) as BaseMovieDetails[];
  },

  async getMoviesWithDetailsByTmdbIds(
    tmdbIds: number[]
  ): Promise<BaseMovieDetails[]> {
    if (!tmdbIds?.length) return [];
    const { data, error } = await supabase.rpc('get_movies_with_details', {
      tmdb_ids_param: tmdbIds,
    });
    if (error) throw error;
    return (data || []) as BaseMovieDetails[];
  },

  async getPopularMovies(limit = 20): Promise<BaseMovieDetails[]> {
    const { data, error } = await supabase
      .from('movies_with_details')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as BaseMovieDetails[];
  },

  async getRecentMovies(days = 30, limit = 20): Promise<BaseMovieDetails[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const { data, error } = await supabase
      .from('movies_with_details')
      .select('*')
      .gte('release_date', daysAgo.toISOString().split('T')[0])
      .order('release_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as BaseMovieDetails[];
  },

  async getMoviesByGenre(
    genreName: string,
    limit = 20
  ): Promise<BaseMovieDetails[]> {
    const { data, error } = await supabase
      .from('movies_with_details')
      .select('*')
      .ilike('genre_names', `%${genreName}%`) // workable since genre_names is array<string>
      .limit(limit);

    if (error) throw error;
    return (data || []) as BaseMovieDetails[];
  },

  async getEnrichedMovie(movieId: string) {
    const movie = await this.getMovieWithDetails(movieId);
    if (!movie) return null;

    return {
      ...movie,
      posterUrl: movieHelpers.getPosterUrl(movie),
      backdropUrl: movieHelpers.getBackdropUrl(movie),
      displayTitle: movieHelpers.getDisplayTitle(movie),
      releaseYear: movieHelpers.getReleaseYear(movie),
    };
  },

  async getCacheStats(): Promise<{
    totalMovies: number;
    recentlyAdded: number;
    popularMovies: number;
  }> {
    const [total, recent, popular] = await Promise.all([
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
      totalMovies: total.count || 0,
      recentlyAdded: recent.count || 0,
      popularMovies: popular.count || 0,
    };
  },
};
