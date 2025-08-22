// AUDITED 07/08/2025
import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database.types';
import shuffle from '@/utils/shuffle';
import { activityService } from '@/services/supabase/activity.service';
import { collectionService } from './collection.service';

// Constants
const DEFAULT_ELO_RATING = 1200;
const MIN_MOVIES_FOR_RANKING = 2;

// Types
type RankingItem = Tables<'ranking_list_items'>;
type RankingBattle = TablesInsert<'versus_battles'>;

// Extended type for ranking items with movie data
type RankingItemWithMovie = RankingItem & {
  movie: Tables<'movies'>;
};

export interface RankingBattleResult {
  winnerId: number;
  loserId: number;
  rankingListId: string;
}

export interface MoviePair {
  movie1: RankingItemWithMovie;
  movie2: RankingItemWithMovie;
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
  async getUserRankingLists(
    userId: string,
    options?: {
      onlyActive?: boolean;
      limit?: number;
      sortBy?: 'updated_at' | 'created_at' | 'name';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<
    Array<
      Tables<'ranking_lists'> & {
        _count: { ranking_list_items: number };
      }
    >
  > {
    const {
      onlyActive = false,
      limit,
      sortBy = 'updated_at',
      sortOrder = 'desc',
    } = options || {};

    let query = supabase
      .from('ranking_lists')
      .select('*, ranking_list_items(count), collections(id)')
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (onlyActive) {
      query = query.eq('status', 'active' as any);
    }

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    // Normalize counts
    const lists = (data || []).map((row: any) => ({
      ...row,
      _count: { ranking_list_items: row.ranking_list_items?.[0]?.count || 0 },
    }));
    return lists;
  },

  async getOrCreateDefaultVersusList(
    userId: string
  ): Promise<Tables<'ranking_lists'>> {
    // Always create a new versus list with a unique name
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const time = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const uniqueId = now.getTime(); // milliseconds for uniqueness

    const { data: created, error: createError } = await supabase
      .from('ranking_lists')
      .insert({
        user_id: userId,
        name: `Versus Ranking - ${timestamp} ${time} #${uniqueId
          .toString()
          .slice(-4)}`,
        description: 'Head-to-head ranking session',
        ranking_method: 'versus' as any,
        status: 'active',
      })
      .select('*')
      .single();

    if (createError) throw createError;
    return created as Tables<'ranking_lists'>;
  },

  async updateRankingListName(
    rankingListId: string,
    newName: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ranking_lists')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', rankingListId);

    if (error) throw error;
  },

  async updateRankingListStatus(
    rankingListId: string,
    status: string
  ): Promise<void> {
    const { error } = await supabase
      .from('ranking_lists')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', rankingListId);
    if (error) throw error;
  },

  async deleteRankingList(rankingListId: string): Promise<void> {
    const { error } = await supabase
      .from('ranking_lists')
      .delete()
      .eq('id', rankingListId);

    if (error) throw error;
  },

  async getBattleHistory(movieAId: string, movieBId: string) {
    const { data, error } = await supabase
      .from('versus_battles')
      .select('winner_movie_id, loser_movie_id')
      .in('winner_movie_id', [movieAId, movieBId])
      .in('loser_movie_id', [movieAId, movieBId]);

    if (error) {
      console.error('Failed to fetch battle history:', error);
      throw error;
    }

    let aWins = 0;
    let bWins = 0;

    (data || []).forEach((battle) => {
      if (battle.winner_movie_id === movieAId) aWins++;
      if (battle.winner_movie_id === movieBId) bWins++;
    });

    return { aWins, bWins };
  },

  async getBattlesSince(
    rankingListId: string,
    sinceIso: string
  ): Promise<Tables<'versus_battles'>[]> {
    const { data, error } = await supabase
      .from('versus_battles')
      .select('*')
      .eq('ranking_list_id', rankingListId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as Tables<'versus_battles'>[];
  },
  async processRankingBattle(
    result: RankingBattleResult
  ): Promise<BattleProcessResult> {
    const { data, error } = await supabase.rpc('process_ranking_battle', {
      p_ranking_list_id: result.rankingListId,
      p_winner_movie_id: result.winnerId,
      p_loser_movie_id: result.loserId,
    });

    if (error) throw error;
    try {
      // Log generic ranking battle; exact user attribution requires fetching list owner
      const { data: list } = await supabase
        .from('ranking_lists')
        .select('user_id')
        .eq('id', result.rankingListId)
        .single();
      const userId = (list as any)?.user_id;
      if (userId) {
        await activityService.logActivity({
          user_id: userId,
          type: 'ranking_battle',
          ranking_list_id: result.rankingListId,
          metadata: {
            winner_movie_id: result.winnerId,
            loser_movie_id: result.loserId,
          },
        });
      }
    } catch (_) {}
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
      .from('ranking_list_items')
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
        .from('ranking_list_items')
        .insert(moviesNeedingRankingItems);

      if (insertError) throw insertError;
    }

    // Get final ranking items with movies
    const { data: rankingItems, error: finalError } = await supabase
      .from('ranking_list_items')
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
      movie1: shuffled[0] as RankingItemWithMovie,
      movie2: shuffled[1] as RankingItemWithMovie,
    };
  },

