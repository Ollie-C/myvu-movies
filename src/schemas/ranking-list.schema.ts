// Define the ranking method being used
// Link to users
// Collaborative ranking support
// AUDITED 05/08/2025

import { z } from 'zod';
import type { Database } from '@/types/database.types';

type RankingListRow = Database['public']['Tables']['ranking_lists']['Row'];

export const RankingMethodEnum = z.enum(['versus', 'tier', 'manual', 'merged']);

export const RankingListSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  ranking_method: RankingMethodEnum,
  is_public: z.boolean().nullable(),
  slug: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  status: z.string(),
}) satisfies z.ZodType<RankingListRow>;

// For collaborative rankings, you might need an additional schema
export const CollaborativeRankingSchema = z.object({
  id: z.string(),
  ranking_list_id: z.string(),
  user1_id: z.string(),
  user2_id: z.string(),
  similarity_score: z.number().nullable(),
  battles_completed: z.number().default(0),
  status: z.enum(['active', 'completed', 'abandoned']),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});
