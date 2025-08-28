// AUDITED 11/08/2025

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { collectionService } from '@/services/supabase/collection.service';
import type { Collection } from '@/schemas/collection.schema';
import type {
  CollectionWithItems,
  CollectionPreview,
} from '@/schemas/collection-combined.schema';

// Types
interface CollectionFilters {
  limit?: number;
  withCounts?: boolean;
  isRankedOnly?: boolean;
  sortBy?: 'updated_at' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Query keys factory
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (userId: string, filters?: CollectionFilters) =>
    [...collectionKeys.lists(), userId, filters] as const,
  detail: (userId: string, id: string) =>
    [...collectionKeys.all, 'detail', userId, id] as const,
  preview: (userId: string, id: string) =>
    [...collectionKeys.all, 'preview', userId, id] as const,
  withPreviews: (userId: string, limit?: number) =>
    [...collectionKeys.all, 'withPreviews', userId, limit] as const,
  withMovie: (userId: string, movieId: string) =>
    [...collectionKeys.all, 'withMovie', userId, movieId] as const,
  stats: (userId: string) => [...collectionKeys.all, 'stats', userId] as const,
};

// Main collections hook (simplified)
export const useCollections = (options?: CollectionFilters) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collectionKeys.list(user?.id || '', options),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');

      return collectionService.getUserCollections(user.id, options);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
};

export const useCollectionsWithPreviews = (limit?: number) => {
  const { user } = useAuth();

  return useQuery<CollectionPreview[], Error>({
    queryKey: collectionKeys.withPreviews(user?.id || '', limit),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');

      return collectionService.getUserCollectionsWithPreviews(user.id, limit);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
};

// Single collection with items
export const useCollection = (collectionId?: string) => {
  const { user } = useAuth();

  return useQuery<CollectionWithItems | null, Error>({
    queryKey: collectionKeys.detail(user?.id || '', collectionId || ''),
    queryFn: () => {
      if (!collectionId) return null;
      return collectionService.getCollection(collectionId);
    },
    enabled: !!user?.id && !!collectionId,
    staleTime: 60 * 1000,
  });
};

// Collection preview (lighter query)
export const useCollectionPreview = (collectionId?: string) => {
  const { user } = useAuth();

  return useQuery<CollectionPreview | null, Error>({
    queryKey: collectionKeys.preview(user?.id || '', collectionId || ''),
    queryFn: () => {
      if (!collectionId) return null;
      return collectionService.getCollectionPreview(collectionId);
    },
    enabled: !!user?.id && !!collectionId,
    staleTime: 5 * 60 * 1000,
  });
};

// Collections with movie status
export const useCollectionsWithMovie = (movieId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collectionKeys.withMovie(user?.id || '', movieId || ''),
    queryFn: () => {
      if (!user?.id || !movieId) throw new Error('Missing required data');
      return collectionService.getCollectionsWithMovie(user.id, movieId);
    },
    enabled: !!user?.id && !!movieId,
    staleTime: 30 * 1000,
  });
};

// Collection statistics
export const useCollectionStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collectionKeys.stats(user?.id || ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return collectionService.getCollectionStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
};

// Check if movie is in any collections (simplified)
export const useIsMovieInCollections = (movieId?: string) => {
  const { data: collectionsWithMovie } = useCollectionsWithMovie(movieId);

  return {
    data:
      collectionsWithMovie?.some(({ inCollection }) => inCollection) ?? false,
    isLoading: !collectionsWithMovie,
  };
};

// Simple utility hook (no complex logic)
export const useCanEditCollection = (collection?: Collection | null) => {
  const { user } = useAuth();

  if (!collection || !user?.id) return false;
  return collection.user_id === user.id;
};

// Prefetch utilities (simplified)
export const usePrefetchCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (collectionId: string) => {
    if (!user?.id || !collectionId) return;

    queryClient.prefetchQuery({
      queryKey: collectionKeys.detail(user.id, collectionId),
      queryFn: () => collectionService.getCollection(collectionId),
      staleTime: 60 * 1000,
    });
  };
};
