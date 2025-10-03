import { useQuery } from '@tanstack/react-query';
import { rankingSessionService } from '@/features/rankings/api/rankingSession.service';
import type { RankingList } from '@/features/rankings/models/ranking-list.schema';
import { rankingKeys } from './useRankingSession';

export type RankingListWithItemCount = RankingList & { itemCount: number };

export function useRankingDashboard(userId: string) {
  const sessions = useQuery<RankingListWithItemCount[]>({
    queryKey: rankingKeys.all,
    queryFn: () => rankingSessionService.getUserSessions(userId),
    enabled: !!userId,
  });

  const activeSessions =
    sessions.data?.filter((s) => s.status === 'active') ?? [];
  const completedSessions =
    sessions.data?.filter((s) => s.status === 'completed') ?? [];
  const pausedSessions =
    sessions.data?.filter((s) => s.status === 'paused') ?? [];

  return {
    sessions,
    activeSessions,
    completedSessions,
    pausedSessions,
  };
}
