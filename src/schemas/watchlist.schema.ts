import { z } from 'zod';
import type { Database } from '@/types/database.types';

type WatchlistRow = Database['public']['Tables']['watchlist']['Row'];
type WatchlistWithDetailsRow =
  Database['public']['Views']['watchlist_with_details']['Row'];

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

export const WatchlistWithDetailsSchema = z.object({
  watchlist_id: z.uuid(),
  user_id: z.uuid().nullable(),
  movie_id: z.uuid().nullable(),
  priority: WatchlistPriorityEnum.nullable(),
  notes: z.string().nullable(),
  reminder_date: z.string().nullable(),
  added_date: z.string().nullable(),
  watchlist_updated_at: z.string().nullable(),

  movie_uuid: z.uuid().nullable(),
  tmdb_id: z.number().nullable(),
  title: z.string().nullable(),
  original_title: z.string().nullable(),
  original_language: z.string().nullable(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  runtime: z.number().nullable(),
  tagline: z.string().nullable(),
  popularity: z.number().nullable(),
  vote_average: z.number().nullable(),
  vote_count: z.number().nullable(),
  backdrop_path: z.string().nullable(),
  overview: z.string().nullable(),

  genre_ids: z.array(z.string()).nullable(),
  genre_names: z.array(z.string()).nullable(),
  director_ids: z.array(z.string()).nullable(),
  director_names: z.array(z.string()).nullable(),
}) satisfies z.ZodType<WatchlistWithDetailsRow>;

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

export const WatchlistUpdateSchema = WatchlistSchema.partial().omit({
  id: true,
  user_id: true,
  movie_id: true,
  created_at: true,
});

// --- Export types ---
export type Watchlist = z.infer<typeof WatchlistSchema>;
export type WatchlistWithDetails = z.infer<typeof WatchlistWithDetailsSchema>;
export type WatchlistInsert = z.infer<typeof WatchlistInsertSchema>;
export type WatchlistUpdate = z.infer<typeof WatchlistUpdateSchema>;
