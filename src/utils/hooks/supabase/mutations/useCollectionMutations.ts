// AUDITED 12/08/2025

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionService } from '@/services/supabase/collection.service';
import { useAuth } from '@/context/AuthContext';
import { collectionKeys } from '../queries/useCollections';
import type { CollectionInsert } from '@/schemas/collection.schema';
import { useToast } from '@/context/ToastContext';

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
    },
  });
};

export const useAddMovieToCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movieId,
    }: {
      collectionId: string;
      movieId: number;
    }) => {
      return collectionService.addMovieToCollection(collectionId, movieId);
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
    },
  });
};

export const useRemoveMovieFromCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movieId,
    }: {
      collectionId: string;
      movieId: number;
    }) => {
      return collectionService.removeMovieFromCollection(collectionId, movieId);
    },
    onSuccess: (_, { collectionId }) => {
      // Invalidate the specific collection detail
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
      // Invalidate collections list to update movie counts
      queryClient.invalidateQueries({
        queryKey: collectionKeys.withPreviews(user?.id || ''),
      });
      // Invalidate all collections for broader updates
      queryClient.invalidateQueries({
        queryKey: collectionKeys.all,
      });
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
      movieId,
    }: {
      collectionId: string;
      movieId: number;
    }) => {
      return collectionService.toggleMovieInCollection(collectionId, movieId);
    },
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(user?.id || '', collectionId),
      });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.all,
      });
    },
    onError: (error: Error) => {
      showToast('error', error.message);
    },
  });
};
