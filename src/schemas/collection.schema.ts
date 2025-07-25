import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type CollectionRow = Database['public']['Tables']['collections']['Row'];

// Create Zod schema matching the database
export const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  user_id: z.string().nullable(),
  is_public: z.boolean().nullable(),
  is_ranked: z.boolean(),
  slug: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<CollectionRow>;

// Create insert schema (id is auto-generated)
export const CollectionInsertSchema = CollectionSchema.omit({ id: true });

// Create update schema (all fields optional)
export const CollectionUpdateSchema = CollectionSchema.partial();

// Export types
export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionInsert = z.infer<typeof CollectionInsertSchema>;
export type CollectionUpdate = z.infer<typeof CollectionUpdateSchema>;
