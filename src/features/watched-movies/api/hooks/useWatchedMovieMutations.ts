import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchedMoviesService } from '@/features/watched-movies/api/watched-movies.service';
import { watchlistService } from '@/features/watchlist/api/watchlist.service';
import { useAuth } from '@/shared/context/AuthContext';
import { movieKeys } from '@/features/movies/api/hooks/useMovieDetails';
import { watchedMoviesKeys } from '@/features/watched-movies/api/hooks/useWatchedMovies';
import { watchlistKeys } from '@/features/watchlist/api/hooks/useWatchlist';
import { userMoviesKeys } from '@/features/user/api/hooks/useUserMovies';
import { useMovieStore } from '@/shared/stores/useMovieStore';
import { userStatsKeys } from '@/features/user/api/hooks/useUserStats';
import { activityKeys } from '@/features/user/api/hooks/useUserActivity';
import { movieService } from '@/features/movies/api/movies.service';
import { tmdb } from '@/shared/lib/tmdb';

export interface MovieActionPayload {
  movie_uuid: string;
  tmdb_id?: number | null;
  title?: string | null;
  original_title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
}

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({ movie_uuid }: MovieActionPayload) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!movie_uuid) throw new Error('Movie UUID is required');
      return watchedMoviesService.toggleFavorite(user.id, movie_uuid);
    },
    onSuccess: (newFavoriteValue, { tmdb_id }) => {
      // Only update movie store if tmdb_id is provided (optimistic update)
      if (tmdb_id) {
        setMovieState(tmdb_id, { isFavorite: newFavoriteValue });
      }

      // Query invalidation will ensure correct state regardless
      queryClient.invalidateQueries({ queryKey: watchedMoviesKeys.all });
      queryClient.invalidateQueries({ queryKey: userMoviesKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: userStatsKeys.stats(user.id),
        });
      }
    },
  });
};

export const useToggleWatched = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({
      movie_uuid,
      tmdb_id,
      isWatched,
    }: MovieActionPayload & { isWatched: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let ensuredUuid = movie_uuid;

      if (!ensuredUuid) {
        if (!tmdb_id) {
          throw new Error('Either movie_uuid or tmdb_id is required');
        }
        const fullDetails = await tmdb.getMovie(tmdb_id);
        const movie = await movieService.cacheMovie(fullDetails);
        ensuredUuid = movie.id;
      }

      if (!ensuredUuid) throw new Error('Could not ensure movie UUID');
      if (isWatched) {
        await watchedMoviesService.removeWatched(user.id, ensuredUuid);
      } else {
        await watchedMoviesService.markAsWatched(user.id, ensuredUuid);
        await watchlistService
          .removeFromWatchlist(user.id, ensuredUuid)
          .catch(() => {});
      }

      return { tmdb_id, wasWatched: isWatched, movie_uuid: ensuredUuid };
    },
    onSuccess: ({ tmdb_id, wasWatched }) => {
      // Only update movie store if tmdb_id is provided (optimistic update)
      if (tmdb_id) {
        setMovieState(tmdb_id, {
          isWatched: !wasWatched,
          isInWatchlist: false,
        });
      }

      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: watchedMoviesKeys.all });
        queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
        queryClient.invalidateQueries({
          queryKey: watchedMoviesKeys.recent(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: userStatsKeys.stats(user.id),
        });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      }
    },
  });
};

export const useToggleWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({
      movie_uuid,
      tmdb_id,
      isInWatchlist,
    }: MovieActionPayload & { isInWatchlist: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let ensuredUuid = movie_uuid;

      if (!ensuredUuid) {
        if (!tmdb_id) {
          throw new Error('Either movie_uuid or tmdb_id is required');
        }
        const fullDetails = await tmdb.getMovie(tmdb_id);
        const movie = await movieService.cacheMovie(fullDetails);
        ensuredUuid = movie.id;
      }

      if (!ensuredUuid) throw new Error('Could not ensure movie UUID');

      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(user.id, ensuredUuid);
      } else {
        await watchlistService.addToWatchlist(user.id, ensuredUuid);
      }

      return {
        tmdb_id,
        wasInWatchlist: isInWatchlist,
        movie_uuid: ensuredUuid,
      };
    },
    onSuccess: ({ tmdb_id, wasInWatchlist }) => {
      // Only update movie store if tmdb_id is provided (optimistic update)
      if (tmdb_id) {
        setMovieState(tmdb_id, {
          isInWatchlist: !wasInWatchlist,
        });
      }

      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      }
    },
  });
};

export const useUpdateRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({
      movie_uuid,
      tmdb_id,
      rating,
      isWatched,
    }: MovieActionPayload & { rating: number; isWatched: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!movie_uuid) throw new Error('Movie UUID is required');

      if (!isWatched) {
        await watchedMoviesService.markAsWatched(user.id, movie_uuid);
      }
      await watchedMoviesService.updateRating(user.id, movie_uuid, rating);
      return { tmdb_id, rating };
    },
    onSuccess: ({ tmdb_id, rating }) => {
      // Only update movie store if tmdb_id is provided (optimistic update)
      if (tmdb_id) {
        setMovieState(tmdb_id, { rating });
      }

      if (!user?.id) return;
      if (tmdb_id) {
        queryClient.invalidateQueries({
          queryKey: movieKeys.userStatus(user.id, tmdb_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: watchedMoviesKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useUpdateNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie_uuid,
      tmdb_id,
      notes,
      type,
    }: MovieActionPayload & {
      notes: string;
      type: 'watched' | 'watchlist';
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!movie_uuid) throw new Error('Movie UUID is required');
      if (type === 'watched') {
        await watchedMoviesService.updateNotes(user.id, movie_uuid, notes);
      } else {
        await watchlistService.updateNotes(user.id, movie_uuid, notes);
      }
      return { tmdb_id };
    },
    onSuccess: ({ tmdb_id }) => {
      if (!user?.id) return;
      if (tmdb_id) {
        queryClient.invalidateQueries({
          queryKey: movieKeys.userStatus(user.id, tmdb_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useUpdateWatchlistPriority = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie_uuid,
      tmdb_id,
      priority,
    }: MovieActionPayload & { priority: 'high' | 'medium' | 'low' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!movie_uuid) throw new Error('Movie UUID is required');
      await watchlistService.updatePriority(user.id, movie_uuid, priority);
      return { tmdb_id };
    },
    onSuccess: ({ tmdb_id }) => {
      if (!user?.id) return;
      if (tmdb_id) {
        queryClient.invalidateQueries({
          queryKey: movieKeys.userStatus(user.id, tmdb_id),
        });
      }
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.recent(user.id) });
    },
  });
};
