// DONE

import { z } from 'zod';
import type { Database } from '@/types/database.types';

// Get the type from Supabase
type CollectionRow = Database['public']['Tables']['collections']['Row'];

// Create Zod schema matching the database
export const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Collection name is required').max(100),
  description: z.string().max(500).nullable(),
  user_id: z.string().uuid().nullable(),
  is_public: z.boolean().nullable(),
  is_ranked: z.boolean(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only')
    .nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<CollectionRow>;

export const CollectionWithCountSchema = CollectionSchema.extend({
  _count: z
    .object({
      collection_items: z.number(),
    })
    .optional(),
});

// Create insert schema
export const CollectionInsertSchema = CollectionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  user_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  is_public: z.boolean().default(false),
  is_ranked: z.boolean().default(false),
});

// Create update schema
export const CollectionUpdateSchema = CollectionSchema.pick({
  name: true,
  description: true,
  is_public: true,
  is_ranked: true,
  slug: true,
}).partial();

// Export types
export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionWithCount = z.infer<typeof CollectionWithCountSchema>;
export type CollectionInsert = z.infer<typeof CollectionInsertSchema>;
export type CollectionUpdate = z.infer<typeof CollectionUpdateSchema>;

// Helper functions
export const collectionHelpers = {
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  isOwner(collection: Collection, userId: string): boolean {
    return collection.user_id === userId;
  },

  canEdit(collection: Collection, userId: string): boolean {
    return this.isOwner(collection, userId);
  },

  canView(collection: Collection, userId: string): boolean {
    return collection.is_public || this.isOwner(collection, userId);
  },
};
