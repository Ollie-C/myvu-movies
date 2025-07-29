// DONE

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

// Query keys for rankings
export const rankingKeys = {
  all: ['rankings'] as const,
  unratedMovies: (userId: string) =>
    [...rankingKeys.all, 'unrated', userId] as const,
  ratingStats: (userId: string) =>
    [...rankingKeys.all, 'stats', userId] as const,
};

// Hook to get unrated movies for standard ranking
export const useUnratedMovies = () => {
  const { user } = useAuth();

  return useQuery<WatchedMovieWithMovie[], Error>({
    queryKey: rankingKeys.unratedMovies(user?.id || ''),
    queryFn: () => watchedMoviesService.getUnratedMovies(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to update movie rating
export const useUpdateRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      rating,
      notes,
    }: {
      movieId: number;
      rating: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update rating
      await watchedMoviesService.updateRating(user.id, movieId, rating);

      // Update notes if provided
      if (notes !== undefined) {
        await watchedMoviesService.updateNotes(user.id, movieId, notes);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['watchedMovies'] });
      queryClient.invalidateQueries({
        queryKey: rankingKeys.unratedMovies(user?.id || ''),
      });
      queryClient.invalidateQueries({
        queryKey: rankingKeys.ratingStats(user?.id || ''),
      });
    },
  });
};

// Hook to get rating statistics
export const useRatingStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: rankingKeys.ratingStats(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get all watched movies
      const { data: watchedMovies } =
        await watchedMoviesService.getWatchedMovies(user.id, {
          limit: 1000, // Get all for stats
        });

      const ratedMovies = watchedMovies.filter(
        (movie) => movie.rating !== null
      );
      const unratedMovies = watchedMovies.filter(
        (movie) => movie.rating === null
      );

      const averageRating =
        ratedMovies.length > 0
          ? ratedMovies.reduce((sum, movie) => sum + (movie.rating || 0), 0) /
            ratedMovies.length
          : 0;

      return {
        totalWatched: watchedMovies.length,
        totalRated: ratedMovies.length,
        totalUnrated: unratedMovies.length,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution: {
          '9-10': ratedMovies.filter((m) => (m.rating || 0) >= 9).length,
          '8-8.9': ratedMovies.filter(
            (m) => (m.rating || 0) >= 8 && (m.rating || 0) < 9
          ).length,
          '7-7.9': ratedMovies.filter(
            (m) => (m.rating || 0) >= 7 && (m.rating || 0) < 8
          ).length,
          '6-6.9': ratedMovies.filter(
            (m) => (m.rating || 0) >= 6 && (m.rating || 0) < 7
          ).length,
          '5-5.9': ratedMovies.filter(
            (m) => (m.rating || 0) >= 5 && (m.rating || 0) < 6
          ).length,
          'Below 5': ratedMovies.filter((m) => (m.rating || 0) < 5).length,
        },
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
