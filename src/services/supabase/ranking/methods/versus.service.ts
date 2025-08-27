import { supabase } from '@/lib/supabase';
import { RankingBattleWithTitlesSchema } from '@/schemas/ranking-battle.schema';
import { type RankingItemWithMovie } from '@/schemas/ranking-item.schema';

export const versusService = {
  /** Get completed pairs as unique keys */
  async getCompletedPairs(sessionId: string): Promise<Set<string>> {
    const { data, error } = await supabase
      .from('versus_battles')
      .select('winner_movie_id, loser_movie_id')
      .eq('ranking_list_id', sessionId);
    if (error) throw error;

    const completed = new Set<string>();
    data?.forEach((b) => {
      if (b.winner_movie_id && b.loser_movie_id) {
        completed.add([b.winner_movie_id, b.loser_movie_id].sort().join('-'));
      }
    });
    return completed;
  },

  generatePairs(movies: RankingItemWithMovie[], completed: Set<string>) {
    const pairs: Array<{
      movie1: RankingItemWithMovie;
      movie2: RankingItemWithMovie;
    }> = [];

    // Filter out null movie_ids
    const validMovies = movies.filter((m) => m.movie_id !== null);

    for (let i = 0; i < validMovies.length; i++) {
      for (let j = i + 1; j < validMovies.length; j++) {
        const id1 = validMovies[i].movie_id!;
        const id2 = validMovies[j].movie_id!;
        const key = [id1, id2].sort().join('-');

        if (!completed.has(key)) {
          pairs.push({ movie1: validMovies[i], movie2: validMovies[j] });
        }
      }
    }

    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[rand]] = [pairs[rand], pairs[i]];
    }

    return pairs;
  },

  /** Process a versus battle using Supabase RPC */
  async processBattle(
    sessionId: string,
    winnerId: string,
    loserId: string,
    useGlobalElo: boolean
  ) {
    const { data, error } = await supabase.rpc('process_custom_versus_battle', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_ranking_list_id: sessionId,
      p_use_global_elo: useGlobalElo,
    });
    if (error) throw error;
    return data;
  },

  /** Get battle history */
  async getBattles(sessionId: string) {
    const { data, error } = await supabase
      .from('versus_battles')
      .select(
        `*, winner:winner_movie_id (id,title), loser:loser_movie_id (id,title)`
      )
      .eq('ranking_list_id', sessionId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((battle) =>
      RankingBattleWithTitlesSchema.parse(battle)
    );
  },
};
