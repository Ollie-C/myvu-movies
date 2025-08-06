// Audited: 2025-08-05
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Services
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { rankingService } from '@/services/supabase/ranking.service';
import { enhancedRatingService } from '@/services/supabase/enhanced-rating.service';

// Ranking engine
import {
  calculateEloFromRating,
  calculateEloFromReorder,
} from '@/lib/ranking-engine/elo';

// Schemas
import { RankingMethodEnum } from '@/schemas/ranking-list.schema';
import type { RankingItem } from '@/schemas/ranking-item.schema';

// Zod
import { z } from 'zod';

export const unifiedRankingKeys = {
  all: ['unified-rankings'] as const,

  // Legacy ranking keys for compatibility TODO
  rankings: ['rankings'] as const,
  unrated: (userId: string) =>
    [...unifiedRankingKeys.rankings, 'unrated', userId] as const,
  stats: (userId: string) =>
    [...unifiedRankingKeys.rankings, 'stats', userId] as const,
  ranked: (userId: string) =>
    [...unifiedRankingKeys.rankings, 'ranked', userId] as const,
  currentPosition: (userId: string, rating: number) =>
    [...unifiedRankingKeys.rankings, 'position', userId, rating] as const,
  similar: (userId: string, movieId: number, rating: number) =>
    [
      ...unifiedRankingKeys.rankings,
      'similar',
      userId,
      movieId,
      rating,
    ] as const,

  // New unified keys
  rankingItems: (rankingListId: string) =>
    [...unifiedRankingKeys.all, 'items', rankingListId] as const,
  leagueSnippet: (userId: string, movieId: number, rating: number) =>
    [
      ...unifiedRankingKeys.all,
      'league-snippet',
      userId,
      movieId,
      rating,
    ] as const,
};

interface UseUnifiedRankingProps {
  rankingListId?: string;
  userId: string;
  method?: z.infer<typeof RankingMethodEnum>;
}

interface SessionStats {
  battlesCompleted: number;
  moviesRated: number;
  lastAction: Date | null;
}

