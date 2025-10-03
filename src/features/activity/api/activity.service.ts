import { supabase } from '@/shared/lib/supabase';

// Types and schemas
import {
  ActivitySchema,
  ActivityInsertSchema,
  ActivityWithEntitiesSchema,
  type Activity,
  type ActivityInsert,
  type ActivityWithEntities,
} from '@/features/activity/models/activity.schema';
import { z } from 'zod';

export type ActivityType = z.infer<typeof ActivitySchema>['type'];

export const activityService = {
  async logActivity(activity: ActivityInsert): Promise<Activity> {
    const validated = ActivityInsertSchema.parse(activity);

    const { data, error } = await supabase
      .from('activities')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    return ActivitySchema.parse(data);
  },

  async getRecentActivities(
    userId: string,
    limit = 20
  ): Promise<ActivityWithEntities[]> {
    const { data, error } = await supabase
      .from('activities')
      .select(`*, movie:movies_with_details(*), collection:collections(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      const { data: base, error: baseError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (baseError) throw baseError;

      return (base || []).map((row) =>
        ActivityWithEntitiesSchema.parse({
          ...ActivitySchema.parse(row),
          movie: null,
          collection: null,
        })
      );
    }

    return z.array(ActivityWithEntitiesSchema).parse(data);
  },

  async getActivities(
    userId: string,
    options?: {
      types?: ActivityType[];
      page?: number;
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<{ data: ActivityWithEntities[]; count: number }> {
    const { types, page = 1, limit = 25, fromDate, toDate } = options || {};
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('activities')
      .select(`*, movie:movies_with_details(*), collection:collections(*)`, {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (types?.length) query = query.in('type', types);
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);

    const { data, error, count } = await query.range(start, end);

    if (error || !data) {
      let baseQuery = supabase
        .from('activities')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (types?.length) baseQuery = baseQuery.in('type', types);
      if (fromDate) baseQuery = baseQuery.gte('created_at', fromDate);
      if (toDate) baseQuery = baseQuery.lte('created_at', toDate);

      const {
        data: base,
        error: baseError,
        count: baseCount,
      } = await baseQuery.range(start, end);

      if (baseError) throw baseError;
      return {
        data: (base || []).map((row) =>
          ActivityWithEntitiesSchema.parse({
            ...ActivitySchema.parse(row),
            movie: null,
            collection: null,
          })
        ),
        count: baseCount || 0,
      };
    }

    return {
      data: z.array(ActivityWithEntitiesSchema).parse(data),
      count: count || 0,
    };
  },
};
