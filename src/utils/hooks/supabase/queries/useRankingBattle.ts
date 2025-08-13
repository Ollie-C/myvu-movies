// AUDITED 12/08/2025

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rankingService } from '@/services/supabase/ranking.service';

export function useRankingBattle(rankingListId: string, userId: string) {
  const queryClient = useQueryClient();

  // Fetch movie pair
  const {
    data: moviePair,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['movie-pair', userId, rankingListId],
    queryFn: async () => {
      if (!userId || !rankingListId) return null;

      const pair = await rankingService.getRandomMoviePair(
        userId,
        rankingListId
      );

      return pair;
    },
    enabled: !!userId && !!rankingListId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Process battle result
  const battleMutation = useMutation({
    mutationFn: async ({
      winnerId,
      loserId,
    }: {
      winnerId: number;
      loserId: number;
    }) => {
      if (!userId || !rankingListId)
        throw new Error('Missing user or ranking list');

      return await rankingService.processRankingBattle({
        winnerId,
        loserId,
        rankingListId,
      });
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['movie-pair', userId, rankingListId],
      });
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
    },
  });

  return {
    moviePair,
    isLoading,
    error,
    selectWinner: (winnerId: number, loserId: number) =>
      battleMutation.mutate({ winnerId, loserId }),
    isProcessing: battleMutation.isPending,
    getNewPair: () => refetch(),
  };
}
