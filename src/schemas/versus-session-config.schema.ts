import { z } from 'zod';

export const VersusSessionConfigSchema = z.object({
  name: z.string().min(3, 'Session name too short'),
  elo_handling: z.enum(['local', 'global']),
  movieSelection: z.enum(['all', 'selection']),
  movieIds: z.array(z.uuid()).optional(),
  battle_limit_type: z.enum(['complete', 'fixed', 'per-movie']),
  battle_limit: z.number().positive().optional(),
});

export type VersusSessionConfig = z.infer<typeof VersusSessionConfigSchema>;
