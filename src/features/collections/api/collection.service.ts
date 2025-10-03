import { supabase } from '@/shared/lib/supabase';
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
} from '@/features/collections/models/collection.schema';

import {
  CollectionItemInsertSchema,
  CollectionItemReorderSchema,
  CollectionItemWithDetailsSchema,
  type CollectionItemWithDetails,
} from '@/features/collections/models/collection-item.schema';

import {
  CollectionWithItemsSchema,
  CollectionPreviewSchema,
  collectionItemHelpers,
  type CollectionWithItems,
  type CollectionPreview,
} from '@/features/collections/models/collection-combined.schema';

import { activityService } from '@/features/activity/api/activity.service';

export const collectionService = {
  async getUserCollections(
    userId: string,
    options?: {
      limit?: number;
      withCounts?: boolean;
      isRankedOnly?: boolean;
      sortBy?: 'updated_at' | 'created_at' | 'name';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<CollectionWithCount[]> {
    const {
      limit,
      withCounts = true,
      isRankedOnly = false,
      sortBy = 'updated_at',
      sortOrder = 'desc',
    } = options || {};

    let query = supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', userId);

    if (isRankedOnly) {
      query = query.eq('is_ranked', true);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

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
        ranking_list_id: collection.ranking_list_id ?? null,
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
        collection_items:collection_items_with_details(*)
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
        collection_items:collection_items_with_details(*)
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

    if (collectionData.ranking_list_id) {
      const { data: existing, error: checkError } = await supabase
        .from('collections')
        .select('*')
        .eq('ranking_list_id', collectionData.ranking_list_id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        throw new Error('A collection already exists for this ranking list.');
      }
    }

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
    const parsed = CollectionSchema.parse(data);
    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'collection_created',
        collection_id: parsed.id,
        metadata: { name: parsed.name },
      });
    } catch (_) {}
    return parsed;
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
    movieId: string,
    notes?: string
  ): Promise<CollectionItemWithDetails> {
    const { data: existingItem, error: checkError } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingItem)
      throw new Error('Movie already exists in this collection');

    const collection = await collectionService.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    const nextPosition = collectionItemHelpers.getNextPosition(collection);

    const insertData = CollectionItemInsertSchema.parse({
      collection_id: collectionId,
      movie_id: movieId,
      position: nextPosition,
      notes: notes || null,
    });

    // Insert and immediately reselect from the new view
    const { data, error } = await supabase
      .from('collection_items')
      .insert(insertData)
      .select(`id`)
      .single();

    if (error) throw error;
    await collectionService.touchCollection(collectionId);

    // Reselect flattened details
    const { data: detailRow, error: detailError } = await supabase
      .from('collection_items_with_details')
      .select('*')
      .eq('collection_item_id', data.id)
      .single();

    if (detailError) throw detailError;

    return CollectionItemWithDetailsSchema.parse(detailRow);
  },

  async addMoviesToCollection(
    collectionId: string,
    movieIds: string[]
  ): Promise<CollectionItemWithDetails[]> {
    if (movieIds.length === 0) return [];

    const collection = await collectionService.getCollection(collectionId);
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
      .insert(insertData)
      .select('id');

    if (error) throw error;
    await collectionService.touchCollection(collectionId);

    // Reselect from view
    const { data: detailRows, error: detailErr } = await supabase
      .from('collection_items_with_details')
      .select('*')
      .in(
        'collection_item_id',
        (data || []).map((d) => d.id)
      );

    if (detailErr) throw detailErr;
    return z.array(CollectionItemWithDetailsSchema).parse(detailRows || []);
  },

  async removeMovieFromCollection(collectionId: string, movieId: string) {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId);

    if (error) throw error;

    await collectionService.touchCollection(collectionId);
  },

  async toggleMovieInCollection(collectionId: string, movieId: string) {
    const { data: existingItem } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (existingItem) {
      await collectionService.removeMovieFromCollection(collectionId, movieId);
    } else {
      await collectionService.addMovieToCollection(collectionId, movieId);
    }
  },

  async reorderCollectionItems(
    collectionId: string,
    items: Array<{ id: string; position: number }>
  ) {
    const validated = CollectionItemReorderSchema.parse(items);
    await Promise.all(
      validated.map((item) =>
        supabase
          .from('collection_items')
          .update({ position: item.position })
          .eq('id', item.id)
      )
    );
    await collectionService.touchCollection(collectionId);
  },

  async getCollectionsWithMovie(userId: string, movieId: string) {
    const collections = await collectionService.getUserCollections(userId);

    const { data, error } = await supabase
      .from('collection_items')
      .select('collection_id')
      .eq('movie_id', movieId);

    if (error) throw error;

    const inSet = new Set(data?.map((d) => d.collection_id));
    return collections.map((c) => ({
      collection: c,
      inCollection: inSet.has(c.id),
    }));
  },

  async getUserCollectionsWithPreviews(
    userId: string,
    limit?: number,
    options?: {
      sortBy?: 'updated_at' | 'created_at' | 'name';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<CollectionPreview[]> {
    const { sortBy = 'updated_at', sortOrder = 'desc' } = options || {};

    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items:collection_items_with_details(*)
      `
      )
      .eq('user_id', userId)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit || 10);

    if (error) throw error;

    return (data || []).map((c) => {
      const preview = {
        ...c,
        collection_items: c.collection_items?.slice(0, 6) || [],
        _count: { collection_items: c.collection_items?.length || 0 },
      };
      return CollectionPreviewSchema.parse(preview);
    });
  },

  async updateItemNotes(
    collectionId: string,
    movieId: string,
    notes: string | null
  ) {
    const { error } = await supabase
      .from('collection_items')
      .update({ notes })
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId);

    if (error) throw error;
    await collectionService.touchCollection(collectionId);
  },

  async touchCollection(collectionId: string) {
    await supabase
      .from('collections')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', collectionId);
  },

  async getCollectionStats(userId: string) {
    const collections = await collectionService.getUserCollections(userId);
    return collections.reduce(
      (acc, c) => ({
        totalCollections: acc.totalCollections + 1,
        rankedCollections: acc.rankedCollections + (c.is_ranked ? 1 : 0),
        publicCollections: acc.publicCollections + (c.is_public ? 1 : 0),
        totalMovies: acc.totalMovies + (c._count?.collection_items || 0),
      }),
      {
        totalCollections: 0,
        rankedCollections: 0,
        publicCollections: 0,
        totalMovies: 0,
      }
    );
  },
};
