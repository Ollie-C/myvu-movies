// NOT AUDITED

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/context/AuthContext';
import type {
  Watchlist,
  WatchlistPriority,
  WatchlistWithMovie,
} from '@/schemas/watchlist.schema';

type WatchlistFilters = {
  sortBy?: 'added_date' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  priority?: 'high' | 'medium' | 'low';
};

// Query keys factory
export const watchlistKeys = {
  all: ['watchlist'] as const,
  lists: () => [...watchlistKeys.all, 'list'] as const,
  list: (filters?: WatchlistFilters) =>
    [...watchlistKeys.lists(), filters] as const,
  detail: (movieId: number) =>
    [...watchlistKeys.all, 'detail', movieId] as const,
  byPriority: (priority: WatchlistPriority) =>
    [...watchlistKeys.all, 'priority', priority] as const,
  upcoming: () => [...watchlistKeys.all, 'upcoming'] as const,
  infinite: (userId: string) =>
    [...watchlistKeys.all, 'infinite', userId] as const,
};

export const useWatchlistInfinite = (
  options?: Parameters<typeof watchlistService.getWatchlist>[1]
) => {
  const { user } = useAuth();

  return useInfiniteQuery<
    { data: WatchlistWithMovie[]; count: number | null },
    Error
  >({
    queryKey: watchlistKeys.infinite(user?.id || ''),
    queryFn: ({ pageParam = 1 }) =>
      watchlistService.getWatchlist(user!.id, {
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

// Main query hook
export const useWatchlist = (
  options?: Parameters<typeof watchlistService.getWatchlist>[1]
) => {
  const { user } = useAuth();

  return useQuery<{ data: WatchlistWithMovie[]; count: number | null }, Error>({
    queryKey: watchlistKeys.list(options),
    queryFn: () => watchlistService.getWatchlist(user!.id, options),
    enabled: !!user,
  });
};

// Get watchlist by priority
export const useWatchlistByPriority = (priority: WatchlistPriority) => {
  const { user } = useAuth();

  return useQuery<{ data: WatchlistWithMovie[]; count: number | null }, Error>({
    queryKey: watchlistKeys.byPriority(priority),
    queryFn: () =>
      watchlistService.getWatchlist(user!.id, { priority, limit: 50 }),
    enabled: !!user,
  });
};

// Get single watchlist item
export const useWatchlistItem = (movieId: number) => {
  const { user } = useAuth();

  return useQuery<Watchlist | null, Error>({
    queryKey: watchlistKeys.detail(movieId),
    queryFn: () => watchlistService.getWatchlistItem(user!.id, movieId),
    enabled: !!user && !!movieId,
  });
};

// Get high priority movies
export const useHighPriorityWatchlist = (limit = 10) => {
  const { user } = useAuth();

  return useQuery<{ data: WatchlistWithMovie[]; count: number | null }, Error>({
    queryKey: [...watchlistKeys.byPriority('high'), { limit }],
    queryFn: () =>
      watchlistService.getWatchlist(user!.id, {
        priority: 'high',
        limit,
        sortBy: 'added_date',
        sortOrder: 'desc',
      }),
    enabled: !!user,
  });
};

// Get upcoming movies with reminders
export const useUpcomingReminders = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery<WatchlistWithMovie[], Error>({
    queryKey: watchlistKeys.upcoming(),
    queryFn: async () => {
      const { data } = await watchlistService.getWatchlist(user!.id, {
        limit: 100, // Get all for filtering
      });

      // Filter for movies with reminders in the future
      return data
        .filter((item) => item.reminder_date && item.reminder_date >= today)
        .sort(
          (a, b) =>
            new Date(a.reminder_date!).getTime() -
            new Date(b.reminder_date!).getTime()
        );
    },
    enabled: !!user,
  });
};

// Get watchlist stats
export const useWatchlistStats = () => {
  const { user } = useAuth();

  return useQuery<
    {
      total: number;
      byPriority: Record<WatchlistPriority, number>;
      withNotes: number;
      withReminders: number;
    },
    Error
  >({
    queryKey: [...watchlistKeys.all, 'stats'],
    queryFn: async () => {
      const { data } = await watchlistService.getWatchlist(user!.id, {
        limit: 1000, // Get all for stats
      });

      return {
        total: data.length,
        byPriority: {
          high: data.filter((item) => item.priority === 'high').length,
          medium: data.filter((item) => item.priority === 'medium').length,
          low: data.filter((item) => item.priority === 'low').length,
        },
        withNotes: data.filter((item) => item.notes).length,
        withReminders: data.filter((item) => item.reminder_date).length,
      };
    },
    enabled: !!user,
  });
};

// Check if movie is in watchlist (useful for movie detail pages)
export const useIsInWatchlist = (movieId: number) => {
  const { user } = useAuth();

  return useQuery<boolean, Error>({
    queryKey: [...watchlistKeys.detail(movieId), 'check'],
    queryFn: async () => {
      const item = await watchlistService.getWatchlistItem(user!.id, movieId);
      return !!item;
    },
    enabled: !!user && !!movieId,
  });
};

// Prefetch watchlist item (for hover states)
export const usePrefetchWatchlistItem = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return (movieId: number) => {
    queryClient.prefetchQuery<Watchlist | null, Error>({
      queryKey: watchlistKeys.detail(movieId),
      queryFn: () => watchlistService.getWatchlistItem(user!.id, movieId),
    });
  };
};
