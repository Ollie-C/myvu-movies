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
    error,
  } = useQuery({
    queryKey: ['movie-pair', userId, rankingListId],
    queryFn: async () => {
      if (!userId || !rankingListId) return null;

      const pair = await RankingService.getRandomMoviePair(
        userId,
        rankingListId
      );

      // Console log the movie pair details
      if (pair) {
        console.log('⚔️ Versus Battle Pair:', {
          movie1: {
            title: (pair.movie1 as any).movie.title,
            rating: (pair.movie1 as any).rating,
            elo_score: pair.movie1.elo_score,
            movie_id: pair.movie1.movie_id,
          },
          movie2: {
            title: (pair.movie2 as any).movie.title,
            rating: (pair.movie2 as any).rating,
            elo_score: pair.movie2.elo_score,
            movie_id: pair.movie2.movie_id,
          },
        });
      }

      return pair;
    },
    enabled: !!userId && !!rankingListId,
    staleTime: 30 * 1000, // 30 seconds
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
      if (!userId || !rankingListId)
        throw new Error('Missing user or ranking list');

      // Console log the battle result
      console.log('🏆 Versus Battle Result:', {
        winnerId,
        loserId,
        userId,
        rankingListId,
      });

      return await RankingService.processRankingBattle(
        { winnerId, loserId, rankingListId },
        1500, // Default ELO for now
        1500 // Default ELO for now
      );
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
    selectWinner: (winnerId: number, loserId: number) =>
      battleMutation.mutate({ winnerId, loserId }),
    isProcessing: battleMutation.isPending,
    getNewPair: () => {
      // This function is no longer directly exposed as per the new_code.
      // If you need to refetch, you'll need to call the query directly or manage its state.
      // For now, it's removed from the return object.
    },
  };
}
