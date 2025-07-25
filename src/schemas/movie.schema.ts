import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type MovieRow = Database['public']['Tables']['movies']['Row'];

// Define the genres schema (since it's Json type)
const GenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Create Zod schema matching the database
export const MovieSchema = z.object({
  id: z.number(),
  tmdb_id: z.number(),
  title: z.string(),
  original_title: z.string().nullable(),
  original_language: z.string().nullable(),
  overview: z.string().nullable(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  popularity: z.number().nullable(),
  vote_average: z.number().nullable(),
  genres: z.array(GenreSchema).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<MovieRow>;

// Create insert schema (id is auto-generated)
export const MovieInsertSchema = MovieSchema.omit({ id: true });

// Create update schema (all fields optional)
export const MovieUpdateSchema = MovieSchema.partial();

// Export types
export type Movie = z.infer<typeof MovieSchema>;
export type MovieInsert = z.infer<typeof MovieInsertSchema>;
export type MovieUpdate = z.infer<typeof MovieUpdateSchema>;
export type Genre = z.infer<typeof GenreSchema>;
