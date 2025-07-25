import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type CollectionItemRow =
  Database['public']['Tables']['collection_items']['Row'];

// Create Zod schema matching the database
export const CollectionItemSchema = z.object({
  id: z.string(),
  collection_id: z.string().nullable(),
  movie_id: z.number().nullable(),
  position: z.number().nullable(),
  notes: z.string().nullable(),
  added_at: z.string().nullable(),
}) satisfies z.ZodType<CollectionItemRow>;

// Create insert schema (id is auto-generated)
export const CollectionItemInsertSchema = CollectionItemSchema.omit({
  id: true,
});

// Create update schema (all fields optional)
export const CollectionItemUpdateSchema = CollectionItemSchema.partial();

// Export types
export type CollectionItem = z.infer<typeof CollectionItemSchema>;
export type CollectionItemInsert = z.infer<typeof CollectionItemInsertSchema>;
export type CollectionItemUpdate = z.infer<typeof CollectionItemUpdateSchema>;