  async getOrCreateRankingItem(
    rankingListId: string,
    movieId: number
  ): Promise<RankingItem> {
    const { data: existing, error: getError } = await supabase
      .from('ranking_list_items')
      .select('*')
      .eq('ranking_list_id', rankingListId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (getError) throw getError;

    if (existing) {
      return existing;
    }

    const { data: created, error: createError } = await supabase
      .from('ranking_list_items')
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
      .from('ranking_list_items')
      .select(`*, movie:movies(*)`)
      .eq('ranking_list_id', rankingListId)
      .order('elo_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  },

  async reorderRankingItems(
    rankingListId: string,
    reorderedItems: Array<{
      id: string;
      movie_id: number;
      new_position: number;
    }>
  ) {
    const { data, error } = await supabase.rpc('reorder_ranking_list_items', {
      p_ranking_list_id: rankingListId,
      p_reordered_items: reorderedItems,
    });

    if (error) throw error;
    return data;
  },

  async calculateMergedScores(
    rankingListId: string,
    weights?: {
      elo: number;
      userRating: number;
      position: number;
      popularity: number;
    }
  ) {
    const { data, error } = await supabase.rpc(
      'calculate_merged_ranking_scores',
      {
        p_ranking_list_id: rankingListId,
        p_weights: weights,
      }
    );

    if (error) throw error;
    return data;
  },

  async convertRankingListToCollection(
    rankingListId: string
  ): Promise<{ newCollectionId: string }> {
    const { data: rankingList, error: listError } = await supabase
      .from('ranking_lists')
      .select('*')
      .eq('id', rankingListId)
      .single();

    if (listError || !rankingList) throw listError;

    const { data: rankingItems, error: itemsError } = await supabase
      .from('ranking_list_items')
      .select('*')
      .eq('ranking_list_id', rankingListId)
      .order('position', { ascending: true });

    if (itemsError) throw itemsError;

    const newCollection = await collectionService.createCollection(
      rankingList.user_id,
      {
        name: rankingList.name,
        description: rankingList.description,
        is_public: rankingList.is_public || false,
        is_ranked: true,
        slug: rankingList.slug,
        ranking_list_id: rankingListId,
      }
    );

    if (rankingItems && rankingItems.length > 0) {
      const batch = rankingItems.map((item, idx) => ({
        collection_id: newCollection.id,
        movie_id: item.movie_id,
        position: item.position ?? idx, // fallback to index if null
        notes: item.notes,
        added_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('collection_items')
        .insert(batch);

      if (insertError) throw insertError;
    }

    return { newCollectionId: newCollection.id };
  },
};

export const useEloConversions = () => {
  return {
    ratingToElo: async (rating: number) => {
      const { data, error } = await supabase.rpc('rating_to_elo', {
        p_rating: rating,
      });
      if (error) throw error;
      return data;
    },
    eloToRating: async (eloScore: number) => {
      const { data, error } = await supabase.rpc('elo_to_rating', {
        p_elo_score: eloScore,
      });
      if (error) throw error;
      return data;
    },
  };
};
