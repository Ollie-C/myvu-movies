// AUDITED 06/08/2025
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database.types';
import shuffle from '@/utils/shuffle';

// Constants
const DEFAULT_ELO_RATING = 1500;
const MIN_MOVIES_FOR_RANKING = 2;

// Types
type RankingItem = Tables<'ranking_items'>;
type RankingBattle = TablesInsert<'ranking_battles'>;

export interface RankingBattleResult {
  winnerId: number;
  loserId: number;
  rankingListId: string;
}

export interface MoviePair {
  movie1: RankingItem;
  movie2: RankingItem;
}

export interface BattleProcessResult {
  success: boolean;
  eloResult: {
    winnerNewRating: number;
    loserNewRating: number;
  };
  battleRecord: RankingBattle;
}

export const rankingService = {
  async processRankingBattle(
    result: RankingBattleResult,
    winnerCurrentRating = DEFAULT_ELO_RATING,
    loserCurrentRating = DEFAULT_ELO_RATING
  ): Promise<BattleProcessResult> {
    const { data, error } = await supabase.rpc('process_ranking_battle', {
      p_ranking_list_id: result.rankingListId,
      p_winner_movie_id: result.winnerId,
      p_loser_movie_id: result.loserId,
      p_winner_current_rating: winnerCurrentRating,
      p_loser_current_rating: loserCurrentRating,
    });

    if (error) throw error;
    return data;
  },

  async getRandomMoviePair(
    rankingListId: string,
    userId: string
  ): Promise<MoviePair | null> {
    // Get watched movies
    const { data: watchedMovies, error: watchedError } = await supabase
      .from('watched_movies')
      .select('movie_id, movie:movies(*)')
      .eq('user_id', userId);

    if (watchedError) throw watchedError;

    if (!watchedMovies || watchedMovies.length < MIN_MOVIES_FOR_RANKING) {
      return null;
    }

    // Get existing ranking items
    const { data: existingRankingItems, error: rankingError } = await supabase
      .from('ranking_items')
      .select('*')
      .eq('ranking_list_id', rankingListId)
      .in(
        'movie_id',
        watchedMovies.map((w) => w.movie_id)
      );

    if (rankingError) throw rankingError;

    // Create missing ranking items
    const existingMovieIds = new Set(
      existingRankingItems?.map((item) => item.movie_id) || []
    );
    const moviesNeedingRankingItems = watchedMovies
      .filter((movie) => !existingMovieIds.has(movie.movie_id))
      .map((movie) => ({
        ranking_list_id: rankingListId,
        movie_id: movie.movie_id,
        elo_score: DEFAULT_ELO_RATING,
      }));

    if (moviesNeedingRankingItems.length > 0) {
      const { error: insertError } = await supabase
        .from('ranking_items')
        .insert(moviesNeedingRankingItems);

      if (insertError) throw insertError;
    }

    // Get final ranking items with movies
    const { data: rankingItems, error: finalError } = await supabase
      .from('ranking_items')
      .select('*, movie:movies(*)')
      .eq('ranking_list_id', rankingListId)
      .in(
        'movie_id',
        watchedMovies.map((w) => w.movie_id)
      );

    if (finalError) throw finalError;

    if (!rankingItems || rankingItems.length < MIN_MOVIES_FOR_RANKING) {
      return null;
    }

    const shuffled = shuffle(rankingItems);
    return {
      movie1: shuffled[0] as RankingItem,
      movie2: shuffled[1] as RankingItem,
    };
  },

  async getOrCreateRankingItem(
    rankingListId: string,
    movieId: number
  ): Promise<RankingItem> {
    const { data: existing, error: getError } = await supabase
      .from('ranking_items')
      .select('*')
      .eq('ranking_list_id', rankingListId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (getError) throw getError;

    if (existing) {
      return existing;
    }

    const { data: created, error: createError } = await supabase
      .from('ranking_items')
      .insert({
        ranking_list_id: rankingListId,
        movie_id: movieId,
        elo_score: DEFAULT_ELO_RATING,
      })
      .select()
      .single();

    if (createError) throw createError;
    return created;
  },

  async getRankingLeaderboard(
    rankingListId: string,
    limit = 50
  ): Promise<RankingItem[]> {
    const { data, error } = await supabase
      .from('ranking_items')
      .select(`*, movie:movies(*)`)
      .eq('ranking_list_id', rankingListId)
      .order('elo_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
