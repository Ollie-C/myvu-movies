// audited: 13/08/2025
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/context/AuthContext';
import { movieKeys } from '../queries/useMovieDetails';
import { watchedMoviesKeys } from '../queries/useWatchedMovies';
import { watchlistKeys } from '../queries/useWatchlist';
import { userMoviesKeys } from '../queries/useUserMovies';
import { useMovieStore } from '@/stores/useMovieStore';
import { userStatsKeys } from '../queries/useUserStats';
import { activityKeys } from '../queries/useUserActivity';

/** The standardized movie shape for mutations */
export interface ActionMovie {
  movie_id: string; // UUID in our movies table
  tmdb_id: number; // TMDB numeric id
}

//
// -- FAVORITE ------------------------------------------------------------------
//
export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ movie_id }: ActionMovie) => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.toggleFavorite(user.id, movie_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: watchedMoviesKeys.all });
      queryClient.invalidateQueries({ queryKey: userMoviesKeys.all });
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: userMoviesKeys.allForUser(user.id),
        });
        queryClient.invalidateQueries({ queryKey: activityKeys.all });
      }
    },
  });
};

//
// -- WATCHED -------------------------------------------------------------------
//
export const useToggleWatched = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({
      movie_id,
      tmdb_id,
      isWatched,
    }: ActionMovie & { isWatched: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isWatched) {
        await watchedMoviesService.removeWatched(user.id, movie_id);
      } else {
        await watchedMoviesService.markAsWatched(user.id, movie_id);
        await watchlistService
          .removeFromWatchlist(user.id, movie_id)
          .catch(() => {});
      }
      return { movie_id, tmdb_id, wasWatched: isWatched };
    },
    onSuccess: ({ tmdb_id, wasWatched }) => {
      // Update local movie store
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

//
// -- WATCHLIST -----------------------------------------------------------------
//
export const useToggleWatchlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({
      movie_id,
      tmdb_id,
      isInWatchlist,
    }: ActionMovie & { isInWatchlist: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(user.id, movie_id);
      } else {
        await watchlistService.addToWatchlist(user.id, movie_id, 'medium');
      }
      return { movie_id, tmdb_id, wasInWatchlist: isInWatchlist };
    },
    onSuccess: ({ tmdb_id, wasInWatchlist }) => {
      setMovieState(tmdb_id, { isInWatchlist: !wasInWatchlist });

      queryClient.invalidateQueries({ queryKey: watchlistKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

//
// -- RATING --------------------------------------------------------------------
//
export const useUpdateRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie_id,
      tmdb_id,
      rating,
      isWatched,
    }: ActionMovie & { rating: number; isWatched: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!isWatched) {
        await watchedMoviesService.markAsWatched(user.id, movie_id);
      }
      await watchedMoviesService.updateRating(user.id, movie_id, rating);
      return { tmdb_id };
    },
    onSuccess: ({ tmdb_id }) => {
      if (!user?.id) return;
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user.id, tmdb_id),
      });
      queryClient.invalidateQueries({ queryKey: watchedMoviesKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

//
// -- NOTES (Watched or Watchlist) ---------------------------------------------
//
export const useUpdateNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie_id,
      tmdb_id,
      notes,
      type,
    }: ActionMovie & { notes: string; type: 'watched' | 'watchlist' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (type === 'watched') {
        await watchedMoviesService.updateNotes(user.id, movie_id, notes);
      } else {
        await watchlistService.updateNotes(user.id, movie_id, notes);
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

//
// -- WATCHLIST PRIORITY --------------------------------------------------------
//
export const useUpdateWatchlistPriority = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movie_id,
      tmdb_id,
      priority,
    }: ActionMovie & { priority: 'high' | 'medium' | 'low' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await watchlistService.updatePriority(user.id, movie_id, priority);
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
