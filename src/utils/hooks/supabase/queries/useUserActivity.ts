import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { activityService } from '@/services/supabase/activity.service';
import type { ActivityWithEntities } from '@/schemas/activity.schema';
import type { ActivityType } from '@/services/supabase/activity.service';

export const activityKeys = {
  all: ['activities'] as const,
  recent: (userId: string, limit?: number) =>
    [...activityKeys.all, 'recent', userId, limit] as const,
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
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
  const key = [
    ...activityKeys.all,
    'list',
    user?.id || '',
    options?.types?.join(',') || '',
    options?.page || 1,
    options?.limit || 25,
    options?.fromDate || '',
    options?.toDate || '',
  ] as const;
  return useQuery<
    { data: ActivityWithEntities[]; count: number | null },
    Error
  >({
    queryKey: key,
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return activityService.getActivities(user.id, options);
    },
    enabled: !!user?.id,
    staleTime: 0,
  });
};
