// audited: 12/08/2025

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/context/AuthContext';
import { movieKeys } from '../queries/useMovieDetails';
import { watchedMoviesKeys } from '../queries/useWatchedMovies';
import { watchlistKeys } from '../queries/useWatchlist';
import { movieService } from '@/services/supabase/movies.service';
import type { TMDBMovie } from '@/schemas/movie.schema';
import { userMoviesKeys } from '../queries/useUserMovies';
import { useMovieStore } from '@/stores/useMovieStore';
import { userStatsKeys } from '../queries/useUserStats';
import { activityKeys } from '../queries/useUserActivity';

interface MovieData {
  movieId: number;
  tmdbId: number;
  [key: string]: any;
}

const prepareMovieData = async (
  movie: TMDBMovie | MovieData
): Promise<MovieData> => {
  if ('movieId' in movie) {
    return movie;
  }

  const cachedMovie = await movieService.cacheMovie(movie);
  return {
    movieId: cachedMovie.id,
    tmdbId: movie.id,
    ...movie,
  };
};

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: number) => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.toggleFavorite(user.id, movieId);
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

export const useToggleWatched = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setMovieState } = useMovieStore.getState();

  return useMutation({
    mutationFn: async ({
      movie,
      isWatched,
    }: {
      movie: MovieData | TMDBMovie;
      isWatched: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const movieData = await prepareMovieData(movie);

      if (isWatched) {
        await watchedMoviesService.removeWatched(user.id, movieData.movieId);
      } else {
        await watchedMoviesService.markAsWatched(user.id, movieData.movieId);
        await watchlistService
          .removeFromWatchlist(user.id, movieData.movieId)
          .catch(() => {});
      }

      return { movieData, isWatched };
    },
    onSuccess: ({ movieData, isWatched }) => {
      setMovieState(movieData.tmdbId, {
        isWatched: !isWatched,
        isInWatchlist: false,
      });

      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: watchedMoviesKeys.all,
        });

        queryClient.invalidateQueries({
          queryKey: watchlistKeys.all,
        });

        queryClient.invalidateQueries({
          queryKey: userStatsKeys.stats(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: watchedMoviesKeys.recent(user.id),
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
      movie,
      isInWatchlist,
    }: {
      movie: MovieData | TMDBMovie;
      isInWatchlist: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const movieData = await prepareMovieData(movie);

      if (isInWatchlist) {
        await watchlistService.removeFromWatchlist(user.id, movieData.movieId);
      } else {
        await watchlistService.addToWatchlist(
          user.id,
          movieData.movieId,
          'medium'
        );
      }

      return { movieData, isInWatchlist };
    },
    onSuccess: ({ movieData, isInWatchlist }) => {
      setMovieState(movieData.tmdbId, {
        isInWatchlist: !isInWatchlist,
      });

      queryClient.invalidateQueries({
        queryKey: watchlistKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
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

      if (!isWatched) {
        await watchedMoviesService.markAsWatched(user.id, movie.movieId);
      }

      await watchedMoviesService.updateRating(user.id, movie.movieId, rating);
    },
    onSuccess: (_, { movie }) => {
      // console.log('onSuccess', movie);
      queryClient.invalidateQueries({
        queryKey: movieKeys.userStatus(user?.id || '', movie.tmdbId),
      });
      queryClient.invalidateQueries({
        queryKey: watchedMoviesKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
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
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
};

export const useUpdateWatchedMovieNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      notes,
    }: {
      movieId: number;
      notes: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      await watchedMoviesService.updateNotes(user.id, String(movieId), notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: watchedMoviesKeys.all,
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
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: activityKeys.recent(user.id),
        });
      }
    },
  });
};
