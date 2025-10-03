import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rankingSessionService } from '@/features/rankings/api/rankingSession.service';
import { useAuth } from '@/shared/context/AuthContext';
import type { RankingList } from '@/features/rankings/models/ranking-list.schema';
import type { BaseMovieDetails } from '@/shared/types/userMovie';

export const rankingKeys = {
  all: ['rankingSessions'] as const,
  session: (id: string) => [...rankingKeys.all, 'session', id] as const,
  movies: (id: string) => [...rankingKeys.all, 'movies', id] as const,
  progress: (id: string) => [...rankingKeys.all, 'progress', id] as const,
  leaderboard: (id: string) => [...rankingKeys.all, 'leaderboard', id] as const,
};

export const useRankingSession = (sessionId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const session = useQuery({
    queryKey: rankingKeys.session(sessionId),
    queryFn: () => rankingSessionService.get(sessionId),
    enabled: !!sessionId,
  });

  const movies = useQuery<BaseMovieDetails[]>({
    queryKey: rankingKeys.movies(sessionId),
    queryFn: () => rankingSessionService.getMovies(sessionId),
    enabled: !!sessionId,
  });

  const progress = useQuery({
    queryKey: rankingKeys.progress(sessionId),
    queryFn: () => rankingSessionService.getProgress(sessionId),
    enabled: !!sessionId,
  });

  const leaderboard = useQuery({
    queryKey: rankingKeys.leaderboard(sessionId),
    queryFn: () => rankingSessionService.getLeaderboard(sessionId),
    enabled: !!sessionId,
  });

  const create = useMutation({
    mutationFn: (args: Parameters<typeof rankingSessionService.create>[1]) =>
      rankingSessionService.create(user?.id ?? '', args),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({
        queryKey: rankingKeys.session(newSession.id),
      });
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });

  const convertToCollection = useMutation({
    mutationFn: () => rankingSessionService.convertToCollection(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  const softDelete = useMutation({
    mutationFn: () => rankingSessionService.softDelete(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rankingKeys.session(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });

  const pause = useMutation({
    mutationFn: () => rankingSessionService.pause(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });

  const resume = useMutation({
    mutationFn: () => rankingSessionService.resume(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });

  const update = useMutation({
    mutationFn: (updates: Partial<RankingList>) =>
      rankingSessionService.update(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: rankingKeys.session(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
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
