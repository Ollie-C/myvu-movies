import { supabase } from '@/lib/supabase';
import type { TMDBMovie } from '@/lib/api/tmdb';

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
      .upsert({
        user_id: userId,
        movie_id: movieId,
        rating: rating * 2, // Convert 5-star to 10-point scale
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleWatched(userId: string, movieId: number, watched: boolean) {
    const { data, error } = await supabase
      .from('user_movies')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        watched,
        watched_date: watched ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleWatchlist(userId: string, movieId: number, inWatchlist: boolean) {
    const { data, error } = await supabase
      .from('user_movies')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        watch_list: inWatchlist,
        watchlist_added_date: inWatchlist ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
