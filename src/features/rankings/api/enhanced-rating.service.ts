import { supabase } from '@/shared/lib/supabase';
import { WatchedMovieWithDetailsSchema } from '@/features/watched-movies/models/watched-movies-with-details.schema';
import { z } from 'zod';

// Types
export interface EnhancedRatingResult {
  originalRating: number;
  finalRating: number;
  eloScore: number;
  battlesCompleted: number;
}

export interface RatingStats {
  totalRated: number;
  averageRating: number;
  averageElo: number;
  ratingDistribution: {
    '9-10': number;
    '8-8.9': number;
    '7-7.9': number;
    '6-6.9': number;
    '5-5.9': number;
    'Below 5': number;
  };
}

export const enhancedRatingService = {
  async completeEnhancedRating(
    userId: string,
    movieId: number,
    initialRating: number,
    notes?: string,
    tolerance = 0.5
  ): Promise<EnhancedRatingResult> {
    const { data, error } = await supabase.rpc('process_enhanced_rating', {
      p_user_id: userId,
      p_movie_id: movieId,
      p_initial_rating: initialRating,
      p_notes: notes,
      p_tolerance: tolerance,
    });

    if (error) throw error;
    return data;
  },

  async getRatingStats(userId: string): Promise<RatingStats> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('rating, elo_score')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    if (error) throw error;

    const ratings = data || [];
    const totalRated = ratings.length;

    if (totalRated === 0) {
      return {
        totalRated: 0,
        averageRating: 0,
        averageElo: 1200,
        ratingDistribution: {
          '9-10': 0,
          '8-8.9': 0,
          '7-7.9': 0,
          '6-6.9': 0,
          '5-5.9': 0,
          'Below 5': 0,
        },
      };
    }

    const averageRating =
      ratings.reduce((sum, movie) => sum + (movie.rating || 0), 0) / totalRated;
    const averageElo =
      ratings.reduce((sum, movie) => sum + (movie.elo_score || 1200), 0) /
      totalRated;

    return {
      totalRated,
      averageRating,
      averageElo,
      ratingDistribution: {
        '9-10': ratings.filter((m) => (m.rating || 0) >= 9).length,
        '8-8.9': ratings.filter(
          (m) => (m.rating || 0) >= 8 && (m.rating || 0) < 9
        ).length,
        '7-7.9': ratings.filter(
          (m) => (m.rating || 0) >= 7 && (m.rating || 0) < 8
        ).length,
        '6-6.9': ratings.filter(
          (m) => (m.rating || 0) >= 6 && (m.rating || 0) < 7
        ).length,
        '5-5.9': ratings.filter(
          (m) => (m.rating || 0) >= 5 && (m.rating || 0) < 6
        ).length,
        'Below 5': ratings.filter((m) => (m.rating || 0) < 5).length,
      },
    };
  },

  async findSimilarMovies(
    userId: string,
    movieId: number,
    rating: number,
    tolerance = 0.5
  ) {
    const { data, error } = await supabase
      .from('watched_movies')
      .select(
        `
        *,
        movie:movies (*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .neq('movie_id', movieId)
      .not('rating', 'is', null)
      .gte('rating', rating - tolerance)
      .lte('rating', rating + tolerance)
      .order('rating', { ascending: false })
      .limit(5);

    if (error) throw error;

    const validatedData = z
      .array(WatchedMovieWithDetailsSchema)
      .parse(data || []);

    return validatedData.sort((a, b) => {
      if (a.rating !== b.rating) {
        return (b.rating || 0) - (a.rating || 0);
      }
      return (b.elo_score || 0) - (a.elo_score || 0);
    });
  },
};
