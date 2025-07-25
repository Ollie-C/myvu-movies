// DONE
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { useAuth } from '@/context/AuthContext';
import type {
  WatchedMovie,
  WatchedMovieWithMovie,
} from '@/schemas/watched-movie.schema';

type WatchedMoviesFilters = {
  sortBy?: 'watched_date' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
  onlyFavorites?: boolean;
  onlyRated?: boolean;
  userId?: string;
};

export const watchedMoviesKeys = {
  all: ['watchedMovies'] as const,
  lists: () => [...watchedMoviesKeys.all, 'list'] as const,
  list: (filters: WatchedMoviesFilters) =>
    [...watchedMoviesKeys.lists(), filters] as const,
  infinite: (userId: string, type: 'watched' | 'watchlist' = 'watched') =>
    ['user-movies-infinite', userId, type] as const,
  detail: (movieId: number) =>
    [...watchedMoviesKeys.all, 'detail', movieId] as const,
  favorites: () => [...watchedMoviesKeys.all, 'favorites'] as const,
  recent: () => [...watchedMoviesKeys.all, 'recent'] as const,
};

export const useWatchedMoviesInfinite = (
  options?: Parameters<typeof watchedMoviesService.getWatchedMovies>[1]
) => {
  const { user } = useAuth();

  return useInfiniteQuery<
    { data: WatchedMovieWithMovie[]; count: number | null },
    Error
  >({
    queryKey: watchedMoviesKeys.infinite(user?.id || '', 'watched'),
    queryFn: ({ pageParam = 1 }) =>
      watchedMoviesService.getWatchedMovies(user!.id, {
        ...options,
        page: pageParam as number,
      }),
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

export const useWatchedMovies = (
  options?: Parameters<typeof watchedMoviesService.getWatchedMovies>[1]
) => {
  const { user } = useAuth();

  return useQuery<
    { data: WatchedMovieWithMovie[]; count: number | null },
    Error
  >({
    queryKey: watchedMoviesKeys.list({ ...options, userId: user?.id }),
    queryFn: () => watchedMoviesService.getWatchedMovies(user!.id, options),
    enabled: !!user,
  });
};

export const useFavoriteMovies = (limit = 10) => {
  const { user } = useAuth();

  return useQuery<WatchedMovieWithMovie[], Error>({
    queryKey: watchedMoviesKeys.favorites(),
    queryFn: () => watchedMoviesService.getFavoriteMovies(user!.id, limit),
    enabled: !!user,
  });
};

export const useRecentMovies = (limit = 10) => {
  const { user } = useAuth();

  return useQuery<WatchedMovieWithMovie[], Error>({
    queryKey: watchedMoviesKeys.recent(),
    queryFn: () => watchedMoviesService.getRecentMovies(user!.id, limit),
    enabled: !!user,
  });
};

export const useWatchedMovie = (movieId: number) => {
  const { user } = useAuth();

  return useQuery<WatchedMovie | null, Error>({
    queryKey: watchedMoviesKeys.detail(movieId),
    queryFn: () => watchedMoviesService.getWatchedMovie(user!.id, movieId),
    enabled: !!user && !!movieId,
  });
};

export const usePrefetchWatchedMovie = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (movieId: number) => {
    if (!user?.id || !movieId) return;

    queryClient.prefetchQuery<WatchedMovie | null, Error>({
      queryKey: watchedMoviesKeys.detail(movieId),
      queryFn: () => watchedMoviesService.getWatchedMovie(user.id, movieId),
    });
  };
};
