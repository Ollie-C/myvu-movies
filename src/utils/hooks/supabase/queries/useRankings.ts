// hooks/queries/useRankings.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { rankingService } from '@/services/supabase/ranking.service';
import type { RankingList } from '@/schemas/ranking-list.schema';

// Query keys factory
export const rankingKeys = {
  all: ['rankings'] as const,
  lists: () => [...rankingKeys.all, 'list'] as const,
  list: (filters: any) => [...rankingKeys.lists(), filters] as const,
  detail: (id: string) => [...rankingKeys.all, 'detail', id] as const,
  active: () => [...rankingKeys.all, 'active'] as const,
  byMethod: (method: string) => [...rankingKeys.all, 'method', method] as const,
};

// Get active rankings (recently updated)
export const useActiveRankings = (limit = 3) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...rankingKeys.active(), { limit }],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get all rankings and sort by most recently updated
      const rankings = await rankingService.getUserRankings(user.id);

      // Sort by updated_at descending and take the limit
      const activeRankings = rankings
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        )
        .slice(0, limit);

      // Add movie count for each ranking
      const rankingsWithCount = await Promise.all(
        activeRankings.map(async (ranking) => {
          const items = await rankingService.getRankingItems(ranking.id);
          return {
            ...ranking,
            movieCount: items.length,
          };
        })
      );

      return rankingsWithCount;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get all rankings with options
export const useRankings = (options?: {
  method?: 'versus' | 'tier' | 'manual' | 'merged';
  sortBy?: 'updated_at' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}) => {
  const { user } = useAuth();
  const { method, sortBy = 'updated_at', sortOrder = 'desc' } = options || {};

  return useQuery({
    queryKey: rankingKeys.list({ ...options, userId: user?.id }),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      let rankings = await rankingService.getUserRankings(user.id);

      // Filter by method if specified
      if (method) {
        rankings = rankings.filter((r) => r.ranking_method === method);
      }

      // Apply sorting
      rankings.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'created_at':
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          case 'updated_at':
          default:
            comparison =
              new Date(a.updated_at || a.created_at).getTime() -
              new Date(b.updated_at || b.created_at).getTime();
            break;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      return rankings;
    },
    enabled: !!user?.id,
  });
};

// Get a single ranking with its items
export const useRanking = (rankingId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: rankingKeys.detail(rankingId),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const [ranking, items] = await Promise.all([
        rankingService.getRanking(rankingId),
        rankingService.getRankingItems(rankingId),
      ]);

      return {
        ...ranking,
        items,
        movieCount: items.length,
      };
    },
    enabled: !!user?.id && !!rankingId,
  });
};
