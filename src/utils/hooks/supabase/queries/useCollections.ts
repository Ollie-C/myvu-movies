// hooks/queries/useCollections.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { collectionService } from '@/services/supabase/collection.service';
import type { Collection } from '@/schemas/collection.schema';

// Query keys factory
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (filters: any) => [...collectionKeys.lists(), filters] as const,
  detail: (id: string) => [...collectionKeys.all, 'detail', id] as const,
  withPreviews: () => [...collectionKeys.all, 'withPreviews'] as const,
};

interface UseCollectionsOptions {
  limit?: number;
  withPreviews?: boolean;
  onlyRanked?: boolean;
  sortBy?: 'updated_at' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const useCollections = (options?: UseCollectionsOptions) => {
  const { user } = useAuth();
  const {
    limit,
    withPreviews = false,
    onlyRanked = false,
    sortBy = 'updated_at',
    sortOrder = 'desc',
  } = options || {};

  return useQuery({
    queryKey: collectionKeys.list({ ...options, userId: user?.id }),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let collections;

      if (withPreviews) {
        collections = await collectionService.getUserCollectionsWithPreviews(
          user.id
        );
      } else {
        collections = await collectionService.getUserCollections(user.id);
      }

      // Apply filters
      if (onlyRanked) {
        collections = collections.filter((c) => c.is_ranked);
      }

      // Apply sorting
      collections.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created_at':
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          case 'updated_at':
          default:
            comparison =
              new Date(a.updated_at).getTime() -
              new Date(b.updated_at).getTime();
            break;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Apply limit
      if (limit) {
        collections = collections.slice(0, limit);
      }

      return collections;
    },
    enabled: !!user?.id,
  });
};

// Get a single collection
export const useCollection = (collectionId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: collectionKeys.detail(collectionId),
    queryFn: () => collectionService.getCollection(collectionId),
    enabled: !!user?.id && !!collectionId,
  });
};

// Prefetch collection
export const usePrefetchCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (collectionId: string) => {
    if (!user?.id || !collectionId) return;

    queryClient.prefetchQuery({
      queryKey: collectionKeys.detail(collectionId),
      queryFn: () => collectionService.getCollection(collectionId),
    });
  };
};
