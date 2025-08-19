import { supabase } from '@/lib/supabase';
import {
  ActivitySchema,
  ActivityInsertSchema,
  ActivityWithEntitiesSchema,
  type Activity,
  type ActivityInsert,
  type ActivityWithEntities,
} from '@/schemas/activity.schema';
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
      .select(`*, movie:movies(*), collection:collections(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Fallback: return base activities if join aliasing fails in some environments
      const { data: base, error: baseError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (baseError) throw baseError;
      return z
        .array(
          ActivityWithEntitiesSchema.partial({ movie: true, collection: true })
        )
        .parse(base || []);
    }
    return z.array(ActivityWithEntitiesSchema).parse(data || []);
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
  ): Promise<{ data: ActivityWithEntities[]; count: number | null }> {
    const { types, page = 1, limit = 25, fromDate, toDate } = options || {};

    let query = supabase
      .from('activities')
      .select(`*, movie:movies(*), collection:collections(*)`, {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (types && types.length > 0) {
      query = query.in('type', types as any);
    }
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) {
      // Fallback without joins
      let baseQuery = supabase
        .from('activities')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (types && types.length > 0)
        baseQuery = baseQuery.in('type', types as any);
      if (fromDate) baseQuery = baseQuery.gte('created_at', fromDate);
      if (toDate) baseQuery = baseQuery.lte('created_at', toDate);
      const {
        data: base,
        error: baseError,
        count: baseCount,
      } = await baseQuery.range(start, end);
      if (baseError) throw baseError;
      return {
        data: z
          .array(
            ActivityWithEntitiesSchema.partial({
              movie: true,
              collection: true,
            })
          )
          .parse(base || []),
        count: baseCount || 0,
      };
    }

    return {
      data: z.array(ActivityWithEntitiesSchema).parse(data || []),
      count: count || 0,
    };
  },
};
