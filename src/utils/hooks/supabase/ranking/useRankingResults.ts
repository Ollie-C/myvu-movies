import { useQuery } from '@tanstack/react-query';
import { rankingSessionService } from '@/services/supabase/ranking/rankingSession.service';
import { versusService } from '@/services/supabase/ranking/methods/versus.service';

import type { RankingList } from '@/schemas/ranking-list.schema';
import type { RankingItemWithDetails } from '@/schemas/ranking-item.schema';
import type { RankingBattleWithTitles } from '@/schemas/ranking-battle.schema';
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
