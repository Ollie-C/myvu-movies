// AUDITED 07/08/2025
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { rankingService } from '@/services/supabase/ranking.service';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { versusRankingService } from '@/services/supabase/versus-ranking.service';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

// Hooks
export const useRankingItems = (rankingListId?: string) => {
  return useQuery({
    queryKey: ['ranking-items', rankingListId],
    queryFn: () => {
      if (!rankingListId) throw new Error('Ranking list ID required');
      return rankingService.getRankingLeaderboard(rankingListId);
    },
    enabled: !!rankingListId,
  });
};

export const useRankingBattle = (rankingListId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      winnerId,
      loserId,
    }: {
      winnerId: number;
      loserId: number;
    }) => {
      return rankingService.processRankingBattle({
        winnerId,
        loserId,
        rankingListId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
    },
  });
};

export const useRandomMoviePair = (rankingListId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['random-pair', rankingListId, user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User required');
      return rankingService.getRandomMoviePair(rankingListId, user.id);
    },
    enabled: !!user?.id && !!rankingListId,
    refetchOnMount: true,
  });
};

export const useRankedMovies = (userId?: string) => {
  return useQuery({
    queryKey: ['ranked-movies', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID required');
      return watchedMoviesService.getWatchedMovies(userId, {
        sortBy: 'rating',
        sortOrder: 'desc',
        onlyRated: true,
      });
    },
    enabled: !!userId,
  });
};

export const useReorderRankingItems = (rankingListId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      reorderedItems: Array<{
        id: string;
        movie_id: number;
        new_position: number;
      }>
    ) => {
      return rankingService.reorderRankingItems(rankingListId, reorderedItems);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
    },
  });
};

export const useMergedRankingScores = (rankingListId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weights?: {
      elo: number;
      userRating: number;
      position: number;
      popularity: number;
    }) => {
      return rankingService.calculateMergedScores(rankingListId, weights);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
    },
  });
};

export const useCreateRankingItem = (rankingListId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieId: number) => {
      return rankingService.getOrCreateRankingItem(rankingListId, movieId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
    },
  });
};

// Versus ranking hook that works directly with watched movies
export const useVersusRanking = (userId?: string) => {
  return useQuery({
    queryKey: ['versus-ranking', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      return versusRankingService.getWatchedMoviesForVersus(userId);
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for managing versus ranking pairs and battles
export const useVersusRankingPairs = (
  watchedMovies: WatchedMovieWithMovie[]
) => {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create random pairs from watched movies using the service
  const moviePairs = useMemo(() => {
    return versusRankingService.createRandomPairs(watchedMovies);
  }, [watchedMovies]);

  const currentPair = moviePairs[currentPairIndex];

  const nextPair = () => {
    if (currentPairIndex < moviePairs.length - 1) {
      setCurrentPairIndex((prev) => prev + 1);
    }
  };

  const previousPair = () => {
    if (currentPairIndex > 0) {
      setCurrentPairIndex((prev) => prev - 1);
    }
  };

  const resetPairs = () => {
    setCurrentPairIndex(0);
  };

  const processBattle = async (
    winnerId: number,
    loserId: number,
    userId: string
  ) => {
    setIsProcessing(true);
    try {
      await versusRankingService.processVersusBattle(winnerId, loserId, userId);
      nextPair(); // Move to next pair after battle
    } catch (error) {
      console.error('Failed to process battle:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    moviePairs,
    currentPair,
    currentPairIndex,
    isProcessing,
    nextPair,
    previousPair,
    resetPairs,
    processBattle,
    hasNextPair: currentPairIndex < moviePairs.length - 1,
    hasPreviousPair: currentPairIndex > 0,
    totalPairs: moviePairs.length,
  };
};
