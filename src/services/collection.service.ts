import { supabase } from '@/lib/supabase';

export interface Collection {
  id: string; // Changed from number to string for UUID
  user_id: string;
  name: string;
  description: string | null;
  is_ranked: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    collection_items: number;
  };
}

export interface CollectionItem {
  id: number;
  collection_id: string; // Changed from number to string for UUID
  movie_id: number;
  position: number | null;
  added_at: string;
  movie: {
    id: number;
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string | null;
    release_date: string | null;
    vote_average: number | null;
    genres: any[];
  };
}

export interface CollectionWithItems extends Collection {
  collection_items: CollectionItem[];
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  is_ranked?: boolean;
}

export const collectionService = {
  // Get all collections for a user
  async getUserCollections(userId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items(count)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Transform the data to include count
    return (data || []).map((collection) => ({
      ...collection,
      _count: {
        collection_items: collection.collection_items?.[0]?.count || 0,
      },
    }));
  },

  // Get a specific collection with its items
  async getCollection(
    collectionId: string
  ): Promise<CollectionWithItems | null> {
    console.log('Fetching collection with ID:', collectionId);

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
      console.error('getCollection error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    console.log('Collection data received:', data);
    return data;
  },

  // Create a new collection
  async createCollection(
    userId: string,
    collectionData: CreateCollectionData
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: userId,
        name: collectionData.name,
        description: collectionData.description || null,
        is_ranked: collectionData.is_ranked || false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Update a collection
  async updateCollection(
    collectionId: string,
    updates: Partial<CreateCollectionData>
  ): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a collection
  async deleteCollection(collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', collectionId);

    if (error) throw error;
  },

  // Add a movie to a collection
  async addMovieToCollection(
    collectionId: string,
    movieId: number
  ): Promise<CollectionItem> {
    console.log('Adding movie to collection:', { collectionId, movieId });

    // Get the next position for this collection
    const { data: maxPositionData } = await supabase
      .from('collection_items')
      .select('position')
      .eq('collection_id', collectionId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (maxPositionData?.position || 0) + 1;
    console.log('Next position will be:', nextPosition);

    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        movie_id: movieId,
        position: nextPosition,
      })
      .select(
        `
        *,
        movie:movies(*)
      `
      )
      .single();

    if (error) {
      console.error('addMovieToCollection error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      throw error;
    }

    // Update collection's updated_at timestamp
    await supabase
      .from('collections')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', collectionId);

    return data;
  },

  // Remove a movie from a collection
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

    // Update collection's updated_at timestamp
    await supabase
      .from('collections')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', collectionId);
  },

  // Check if a movie is in a collection
  async isMovieInCollection(
    collectionId: string,
    movieId: number
  ): Promise<boolean> {
    const { data } = await supabase
      .from('collection_items')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('movie_id', movieId)
      .single();

    return !!data;
  },

  // Reorder items in a collection (for ranked collections)
  async reorderCollectionItems(
    collectionId: string,
    itemIds: number[]
  ): Promise<void> {
    const updates = itemIds.map((itemId, index) => ({
      id: itemId,
      position: index + 1,
    }));

    const { error } = await supabase.from('collection_items').upsert(updates);

    if (error) throw error;

    // Update collection's updated_at timestamp
    await supabase
      .from('collections')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', collectionId);
  },

  // Get collections that contain a specific movie
  async getCollectionsWithMovie(
    userId: string,
    movieId: number
  ): Promise<{ collection: Collection; inCollection: boolean }[]> {
    // Get all user collections
    const collections = await this.getUserCollections(userId);

    // Get all collection items for this movie in one query
    const { data: movieCollectionItems, error } = await supabase
      .from('collection_items')
      .select('collection_id')
      .eq('movie_id', movieId);

    if (error) {
      console.error('getCollectionsWithMovie error:', error);
      throw error;
    }

    // Create a set of collection IDs that contain the movie
    const collectionsWithMovieSet = new Set(
      movieCollectionItems?.map((item) => item.collection_id) || []
    );

    // Map all collections with their movie status
    return collections.map((collection) => ({
      collection,
      inCollection: collectionsWithMovieSet.has(collection.id),
    }));
  },
};
