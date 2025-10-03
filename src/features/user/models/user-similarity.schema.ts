//   not yet used
import { z } from 'zod';
import { RankingMethodEnum } from '@/features/rankings/models/ranking-list.schema';

export const UserSimilaritySchema = z.object({
  id: z.string(),
  user1_id: z.string(),
  user2_id: z.string(),
  similarity_score: z.number().min(0).max(100),
  battles_completed: z.number(),
  last_updated: z.string(),
});

// ranking-session.schema.ts
export const RankingSessionSchema = z.object({
  id: z.string(),
  ranking_list_id: z.string(),
  session_type: z.enum(['solo', 'collaborative']),
  participants: z.array(z.string()), // user IDs
  battles_completed: z.number(),
  status: z.enum(['active', 'completed', 'paused']),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  metadata: z
    .object({
      similarity_score: z.number().optional(),
      method_used: RankingMethodEnum,
    })
    .nullable(),
});
