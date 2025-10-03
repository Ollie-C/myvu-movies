import { useQuery } from '@tanstack/react-query';
import { rankingSessionService } from '@/features/rankings/api/rankingSession.service';
import { versusService } from '@/features/rankings/api/versus.service';

import type { RankingList } from '@/features/rankings/models/ranking-list.schema';
import type { RankingItemWithDetails } from '@/features/rankings/models/ranking-item.schema';
import type { RankingBattleWithTitles } from '@/features/rankings/models/ranking-battle.schema';
import { rankingKeys } from './useRankingSession';

export function useRankingResults(sessionId: string) {
  const session = useQuery<RankingList>({
    queryKey: rankingKeys.session(sessionId),
    queryFn: () => rankingSessionService.get(sessionId),
    enabled: !!sessionId,
  });

  const leaderboard = useQuery<RankingItemWithDetails[]>({
    queryKey: rankingKeys.leaderboard(sessionId),
    queryFn: () => rankingSessionService.getLeaderboard(sessionId),
    enabled: !!sessionId,
  });

  const battles = useQuery<RankingBattleWithTitles[]>({
    queryKey: ['versusBattles', sessionId],
    queryFn: () => versusService.getBattles(sessionId),
    enabled: !!sessionId,
  });

  return {
    session,
    leaderboard,
    battles,
  };
}
