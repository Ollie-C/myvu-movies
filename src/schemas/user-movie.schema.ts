import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type UserMovieRow = Database['public']['Tables']['user_movies']['Row'];

// Create Zod schema matching the database
export const UserMovieSchema = z.object({
  id: z.number(),
  user_id: z.string().nullable(),
  movie_id: z.number().nullable(),
  rating: z.number().nullable(),
  watched: z.boolean().nullable(),
  watched_date: z.string().nullable(),
  favorite: z.boolean().nullable(),
  notes: z.string().nullable(),
  status: z.string().nullable(),
  watch_list: z.boolean().nullable(),
  watchlist_added_date: z.string().nullable(),
  watchlist_notes: z.string().nullable(),
  watchlist_priority: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<UserMovieRow>;

// Create insert schema (id is auto-generated)
export const UserMovieInsertSchema = UserMovieSchema.omit({ id: true });

// Create update schema (all fields optional)
export const UserMovieUpdateSchema = UserMovieSchema.partial();

// Export types
export type UserMovie = z.infer<typeof UserMovieSchema>;
export type UserMovieInsert = z.infer<typeof UserMovieInsertSchema>;
export type UserMovieUpdate = z.infer<typeof UserMovieUpdateSchema>;