export function useUnifiedRanking({
  rankingListId,
  userId,
  method = 'manual',
}: UseUnifiedRankingProps) {
  const queryClient = useQueryClient();
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    battlesCompleted: 0,
    moviesRated: 0,
    lastAction: null,
  });

  const { data: rankingItems, isLoading: itemsLoading } = useQuery({
    queryKey: unifiedRankingKeys.rankingItems(rankingListId || ''),
    queryFn: async () => {
      if (!rankingListId) return [];

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

      return data.map((item, index) => ({
        ...item,
        position: index + 1,
      }));
    },
    enabled: !!rankingListId,
  });

  const { data: unratedMovies, isLoading: unratedLoading } = useQuery({
    queryKey: unifiedRankingKeys.unrated(userId),
    queryFn: async () => {
      return await watchedMoviesService.getUnratedMovies(userId);
    },
    enabled: !!userId && !rankingListId,
  });

  const { data: rankedMovies, isLoading: rankedLoading } = useQuery({
    queryKey: unifiedRankingKeys.ranked(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watched_movies')
        .select(
          `
          movie_id,
          rating,
          elo_score,
          movie:movies!inner(title, poster_path, release_date)
        `
        )
        .eq('user_id', userId)
        .not('rating', 'is', null)
        .not('elo_score', 'is', null)
        .order('rating', { ascending: false })
        .order('elo_score', { ascending: false });

      if (error) throw error;

      return (data || []).map((movie: any, index) => ({
        movie_id: movie.movie_id,
        rating: movie.rating,
        elo_score: movie.elo_score,
        movie: {
          title: movie.movie.title,
          poster_path: movie.movie.poster_path,
          release_date: movie.movie.release_date,
        },
        position: index + 1,
      }));
    },
    enabled: !!userId && !rankingListId,
  });

  const { data: ratingStats } = useQuery({
    queryKey: unifiedRankingKeys.stats(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watched_movies')
        .select('rating, elo_score')
        .eq('user_id', userId)
        .not('rating', 'is', null);

      if (error) throw error;

      const ratings = data || [];
      const totalWatched = ratings.length;
      const totalRated = ratings.filter((m) => m.rating !== null).length;
      const totalUnrated = totalWatched - totalRated;

      const averageRating =
        totalRated > 0
          ? ratings.reduce((sum, m) => sum + (m.rating || 0), 0) / totalRated
          : 0;

      const distribution = {
        '1-2': 0,
        '3-4': 0,
        '5-6': 0,
        '7-8': 0,
        '9-10': 0,
      };

      ratings.forEach((movie) => {
        const rating = movie.rating;
        if (rating <= 2) distribution['1-2']++;
        else if (rating <= 4) distribution['3-4']++;
        else if (rating <= 6) distribution['5-6']++;
        else if (rating <= 8) distribution['7-8']++;
        else distribution['9-10']++;
      });

      return {
        totalWatched,
        totalRated,
        totalUnrated,
        averageRating,
        distribution,
      };
    },
    enabled: !!userId,
  });

  const getCurrentMoviePosition = useCallback(
    (
      rating: number,
      currentMovie?: {
        title: string;
        poster_path: string | null;
        release_date: string | null;
      }
    ) => {
      if (!rankedMovies || !rating || rating === 0) return null;

      const currentElo = calculateEloFromRating(1500, rating);

      let position = 1;
      for (const movie of rankedMovies) {
        if (movie.rating > rating) {
          position++;
        } else if (movie.rating === rating && movie.elo_score > currentElo) {
          position++;
        } else {
          break;
        }
      }

      return {
        position,
        elo_score: currentElo,
        rating,
      };
    },
    [rankedMovies]
  );

  const getLeagueTableSnippet = useCallback(
    async (
      movieId: number,
      rating: number,
      currentMovie?: {
        title: string;
        poster_path: string | null;
        release_date: string | null;
      }
    ) => {
      const currentPosition = getCurrentMoviePosition(rating, currentMovie);
      if (!currentPosition || !rankedMovies) return [];

      const position = currentPosition.position;

      // Get movie IDs for the surrounding positions
      const surroundingMovieIds = [];
      const startIndex = Math.max(0, position - 3);
      const endIndex = Math.min(rankedMovies.length, position + 2);

      for (let i = startIndex; i < endIndex; i++) {
        const movie = rankedMovies[i];
        const moviePosition = i + 1;
        if (moviePosition !== position) {
          surroundingMovieIds.push(movie.movie_id);
        }
      }

      // Add current movie ID
      const allMovieIds = [movieId, ...surroundingMovieIds];

      // Fetch complete movie data from movies table
      const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .in('id', allMovieIds);

      if (error) throw error;

      // Build the league table snippet
      const result = [];
      let currentInserted = false;

      for (let i = 0; i < surroundingMovieIds.length; i++) {
        const movieId = surroundingMovieIds[i];
        const movie = movies?.find((m) => m.id === movieId);
        const moviePosition = startIndex + i + 1;

        if (!currentInserted && moviePosition >= position) {
          // Insert current movie
          const currentMovieData = movies?.find((m) => m.id === movieId) || {
            id: movieId,
            tmdb_id: movieId,
            title: currentMovie?.title || 'Current Movie',
            poster_path: currentMovie?.poster_path,
            release_date: currentMovie?.release_date,
          };

          result.push({
            movie_id: movieId,
            rating: rating,
            elo_score: currentPosition.elo_score,
            movie: currentMovieData,
            position: position,
            isCurrent: true,
            displayPosition: position,
          });
          currentInserted = true;
        }

        if (movie) {
          result.push({
            ...rankedMovies.find((r) => r.movie_id === movieId),
            movie: movie,
            isCurrent: false,
            displayPosition: moviePosition,
          });
        }
      }

      if (!currentInserted) {
        const currentMovieData = movies?.find((m) => m.id === movieId) || {
          id: movieId,
          tmdb_id: movieId,
          title: currentMovie?.title || 'Current Movie',
          poster_path: currentMovie?.poster_path,
          release_date: currentMovie?.release_date,
        };

        result.push({
          movie_id: movieId,
          rating: rating,
          elo_score: currentPosition.elo_score,
          movie: currentMovieData,
          position: position,
          isCurrent: true,
          displayPosition: position,
        });
      }

      return result.slice(0, 3);
    },
    [getCurrentMoviePosition, rankedMovies]
  );

  const standardRatingMutation = useMutation({
    mutationFn: async ({
      movieId,
      rating,
    }: {
      movieId: number;
      rating: number;
      notes?: string;
    }) => {
      if (rankingListId) {
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
          { onConflict: 'ranking_list_id,movie_id' }
        );

        if (error) throw error;
        return { movieId, newElo, oldElo: currentElo };
      } else {
        return await watchedMoviesService.updateRating(userId, movieId, rating);
      }
    },
    onSuccess: () => {
      if (rankingListId) {
        queryClient.invalidateQueries({
          queryKey: unifiedRankingKeys.rankingItems(rankingListId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: unifiedRankingKeys.ranked(userId),
        });
        queryClient.invalidateQueries({
          queryKey: unifiedRankingKeys.unrated(userId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.stats(userId),
      });

      setSessionStats((prev) => ({
        ...prev,
        moviesRated: prev.moviesRated + 1,
        lastAction: new Date(),
      }));
    },
  });

  const enhancedRatingMutation = useMutation({
    mutationFn: async ({
      movieId,
      rating,
      notes,
    }: {
      movieId: number;
      rating: number;
      notes?: string;
    }) => {
      return await enhancedRatingService.completeEnhancedRating(
        userId,
        movieId,
        rating,
        notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.ranked(userId),
      });
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.unrated(userId),
      });
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.stats(userId),
      });

      setSessionStats((prev) => ({
        ...prev,
        moviesRated: prev.moviesRated + 1,
        lastAction: new Date(),
      }));
    },
  });

  const versusBattleMutation = useMutation({
    mutationFn: async ({
      winnerId,
      loserId,
    }: {
      winnerId: number;
      loserId: number;
    }) => {
      if (!rankingListId)
        throw new Error('Ranking list ID required for battles');

      const winnerItem = rankingItems?.find(
        (item) => item.movie_id === winnerId
      );
      const loserItem = rankingItems?.find((item) => item.movie_id === loserId);

      const winnerElo = winnerItem?.elo_score || 1500;
      const loserElo = loserItem?.elo_score || 1500;

      return rankingService.processRankingBattle(
        { winnerId, loserId, rankingListId },
        winnerElo,
        loserElo
      );
    },
    onSuccess: () => {
      if (rankingListId) {
        queryClient.invalidateQueries({
          queryKey: unifiedRankingKeys.rankingItems(rankingListId),
        });
      }
      setSessionStats((prev) => ({
        ...prev,
        battlesCompleted: prev.battlesCompleted + 1,
        lastAction: new Date(),
      }));
    },
  });

  const dragDropMutation = useMutation({
    mutationFn: async (reorderedItems: RankingItem[]) => {
      if (!rankingItems || !rankingListId) return;

      const oldPositions = new Map<string, number>();
      const newPositions = new Map<string, number>();

      rankingItems.forEach((item, index) => {
        oldPositions.set(item.id, index);
      });

      reorderedItems.forEach((item, index) => {
        newPositions.set(item.id, index);
      });

      const newEloScores = calculateEloFromReorder(
        reorderedItems,
        oldPositions,
        newPositions
      );

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
      if (rankingListId) {
        queryClient.invalidateQueries({
          queryKey: unifiedRankingKeys.rankingItems(rankingListId),
        });
      }
      setSessionStats((prev) => ({
        ...prev,
        lastAction: new Date(),
      }));
    },
  });

  const calculateMergedScore = useCallback(
    (item: RankingItem & { movie?: any }) => {
      const weights = {
        elo: 0.4,
        userRating: 0.3,
        position: 0.2,
        popularity: 0.1,
      };

      const eloComponent = (item.elo_score || 1500) / 3000;
      const ratingComponent = (item.movie?.vote_average || 5) / 10;
      const positionComponent = item.position
        ? 1 - item.position / (rankingItems?.length || 1)
        : 0.5;
      const popularityComponent = Math.min(
        (item.movie?.popularity || 0) / 100,
        1
      );

      const mergedScore =
        eloComponent * weights.elo +
        ratingComponent * weights.userRating +
        positionComponent * weights.position +
        popularityComponent * weights.popularity;

      return mergedScore * 3000;
    },
    [rankingItems]
  );

  const applySmartMerge = useCallback(async () => {
    if (!rankingItems || !rankingListId) return;

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
      queryKey: unifiedRankingKeys.rankingItems(rankingListId),
    });
  }, [rankingItems, rankingListId, calculateMergedScore, queryClient]);

  const getNextUnratedMovie = useCallback(() => {
    if (rankingItems) {
      return rankingItems.find(
        (item) => !item.elo_score || item.elo_score === 1500
      );
    }
    return unratedMovies?.[0];
  }, [rankingItems, unratedMovies]);

  const getRandomPair = useCallback(() => {
    if (!rankingItems || rankingItems.length < 2) return null;

    const shuffled = [...rankingItems].sort(() => 0.5 - Math.random());
    return {
      movie1: shuffled[0],
      movie2: shuffled[1],
    };
  }, [rankingItems]);

  const getSimilarMovies = useCallback(
    async (movieId: number, rating: number) => {
      if (!userId || !movieId || !rating) return [];
      return await enhancedRatingService.findSimilarMovies(
        userId,
        movieId,
        rating,
        0.5
      );
    },
    [userId]
  );

  const currentRankings = useMemo(() => {
    if (rankingItems) {
      return [...rankingItems].sort(
        (a, b) => (b.elo_score || 0) - (a.elo_score || 0)
      );
    }
    return rankedMovies || [];
  }, [rankingItems, rankedMovies]);

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
    unratedMovies,
    ratingStats,
    isLoading: itemsLoading || unratedLoading || rankedLoading,
    sessionStats,

    // Method-specific mutations
    rateMovie: standardRatingMutation.mutate,
    rateMovieEnhanced: enhancedRatingMutation.mutate,
    submitBattle: versusBattleMutation.mutate,
    reorderItems: dragDropMutation.mutate,
    applySmartMerge,

    // Loading states
    isRating:
      standardRatingMutation.isPending || enhancedRatingMutation.isPending,
    isBattling: versusBattleMutation.isPending,
    isReordering: dragDropMutation.isPending,

    // Utilities
    calculateMergedScore,
    getCurrentMoviePosition,
    getLeagueTableSnippet,
    getSimilarMovies,
    getNextUnratedMovie,
    getRandomPair,
    currentMethod: method,
    methodHelpers,

    // Batch operations
    currentBatch,
    setCurrentBatch,

    // Legacy compatibility methods
    updateRating: standardRatingMutation.mutate,
    useEnhancedRating: enhancedRatingMutation.mutate,
  };
}

