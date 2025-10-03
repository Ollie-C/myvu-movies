import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tmdb } from '@/shared/lib/tmdb';

// Services
import { movieService } from '@/features/movies/api/movies.service';
import { watchedMoviesService } from '@/features/watched-movies/api/watched-movies.service';
import { watchlistService } from '@/features/watchlist/api/watchlist.service';

// Contexts
import { useAuth } from '@/shared/context/AuthContext';

// Types
import type {
  BaseMovieDetails,
  WatchedMovie,
  WatchlistMovie,
} from '@/shared/types/userMovie';

export const movieKeys = {
  all: ['movies'] as const,
  tmdb: (id: string | number) =>
    [...movieKeys.all, 'tmdb', String(id)] as const,
  cached: (tmdbId: number) => [...movieKeys.all, 'cached', tmdbId] as const,
  userStatus: (userId: string, tmdbId: number) =>
    ['user-movie-status', userId, tmdbId] as const,
  enriched: (movieId: string) =>
    [...movieKeys.all, 'enriched', movieId] as const,
};

export const useMovieDetails = (tmdbId: string | undefined) => {
  return useQuery<BaseMovieDetails | null, Error>({
    queryKey: movieKeys.tmdb(tmdbId || ''),
    queryFn: async (): Promise<BaseMovieDetails | null> => {
      if (!tmdbId) return null;
      const movie = await movieService.getMovieWithDetailsByTmdbId(
        Number(tmdbId)
      );

      if (movie) return movie;

      const tmdbMovie = await tmdb.getMovie(Number(tmdbId));
      await movieService.cacheMovie(tmdbMovie);

      return movieService.getMovieWithDetailsByTmdbId(Number(tmdbId));
    },
    enabled: !!tmdbId,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.message?.includes('404')) return false;
      return failureCount < 3;
    },
  });
};

interface UserMovieStatus {
  movie_id: string;
  watchedMovie: WatchedMovie | null;
  watchlistItem: WatchlistMovie | null;
  isWatched: boolean;
  isInWatchlist: boolean;
  rating: number | null;
  isFavorite: boolean;
}

export const useUserMovieStatus = (tmdbId: number | undefined) => {
  const { user } = useAuth();

  return useQuery<UserMovieStatus | null, Error>({
    queryKey: movieKeys.userStatus(user?.id || '', tmdbId || 0),
    queryFn: async () => {
      if (!user?.id || !tmdbId) return null;

      const cachedMovie = await movieService.getMovieByTmdbId(tmdbId);
      if (!cachedMovie) return null;

      const [watchedMovie, watchlistItem] = await Promise.all([
        watchedMoviesService.getWatchedMovie(user.id, cachedMovie.id),
        watchlistService.getWatchlistItem(user.id, cachedMovie.id),
      ]);

      return {
        movie_id: cachedMovie.id,
        watchedMovie,
        watchlistItem,
        isWatched: !!watchedMovie,
        isInWatchlist: !!watchlistItem,
        rating: watchedMovie?.rating || null,
        isFavorite: watchedMovie?.favorite || false,
      };
    },
    enabled: !!user?.id && !!tmdbId,
    staleTime: 30 * 1000,
  });
};

export const useCachedMovie = (movieId: string | undefined) => {
  return useQuery<BaseMovieDetails | null, Error>({
    queryKey: movieKeys.enriched(movieId || ''),
    queryFn: () => {
      if (!movieId) return null;
      return movieService.getMovieWithDetails(movieId);
    },
    enabled: !!movieId,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useMovieWithStatus = (tmdbId: string | undefined) => {
  const movieQuery = useMovieDetails(tmdbId);
  if (!movieQuery.data?.tmdb_id) return null;

  const statusQuery = useUserMovieStatus(movieQuery.data.tmdb_id);

  return {
    movie: movieQuery.data,
    userStatus: statusQuery.data,
    isLoading: movieQuery.isLoading || statusQuery.isLoading,
    isError: movieQuery.isError || statusQuery.isError,
    error: movieQuery.error || statusQuery.error,
  };
};

export const usePrefetchMovie = () => {
  const queryClient = useQueryClient();

  return {
    prefetchMovieDetails: (tmdbId: string) =>
      queryClient.prefetchQuery({
        queryKey: movieKeys.tmdb(tmdbId),
        queryFn: () => movieService.getMovieWithDetailsByTmdbId(Number(tmdbId)),
        staleTime: 24 * 60 * 60 * 1000,
      }),

    prefetchUserStatus: (tmdbId: number, userId: string) =>
      queryClient.prefetchQuery({
        queryKey: movieKeys.userStatus(userId, tmdbId),
        queryFn: async () => {
          const cachedMovie = await movieService.getMovieByTmdbId(tmdbId);
          if (!cachedMovie) return null;

          const [watchedMovie, watchlistItem] = await Promise.all([
            watchedMoviesService.getWatchedMovie(userId, cachedMovie.id),
            watchlistService.getWatchlistItem(userId, cachedMovie.id),
          ]);

          return {
            movie_id: cachedMovie.id,
            watchedMovie,
            watchlistItem,
            isWatched: !!watchedMovie,
            isInWatchlist: !!watchlistItem,
            rating: watchedMovie?.rating || null,
            isFavorite: watchedMovie?.favorite || false,
          } as UserMovieStatus;
        },
      }),
  };
};

export const useIsMovieCached = (tmdbId: number | undefined) => {
  return useQuery<boolean>({
    queryKey: [...movieKeys.cached(tmdbId || 0), 'exists'],
    queryFn: async () => {
      if (!tmdbId) return false;
      const movie = await movieService.getMovieByTmdbId(tmdbId);
      return !!movie;
    },
    enabled: !!tmdbId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMoviesBatch = (tmdbIds: number[]) => {
  return useQuery<BaseMovieDetails[]>({
    queryKey: [...movieKeys.all, 'batch', tmdbIds],
    queryFn: () => movieService.getMoviesWithDetailsByTmdbIds(tmdbIds),
    enabled: tmdbIds.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });
};
