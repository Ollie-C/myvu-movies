// NOT AUDITED

import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { collectionService } from '@/services/supabase/collection.service';
import type {
  Collection,
  CollectionWithCount,
} from '@/schemas/collection.schema';
import type {
  CollectionWithItems,
  CollectionPreview,
} from '@/schemas/collection-combined.schema';

// Better typed filters
interface CollectionFilters {
  userId?: string;
  limit?: number;
  withPreviews?: boolean;
  withCounts?: boolean;
  isRankedOnly?: boolean;
  sortBy?: 'updated_at' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Query keys factory with better typing
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (filters: CollectionFilters) =>
    [...collectionKeys.lists(), filters] as const,
  detail: (id: string) => [...collectionKeys.all, 'detail', id] as const,
  preview: (id: string) => [...collectionKeys.all, 'preview', id] as const,
  withPreviews: (userId: string) =>
    [...collectionKeys.all, 'withPreviews', userId] as const,
  withMovie: (userId: string, movieId: number) =>
    [...collectionKeys.all, 'withMovie', userId, movieId] as const,
  stats: (userId: string) => [...collectionKeys.all, 'stats', userId] as const,
  infinite: (filters: CollectionFilters) =>
    [...collectionKeys.all, 'infinite', filters] as const,
};

// Main collections hook with better options
export const useCollections = (options?: CollectionFilters) => {
  const { user } = useAuth();
  const {
    limit,
    withPreviews = false,
    withCounts = true,
    isRankedOnly = false,
    sortBy = 'updated_at',
    sortOrder = 'desc',
  } = options || {};

  return useQuery({
    queryKey: collectionKeys.list({ ...options, userId: user?.id }),
    queryFn: async (): Promise<CollectionPreview[] | CollectionWithCount[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      let collections;

      if (withPreviews) {
        collections = await collectionService.getUserCollectionsWithPreviews(
          user.id,
          limit
        );
      } else {
        collections = await collectionService.getUserCollections(user.id, {
          limit,
          withCounts,
          isRankedOnly,
        });
      }

      // Client-side sorting (if not handled by service)
      if (sortBy !== 'updated_at' || sortOrder !== 'desc') {
        collections.sort((a, b) => {
          let comparison = 0;

          switch (sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'created_at':
              comparison =
                new Date(a.created_at || 0).getTime() -
                new Date(b.created_at || 0).getTime();
              break;
            case 'updated_at':
            default:
              comparison =
                new Date(a.updated_at || 0).getTime() -
                new Date(b.updated_at || 0).getTime();
              break;
          }

          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      return collections;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get a single collection with its items
export const useCollection = (collectionId: string | undefined) => {
  const { user } = useAuth();

  return useQuery<CollectionWithItems | null, Error>({
    queryKey: collectionKeys.detail(collectionId || ''),
    queryFn: () => {
      if (!collectionId) return null;
      return collectionService.getCollection(collectionId);
    },
    enabled: !!user?.id && !!collectionId,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Get collection preview (lighter query)
export const useCollectionPreview = (collectionId: string | undefined) => {
  const { user } = useAuth();

  return useQuery<CollectionPreview | null, Error>({
    queryKey: collectionKeys.preview(collectionId || ''),
    queryFn: () => {
      if (!collectionId) return null;
      return collectionService.getCollectionPreview(collectionId);
    },
    enabled: !!user?.id && !!collectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get collections with movie status
export const useCollectionsWithMovie = (movieId: number | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collectionKeys.withMovie(user?.id || '', movieId || 0),
    queryFn: () => {
      if (!user?.id || !movieId) throw new Error('Missing required data');
      return collectionService.getCollectionsWithMovie(user.id, movieId);
    },
    enabled: !!user?.id && !!movieId,
    staleTime: 30 * 1000,
  });
};

// Get user collection statistics
export const useCollectionStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collectionKeys.stats(user?.id || ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return collectionService.getCollectionStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Infinite scroll for collections (useful for large lists)
export const useCollectionsInfinite = (
  options?: Omit<CollectionFilters, 'limit'>
) => {
  const { user } = useAuth();
  const limit = 20;

  return useInfiniteQuery({
    queryKey: collectionKeys.infinite({ ...options, userId: user?.id, limit }),
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const collections = await collectionService.getUserCollections(user.id, {
        ...options,
        limit,
        // offset: pageParam * limit, // If your service supports offset
      });

      // Simulate pagination
      const start = pageParam * limit;
      const end = start + limit;
      return collections.slice(start, end);
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === limit ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
  });
};

// Prefetch utilities
export const usePrefetchCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return {
    prefetchCollection: (collectionId: string) => {
      if (!user?.id || !collectionId) return;

      return queryClient.prefetchQuery({
        queryKey: collectionKeys.detail(collectionId),
        queryFn: () => collectionService.getCollection(collectionId),
        staleTime: 60 * 1000,
      });
    },

    prefetchCollectionPreview: (collectionId: string) => {
      if (!user?.id || !collectionId) return;

      return queryClient.prefetchQuery({
        queryKey: collectionKeys.preview(collectionId),
        queryFn: () => collectionService.getCollectionPreview(collectionId),
        staleTime: 5 * 60 * 1000,
      });
    },

    prefetchCollections: () => {
      if (!user?.id) return;

      return queryClient.prefetchQuery({
        queryKey: collectionKeys.list({ userId: user.id }),
        queryFn: () => collectionService.getUserCollections(user.id),
        staleTime: 30 * 1000,
      });
    },
  };
};

// Check if a movie is in any collections
export const useIsMovieInCollections = (movieId: number | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...collectionKeys.all, 'movieInAny', user?.id, movieId],
    queryFn: async () => {
      if (!user?.id || !movieId) return false;

      const result = await collectionService.getCollectionsWithMovie(
        user.id,
        movieId
      );

      return result.some(({ inCollection }) => inCollection);
    },
    enabled: !!user?.id && !!movieId,
    staleTime: 30 * 1000,
  });
};

// Hook to check if user can edit a collection
export const useCanEditCollection = (
  collection: Collection | null | undefined
) => {
  const { user } = useAuth();

  if (!collection || !user?.id) return false;
  return collection.user_id === user.id;
};

// Get collections with previews (typed specifically for previews)
export const useCollectionsWithPreviews = (
  options?: Omit<CollectionFilters, 'withPreviews'>
) => {
  const { user } = useAuth();
  const {
    limit,
    withCounts = true,
    isRankedOnly = false,
    sortBy = 'updated_at',
    sortOrder = 'desc',
  } = options || {};

  return useQuery<CollectionPreview[], Error>({
    queryKey: collectionKeys.withPreviews(user?.id || ''),
    queryFn: async (): Promise<CollectionPreview[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const collections =
        await collectionService.getUserCollectionsWithPreviews(user.id, limit);

      // Client-side sorting (if not handled by service)
      if (sortBy !== 'updated_at' || sortOrder !== 'desc') {
        collections.sort((a, b) => {
          let comparison = 0;

          switch (sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'created_at':
              comparison =
                new Date(a.created_at || 0).getTime() -
                new Date(b.created_at || 0).getTime();
              break;
            case 'updated_at':
            default:
              comparison =
                new Date(a.updated_at || 0).getTime() -
                new Date(b.updated_at || 0).getTime();
              break;
          }

          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      return collections;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};