export const useUnratedMovies = (userId: string | undefined) => {
  const { unratedMovies, isLoading } = useUnifiedRanking({
    userId: userId || '',
  });
  return { data: unratedMovies, isLoading };
};

export const useRankedMovies = (userId: string | undefined) => {
  const { rankingItems, isLoading } = useUnifiedRanking({
    userId: userId || '',
  });
  return { data: rankingItems, isLoading };
};

export const useActiveRankings = (
  userId: string | undefined,
  limit: number = 3
) => {
  return useQuery({
    queryKey: [...unifiedRankingKeys.all, 'active-rankings', userId, limit],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('ranking_lists')
        .select(
          `
          id,
          name,
          description,
          ranking_method,
          updated_at,
          ranking_items!inner(movie_id)
        `
        )
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform data to match Dashboard expectations
      return (data || []).map((rankingList) => ({
        id: rankingList.id,
        name: rankingList.name,
        description: rankingList.description,
        ranking_method: rankingList.ranking_method,
        movieCount: rankingList.ranking_items?.length || 0,
        updated_at: rankingList.updated_at,
      }));
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useCurrentMoviePosition = (
  userId: string | undefined,
  rating: number | undefined,
  currentMovie?: {
    title: string;
    poster_path: string | null;
    release_date: string | null;
  }
) => {
  const { getCurrentMoviePosition } = useUnifiedRanking({
    userId: userId || '',
  });
  return {
    data: rating ? getCurrentMoviePosition(rating, currentMovie) : null,
  };
};

export const useLeagueTableSnippet = (
  userId: string | undefined,
  movieId: number | undefined,
  rating: number | undefined,
  currentMovie?: {
    title: string;
    poster_path: string | null;
    release_date: string | null;
  }
) => {
  const { getLeagueTableSnippet } = useUnifiedRanking({ userId: userId || '' });

  return useQuery({
    queryKey: unifiedRankingKeys.leagueSnippet(
      userId || '',
      movieId || 0,
      rating || 0
    ),
    queryFn: async () => {
      if (!userId || !movieId || !rating) return [];
      return await getLeagueTableSnippet(movieId, rating, currentMovie);
    },
    enabled: !!userId && !!movieId && !!rating && rating > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUpdateRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      movieId,
      rating,
    }: {
      userId: string;
      movieId: number;
      rating: number;
      notes?: string;
    }) => {
      return await watchedMoviesService.updateRating(userId, movieId, rating);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.ranked(userId),
      });
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.unrated(userId),
      });
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.stats(userId),
      });
    },
  });
};

export const useRatingStats = (userId: string | undefined) => {
  const { ratingStats, isLoading } = useUnifiedRanking({
    userId: userId || '',
  });
  return { data: ratingStats, isLoading };
};

export const useSimilarMovies = (
  userId: string | undefined,
  movieId: number | undefined,
  rating: number | undefined
) => {
  const { getSimilarMovies } = useUnifiedRanking({ userId: userId || '' });

  return useQuery({
    queryKey: unifiedRankingKeys.similar(
      userId || '',
      movieId || 0,
      rating || 0
    ),
    queryFn: async () => {
      if (!userId || !movieId || !rating) return [];
      return await getSimilarMovies(movieId, rating);
    },
    enabled: !!userId && !!movieId && !!rating && rating > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useEnhancedRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      movieId,
      rating,
      notes,
    }: {
      userId: string;
      movieId: number;
      rating: number;
      notes?: string;
    }) => {
      return await enhancedRatingService.completeEnhancedRating(
        userId,
        movieId,
        rating,
        notes
      );
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.ranked(userId),
      });
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.unrated(userId),
      });
      queryClient.invalidateQueries({
        queryKey: unifiedRankingKeys.stats(userId),
      });
    },
  });
};
