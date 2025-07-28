// DONE

import { z } from 'zod';
import { CollectionSchema } from './collection.schema';
import {
  CollectionItemWithMovieSchema,
  type CollectionItemWithMovie,
} from './collection-item.schema';

// Collection with its items
export const CollectionWithItemsSchema = CollectionSchema.extend({
  collection_items: z.array(CollectionItemWithMovieSchema),
  _count: z
    .object({
      collection_items: z.number(),
    })
    .optional(),
});

// Collection preview (limited items for display)
export const CollectionPreviewSchema = CollectionSchema.extend({
  collection_items: z.array(CollectionItemWithMovieSchema).max(6),
  _count: z.object({
    collection_items: z.number(),
  }),
});

// Collection summary for lists
export const CollectionSummarySchema = CollectionSchema.extend({
  movie_count: z.number(),
  preview_posters: z.array(z.string()).max(4),
  last_updated: z.string(),
});

// Export types
export type CollectionWithItems = z.infer<typeof CollectionWithItemsSchema>;
export type CollectionPreview = z.infer<typeof CollectionPreviewSchema>;
export type CollectionSummary = z.infer<typeof CollectionSummarySchema>;

// Helper to check if collection can be modified
export const collectionItemHelpers = {
  canAddMovie(collection: CollectionWithItems, movieId: number): boolean {
    return !collection.collection_items.some(
      (item) => item.movie_id === movieId
    );
  },

  getNextPosition(collection: CollectionWithItems): number {
    if (collection.collection_items.length === 0) return 0;

    const positions = collection.collection_items
      .map((item) => item.position || 0)
      .filter((pos) => pos !== null);

    return Math.max(...positions, -1) + 1;
  },

  sortByPosition(items: CollectionItemWithMovie[]): CollectionItemWithMovie[] {
    return [...items].sort((a, b) => (a.position || 0) - (b.position || 0));
  },
};
