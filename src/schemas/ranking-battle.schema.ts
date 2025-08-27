import { z } from 'zod';

export const RankingBattleSchema = z.object({
  id: z.uuid(),
  ranking_list_id: z.uuid(),
  winner_movie_id: z.uuid(),
  loser_movie_id: z.uuid(),
  winner_elo_before: z.number().nullable(),
  winner_elo_after: z.number().nullable(),
  loser_elo_before: z.number().nullable(),
  loser_elo_after: z.number().nullable(),
  created_at: z.string().nullable(),
});

export const RankingBattleWithTitlesSchema = RankingBattleSchema.extend({
  winner: z.object({ id: z.string().uuid(), title: z.string() }).nullable(),
  loser: z.object({ id: z.string().uuid(), title: z.string() }).nullable(),
});

export type RankingBattle = z.infer<typeof RankingBattleSchema>;
export type RankingBattleWithTitles = z.infer<
  typeof RankingBattleWithTitlesSchema
>;
