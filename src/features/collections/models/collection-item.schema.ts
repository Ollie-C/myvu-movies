import { z } from 'zod';
import type { Database } from '@/shared/types/database.types';

type CollectionItemRow =
  Database['public']['Tables']['collection_items']['Row'];

export const CollectionItemSchema = z.object({
  id: z.uuid(),
  collection_id: z.uuid(),
  movie_id: z.uuid().nullable(),
  position: z.number().min(0).nullable(),
  notes: z.string().max(1000).nullable(),
  added_at: z.string().nullable(),
}) satisfies z.ZodType<CollectionItemRow>;

//
// --- Flattened details view ---
//
type CollectionItemWithDetailsRow =
  Database['public']['Views']['collection_items_with_details']['Row'];

export const CollectionItemWithDetailsSchema = z.object({
  collection_item_id: z.string(),
  collection_id: z.string(),
  movie_id: z.string().nullable(),
  position: z.number().nullable(),
  notes: z.string().nullable(),
  added_at: z.string().nullable(),

  movie_uuid: z.string().nullable(),
  tmdb_id: z.number().nullable(),
  title: z.string().nullable(),
  original_title: z.string().nullable(),
  original_language: z.string().nullable(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  runtime: z.number().nullable(),
  tagline: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  popularity: z.number().nullable(),
  vote_average: z.number().nullable(),
  vote_count: z.number().nullable(),

  genre_ids: z.array(z.string()).nullable(),
  genre_names: z.array(z.string()).nullable(),
  director_ids: z.array(z.string()).nullable(),
  director_names: z.array(z.string()).nullable(),
}) satisfies z.ZodType<CollectionItemWithDetailsRow>;

export const CollectionItemInsertSchema = CollectionItemSchema.omit({
  id: true,
  added_at: true,
}).extend({
  collection_id: z.uuid(),
  movie_id: z.uuid(),
  position: z.number().min(0).optional(),
  added_at: z.string().default(() => new Date().toISOString()),
});

export const CollectionItemReorderSchema = z.array(
  z.object({
    id: z.uuid(),
    position: z.number().min(0),
  })
);

export type CollectionItem = z.infer<typeof CollectionItemSchema>;
export type CollectionItemWithDetails = z.infer<
  typeof CollectionItemWithDetailsSchema
>;
export type CollectionItemInsert = z.infer<typeof CollectionItemInsertSchema>;
export type CollectionItemReorder = z.infer<typeof CollectionItemReorderSchema>;
