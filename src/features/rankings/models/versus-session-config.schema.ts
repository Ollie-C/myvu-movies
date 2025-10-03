import { z } from 'zod';

export const FiltersSchema = z.object({
  genreIds: z.array(z.uuid()).optional(),
  directorIds: z.array(z.uuid()).optional(),
  releaseYear: z
    .object({
      from: z.number().optional(),
      to: z.number().optional(),
    })
    .optional(),
  runtimeMinutes: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  languages: z.array(z.string()).optional(),
});
export const SessionMethodEnum = z.enum(['versus', 'tier']);

export const VersusSessionConfigSchema = z.object({
  name: z.string().min(3, 'Session name too short'),
  elo_handling: z.enum(['local', 'global']),
  method: SessionMethodEnum.default('versus'),
  movieSelection: z.enum(['all', 'selection']),
  movieIds: z.array(z.uuid()).optional(),
  battle_limit_type: z.enum(['complete', 'fixed', 'per-movie', 'infinite']),
  battle_limit: z.number().positive().optional(),
  filters: FiltersSchema.optional(),
});

export type VersusSessionConfig = z.infer<typeof VersusSessionConfigSchema>;
export type SessionFilters = z.infer<typeof FiltersSchema>;
