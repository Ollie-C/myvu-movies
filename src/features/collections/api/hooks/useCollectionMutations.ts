import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionService } from '@/features/collections/api/collection.service';
import { useAuth } from '@/shared/context/AuthContext';
import { collectionKeys } from '@/features/collections/api/hooks/useCollections';
import type { CollectionInsert } from '@/features/collections/models/collection.schema';
import { useToast } from '@/shared/context/ToastContext';
import { activityKeys } from '@/features/user/api/hooks/useUserActivity';

export const useCreateCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (data: CollectionInsert) => {
      if (!user?.id) throw new Error('User not authenticated');
      return collectionService.createCollection(user.id, data);
    },
    onSuccess: (newCollection) => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      showToast('success', `Collection "${newCollection.name}" created`);
    },
    onError: (error: Error) => {
      showToast('error', error.message);
    },
  });
};

export const useUpdateCollection = (collectionId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      name?: string;
      description?: string;
      is_ranked?: boolean;
      is_public?: boolean;
    }) => {
      return collectionService.updateCollection(collectionId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useDeleteCollection = (collectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return collectionService.deleteCollection(collectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

// 🔄 UPDATED — movieId → movie_uuid
export const useAddMovieToCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movie_uuid,
    }: {
      collectionId: string;
      movie_uuid: string;
    }) => {
      return collectionService.addMovieToCollection(collectionId, movie_uuid);
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useRemoveMovieFromCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movie_uuid,
    }: {
      collectionId: string;
      movie_uuid: string;
    }) => {
      return collectionService.removeMovieFromCollection(
        collectionId,
        movie_uuid
      );
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.withPreviews(user?.id || ''),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useToggleMovieInCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movie_uuid,
    }: {
      collectionId: string;
      movie_uuid: string;
    }) => {
      return collectionService.toggleMovieInCollection(
        collectionId,
        movie_uuid
      );
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: activityKeys.recent(user.id),
        });
      }
    },
    onError: (error: Error) => {
      showToast('error', error.message);
    },
  });
};
