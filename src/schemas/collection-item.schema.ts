// DONE

import { z } from 'zod';
import { MovieSchema } from './movie.schema';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type CollectionItemRow =
  Database['public']['Tables']['collection_items']['Row'];

// Create Zod schema matching the database
export const CollectionItemSchema = z.object({
  id: z.string().uuid(),
  collection_id: z.string().uuid().nullable(),
  movie_id: z.number().nullable(),
  position: z.number().min(0).nullable(),
  notes: z.string().max(1000).nullable(),
  added_at: z.string().nullable(),
}) satisfies z.ZodType<CollectionItemRow>;

// Schema when joined with movie data
export const CollectionItemWithMovieSchema = CollectionItemSchema.extend({
  movie: MovieSchema,
});

// Create insert schema
export const CollectionItemInsertSchema = CollectionItemSchema.omit({
  id: true,
  added_at: true,
}).extend({
  collection_id: z.string().uuid(),
  movie_id: z.number(),
  position: z.number().min(0).optional(),
  added_at: z.string().default(() => new Date().toISOString()),
});

// Create update schema (only position and notes should be updatable)
export const CollectionItemUpdateSchema = z.object({
  position: z.number().min(0).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// Batch update schema for reordering
export const CollectionItemReorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    position: z.number().min(0),
  })
);

// Export types
export type CollectionItem = z.infer<typeof CollectionItemSchema>;
export type CollectionItemWithMovie = z.infer<
  typeof CollectionItemWithMovieSchema
>;
export type CollectionItemInsert = z.infer<typeof CollectionItemInsertSchema>;
export type CollectionItemUpdate = z.infer<typeof CollectionItemUpdateSchema>;
export type CollectionItemReorder = z.infer<typeof CollectionItemReorderSchema>;
