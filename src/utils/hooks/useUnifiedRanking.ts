import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RankingItem } from '@/schemas/ranking-item.schema';
import { RankingService } from '@/services/supabase/ranking.service';
import {
  calculateEloFromRating,
  calculateEloFromReorder,
} from '@/lib/ranking-engine/elo';
import { supabase } from '@/lib/supabase';
import { RankingMethodEnum } from '@/schemas/ranking-list.schema';
import { z } from 'zod';

interface UseUnifiedRankingProps {
  rankingListId: string;
  userId: string;
  method: z.infer<typeof RankingMethodEnum>;
}

export function useUnifiedRanking({
  rankingListId,
  method,
}: UseUnifiedRankingProps) {
  const queryClient = useQueryClient();
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState({
    battlesCompleted: 0,
    moviesRated: 0,
    lastAction: null as Date | null,
  });

  // Fetch current ranking items
  const { data: rankingItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['ranking-items', rankingListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking_items')
        .select(
          `
          *,
          movie:movies(*)
        `
        )
        .eq('ranking_list_id', rankingListId)
        .order('elo_score', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Standard rating mutation (direct score input)
  const standardRatingMutation = useMutation({
    mutationFn: async ({
      movieId,
      rating,
    }: {
      movieId: number;
      rating: number;
    }) => {
      const currentItem = rankingItems?.find(
        (item) => item.movie_id === movieId
      );
      const currentElo = currentItem?.elo_score || 1500;

      const newElo = calculateEloFromRating(currentElo, rating);

      const { error } = await supabase.from('ranking_items').upsert(
        {
          ranking_list_id: rankingListId,
          movie_id: movieId,
          elo_score: newElo,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'ranking_list_id,movie_id',
        }
      );

      if (error) throw error;

      return { movieId, newElo, oldElo: currentElo };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
      setSessionStats((prev) => ({
        ...prev,
        moviesRated: prev.moviesRated + 1,
        lastAction: new Date(),
      }));
    },
  });

  // Versus battle mutation (1v1 comparison)
  const versusBattleMutation = useMutation({
    mutationFn: async ({
      winnerId,
      loserId,
    }: {
      winnerId: number;
      loserId: number;
    }) => {
      const winnerItem = rankingItems?.find(
        (item) => item.movie_id === winnerId
      );
      const loserItem = rankingItems?.find((item) => item.movie_id === loserId);

      const winnerElo = winnerItem?.elo_score || 1500;
      const loserElo = loserItem?.elo_score || 1500;

      return RankingService.processRankingBattle(
        { winnerId, loserId, rankingListId },
        winnerElo,
        loserElo
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
      setSessionStats((prev) => ({
        ...prev,
        battlesCompleted: prev.battlesCompleted + 1,
        lastAction: new Date(),
      }));
    },
  });

  // Drag and drop mutation (reordering)
  const dragDropMutation = useMutation({
    mutationFn: async (reorderedItems: RankingItem[]) => {
      if (!rankingItems) return;

      // Create position maps
      const oldPositions = new Map<string, number>();
      const newPositions = new Map<string, number>();

      rankingItems.forEach((item, index) => {
        oldPositions.set(item.id, index);
      });

      reorderedItems.forEach((item, index) => {
        newPositions.set(item.id, index);
      });

      // Calculate new ELO scores based on reordering
      const newEloScores = calculateEloFromReorder(
        reorderedItems,
        oldPositions,
        newPositions
      );

      // Update all changed items
      const updates = Array.from(newEloScores.entries()).map(
        ([id, elo_score]) => {
          const item = reorderedItems.find((it) => it.id === id)!;
          return {
            id,
            ranking_list_id: rankingListId,
            movie_id: item.movie_id,
            elo_score,
            position: newPositions.get(id),
            updated_at: new Date().toISOString(),
          };
        }
      );

      const { error } = await supabase.from('ranking_items').upsert(updates, {
        onConflict: 'id',
      });

      if (error) throw error;

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ranking-items', rankingListId],
      });
      setSessionStats((prev) => ({
        ...prev,
        lastAction: new Date(),
      }));
    },
  });

  // Smart merge calculation
  const calculateMergedScore = useCallback(
    (item: RankingItem & { movie?: any }) => {
      const weights = {
        elo: 0.4,
        userRating: 0.3,
        position: 0.2,
        popularity: 0.1,
      };

      // Get various scoring components
      const eloComponent = (item.elo_score || 1500) / 3000; // Normalize to 0-1
      const ratingComponent = (item.movie?.vote_average || 5) / 10;
      const positionComponent = item.position
        ? 1 - item.position / (rankingItems?.length || 1)
        : 0.5;
      const popularityComponent = Math.min(
        (item.movie?.popularity || 0) / 100,
        1
      );

      // Calculate weighted score
      const mergedScore =
        eloComponent * weights.elo +
        ratingComponent * weights.userRating +
        positionComponent * weights.position +
        popularityComponent * weights.popularity;

      return mergedScore * 3000; // Scale back to ELO range
    },
    [rankingItems]
  );

  // Apply smart merge to all items
  const applySmartMerge = useCallback(async () => {
    if (!rankingItems) return;

    const updates = rankingItems.map((item) => ({
      id: item.id,
      ranking_list_id: rankingListId,
      movie_id: item.movie_id,
      elo_score: calculateMergedScore(item),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('ranking_items').upsert(updates, {
      onConflict: 'id',
    });

    if (error) throw error;

    queryClient.invalidateQueries({
      queryKey: ['ranking-items', rankingListId],
    });
  }, [rankingItems, rankingListId, calculateMergedScore, queryClient]);

  // Get next unrated movie for standard rating
  const getNextUnratedMovie = useCallback(() => {
    if (!rankingItems) return null;

    return rankingItems.find(
      (item) => !item.elo_score || item.elo_score === 1500
    );
  }, [rankingItems]);

  // Get random pair for versus mode
  const getRandomPair = useCallback(() => {
    if (!rankingItems || rankingItems.length < 2) return null;

    const shuffled = [...rankingItems].sort(() => 0.5 - Math.random());
    return {
      movie1: shuffled[0],
      movie2: shuffled[1],
    };
  }, [rankingItems]);

  // Get current rankings sorted by score
  const currentRankings = useMemo(() => {
    if (!rankingItems) return [];

    return [...rankingItems].sort(
      (a, b) => (b.elo_score || 0) - (a.elo_score || 0)
    );
  }, [rankingItems]);

  // Method-specific helpers
  const methodHelpers = useMemo(() => {
    switch (method) {
      case 'versus':
        return {
          getNextBattle: getRandomPair,
          submitResult: versusBattleMutation.mutate,
        };
      case 'manual':
        return {
          getNextMovie: getNextUnratedMovie,
          submitRating: standardRatingMutation.mutate,
        };
      case 'tier':
        return {
          reorderItems: dragDropMutation.mutate,
          currentOrder: currentRankings,
        };
      case 'merged':
        return {
          applyMerge: applySmartMerge,
          previewScores: rankingItems?.map((item) => ({
            ...item,
            mergedScore: calculateMergedScore(item),
          })),
        };
      default:
        return {};
    }
  }, [
    method,
    getRandomPair,
    getNextUnratedMovie,
    versusBattleMutation.mutate,
    standardRatingMutation.mutate,
    dragDropMutation.mutate,
    currentRankings,
    applySmartMerge,
    rankingItems,
    calculateMergedScore,
  ]);

  return {
    // Current state
    rankingItems: currentRankings,
    isLoading: itemsLoading,
    sessionStats,

    // Method-specific mutations
    rateMovie: standardRatingMutation.mutate,
    submitBattle: versusBattleMutation.mutate,
    reorderItems: dragDropMutation.mutate,
    applySmartMerge,

    // Loading states
    isRating: standardRatingMutation.isPending,
    isBattling: versusBattleMutation.isPending,
    isReordering: dragDropMutation.isPending,

    // Utilities
    calculateMergedScore,
    currentMethod: method,
    methodHelpers,

    // Batch operations
    currentBatch,
    setCurrentBatch,
  };
}
