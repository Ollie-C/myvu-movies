// AUDITED 12/08/2025

import { supabase } from '@/lib/supabase';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

export interface VersusPair {
  movie1: WatchedMovieWithMovie;
  movie2: WatchedMovieWithMovie;
}

export const versusRankingService = {
  // Get user's watched movies for versus ranking
  async getWatchedMoviesForVersus(
    userId: string
  ): Promise<WatchedMovieWithMovie[]> {
    const { data: watchedMovies, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId);

    if (error) throw error;

    return watchedMovies || [];
  },

  // Create random pairs from watched movies
  createRandomPairs(watchedMovies: WatchedMovieWithMovie[]): VersusPair[] {
    if (watchedMovies.length < 2) return [];

    const shuffled = [...watchedMovies].sort(() => Math.random() - 0.5);
    const pairs = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      pairs.push({
        movie1: shuffled[i],
        movie2: shuffled[i + 1],
      });
    }

    return pairs;
  },

  // Process a versus battle result (this will update ELO scores)
  async processVersusBattle(
    winnerId: number,
    loserId: number,
    userId: string
  ): Promise<void> {
    // For now, we'll just log the battle result
    // In the future, this will call the ELO calculation RPC function
    console.log('Versus Battle Result:', {
      winnerId,
      loserId,
      userId,
    });

    // TODO: Implement ELO calculation and update
    // This should call the ranking service's processRankingBattle method
    // or a new versus-specific ELO update function
  },
};
