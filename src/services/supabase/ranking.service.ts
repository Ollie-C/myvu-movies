import { supabase } from '@/lib/supabase';
import { calculateElo, getDynamicKFactor } from '@/lib/ranking-engine/elo';
import type { Tables, TablesInsert } from '@/types/database.types';

type RankingItem = Tables<'ranking_items'>;
type RankingBattle = TablesInsert<'ranking_battles'>;
type WatchedMovie = Tables<'watched_movies'>;

export interface RankingBattleResult {
  winnerId: number;
  loserId: number;
  rankingListId: string;
}

export class RankingService {
  static async processRankingBattle(
    result: RankingBattleResult,
    winnerCurrentRating: number = 1500,
    loserCurrentRating: number = 1500
  ) {
    try {
      // Calculate rating difference for dynamic K-factor
      const ratingDiff = winnerCurrentRating - loserCurrentRating;
      const kFactor = getDynamicKFactor(ratingDiff);

      // Calculate new ELO ratings
      const eloResult = calculateElo(
        winnerCurrentRating,
        loserCurrentRating,
        kFactor
      );

      // Create battle record
      const battleRecord: RankingBattle = {
        ranking_list_id: result.rankingListId,
        winner_movie_id: result.winnerId,
        loser_movie_id: result.loserId,
        winner_elo_before: winnerCurrentRating,
        winner_elo_after: eloResult.winnerNewRating,
        loser_elo_before: loserCurrentRating,
        loser_elo_after: eloResult.loserNewRating,
      };

      // Start a transaction
      const { error: battleError } = await supabase
        .from('ranking_battles')
        .insert(battleRecord);

      if (battleError) throw battleError;

      // Update ranking items
      const updates = [
        {
          ranking_list_id: result.rankingListId,
          movie_id: result.winnerId,
          elo_score: eloResult.winnerNewRating,
        },
        {
          ranking_list_id: result.rankingListId,
          movie_id: result.loserId,
          elo_score: eloResult.loserNewRating,
        },
      ];

      // Upsert ranking items - fixed onConflict
      const { error: rankingError } = await supabase
        .from('ranking_items')
        .upsert(updates, {
          onConflict: 'ranking_list_id, movie_id', // Space after comma
          // OR use the actual constraint name if you have one:
          // onConflict: 'ranking_items_ranking_list_id_movie_id_key'
        });

      if (rankingError) throw rankingError;

      return {
        success: true,
        eloResult,
        battleRecord,
      };
    } catch (error) {
      console.error('Error processing ranking battle:', error);
      throw error;
    }
  }

  static async getRandomMoviePair(
    rankingListId: string,
    userId: string
  ): Promise<{ movie1: RankingItem; movie2: RankingItem } | null> {
    try {
      const { data: watchedMovies, error: watchedError } = await supabase
        .from('watched_movies')
        .select(
          `
          movie_id,
          movie:movies(*)
        `
        )
        .eq('user_id', userId);

      if (watchedError || !watchedMovies || watchedMovies.length < 2) {
        return null;
      }

      // Get existing ranking items for this list
      const { data: existingRankingItems, error: rankingError } = await supabase
        .from('ranking_items')
        .select('*')
        .eq('ranking_list_id', rankingListId);

      if (rankingError) throw rankingError;

      // Create a map of existing ranking items
      const existingMap = new Map(
        (existingRankingItems || []).map((item) => [item.movie_id, item])
      );

      // Initialize ranking items for watched movies that don't have one yet
      const newRankingItems = [];
      for (const watched of watchedMovies) {
        if (!existingMap.has(watched.movie_id)) {
          newRankingItems.push({
            ranking_list_id: rankingListId,
            movie_id: watched.movie_id,
            elo_score: 1500, // Default starting ELO
          });
        }
      }

      // Insert new ranking items if any
      if (newRankingItems.length > 0) {
        const { error: insertError } = await supabase
          .from('ranking_items')
          .insert(newRankingItems);

        if (insertError) {
          console.error('Error inserting new ranking items:', insertError);
        }
      }

      // Now fetch all ranking items with movie data
      const { data: rankingItems, error: finalError } = await supabase
        .from('ranking_items')
        .select(
          `
          *,
          movie:movies(*)
        `
        )
        .eq('ranking_list_id', rankingListId)
        .in(
          'movie_id',
          watchedMovies.map((w) => w.movie_id!)
        );

      if (finalError || !rankingItems || rankingItems.length < 2) {
        console.error('Error fetching ranking items:', finalError);
        return null;
      }

      // Randomly select 2 different movies
      const shuffled = [...rankingItems].sort(() => 0.5 - Math.random());
      return {
        movie1: shuffled[0] as RankingItem,
        movie2: shuffled[1] as RankingItem,
      };
    } catch (error) {
      console.error('Error getting random movie pair:', error);
      return null;
    }
  }

  // Alternative approach - get or create ranking items on demand
  static async getOrCreateRankingItem(
    rankingListId: string,
    movieId: number
  ): Promise<RankingItem | null> {
    try {
      // First try to get existing
      const { data: existing, error: getError } = await supabase
        .from('ranking_items')
        .select('*')
        .eq('ranking_list_id', rankingListId)
        .eq('movie_id', movieId)
        .single();

      if (!getError && existing) {
        return existing;
      }

      // Create new if doesn't exist
      const { data: created, error: createError } = await supabase
        .from('ranking_items')
        .insert({
          ranking_list_id: rankingListId,
          movie_id: movieId,
          elo_score: 1500,
        })
        .select()
        .single();

      if (createError) throw createError;
      return created;
    } catch (error) {
      console.error('Error getting/creating ranking item:', error);
      return null;
    }
  }
}
