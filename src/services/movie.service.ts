import { supabase } from '@/lib/supabase';
import type { TMDBMovie } from '@/lib/api/tmdb';

export interface UserMovie {
  user_id: string;
  movie_id: number;
  rating: number | null;
  watched: boolean;
  watched_date: string | null;
  watch_list: boolean;
  watchlist_added_date: string | null;
  favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  movie: {
    id: number;
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string | null;
    release_date: string | null;
    vote_average: number | null;
    genres: any[];
    original_language: string | null;
    original_title: string | null;
    popularity: number | null;
  };
}

export const movieService = {
  // MOVIES TABLE
  async cacheMovie(tmdbMovie: TMDBMovie) {
    const { data: existingMovie } = await supabase
      .from('movies')
      .select('id')
      .eq('tmdb_id', tmdbMovie.id)
      .single();

    if (existingMovie) {
      return existingMovie;
    }

    const { data, error } = await supabase
      .from('movies')
      .upsert({
        tmdb_id: tmdbMovie.id,
        title: tmdbMovie.title,
        poster_path: tmdbMovie.poster_path,
        backdrop_path: tmdbMovie.backdrop_path,
        overview: tmdbMovie.overview,
        release_date: tmdbMovie.release_date,
        vote_average: tmdbMovie.vote_average,
        genres: tmdbMovie.genres,
        original_language: tmdbMovie.original_language,
        original_title: tmdbMovie.original_title,
        popularity: tmdbMovie.popularity,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // USER_MOVIES TABLE
  async getUserMovies(
    userId: string,
    options?: {
      filter?: 'all' | 'watched' | 'watchlist' | 'rated';
      sortBy?: 'added_date' | 'rating' | 'title' | 'release_date';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: UserMovie[]; count: number | null }> {
    const {
      filter = 'all',
      sortBy = 'added_date',
      sortOrder = 'desc',
      page = 1,
      limit = 24,
    } = options || {};

    let query = supabase
      .from('user_movies')
      .select(
        `
        *,
        movie:movies (*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId);

    // Apply filters
    switch (filter) {
      case 'watched':
        query = query.eq('watched', true);
        break;
      case 'watchlist':
        query = query.eq('watch_list', true);
        break;
      case 'rated':
        query = query.not('rating', 'is', null);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query = query.order('rating', {
          ascending: sortOrder === 'asc',
          nullsFirst: false,
        });
        break;
      case 'title':
        query = query.order('movie.title', { ascending: sortOrder === 'asc' });
        break;
      case 'release_date':
        query = query.order('movie.release_date', {
          ascending: sortOrder === 'asc',
          nullsFirst: false,
        });
        break;
      case 'added_date':
      default:
        query = query.order('updated_at', { ascending: sortOrder === 'asc' });
        break;
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count };
  },

  async getUserMovie(userId: string, movieId: number) {
    const { data } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();

    return data;
  },

  async updateRating(userId: string, movieId: number, rating: number) {
    const { data, error } = await supabase
      .from('user_movies')
      .upsert(
        {
          user_id: userId,
          movie_id: movieId,
          rating: rating * 2, // Convert 5-star to 10-point scale
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,movie_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleWatched(userId: string, movieId: number, watched: boolean) {
    // Get current state to preserve other fields
    const { data: currentMovie } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();

    const updateData: any = {
      user_id: userId,
      movie_id: movieId,
      watched,
      watched_date: watched ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      // Preserve existing rating
      rating: currentMovie?.rating || null,
      // Scenario 1: If marking as watched, remove from watchlist
      watch_list: watched ? false : currentMovie?.watch_list || false,
      watchlist_added_date: watched
        ? null
        : currentMovie?.watchlist_added_date || null,
    };

    const { data, error } = await supabase
      .from('user_movies')
      .upsert(updateData, {
        onConflict: 'user_id,movie_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleWatchlist(userId: string, movieId: number, inWatchlist: boolean) {
    // Get current state to preserve other fields
    const { data: currentMovie } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();

    const updateData: any = {
      user_id: userId,
      movie_id: movieId,
      watch_list: inWatchlist,
      watchlist_added_date: inWatchlist ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      // Scenario 2: Preserve watched status and rating when toggling watchlist
      watched: currentMovie?.watched || false,
      watched_date: currentMovie?.watched_date || null,
      rating: currentMovie?.rating || null,
      favorite: currentMovie?.favorite || false,
    };

    const { data, error } = await supabase
      .from('user_movies')
      .upsert(updateData, {
        onConflict: 'user_id,movie_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleFavorite(userId: string, movieId: number, isFavorite: boolean) {
    // Get current state to preserve other fields
    const { data: currentMovie } = await supabase
      .from('user_movies')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();

    const updateData: any = {
      user_id: userId,
      movie_id: movieId,
      favorite: isFavorite,
      updated_at: new Date().toISOString(),
      // Preserve all other fields
      watched: currentMovie?.watched || false,
      watched_date: currentMovie?.watched_date || null,
      rating: currentMovie?.rating || null,
      watch_list: currentMovie?.watch_list || false,
      watchlist_added_date: currentMovie?.watchlist_added_date || null,
      notes: currentMovie?.notes || null,
    };

    const { data, error } = await supabase
      .from('user_movies')
      .upsert(updateData, {
        onConflict: 'user_id,movie_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
