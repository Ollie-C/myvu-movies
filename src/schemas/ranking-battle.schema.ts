// Individual battle history for ELO calculations
// Versus mode
// Audit trail and analytics
// AUDITED 05/08/2025

import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type RankingBattleRow = Database['public']['Tables']['versus_battles']['Row'];

// Create Zod schema matching the database
export const RankingBattleSchema = z.object({
  id: z.string(),
  ranking_list_id: z.string().nullable(),
  winner_movie_id: z.number().nullable(),
  loser_movie_id: z.number().nullable(),
  winner_elo_before: z.number().nullable(),
  winner_elo_after: z.number().nullable(),
  loser_elo_before: z.number().nullable(),
  loser_elo_after: z.number().nullable(),
  created_at: z.string().nullable(),
}) satisfies z.ZodType<RankingBattleRow>;

// Create insert schema (id is auto-generated)
export const RankingBattleInsertSchema = RankingBattleSchema.omit({ id: true });

// Create update schema (all fields optional)
export const RankingBattleUpdateSchema = RankingBattleSchema.partial();

// Export types
export type RankingBattle = z.infer<typeof RankingBattleSchema>;
export type RankingBattleInsert = z.infer<typeof RankingBattleInsertSchema>;
export type RankingBattleUpdate = z.infer<typeof RankingBattleUpdateSchema>;
