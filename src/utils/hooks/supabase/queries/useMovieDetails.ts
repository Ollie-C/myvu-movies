// DONE

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tmdb } from '@/lib/api/tmdb';

// Services
import { movieService } from '@/services/supabase/movies.service';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';

// Contexts
import { useAuth } from '@/context/AuthContext';

// Schemas
import type { Movie } from '@/schemas/movie.schema';
import type { WatchedMovie } from '@/schemas/watched-movie.schema';
import type { Watchlist } from '@/schemas/watchlist.schema';

// Types
import type { TMDBMovie } from '@/schemas/movie.schema';

// Interfaces
interface MovieDetailsData extends TMDBMovie {
  movieId: number;
  tmdbId: number;
}

interface UserMovieStatus {
  movieId: number;
  watchedMovie: WatchedMovie | null;
  watchlistItem: Watchlist | null;
  isWatched: boolean;
  isInWatchlist: boolean;
  rating: number | null;
  isFavorite: boolean;
}

// Queries
export const movieKeys = {
  all: ['movies'] as const,
  tmdb: (id: string | number) =>
    [...movieKeys.all, 'tmdb', String(id)] as const,
  cached: (tmdbId: number) => [...movieKeys.all, 'cached', tmdbId] as const,
  userStatus: (userId: string, tmdbId: number) =>
    ['user-movie-status', userId, tmdbId] as const,
  enriched: (movieId: number) =>
    [...movieKeys.all, 'enriched', movieId] as const,
};

// Fetches movie details from TMDB and caches them in Supabase
export const useMovieDetails = (tmdbId: string | undefined) => {
  return useQuery<MovieDetailsData | null, Error>({
    queryKey: movieKeys.tmdb(tmdbId || ''),
    queryFn: async () => {
      if (!tmdbId) return null;

      try {
        const tmdbMovie = await tmdb.getMovie(Number(tmdbId));

        const cachedMovie = await movieService.cacheMovie(tmdbMovie);

        return {
          ...tmdbMovie,
          movieId: cachedMovie.id,
          tmdbId: tmdbMovie.id,
        };
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
        throw error;
      }
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

// Fetches user movie status from Supabase
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
        movieId: cachedMovie.id,
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

// Fetches a cached movie from Supabase
export const useCachedMovie = (movieId: number | undefined) => {
  return useQuery<Movie | null, Error>({
    queryKey: movieKeys.enriched(movieId || 0),
    queryFn: () => {
      if (!movieId) return null;
      return movieService.getEnrichedMovie(movieId);
    },
    enabled: !!movieId,
    staleTime: 24 * 60 * 60 * 1000,
  });
};

// Fetches a movie with its user status
export const useMovieWithStatus = (tmdbId: string | undefined) => {
  const movieQuery = useMovieDetails(tmdbId);
  const statusQuery = useUserMovieStatus(movieQuery.data?.tmdbId);

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
    prefetchMovieDetails: (tmdbId: string) => {
      return queryClient.prefetchQuery({
        queryKey: movieKeys.tmdb(tmdbId),
        queryFn: async () => {
          const tmdbMovie = await tmdb.getMovie(Number(tmdbId));
          const cachedMovie = await movieService.cacheMovie(tmdbMovie);
          return {
            ...tmdbMovie,
            movieId: cachedMovie.id,
            tmdbId: tmdbMovie.id,
          };
        },
        staleTime: 24 * 60 * 60 * 1000,
      });
    },

    prefetchUserStatus: (tmdbId: number, userId: string) => {
      return queryClient.prefetchQuery({
        queryKey: movieKeys.userStatus(userId, tmdbId),
        queryFn: async () => {
          const cachedMovie = await movieService.getMovieByTmdbId(tmdbId);
          if (!cachedMovie) return null;

          const [watchedMovie, watchlistItem] = await Promise.all([
            watchedMoviesService.getWatchedMovie(userId, cachedMovie.id),
            watchlistService.getWatchlistItem(userId, cachedMovie.id),
          ]);

          return {
            movieId: cachedMovie.id,
            watchedMovie,
            watchlistItem,
            isWatched: !!watchedMovie,
            isInWatchlist: !!watchlistItem,
            rating: watchedMovie?.rating || null,
            isFavorite: watchedMovie?.favorite || false,
          };
        },
      });
    },
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
  return useQuery<Movie[]>({
    queryKey: [...movieKeys.all, 'batch', tmdbIds],
    queryFn: () => movieService.getMoviesByTmdbIds(tmdbIds),
    enabled: tmdbIds.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });
};
