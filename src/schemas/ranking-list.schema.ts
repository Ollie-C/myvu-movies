import { z } from 'zod';
import type { Database } from '@/types/database.types';

type RankingListRow = Database['public']['Tables']['ranking_lists']['Row'];

export const RankingMethodEnum = z.enum(['versus', 'tier', 'manual', 'merged']);

export const RankingListSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid().nullable(),
  name: z.string().min(3),
  description: z.string().nullable(),
  ranking_method: RankingMethodEnum,
  is_public: z.boolean().nullable(),
  slug: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  status: z.enum(['active', 'paused', 'completed']),
  elo_handling: z.enum(['local', 'global']).nullable(),
  battle_limit_type: z
    .enum(['complete', 'fixed', 'per-movie', 'infinite'])
    .nullable(),
  battle_limit: z.number().nullable(),
  deleted_at: z.string().nullable(),
}) satisfies z.ZodType<RankingListRow>;

export type RankingList = z.infer<typeof RankingListSchema>;
