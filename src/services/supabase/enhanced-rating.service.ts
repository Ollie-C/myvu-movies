// NOT AUDITED

import { supabase } from '@/lib/supabase';
import { WatchedMovieWithMovieSchema } from '@/schemas/watched-movie.schema';
import {
  calculateElo,
  ratingToElo,
  eloToRating,
} from '@/lib/ranking-engine/elo';
import { z } from 'zod';

export interface EnhancedRatingResult {
  originalRating: number;
  finalRating: number;
  eloScore: number;
  battlesCompleted: number;
}

export class EnhancedRatingService {
  // Find similar movies based on rating
  static async findSimilarMovies(
    userId: string,
    movieId: number,
    rating: number,
    tolerance: number = 0.5
  ) {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .not('movie_id', 'eq', movieId)
      .not('rating', 'is', null)
      .gte('rating', rating - tolerance)
      .lte('rating', rating + tolerance)
      .order('rating', { ascending: false })
      .order('elo_score', { ascending: false });

    if (error) throw error;

    return z
      .array(WatchedMovieWithMovieSchema)
      .parse(data || [])
      .sort((a, b) => {
        // Sort by rating first, then by ELO score
        if (a.rating !== b.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return (b.elo_score || 0) - (a.elo_score || 0);
      })
      .slice(0, 5);
  }

  // Process a battle between two movies
  static async processBattle(
    userId: string,
    winnerId: number,
    loserId: number,
    winnerElo: number,
    loserElo: number
  ) {
    // Calculate new ELO scores
    const eloResult = calculateElo(winnerElo, loserElo, 32); // K-factor of 32

    // Update both movies' ELO scores
    const updates = [
      {
        user_id: userId,
        movie_id: Math.floor(winnerId),
        elo_score: eloResult.winnerNewRating,
      },
      {
        user_id: userId,
        movie_id: Math.floor(loserId),
        elo_score: eloResult.loserNewRating,
      },
    ];

    const { error } = await supabase.from('watched_movies').upsert(updates, {
      onConflict: 'user_id,movie_id',
    });

    if (error) throw error;

    return {
      winnerNewElo: eloResult.winnerNewRating,
      loserNewElo: eloResult.loserNewRating,
    };
  }

  // Convert ELO score back to rating using simplified formula
  static eloToRating(eloScore: number): number {
    // Use the simplified ELO to rating conversion: eloScore / 200
    return Math.max(1, Math.min(10, eloScore / 200));
  }

  // Convert rating to ELO score using simplified formula
  static ratingToElo(rating: number): number {
    // Use the simplified rating to ELO conversion: rating * 200
    return Math.round(rating * 200);
  }

  // Complete enhanced rating process
  static async completeEnhancedRating(
    userId: string,
    movieId: number,
    initialRating: number,
    notes?: string
  ): Promise<EnhancedRatingResult> {
    // 1. Save initial rating with ELO
    const initialElo = this.ratingToElo(initialRating);

    console.log('🎯 Enhanced Rating Started:', {
      movieId,
      userId,
      initialRating,
      initialElo,
      timestamp: new Date().toISOString(),
    });

    const { error: saveError } = await supabase.from('watched_movies').upsert(
      {
        user_id: userId,
        movie_id: Math.floor(movieId),
        rating: initialRating,
        elo_score: initialElo,
        notes: notes || null,
        watched_date: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,movie_id',
      }
    );

    if (saveError) throw saveError;

    // 2. Find similar movies
    const similarMovies = await this.findSimilarMovies(
      userId,
      movieId,
      initialRating
    );

    console.log('🔍 Similar Movies Found:', {
      movieId,
      similarMoviesCount: similarMovies.length,
      similarMovies: similarMovies.map((m) => ({
        title: m.movie?.title,
        rating: m.rating,
        elo_score: m.elo_score,
      })),
    });

    if (similarMovies.length === 0) {
      console.log('✅ No similar movies found, using initial rating');
      return {
        originalRating: initialRating,
        finalRating: initialRating,
        eloScore: initialElo,
        battlesCompleted: 0,
      };
    }

    // 3. Process battles with similar movies
    let currentElo = initialElo;
    let battlesCompleted = 0;

    for (const similarMovie of similarMovies) {
      try {
        const battleResult = await this.processBattle(
          userId,
          movieId,
          similarMovie.movie_id!,
          currentElo,
          similarMovie.elo_score || this.ratingToElo(similarMovie.rating!)
        );

        console.log('⚔️ Battle Completed:', {
          battleNumber: battlesCompleted + 1,
          currentMovie: movieId,
          opponentMovie: similarMovie.movie_id,
          opponentTitle: similarMovie.movie?.title,
          eloBefore: currentElo,
          eloAfter: battleResult.winnerNewElo,
          eloChange: battleResult.winnerNewElo - currentElo,
        });

        currentElo = battleResult.winnerNewElo;
        battlesCompleted++;
      } catch (error) {
        console.error('Error processing battle:', error);
      }
    }

    // 4. Update final ELO and convert back to rating
    const finalRating = this.eloToRating(currentElo);

    const { error: updateError } = await supabase
      .from('watched_movies')
      .update({
        rating: finalRating,
        elo_score: currentElo,
      })
      .eq('user_id', userId)
      .eq('movie_id', Math.floor(movieId));

    if (updateError) throw updateError;

    console.log('🏆 Enhanced Rating Completed:', {
      movieId,
      userId,
      originalRating: initialRating,
      finalRating,
      originalElo: initialElo,
      finalElo: currentElo,
      battlesCompleted,
      ratingChange: finalRating - initialRating,
      eloChange: currentElo - initialElo,
    });

    return {
      originalRating: initialRating,
      finalRating: finalRating,
      eloScore: currentElo,
      battlesCompleted,
    };
  }

  // Get rating statistics for a user
  static async getRatingStats(userId: string) {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('rating, elo_score')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    if (error) throw error;

    const ratings = data || [];
    const totalRated = ratings.length;
    const averageRating =
      totalRated > 0
        ? ratings.reduce((sum, movie) => sum + (movie.rating || 0), 0) /
          totalRated
        : 0;
    const averageElo =
      totalRated > 0
        ? ratings.reduce((sum, movie) => sum + (movie.elo_score || 1500), 0) /
          totalRated
        : 1500;

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
  }
}
