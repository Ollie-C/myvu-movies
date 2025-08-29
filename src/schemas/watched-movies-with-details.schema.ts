// For our flattened view in Supabase (movies + genres + directors)
import { z } from 'zod';

export const WatchedMovieWithDetailsSchema = z.object({
  watched_movie_id: z.uuid(),
  user_id: z.uuid(),
  movie_id: z.uuid(),
  watched_date: z.string(),
  rating: z.number().nullable(),
  notes: z.string().nullable(),
  favorite: z.boolean().nullable(),
  elo_score: z.number().nullable(),
  watched_created_at: z.string().nullable(),
  watched_updated_at: z.string().nullable(),

  movie_uuid: z.uuid(),
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
  vote_count: z.number().nullable(),
  runtime: z.number().nullable(),
  tagline: z.string().nullable(),
  genre_ids: z.array(z.uuid()).nullable(),
  genre_names: z.array(z.string()).nullable(),
  director_ids: z.array(z.uuid()).nullable(),
  director_names: z.array(z.string()).nullable(),
});

export type WatchedMovieWithDetails = z.infer<
  typeof WatchedMovieWithDetailsSchema
>;
