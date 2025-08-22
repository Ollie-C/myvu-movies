// audited: 12/08/2025

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingService } from '@/services/supabase/ranking.service';
import { useAuth } from '@/context/AuthContext';
import { rankingKeys } from '../queries/useRanking';
import { activityKeys } from '../queries/useUserActivity';

export const useUpdateRankingListName = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, name }: { listId: string; name: string }) => {
      return rankingService.updateRankingListName(listId, name);
    },
    onSuccess: () => {
      // Invalidate ranking lists to show updated name
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: rankingKeys.userLists(user.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useDeleteRankingList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      return rankingService.deleteRankingList(listId);
    },
    onSuccess: () => {
      // Invalidate ranking lists to remove deleted list
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: rankingKeys.userLists(user.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useConvertRankingToCollection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rankingListId: string) => {
      return rankingService.convertRankingListToCollection(rankingListId);
    },
    onSuccess: () => {
      // Invalidate ranking lists since one was converted
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: rankingKeys.userLists(user.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      // Also invalidate collections since a new one was created
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};
