import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RankingService } from '@/services/supabase/ranking.service';
import { useState, useEffect } from 'react';

export function useRankingBattle(rankingListId: string, userId: string) {
  const queryClient = useQueryClient();
  const [currentPair, setCurrentPair] = useState<any>(null);

  // Fetch movie pair
  const {
    data: moviePair,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ranking-pair', rankingListId],
    queryFn: () => RankingService.getRandomMoviePair(rankingListId, userId),
  });

  // Update current pair when data changes
  useEffect(() => {
    if (moviePair) {
      setCurrentPair(moviePair);
    }
  }, [moviePair]);

  // Process battle result
  const battleMutation = useMutation({
    mutationFn: async ({
      winnerId,
      loserId,
    }: {
      winnerId: number;
      loserId: number;
    }) => {
      if (!currentPair) return;

      const winnerRating =
        currentPair.movie1.movie_id === winnerId
          ? currentPair.movie1.elo_score || 1500
          : currentPair.movie2.elo_score || 1500;

      const loserRating =
        currentPair.movie1.movie_id === loserId
          ? currentPair.movie1.elo_score || 1500
          : currentPair.movie2.elo_score || 1500;

      return RankingService.processRankingBattle(
        {
          winnerId,
          loserId,
          rankingListId,
        },
        winnerRating,
        loserRating
      );
    },
    onSuccess: () => {
      // Invalidate queries to refresh rankings
      queryClient.invalidateQueries({ queryKey: ['rankings', rankingListId] });
      queryClient.invalidateQueries({
        queryKey: ['ranking-pair', rankingListId],
      });
      // Fetch new pair
      refetch();
    },
  });

  return {
    moviePair,
    isLoading,
    selectWinner: (winnerId: number, loserId: number) =>
      battleMutation.mutate({ winnerId, loserId }),
    isProcessing: battleMutation.isPending,
    getNewPair: refetch,
  };
}
