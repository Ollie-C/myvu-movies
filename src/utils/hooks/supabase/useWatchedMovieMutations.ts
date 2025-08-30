import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/context/AuthContext';
import { movieKeys } from '@/utils/hooks/supabase/useMovieDetails';
import { watchedMoviesKeys } from '@/utils/hooks/supabase/useWatchedMovies';
import { watchlistKeys } from '@/utils/hooks/supabase/useWatchlist';
import { userMoviesKeys } from '@/utils/hooks/supabase/useUserMovies';
import { useMovieStore } from '@/stores/useMovieStore';
import { userStatsKeys } from '@/utils/hooks/supabase/useUserStats';
import { activityKeys } from '@/utils/hooks/supabase/useUserActivity';
import { supabase } from '@/lib/supabase';
import { movieService } from '@/services/supabase/movies.service';
import { tmdb } from '@/lib/api/tmdb';

export interface ActionMovie {
  movie_uuid: string | null;
  tmdb_id: number;
  title: string;
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
    mutationFn: async ({ movie_uuid }: ActionMovie) => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.toggleFavorite(user.id, movie_uuid);
    },
    onSuccess: (newFavoriteValue, { tmdb_id }) => {
      setMovieState(tmdb_id, { isFavorite: newFavoriteValue });

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
    }: ActionMovie & { isWatched: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let ensuredUuid = movie_uuid;

      if (!ensuredUuid) {
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
      setMovieState(tmdb_id, {
        isWatched: !wasWatched,
        isInWatchlist: false,
      });

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
    }: ActionMovie & { isInWatchlist: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      let ensuredUuid = movie_uuid;

      if (!ensuredUuid) {
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
      setMovieState(tmdb_id, {
        isInWatchlist: !wasInWatchlist,
      });

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
    }: ActionMovie & { rating: number; isWatched: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (!isWatched) {
        await watchedMoviesService.markAsWatched(user.id, movie_uuid);
      }
      await watchedMoviesService.updateRating(user.id, movie_uuid, rating);
      return { tmdb_id, rating };
    },
    onSuccess: ({ tmdb_id, rating }) => {
      setMovieState(tmdb_id, { rating });

      if (!user?.id) return;
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user.id, tmdb_id),
      });
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
    }: ActionMovie & { notes: string; type: 'watched' | 'watchlist' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (type === 'watched') {
        await watchedMoviesService.updateNotes(user.id, movie_uuid, notes);
      } else {
        await watchlistService.updateNotes(user.id, movie_uuid, notes);
      }
      return { tmdb_id };
    },
    onSuccess: ({ tmdb_id }) => {
      if (!user?.id) return;
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user.id, tmdb_id),
      });
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
    }: ActionMovie & { priority: 'high' | 'medium' | 'low' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await watchlistService.updatePriority(user.id, movie_uuid, priority);
      return { tmdb_id };
    },
    onSuccess: ({ tmdb_id }) => {
      if (!user?.id) return;
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user.id, tmdb_id),
      });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.recent(user.id) });
    },
  });
};
