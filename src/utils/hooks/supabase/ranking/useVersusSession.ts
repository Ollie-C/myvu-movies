import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingSessionService } from '@/services/supabase/ranking/rankingSession.service';
import { versusService } from '@/services/supabase/ranking/methods/versus.service';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RankingList } from '@/schemas/ranking-list.schema';
import type { RankingItemWithMovie } from '@/schemas/ranking-item.schema';
import type { RankingBattleWithTitles } from '@/schemas/ranking-battle.schema';

export interface RankingProgress {
  totalMovies: number;
  targetBattles: number;
  completedBattles: number;
  isCompleted: boolean;
  completionPercent: number;
}

export function useVersusSession(sessionId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<
    { movie1: RankingItemWithMovie; movie2: RankingItemWithMovie }[]
  >([]);

  // Session config
  const session = useQuery<RankingList>({
    queryKey: ['rankingSession', sessionId],
    queryFn: () => rankingSessionService.get(sessionId),
    enabled: !!sessionId,
  });

  const completedPairs = useQuery<Set<string>>({
    queryKey: ['versusCompletedPairs', sessionId],
    queryFn: () => versusService.getCompletedPairs(sessionId),
    enabled: !!sessionId,
  });

  const movies = useQuery<RankingItemWithMovie[]>({
    queryKey: ['rankingSessionMovies', sessionId],
    queryFn: () => rankingSessionService.getMovies(sessionId),
    enabled: !!sessionId,
  });

  const progress = useQuery<RankingProgress>({
    queryKey: ['rankingSessionProgress', sessionId],
    queryFn: () => rankingSessionService.getProgress(sessionId),
    enabled: !!sessionId,
  });

  // Calculate pairs once whenever movies or completedPairs change
  useEffect(() => {
    if (movies.data && completedPairs.data) {
      const pairs = versusService.generatePairs(
        movies.data,
        completedPairs.data
      );
      console.log('Generated Pairs:', pairs); // ✅ debug

      setQueue(pairs);
    }
  }, [movies.data, completedPairs.data]);

  // expose current pair
  const nextPair = queue.length > 0 ? queue[0] : null;

  // Submit a battle, then consume current pair
  const battle = useMutation({
    mutationFn: (opts: { winnerId: string; loserId: string }) =>
      versusService.processBattle(
        sessionId,
        opts.winnerId,
        opts.loserId,
        session.data?.elo_handling === 'global'
      ),
    onSuccess: () => {
      setQueue((prev) => prev.slice(1)); // ✅ drop current pair
      // Refresh progress + leaderboard + battles
      queryClient.invalidateQueries({
        queryKey: ['rankingSessionProgress', sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['rankingSessionLeaderboard', sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ['versusBattles', sessionId] });
      queryClient.invalidateQueries({
        queryKey: ['versusCompletedPairs', sessionId],
      });
    },
  });

  const battlesHistory = useQuery<RankingBattleWithTitles[]>({
    queryKey: ['versusBattles', sessionId],
    queryFn: () => versusService.getBattles(sessionId),
    enabled: !!sessionId,
  });

  // Auto-complete session if progress done
  useEffect(() => {
    if (progress.data?.isCompleted && session.data?.status !== 'completed') {
      (async () => {
        await rankingSessionService.update(sessionId, { status: 'completed' });
        navigate(`/ranking-results/${sessionId}`);
      })();
    }
  }, [progress.data?.isCompleted, session.data?.status, sessionId]);

  return {
    session,
    movies,
    completedPairs,
    nextPair, // ✅ stable pair per round
    battle, // ✅ auto-dequeues after success
    battlesHistory,
    progress,
    queue, // 👉 exposed if you want to show "remaining battles"
  };
}
