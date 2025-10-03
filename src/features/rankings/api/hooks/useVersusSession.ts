import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingSessionService } from '@/features/rankings/api/rankingSession.service';
import { versusService } from '@/features/rankings/api/versus.service';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RankingList } from '@/features/rankings/models/ranking-list.schema';
import type { RankingItemWithDetails } from '@/features/rankings/models/ranking-item.schema';
import type { RankingBattleWithTitles } from '@/features/rankings/models/ranking-battle.schema';
import { rankingKeys } from './useRankingSession';

export interface RankingProgress {
  totalMovies: number;
  targetBattles: number | null;
  completedBattles: number;
  isCompleted: boolean;
  completionPercent: number | null;
}

export function useVersusSession(sessionId: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<
    { movie1: RankingItemWithDetails; movie2: RankingItemWithDetails }[]
  >([]);

  const session = useQuery<RankingList>({
    queryKey: rankingKeys.session(sessionId),
    queryFn: () => rankingSessionService.get(sessionId),
    enabled: !!sessionId,
  });

  const completedPairs = useQuery<Set<string>>({
    queryKey: ['versusCompletedPairs', sessionId],
    queryFn: () => versusService.getCompletedPairs(sessionId),
    enabled: !!sessionId,
  });

  const movies = useQuery<RankingItemWithDetails[]>({
    queryKey: rankingKeys.movies(sessionId),
    queryFn: () => rankingSessionService.getMovies(sessionId),
    enabled: !!sessionId,
  });

  const progress = useQuery<RankingProgress>({
    queryKey: rankingKeys.progress(sessionId),
    queryFn: () => rankingSessionService.getProgress(sessionId),
    enabled: !!sessionId,
  });

  const nextPair = queue.length > 0 ? queue[0] : null;

  const battle = useMutation({
    mutationFn: (opts: { winnerId: string; loserId: string }) =>
      versusService.processBattle(
        sessionId,
        opts.winnerId,
        opts.loserId,
        session.data?.elo_handling === 'global'
      ),
    onSuccess: () => {
      setQueue((prev) => prev.slice(1));
      queryClient.invalidateQueries({
        queryKey: rankingKeys.progress(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: rankingKeys.leaderboard(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: ['versusBattles', sessionId] });
    },
  });

  const battlesHistory = useQuery<RankingBattleWithTitles[]>({
    queryKey: ['versusBattles', sessionId],
    queryFn: () => versusService.getBattles(sessionId),
    enabled: !!sessionId,
  });

  const pause = useMutation({
    mutationFn: () => rankingSessionService.pause(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });

  const skipBattle = useMutation({
    mutationFn: () =>
      versusService.skipBattle(
        sessionId,
        nextPair?.movie1.movie_uuid!,
        nextPair?.movie2.movie_uuid!
      ),
    onSuccess: () => {
      setQueue((prev) => prev.slice(1));
      queryClient.invalidateQueries({
        queryKey: rankingKeys.progress(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: ['versusCompletedPairs', sessionId],
      });
    },
  });

  useEffect(() => {
    if (
      movies.data &&
      completedPairs.data &&
      session.data &&
      queue.length === 0
    ) {
      const pairs = versusService.generatePairs(
        movies.data,
        completedPairs.data,
        session.data.battle_limit_type as any,
        session.data.battle_limit || 10
      );
      setQueue(pairs);
    }
  }, [movies.data, completedPairs.data, session.data, queue.length]);

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
    nextPair,
    battle,
    battlesHistory,
    progress,
    queue,
    pause,
    skipBattle,
  };
}
