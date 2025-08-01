// DONE
import { supabase } from '@/lib/supabase';

// Schemas
import {
  WatchedMovieSchema,
  WatchedMovieWithMovieSchema,
  type WatchedMovie,
  type WatchedMovieWithMovie,
} from '@/schemas/watched-movie.schema';

// Utils
import { z } from 'zod';

// Services
export const watchedMoviesService = {
  async getWatchedMovies(
    userId: string,
    options?: {
      sortBy?: 'watched_date' | 'rating' | 'title' | 'ranked';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
      onlyFavorites?: boolean;
      onlyRated?: boolean;
    }
  ): Promise<{
    data: WatchedMovieWithMovie[];
    count: number | null;
  }> {
    const {
      sortBy = 'watched_date',
      sortOrder = 'desc',
      page = 1,
      limit = 24,
      onlyFavorites = false,
      onlyRated = false,
    } = options || {};

    let query = supabase
      .from('watched_movies')
      .select(
        `
        *,
        movie:movies (*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId);

    if (onlyFavorites) {
      query = query.eq('favorite', true);
    }

    if (onlyRated) {
      query = query.not('rating', 'is', null);
    }

    // Apply sorting
    if (sortBy === 'ranked') {
      // For ranked sorting: rating first (desc), then ELO score (desc)
      query = query
        .not('rating', 'is', null) // Only include rated movies for ranking
        .order('rating', { ascending: false })
        .order('elo_score', { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    const validatedData = z
      .array(WatchedMovieWithMovieSchema)
      .parse(data || []);

    return { data: validatedData, count };
  },

  async getWatchedMovie(
    userId: string,
    movieId: number
  ): Promise<WatchedMovie | null> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return WatchedMovieSchema.parse(data);
  },

  async markAsWatched(
    userId: string,
    movieId: number,
    watchedDate?: string
  ): Promise<WatchedMovie> {
    const { data, error } = await supabase
      .from('watched_movies')
      .upsert(
        {
          user_id: userId,
          movie_id: movieId,
          watched_date: watchedDate || new Date().toISOString().split('T')[0],
          elo_score: 1600, // Default ELO score for new watched movies
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,movie_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    // Console log when movie is marked as watched with default ELO
    console.log('📽️ Movie Marked as Watched:', {
      movieId,
      userId,
      defaultElo: 1600,
      watchedDate: watchedDate || new Date().toISOString().split('T')[0],
    });

    return WatchedMovieSchema.parse(data);
  },

  async removeWatched(userId: string, movieId: number): Promise<void> {
    const { error } = await supabase
      .from('watched_movies')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (error) throw error;
  },

  async updateRating(
    userId: string,
    movieId: number,
    rating: number
  ): Promise<WatchedMovie> {
    // Calculate ELO score based on simplified rating (rating * 200)
    // This makes it much more intuitive: 8.2/10 = 1640 ELO, 7.3/10 = 1460 ELO
    const eloScore = Math.round(rating * 200);

    const { data, error } = await supabase
      .from('watched_movies')
      .update({
        rating: rating, // Use 10-point scale directly
        elo_score: eloScore, // Update ELO score based on rating
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;

    // Console log when rating is updated with new ELO
    console.log('⭐ Rating Updated:', {
      movieId,
      userId,
      rating,
      newEloScore: eloScore,
      timestamp: new Date().toISOString(),
    });

    return WatchedMovieSchema.parse(data);
  },

  async getUnratedMovies(userId: string): Promise<WatchedMovieWithMovie[]> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .is('rating', null)
      .order('watched_date', { ascending: false });

    if (error) throw error;
    return z.array(WatchedMovieWithMovieSchema).parse(data || []);
  },

  async toggleFavorite(userId: string, movieId: number) {
    const existing = await this.getWatchedMovie(userId, movieId);
    if (!existing) {
      throw new Error('Movie must be watched before marking as favorite');
    }

    const { data, error } = await supabase
      .from('watched_movies')
      .update({
        favorite: !existing.favorite,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    return WatchedMovieSchema.parse(data);
  },

  async updateNotes(
    userId: string,
    movieId: number,
    notes: string
  ): Promise<WatchedMovie> {
    const { data, error } = await supabase
      .from('watched_movies')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    return WatchedMovieSchema.parse(data);
  },

  async getFavoriteMovies(
    userId: string,
    limit = 10
  ): Promise<WatchedMovieWithMovie[]> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .eq('favorite', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return z.array(WatchedMovieWithMovieSchema).parse(data || []);
  },

  async getRecentMovies(
    userId: string,
    limit = 10
  ): Promise<WatchedMovieWithMovie[]> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return z.array(WatchedMovieWithMovieSchema).parse(data || []);
  },
};
