import { z } from 'zod';
import type { Database } from '@/types/database.types';
import { MovieSchema } from './movie.schema';

type RankingItemRow = Database['public']['Tables']['ranking_list_items']['Row'];

export const RankingItemSchema = z.object({
  id: z.uuid(),
  ranking_list_id: z.uuid(),
  movie_id: z.uuid().nullable(),
  position: z.number().nullable(),
  tier: z.string().nullable(),
  elo_score: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<RankingItemRow>;

export const RankingItemWithMovieSchema = RankingItemSchema.extend({
  movie: MovieSchema.optional(),
});

export type RankingItem = z.infer<typeof RankingItemSchema>;
export type RankingItemWithMovie = z.infer<typeof RankingItemWithMovieSchema>;
