import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingSessionService } from '@/services/supabase/ranking/rankingSession.service';
import { useAuth } from '@/context/AuthContext';
import type { RankingList } from '@/schemas/ranking-list.schema';

export const useRankingSession = (sessionId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const session = useQuery({
    queryKey: ['rankingSession', sessionId],
    queryFn: () => rankingSessionService.get(sessionId),
    enabled: !!sessionId,
  });

  const movies = useQuery({
    queryKey: ['rankingSessionMovies', sessionId],
    queryFn: () => rankingSessionService.getMovies(sessionId),
    enabled: !!sessionId,
  });

  const progress = useQuery({
    queryKey: ['rankingSessionProgress', sessionId],
    queryFn: () => rankingSessionService.getProgress(sessionId),
    enabled: !!sessionId,
  });

  const leaderboard = useQuery({
    queryKey: ['rankingSessionLeaderboard', sessionId],
    queryFn: () => rankingSessionService.getLeaderboard(sessionId),
    enabled: !!sessionId,
  });

  const create = useMutation({
    mutationFn: (args: Parameters<typeof rankingSessionService.create>[1]) =>
      rankingSessionService.create(user?.id ?? '', args),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({
        queryKey: ['rankingSession', newSession.id],
      });
    },
  });

  const convertToCollection = useMutation({
    mutationFn: () => rankingSessionService.convertToCollection(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collections'],
      });
    },
  });

  const softDelete = useMutation({
    mutationFn: () => rankingSessionService.softDelete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rankingSession', sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ['rankingSessions'] });
    },
  });

  const pause = useMutation({
    mutationFn: () => rankingSessionService.pause(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingSessions'] });
    },
  });

  const resume = useMutation({
    mutationFn: () => rankingSessionService.resume(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankingSessions'] });
    },
  });

  const update = useMutation({
    mutationFn: (updates: Partial<RankingList>) =>
      rankingSessionService.update(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rankingSession', sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ['rankingSessions'] });
    },
  });

  return {
    session,
    movies,
    progress,
    leaderboard,
    create,
    convertToCollection,
    softDelete,
    pause,
    resume,
    update,
  };
};
