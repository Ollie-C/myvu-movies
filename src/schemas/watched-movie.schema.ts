// AUDITED 05/08/2025
import { z } from 'zod';
import type { Database } from '@/types/database.types';
import { MovieSchema } from './movie.schema';

type WatchedMovieRow = Database['public']['Tables']['watched_movies']['Row'];

export const WatchedMovieSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  movie_id: z.uuid().nullable(),
  watched_date: z.string(),
  rating: z.number().min(0).max(10).nullable(),
  notes: z.string().nullable(),
  favorite: z.boolean().nullable(),
  elo_score: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<WatchedMovieRow>;

export const WatchedMovieWithMovieSchema = WatchedMovieSchema.extend({
  movie: MovieSchema,
});

export const WatchedMovieInsertSchema = WatchedMovieSchema.omit({ id: true });
export const WatchedMovieUpdateSchema = WatchedMovieSchema.partial();

export type WatchedMovie = z.infer<typeof WatchedMovieSchema>;
export type WatchedMovieInsert = z.infer<typeof WatchedMovieInsertSchema>;
export type WatchedMovieUpdate = z.infer<typeof WatchedMovieUpdateSchema>;
export type WatchedMovieWithMovie = z.infer<typeof WatchedMovieWithMovieSchema>;
