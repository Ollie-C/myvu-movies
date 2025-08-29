import { z } from 'zod';

export const RankingItemSchema = z.object({
  id: z.uuid(),
  ranking_list_id: z.uuid(),
  movie_id: z.uuid().nullable(),
  position: z.number().nullable(),
  tier: z.string().nullable(),
  elo_score: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
export type RankingItem = z.infer<typeof RankingItemSchema>;

export const RankingItemWithDetailsSchema = z.object({
  id: z.uuid(),
  ranking_list_id: z.uuid(),
  movie_id: z.uuid().nullable(),
  position: z.number().nullable(),
  tier: z.string().nullable(),
  elo_score: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),

  movie_uuid: z.uuid().nullable(),
  tmdb_id: z.number().nullable(),
  title: z.string().nullable(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  runtime: z.number().nullable(),
  tagline: z.string().nullable(),
  genre_ids: z.array(z.string()).nullable(),
  genre_names: z.array(z.string()).nullable(),
  director_ids: z.array(z.string()).nullable(),
  director_names: z.array(z.string()).nullable(),
});
export type RankingItemWithDetails = z.infer<
  typeof RankingItemWithDetailsSchema
>;
