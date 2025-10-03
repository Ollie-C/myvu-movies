import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';
import { activityService } from '@/features/activity/api/activity.service';
import type { ActivityWithEntities } from '@/features/activity/models/activity.schema';
import type { ActivityType } from '@/features/activity/api/activity.service';

export const activityKeys = {
  all: ['activities'] as const,
  recent: (userId: string, limit?: number) =>
    [...activityKeys.all, 'recent', userId, limit] as const,
  list: (
    userId: string,
    types?: ActivityType[],
    page?: number,
    limit?: number,
    fromDate?: string,
    toDate?: string
  ) =>
    [
      ...activityKeys.all,
      'list',
      userId,
      types?.join(',') || '',
      page || 1,
      limit || 25,
      fromDate || '',
      toDate || '',
    ] as const,
};

export const useRecentActivity = (limit = 20) => {
  const { user } = useAuth();

  return useQuery<ActivityWithEntities[], Error>({
    queryKey: activityKeys.recent(user?.id || '', limit),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return activityService.getRecentActivities(user.id, limit);
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
  });
};

export const useActivities = (options?: {
  types?: ActivityType[];
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}) => {
  const { user } = useAuth();

  return useQuery<
    { data: ActivityWithEntities[]; count: number | null },
    Error
  >({
    queryKey: activityKeys.list(
      user?.id || '',
      options?.types,
      options?.page,
      options?.limit,
      options?.fromDate,
      options?.toDate
    ),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return activityService.getActivities(user.id, options);
    },
    enabled: !!user?.id,
  });
};
