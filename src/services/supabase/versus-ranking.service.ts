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
    userId: string,
    rankingListId?: string
  ): Promise<any> {
    if (!rankingListId) {
      throw new Error('Ranking list ID is required for versus battles');
    }

    console.log(winnerId, loserId, rankingListId);

    const { data, error } = await supabase.rpc('process_versus_battle', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_ranking_list_id: rankingListId,
    });

    if (error) {
      console.error('Failed to process versus battle:', error);
      throw error;
    }

    console.log('ELO result', data);

    return data;
  },
};
