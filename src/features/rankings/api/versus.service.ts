import { supabase } from '@/shared/lib/supabase';
import { RankingBattleWithTitlesSchema } from '@/features/rankings/models/ranking-battle.schema';
import { type RankingItemWithMovie } from '@/features/rankings/models/ranking-item.schema';

export const versusService = {
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

  generatePairs(
    movies: RankingItemWithMovie[],
    completed: Set<string>,
    battleLimitType:
      | 'complete'
      | 'fixed'
      | 'per-movie'
      | 'infinite' = 'complete',
    limit: number = 10
  ) {
    const validMovies = movies.filter((m) => m.movie_id !== null);

    if (battleLimitType === 'infinite') {
      const randPair = pickRandomPair(validMovies);
      return randPair ? [randPair] : [];
    }

    const pairs: Array<{
      movie1: RankingItemWithMovie;
      movie2: RankingItemWithMovie;
    }> = [];
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

    for (let i = pairs.length - 1; i > 0; i--) {
      const rand = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[rand]] = [pairs[rand], pairs[i]];
    }

    if (battleLimitType === 'fixed') {
      return pairs.slice(0, limit);
    }

    if (battleLimitType === 'per-movie') {
      const targetCount = validMovies.length * limit;
      return pairs.slice(0, targetCount);
    }

    return pairs;
  },

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

  async skipBattle(rankingListId: string, movie1: string, movie2: string) {
    const { error } = await supabase.from('versus_battles').insert({
      ranking_list_id: rankingListId,
      winner_movie_id: movie1,
      loser_movie_id: movie2,
      skipped: true,
    });
    if (error) throw error;
  },
};

function pickRandomPair(movies: RankingItemWithMovie[]) {
  if (movies.length < 2) return null;
  const i = Math.floor(Math.random() * movies.length);
  let j = i;
  while (j === i) j = Math.floor(Math.random() * movies.length);
  return { movie1: movies[i], movie2: movies[j] };
}
