import { supabase } from '@/shared/lib/supabase';
import { z } from 'zod';
import {
  WatchedMovieSchema,
  type WatchedMovie,
} from '@/features/watched-movies/models/watched-movie.schema';
import {
  WatchedMovieWithDetailsSchema,
  type WatchedMovieWithDetails,
} from '@/features/watched-movies/models/watched-movies-with-details.schema';
import { dateHelpers } from '@/shared/utils/helpers/dateHelpers';
import { activityService } from '@/features/activity/api/activity.service';

const DEFAULT_ELO_SCORE = 1200;
const ELO_RATING_MULTIPLIER = 200;

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
      genreIds?: string[];
      directorIds?: string[];
      languages?: string[];
    }
  ): Promise<{ data: WatchedMovieWithDetails[]; count: number | null }> {
    const {
      sortBy = 'watched_date',
      sortOrder = 'desc',
      page = 1,
      limit = 24,
      onlyFavorites = false,
      onlyRated = false,
      genreIds,
      directorIds,
      languages,
    } = options || {};

    let query = supabase
      .from('watched_movies_with_details')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (onlyFavorites) query = query.eq('favorite', true);
    if (onlyRated) query = query.not('rating', 'is', null);
    if (genreIds?.length) query = query.contains('genre_ids', genreIds);
    if (directorIds?.length)
      query = query.contains('director_ids', directorIds);
    if (languages?.length) query = query.in('original_language', languages);

    if (sortBy === 'ranked') {
      query = query
        .not('rating', 'is', null)
        .order('rating', { ascending: sortOrder === 'asc' })
        .order('elo_score', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    const validated = z.array(WatchedMovieWithDetailsSchema).parse(data || []);
    return { data: validated, count };
  },

  async getWatchedMovie(
    userId: string,
    movieId: string
  ): Promise<WatchedMovieWithDetails | null> {
    const { data, error } = await supabase
      .from('watched_movies_with_details')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? WatchedMovieWithDetailsSchema.parse(data) : null;
  },

  async markAsWatched(
    userId: string,
    movie_uuid: string,
    watchedDate?: string
  ): Promise<WatchedMovie> {
    const { data, error } = await supabase
      .from('watched_movies')
      .upsert(
        {
          user_id: userId,
          movie_id: movie_uuid,
          watched_date: watchedDate || dateHelpers.getCurrentDate(),
          elo_score: DEFAULT_ELO_SCORE,
          updated_at: dateHelpers.getCurrentTimestamp(),
        },
        { onConflict: 'user_id,movie_id' }
      )
      .select()
      .single();

    if (error) throw error;
    const parsed = WatchedMovieSchema.parse(data);

    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'watched_added',
        movie_id: movie_uuid,
        metadata: { watched_date: parsed.watched_date },
      });
    } catch (_) {}

    return parsed;
  },

  async removeWatched(userId: string, movie_uuid: string): Promise<void> {
    const { error } = await supabase
      .from('watched_movies')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movie_uuid);

    if (error) throw error;

    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'watched_removed',
        movie_id: movie_uuid,
      });
    } catch (_) {}
  },

  async updateRating(
    userId: string,
    movieId: string,
    rating: number
  ): Promise<WatchedMovie> {
    const eloScore = Math.round(rating * ELO_RATING_MULTIPLIER);

    const { data, error } = await supabase
      .from('watched_movies')
      .update({
        rating,
        elo_score: eloScore,
        updated_at: dateHelpers.getCurrentTimestamp(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    const parsed = WatchedMovieSchema.parse(data);

    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'rated_movie',
        movie_id: movieId,
        metadata: { rating, elo_score: eloScore },
      });
    } catch (_) {}

    return parsed;
  },

  async toggleFavorite(userId: string, movieId: string): Promise<boolean> {
    const { data: current, error: fetchError } = await supabase
      .from('watched_movies')
      .select('favorite')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!current) throw new Error('Movie not found in watched list');

    const newFavoriteValue = !current.favorite;
    const { error: updateError } = await supabase
      .from('watched_movies')
      .update({
        favorite: newFavoriteValue,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (updateError) throw updateError;

    try {
      await activityService.logActivity({
        user_id: userId,
        type: newFavoriteValue ? 'favorite_added' : 'favorite_removed',
        movie_id: movieId,
      });
    } catch (_) {}

    return newFavoriteValue;
  },

  async updateNotes(
    userId: string,
    movieId: string,
    notes: string
  ): Promise<WatchedMovie> {
    const { data, error } = await supabase
      .from('watched_movies')
      .update({
        notes,
        updated_at: dateHelpers.getCurrentTimestamp(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    const parsed = WatchedMovieSchema.parse(data);

    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'notes_updated',
        movie_id: movieId,
      });
    } catch (_) {}
    return parsed;
  },

  async getFavoriteMovies(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('watched_movies_with_details')
      .select('*')
      .eq('user_id', userId)
      .eq('favorite', true)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return z.array(WatchedMovieWithDetailsSchema).parse(data || []);
  },

  async getRecentMovies(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('watched_movies_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return z.array(WatchedMovieWithDetailsSchema).parse(data || []);
  },
};
