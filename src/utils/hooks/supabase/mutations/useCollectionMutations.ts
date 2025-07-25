import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionService } from '@/services/supabase/collection.service';
import { useAuth } from '@/context/AuthContext';
import { collectionKeys } from '../queries/useCollections';

export const useCreateCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      is_ranked?: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return collectionService.createCollection(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
};

export const useAddMovieToCollection = () => {
  const queryClient = useQueryClient();

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
        queryKey: collectionKeys.detail(collectionId),
      });
    },
  });
};
