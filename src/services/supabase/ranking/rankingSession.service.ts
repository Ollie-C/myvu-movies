import { supabase } from '@/lib/supabase';
import { collectionService } from '@/services/supabase/collection.service';
import {
  type VersusSessionConfig,
  VersusSessionConfigSchema,
} from '@/schemas/versus-session-config.schema';
import {
  RankingListSchema,
  type RankingList,
} from '@/schemas/ranking-list.schema';
import { RankingItemWithMovieSchema } from '@/schemas/ranking-item.schema';
import { applyMovieFilters } from '@/utils/helpers/applyMovieFilters';

const DEFAULT_ELO_RATING = 1200;

export const rankingSessionService = {
  async create(
    userId: string,
    config: {
      method: 'versus' | 'tier' | 'manual' | 'merged';
    } & Partial<VersusSessionConfig>
  ) {
    const parsedConfig = VersusSessionConfigSchema.partial().parse(config);

    const { data: created, error } = await supabase
      .from('ranking_lists')
      .insert({
        user_id: userId,
        name: parsedConfig.name || 'Untitled Session',
        description: `${config.method} ranking session`,
        ranking_method: config.method,
        status: 'active',
        elo_handling: parsedConfig.elo_handling,
        battle_limit_type: parsedConfig.battle_limit_type,
        battle_limit: parsedConfig.battle_limit,
        config: parsedConfig,
      })
      .select('*')
      .single();

    if (error) throw error;
    const session = RankingListSchema.parse(created);

    let movieIds: string[] = [];

    if (parsedConfig.movieSelection === 'selection' && parsedConfig.movieIds) {
      movieIds = parsedConfig.movieIds;
    } else {
      let query = supabase
        .from('watched_movies')
        .select('movie_id, movie:movies(*)')
        .eq('user_id', userId);

      query = applyMovieFilters(query, parsedConfig.filters);

      const { data: watched, error: watchedError } = await query;
      if (watchedError) throw watchedError;

      movieIds = watched?.map((m) => m.movie_id!).filter(Boolean) || [];
    }

    if (movieIds.length > 0) {
      const rankingItems = movieIds.map((movieId) => ({
        ranking_list_id: session.id,
        movie_id: movieId,
        elo_score: DEFAULT_ELO_RATING,
      }));

      const { error: seedError } = await supabase
        .from('ranking_list_items')
        .insert(rankingItems);

      if (seedError) throw seedError;
    }

    return session;
  },

  async get(sessionId: string) {
    const { data, error } = await supabase
      .from('ranking_lists')
      .select('*')
      .eq('id', sessionId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return RankingListSchema.parse(data);
  },

  async getUserSessions(userId: string) {
    const { data, error } = await supabase
      .from('ranking_lists')
      .select('*, ranking_list_items(count)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => {
      const parsed = RankingListSchema.parse(row);
      return {
        ...parsed,
        itemCount: row.ranking_list_items?.[0]?.count || 0,
      };
    });
  },

  async getMovies(sessionId: string) {
    const { data, error } = await supabase
      .from('ranking_list_items')
      .select('*, movie:movies(*)')
      .eq('ranking_list_id', sessionId);

    if (error) throw error;
    return (data || []).map((item) => RankingItemWithMovieSchema.parse(item));
  },

  async update(sessionId: string, update: Partial<RankingList>) {
    const { data, error } = await supabase
      .from('ranking_lists')
      .update(update)
      .eq('id', sessionId)
      .select('*')
      .single();
    if (error) throw error;
    return RankingListSchema.parse(data);
  },

  async getProgress(sessionId: string) {
    const { data: rankingList, error } = await supabase
      .from('ranking_lists')
      .select('elo_handling, battle_limit_type, battle_limit')
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    const { data: items } = await supabase
      .from('ranking_list_items')
      .select('id')
      .eq('ranking_list_id', sessionId);

    const totalMovies = items?.length ?? 0;
    let targetBattles: number | null = null;

    switch (rankingList.battle_limit_type) {
      case 'complete':
        targetBattles =
          totalMovies > 1
            ? Math.floor((totalMovies * (totalMovies - 1)) / 2)
            : 0;
        break;

      case 'per-movie':
        targetBattles = totalMovies * (rankingList.battle_limit || 10);
        break;

      case 'fixed':
        targetBattles = rankingList.battle_limit || 50;
        break;

      case 'infinite':
        targetBattles = null;
        break;

      default:
        targetBattles =
          totalMovies > 1
            ? Math.floor((totalMovies * (totalMovies - 1)) / 2)
            : 0;
    }

    const { count: totalBattles, error: countError } = await supabase
      .from('versus_battles')
      .select('*', { count: 'exact', head: true })
      .eq('ranking_list_id', sessionId);

    if (countError) throw countError;

    const completed = totalBattles || 0;

    return {
      totalMovies,
      targetBattles,
      completedBattles: completed,
      isCompleted:
        rankingList.battle_limit_type === 'infinite'
          ? false
          : targetBattles !== null && completed >= targetBattles,
      completionPercent:
        rankingList.battle_limit_type === 'infinite' || !targetBattles
          ? null
          : targetBattles > 0
          ? (completed / targetBattles) * 100
          : 0,
    };
  },

  async getLeaderboard(sessionId: string) {
    const { data, error } = await supabase
      .from('ranking_list_items')
      .select('*, movie:movies(*)')
      .eq('ranking_list_id', sessionId)
      .order('elo_score', { ascending: false });
    if (error) throw error;
    return (data || []).map((item) => RankingItemWithMovieSchema.parse(item));
  },

  async convertToCollection(sessionId: string) {
    const { data: rankingList } = await supabase
      .from('ranking_lists')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!rankingList) throw new Error('Ranking list not found');

    return collectionService.createFromRankingList(
      rankingList.user_id,
      rankingList
    );
  },

  async softDelete(sessionId: string) {
    const { error } = await supabase
      .from('ranking_lists')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  },

  async pause(sessionId: string) {
    const { data, error } = await supabase
      .from('ranking_lists')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select('*')
      .single();
    if (error) throw error;
    return RankingListSchema.parse(data);
  },

  async resume(sessionId: string) {
    const { data, error } = await supabase
      .from('ranking_lists')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select('*')
      .single();
    if (error) throw error;
    return RankingListSchema.parse(data);
  },
};
