// AUDITED 06/08/2025
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

import {
  CollectionSchema,
  CollectionWithCountSchema,
  CollectionInsertSchema,
  CollectionUpdateSchema,
  collectionHelpers,
  type Collection,
  type CollectionWithCount,
  type CollectionInsert,
  type CollectionUpdate,
} from '@/schemas/collection.schema';
import {
  CollectionItemWithMovieSchema,
  CollectionItemInsertSchema,
  CollectionItemReorderSchema,
  type CollectionItemWithMovie,
} from '@/schemas/collection-item.schema';
import {
  CollectionWithItemsSchema,
  CollectionPreviewSchema,
  collectionItemHelpers,
  type CollectionWithItems,
  type CollectionPreview,
} from '@/schemas/collection-combined.schema';

export const collectionService = {
  async getUserCollections(
    userId: string,
    options?: {
      limit?: number;
      withCounts?: boolean;
      isRankedOnly?: boolean;
    }
  ): Promise<CollectionWithCount[]> {
    const { limit, withCounts = true, isRankedOnly = false } = options || {};

    let query = supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (isRankedOnly) {
      query = query.eq('is_ranked', true);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!withCounts) {
      return (data || []).map((collection) =>
        CollectionSchema.parse(collection)
      );
    }

    type CollectionWithCountQuery = Collection & {
      collection_items: { count: number }[];
    };

    return ((data || []) as CollectionWithCountQuery[]).map((collection) => {
      const collectionData = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        user_id: collection.user_id,
        is_public: collection.is_public,
        is_ranked: collection.is_ranked,
        slug: collection.slug,
        created_at: collection.created_at,
        updated_at: collection.updated_at,
        _count: {
          collection_items: collection.collection_items?.[0]?.count || 0,
        },
      };
      return CollectionWithCountSchema.parse(collectionData);
    });
  },

  async getCollection(
    collectionId: string
  ): Promise<CollectionWithItems | null> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items(
          *,
          movie:movies(*)
        )
      `
      )
      .eq('id', collectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (data?.collection_items) {
      data.collection_items = collectionItemHelpers.sortByPosition(
        data.collection_items
      );
    }

    return CollectionWithItemsSchema.parse(data);
  },

  async getCollectionPreview(
    collectionId: string
  ): Promise<CollectionPreview | null> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items(
          *,
          movie:movies(*)
        )
      `
      )
      .eq('id', collectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const previewData = {
      ...data,
      collection_items: data.collection_items?.slice(0, 6) || [],
      _count: {
        collection_items: data.collection_items?.length || 0,
      },
    };

    return CollectionPreviewSchema.parse(previewData);
  },

  async createCollection(
    userId: string,
    collectionData: Omit<CollectionInsert, 'user_id'>
  ): Promise<Collection> {
    const slug =
      collectionData.slug ||
      collectionHelpers.generateSlug(collectionData.name);

    const insertData = CollectionInsertSchema.parse({
      ...collectionData,
      user_id: userId,
      slug,
    });

    const { data, error } = await supabase
      .from('collections')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return CollectionSchema.parse(data);
  },

  async updateCollection(
    collectionId: string,
    updates: CollectionUpdate
  ): Promise<Collection> {
    const validatedUpdates = CollectionUpdateSchema.parse(updates);

    if (validatedUpdates.name && !validatedUpdates.slug) {
      validatedUpdates.slug = collectionHelpers.generateSlug(
        validatedUpdates.name
      );
    }

    const { data, error } = await supabase
      .from('collections')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionId)
      .select()
      .single();

    if (error) throw error;
    return CollectionSchema.parse(data);
  },

  async deleteCollection(collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);

    if (error) throw error;
  },

  async addMovieToCollection(
    collectionId: string,
    movieId: number,
    notes?: string
  ): Promise<CollectionItemWithMovie> {
    const exists = await this.isMovieInCollection(collectionId, movieId);
    if (exists) {
      throw new Error('Movie already exists in this collection');
    }

    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    const nextPosition = collectionItemHelpers.getNextPosition(collection);

    const insertData = CollectionItemInsertSchema.parse({
      collection_id: collectionId,
      movie_id: movieId,
      position: nextPosition,
      notes,
    });

    const { data, error } = await supabase
      .from('collection_items')
      .insert(insertData)
      .select(
        `
        *,
        movie:movies(*)
      `
      )
      .single();

    if (error) throw error;

    await this.touchCollection(collectionId);

    return CollectionItemWithMovieSchema.parse(data);
  },

  async addMoviesToCollection(
    collectionId: string,
    movieIds: number[]
  ): Promise<CollectionItemWithMovie[]> {
    if (movieIds.length === 0) return [];

    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    const existingMovieIds = new Set(
      collection.collection_items.map((item) => item.movie_id)
    );
    const newMovieIds = movieIds.filter((id) => !existingMovieIds.has(id));

    if (newMovieIds.length === 0) return [];

    let nextPosition = collectionItemHelpers.getNextPosition(collection);
    const insertData = newMovieIds.map((movieId) => ({
      collection_id: collectionId,
      movie_id: movieId,
      position: nextPosition++,
      added_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('collection_items')
      .upsert(insertData, {
        onConflict: 'collection_id,movie_id',
        ignoreDuplicates: true,
      })
      .select(`*, movie:movies(*)`);

    if (error) throw error;

    await this.touchCollection(collectionId);

    return z.array(CollectionItemWithMovieSchema).parse(data || []);
  },

  async removeMovieFromCollection(
    collectionId: string,
    movieId: number
  ): Promise<void> {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId);

    if (error) throw error;

    await this.touchCollection(collectionId);
  },

  async isMovieInCollection(
    collectionId: string,
    movieId: number
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  async reorderCollectionItems(
    collectionId: string,
    items: Array<{ id: string; position: number }>
  ): Promise<void> {
    const validatedItems = CollectionItemReorderSchema.parse(items);

    const promises = validatedItems.map((item) =>
      supabase
        .from('collection_items')
        .update({ position: item.position })
        .eq('id', item.id)
    );

    const results = await Promise.all(promises);
    const hasError = results.some((result) => result.error);
    if (hasError) throw new Error('Failed to reorder items');

    await this.touchCollection(collectionId);
  },

  async getCollectionsWithMovie(
    userId: string,
    movieId: number
  ): Promise<
    Array<{ collection: CollectionWithCount; inCollection: boolean }>
  > {
    const collections = await this.getUserCollections(userId);

    const { data: movieCollectionItems, error } = await supabase
      .from('collection_items')
      .select('collection_id')
      .eq('movie_id', movieId);

    if (error) throw error;

    const collectionsWithMovieSet = new Set(
      movieCollectionItems?.map((item) => item.collection_id) || []
    );

    return collections.map((collection) => ({
      collection,
      inCollection: collectionsWithMovieSet.has(collection.id),
    }));
  },

  async getUserCollectionsWithPreviews(
    userId: string,
    limit?: number
  ): Promise<CollectionPreview[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items(
          *,
          movie:movies(*)
        )
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit || 10);

    if (error) throw error;

    return (data || []).map((collection) => {
      const preview = {
        ...collection,
        collection_items: collection.collection_items?.slice(0, 6) || [],
        _count: {
          collection_items: collection.collection_items?.length || 0,
        },
      };
      return CollectionPreviewSchema.parse(preview);
    });
  },

  async updateItemNotes(
    collectionId: string,
    movieId: number,
    notes: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from('collection_items')
      .update({ notes })
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId);

    if (error) throw error;
    await this.touchCollection(collectionId);
  },

  async touchCollection(collectionId: string): Promise<void> {
    await supabase
      .from('collections')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', collectionId);
  },

  async getCollectionStats(userId: string): Promise<{
    totalCollections: number;
    rankedCollections: number;
    publicCollections: number;
    totalMovies: number;
  }> {
    const collections = await this.getUserCollections(userId);

    const stats = collections.reduce(
      (acc, collection) => ({
        totalCollections: acc.totalCollections + 1,
        rankedCollections:
          acc.rankedCollections + (collection.is_ranked ? 1 : 0),
        publicCollections:
          acc.publicCollections + (collection.is_public ? 1 : 0),
        totalMovies:
          acc.totalMovies + (collection._count?.collection_items || 0),
      }),
      {
        totalCollections: 0,
        rankedCollections: 0,
        publicCollections: 0,
        totalMovies: 0,
      }
    );

    return stats;
  },
};
