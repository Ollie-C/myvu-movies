// Current state of movies in each ranking list
// Multiple ranking methods
// Position field for D&D
// AUDITED 05/08/2025

import { z } from 'zod';
import type { Database } from '@/types/database.types';

type RankingItemRow = Database['public']['Tables']['ranking_items']['Row'];

export const RankingItemSchema = z.object({
  id: z.string(),
  ranking_list_id: z.string().nullable(),
  movie_id: z.number().nullable(),
  position: z.number().nullable(),
  tier: z.string().nullable(),
  elo_score: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<RankingItemRow>;

export const RankingItemInsertSchema = RankingItemSchema.omit({ id: true });
export const RankingItemUpdateSchema = RankingItemSchema.partial();

export type RankingItem = z.infer<typeof RankingItemSchema>;
export type RankingItemInsert = z.infer<typeof RankingItemInsertSchema>;
export type RankingItemUpdate = z.infer<typeof RankingItemUpdateSchema>;
