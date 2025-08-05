// NOT AUDITED

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/context/AuthContext';
import { movieKeys } from '../queries/useMovieDetails';
import { watchedMoviesKeys } from '../queries/useWatchedMovies';
import { watchlistKeys } from '../queries/useWatchlist';

interface MovieData {
  movieId: number;
  tmdbId: number;
  [key: string]: any;
}

export const useToggleWatched = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie,
      isWatched,
    }: {
      movie: MovieData;
      isWatched: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isWatched) {
        // Remove from watched
        await watchedMoviesService.removeWatched(user.id, movie.movieId);
      } else {
        // Add to watched (and remove from watchlist if present)
        await watchedMoviesService.markAsWatched(user.id, movie.movieId);
        await watchlistService
          .removeFromWatchlist(user.id, movie.movieId)
          .catch(() => {});
      }
    },
    onSuccess: (_, { movie }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user?.id || '', movie.tmdbId),
      });
      queryClient.invalidateQueries({
        queryKey: watchedMoviesKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: watchlistKeys.all,
      });
    },
  });
};

export const useToggleWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie,
      isInWatchlist,
    }: {
      movie: MovieData;
      isInWatchlist: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(user.id, movie.movieId);
      } else {
        await watchlistService.addToWatchlist(user.id, movie.movieId, 'medium');
      }
    },
    onSuccess: (_, { movie }) => {
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user?.id || '', movie.tmdbId),
      });
      queryClient.invalidateQueries({
        queryKey: watchlistKeys.all,
      });
    },
  });
};

export const useUpdateRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie,
      rating,
      isWatched,
    }: {
      movie: MovieData;
      rating: number;
      isWatched: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If not watched yet, mark as watched first
      if (!isWatched) {
        await watchedMoviesService.markAsWatched(user.id, movie.movieId);
      }

      // Update rating (convert 5-star to 10-point scale)
      await watchedMoviesService.updateRating(user.id, movie.movieId, rating);
    },
    onSuccess: (_, { movie }) => {
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user?.id || '', movie.tmdbId),
      });
      queryClient.invalidateQueries({
        queryKey: watchedMoviesKeys.all,
      });
    },
  });
};

export const useUpdateNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie,
      notes,
      type,
    }: {
      movie: MovieData;
      notes: string;
      type: 'watched' | 'watchlist';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (type === 'watched') {
        await watchedMoviesService.updateNotes(user.id, movie.movieId, notes);
      } else {
        await watchlistService.updateNotes(user.id, movie.movieId, notes);
      }
    },
    onSuccess: (_, { movie }) => {
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user?.id || '', movie.tmdbId),
      });
    },
  });
};

export const useUpdateWatchlistPriority = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie,
      priority,
    }: {
      movie: MovieData;
      priority: 'high' | 'medium' | 'low';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      await watchlistService.updatePriority(user.id, movie.movieId, priority);
    },
    onSuccess: (_, { movie }) => {
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user?.id || '', movie.tmdbId),
      });
      queryClient.invalidateQueries({
        queryKey: watchlistKeys.all,
      });
    },
  });
};
