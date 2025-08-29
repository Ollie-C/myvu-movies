import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/context/AuthContext';
import type {
  WatchlistPriority,
  WatchlistWithDetails,
} from '@/schemas/watchlist.schema';

type WatchlistFilters = {
  sortBy?: 'added_date' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  priority?: WatchlistPriority;
};

export const watchlistKeys = {
  all: ['watchlist'] as const,
  lists: () => [...watchlistKeys.all, 'list'] as const,
  list: (userId: string, filters?: WatchlistFilters) =>
    [...watchlistKeys.lists(), userId, filters] as const,
  detail: (userId: string, movieId: string) =>
    [...watchlistKeys.all, 'detail', userId, movieId] as const,
  byPriority: (userId: string, priority: WatchlistPriority) =>
    [...watchlistKeys.all, 'priority', userId, priority] as const,
  upcoming: (userId: string) =>
    [...watchlistKeys.all, 'upcoming', userId] as const,
  stats: (userId: string) => [...watchlistKeys.all, 'stats', userId] as const,
  infinite: (userId: string, filters?: WatchlistFilters) =>
    [...watchlistKeys.all, 'infinite', userId, filters] as const,
};

export const useWatchlistInfinite = (options?: WatchlistFilters) => {
  const { user } = useAuth();

  return useInfiniteQuery<
    { data: WatchlistWithDetails[]; count: number | null },
    Error
  >({
    queryKey: watchlistKeys.infinite(user?.id || '', options),
    queryFn: ({ pageParam = 1 }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getWatchlist(user.id, {
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

export const useWatchlist = (options?: WatchlistFilters) => {
  const { user } = useAuth();

  return useQuery<
    { data: WatchlistWithDetails[]; count: number | null },
    Error
  >({
    queryKey: watchlistKeys.list(user?.id || '', options),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getWatchlist(user.id, options);
    },
    enabled: !!user?.id,
  });
};

export const useWatchlistByPriority = (priority: WatchlistPriority) => {
  const { user } = useAuth();

  return useQuery<
    { data: WatchlistWithDetails[]; count: number | null },
    Error
  >({
    queryKey: watchlistKeys.byPriority(user?.id || '', priority),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getWatchlist(user.id, {
        priority,
        limit: 50,
      });
    },
    enabled: !!user?.id,
  });
};

export const useWatchlistItem = (movieId: string) => {
  const { user } = useAuth();

  return useQuery<WatchlistWithDetails | null, Error>({
    queryKey: watchlistKeys.detail(user?.id || '', movieId),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getWatchlistItem(user.id, movieId);
    },
    enabled: !!user?.id && !!movieId,
  });
};

export const useHighPriorityWatchlist = (limit = 10) => {
  const { user } = useAuth();

  return useQuery<
    { data: WatchlistWithDetails[]; count: number | null },
    Error
  >({
    queryKey: watchlistKeys.byPriority(user?.id || '', 'high'),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getWatchlist(user.id, {
        priority: 'high',
        limit,
        sortBy: 'added_date',
        sortOrder: 'desc',
      });
    },
    enabled: !!user?.id,
  });
};

export const useUpcomingReminders = () => {
  const { user } = useAuth();

  return useQuery<WatchlistWithDetails[], Error>({
    queryKey: watchlistKeys.upcoming(user?.id || ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getDueReminders(user.id);
    },
    enabled: !!user?.id,
  });
};

export const useWatchlistStats = () => {
  const { user } = useAuth();

  return useQuery<
    {
      total: number;
      byPriority: Record<WatchlistPriority, number>;
      withReminders: number;
    },
    Error
  >({
    queryKey: watchlistKeys.stats(user?.id || ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return watchlistService.getWatchlistStats(user.id);
    },
    enabled: !!user?.id,
  });
};

export const useIsInWatchlist = (movieId: string) => {
  const { user } = useAuth();

  return useQuery<boolean, Error>({
    queryKey: [...watchlistKeys.detail(user?.id || '', movieId), 'check'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      const item = await watchlistService.getWatchlistItem(user.id, movieId);
      return !!item;
    },
    enabled: !!user?.id && !!movieId,
  });
};

export const usePrefetchWatchlistItem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (movieId: string) => {
    if (!user?.id || !movieId) return;

    queryClient.prefetchQuery<WatchlistWithDetails | null, Error>({
      queryKey: watchlistKeys.detail(user.id, movieId),
      queryFn: () => watchlistService.getWatchlistItem(user.id, movieId),
    });
  };
};
