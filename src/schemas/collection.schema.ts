import { z } from 'zod';
import type { Database } from '@/types/database.types';

type CollectionRow = Database['public']['Tables']['collections']['Row'];

export const CollectionSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, 'Collection name is required').max(100),
  description: z.string().max(500).nullable(),
  user_id: z.uuid().nullable(),
  is_public: z.boolean().nullable(),
  is_ranked: z.boolean(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only')
    .nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  ranking_list_id: z.string().nullable(),
}) satisfies z.ZodType<CollectionRow>;

export const CollectionWithCountSchema = CollectionSchema.extend({
  _count: z
    .object({
      collection_items: z.number(),
    })
    .optional(),
});

export const CollectionInsertSchema = CollectionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  user_id: z.uuid(),
  name: z.string().min(1).max(100),
  is_public: z.boolean().default(false),
  is_ranked: z.boolean().default(false),
  ranking_list_id: z.string().nullable(),
});

export const CollectionUpdateSchema = CollectionSchema.pick({
  name: true,
  description: true,
  is_public: true,
  is_ranked: true,
  slug: true,
}).partial();

export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionWithCount = z.infer<typeof CollectionWithCountSchema>;
export type CollectionInsert = z.infer<typeof CollectionInsertSchema>;
export type CollectionUpdate = z.infer<typeof CollectionUpdateSchema>;

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
