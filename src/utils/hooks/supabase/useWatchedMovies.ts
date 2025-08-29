import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { useAuth } from '@/context/AuthContext';
import type { WatchedMovieWithDetails } from '@/schemas/watched-movies-with-details.schema';

type WatchedMoviesFilters = {
  sortBy?: 'watched_date' | 'rating' | 'title' | 'ranked';
  sortOrder?: 'asc' | 'desc';
  onlyFavorites?: boolean;
  onlyRated?: boolean;
  page?: number;
  limit?: number;
  genreIds?: string[];
  directorIds?: string[];
  languages?: string[];
};

export const watchedMoviesKeys = {
  all: ['watchedMovies'] as const,
  lists: () => [...watchedMoviesKeys.all, 'list'] as const,
  list: (userId: string, filters?: WatchedMoviesFilters) =>
    [...watchedMoviesKeys.lists(), userId, filters] as const,
  infinite: (userId: string, filters?: WatchedMoviesFilters) =>
    [...watchedMoviesKeys.all, 'infinite', userId, filters] as const,
  detail: (userId: string, movieId: string) =>
    [...watchedMoviesKeys.all, 'detail', userId, movieId] as const,
  favorites: (userId: string, limit?: number) =>
    [...watchedMoviesKeys.all, 'favorites', userId, limit] as const,
  recent: (userId: string, limit?: number) =>
    [...watchedMoviesKeys.all, 'recent', userId, limit] as const,
};

export const useWatchedMoviesInfinite = (options?: WatchedMoviesFilters) => {
  const { user } = useAuth();

  return useInfiniteQuery<
    { data: WatchedMovieWithDetails[]; count: number | null },
    Error
  >({
    queryKey: watchedMoviesKeys.infinite(user?.id || '', options),
    queryFn: ({ pageParam = 1 }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.getWatchedMovies(user.id, {
        ...options,
        page: pageParam as number,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalCount = lastPage.count || 0;
      const currentCount = allPages.reduce(
        (acc, page) => acc + page.data.length,
        0
      );
      return currentCount < totalCount ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!user?.id,
  });
};

export const useWatchedMovies = (options?: WatchedMoviesFilters) => {
  const { user } = useAuth();

  return useQuery<
    { data: WatchedMovieWithDetails[]; count: number | null },
    Error
  >({
    queryKey: watchedMoviesKeys.list(user?.id || '', options),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.getWatchedMovies(user.id, options);
    },
    enabled: !!user?.id,
  });
};

export const useFavoriteMovies = (limit = 10) => {
  const { user } = useAuth();

  return useQuery<WatchedMovieWithDetails[], Error>({
    queryKey: watchedMoviesKeys.favorites(user?.id || '', limit),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.getFavoriteMovies(user.id, limit);
    },
    enabled: !!user?.id,
  });
};

export const useRecentMovies = (limit = 10) => {
  const { user } = useAuth();

  return useQuery<WatchedMovieWithDetails[], Error>({
    queryKey: watchedMoviesKeys.recent(user?.id || '', limit),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.getRecentMovies(user.id, limit);
    },
    enabled: !!user?.id,
  });
};

export const useWatchedMovie = (movieId: string) => {
  const { user } = useAuth();

  return useQuery<WatchedMovieWithDetails | null, Error>({
    queryKey: watchedMoviesKeys.detail(user?.id || '', movieId),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchedMoviesService.getWatchedMovie(user.id, movieId);
    },
    enabled: !!user?.id && !!movieId,
  });
};

export const usePrefetchWatchedMovie = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (movieId: string) => {
    if (!user?.id || !movieId) return;

    queryClient.prefetchQuery<WatchedMovieWithDetails | null, Error>({
      queryKey: watchedMoviesKeys.detail(user.id, movieId),
      queryFn: () => watchedMoviesService.getWatchedMovie(user.id, movieId),
    });
  };
};
