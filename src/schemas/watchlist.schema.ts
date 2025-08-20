// AUDITED 05/08/2025
import { z } from 'zod';
import { MovieSchema } from './movie.schema';
import type { Database } from '@/types/database.types';

type WatchlistRow = Database['public']['Tables']['watchlist']['Row'];

// Define priority enum
export const WatchlistPriorityEnum = z.enum(['high', 'medium', 'low']);
export type WatchlistPriority = z.infer<typeof WatchlistPriorityEnum>;

export const WatchlistSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid().nullable(),
  movie_id: z.uuid().nullable(),
  added_date: z.string().nullable(),
  priority: WatchlistPriorityEnum.nullable(),
  notes: z.string().nullable(),
  reminder_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<WatchlistRow>;

// Schema for when we join with movie data
export const WatchlistWithMovieSchema = WatchlistSchema.extend({
  movie: MovieSchema,
});

// Schema for creating new watchlist items
export const WatchlistInsertSchema = WatchlistSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  user_id: z.uuid(),
  movie_id: z.uuid(),
  added_date: z.string().default(() => new Date().toISOString().split('T')[0]),
  priority: WatchlistPriorityEnum.default('medium'),
});

// Schema for updating watchlist items
export const WatchlistUpdateSchema = WatchlistSchema.partial().omit({
  id: true,
  user_id: true,
  movie_id: true,
  created_at: true,
});

// Export types
export type Watchlist = z.infer<typeof WatchlistSchema>;
export type WatchlistWithMovie = z.infer<typeof WatchlistWithMovieSchema>;
export type WatchlistInsert = z.infer<typeof WatchlistInsertSchema>;
export type WatchlistUpdate = z.infer<typeof WatchlistUpdateSchema>;
