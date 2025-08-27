import { useQuery } from '@tanstack/react-query';
import { rankingSessionService } from '@/services/supabase/ranking/rankingSession.service';
import type { RankingList } from '@/schemas/ranking-list.schema';

type RankingListWithCount = RankingList & { itemCount: number };

export function useRankingDashboard(userId: string) {
  const sessions = useQuery<RankingListWithCount[]>({
    queryKey: ['rankingSessions', userId],
    queryFn: () => rankingSessionService.getUserSessions(userId),
    enabled: !!userId,
  });

  const activeSessions =
    sessions.data?.filter(
      (s) => s.status === 'active' || s.status === 'paused'
    ) ?? [];

  const completedSessions =
    sessions.data?.filter((s) => s.status === 'completed') ?? [];

  return {
    sessions,
    activeSessions,
    completedSessions,
  };
}
