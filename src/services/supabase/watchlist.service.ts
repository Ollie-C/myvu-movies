import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import {
  type WatchlistPriority,
  type WatchlistWithDetails,
  WatchlistWithDetailsSchema,
} from '@/schemas/watchlist.schema';
import { activityService } from '@/services/supabase/activity.service';

export const watchlistService = {
  async getWatchlist(
    userId: string,
    options?: {
      sortBy?: 'added_date' | 'priority' | 'title';
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
      priority?: WatchlistPriority;
    }
  ): Promise<{ data: WatchlistWithDetails[]; count: number | null }> {
    const {
      sortBy = 'priority',
      sortOrder = 'asc',
      page = 1,
      limit = 24,
      priority,
    } = options || {};

    let query = supabase
      .from('watchlist_with_details')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (sortBy === 'title') {
      query = query.order('title', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    const validatedData = z.array(WatchlistWithDetailsSchema).parse(data || []);

    if (sortBy === 'priority') {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      validatedData.sort((a, b) => {
        const orderA = priorityOrder[a.priority || 'medium'];
        const orderB = priorityOrder[b.priority || 'medium'];
        return sortOrder === 'asc' ? orderA - orderB : orderB - orderA;
      });
    }

    return { data: validatedData, count };
  },

  async getWatchlistItem(
    userId: string,
    movieId: string
  ): Promise<WatchlistWithDetails | null> {
    const { data, error } = await supabase
      .from('watchlist_with_details')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? WatchlistWithDetailsSchema.parse(data) : null;
  },

  async addToWatchlist(
    userId: string,
    movie_uuid: string,
    priority: WatchlistPriority = 'medium',
    notes?: string
  ): Promise<WatchlistWithDetails> {
    const { data, error } = await supabase
      .from('watchlist')
      .upsert(
        {
          user_id: userId,
          movie_id: movie_uuid,
          priority,
          notes,
          added_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,movie_id',
        }
      )
      .select()
      .single();

    if (error) throw error;
    const parsed = WatchlistWithDetailsSchema.parse(data);
    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'watchlist_added',
        movie_id: movie_uuid,
        metadata: { priority },
      });
    } catch (_) {}
    return parsed;
  },

  async removeFromWatchlist(userId: string, movie_uuid: string): Promise<void> {
    const { data: existing, error: checkError } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movie_uuid)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!existing) return;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movie_uuid);

    if (error) throw error;

    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'watchlist_removed',
        movie_id: movie_uuid,
      });
    } catch (_) {}
  },

  async updatePriority(
    userId: string,
    movieId: string,
    priority: WatchlistPriority
  ): Promise<WatchlistWithDetails> {
    const { data, error } = await supabase
      .from('watchlist')
      .update({
        priority,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    const parsed = WatchlistWithDetailsSchema.parse(data);
    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'watchlist_priority_updated',
        movie_id: movieId,
        metadata: { priority },
      });
    } catch (_) {}
    return parsed;
  },

  async updateNotes(
    userId: string,
    movieId: string,
    notes: string
  ): Promise<WatchlistWithDetails> {
    const { data, error } = await supabase
      .from('watchlist')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    const parsed = WatchlistWithDetailsSchema.parse(data);
    try {
      await activityService.logActivity({
        user_id: userId,
        type: 'notes_updated',
        movie_id: movieId,
      });
    } catch (_) {}
    return parsed;
  },

  async setReminder(
    userId: string,
    movieId: string,
    reminderDate: string | null
  ): Promise<WatchlistWithDetails> {
    const { data, error } = await supabase
      .from('watchlist')
      .update({
        reminder_date: reminderDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .select()
      .single();

    if (error) throw error;
    return WatchlistWithDetailsSchema.parse(data);
  },

  async getWatchlistStats(userId: string): Promise<{
    total: number;
    byPriority: Record<WatchlistPriority, number>;
    withReminders: number;
  }> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('priority, reminder_date')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byPriority: {
        high: 0,
        medium: 0,
        low: 0,
      } as Record<WatchlistPriority, number>,
      withReminders: 0,
    };

    data?.forEach((item) => {
      if (item.priority) {
        stats.byPriority[item.priority as WatchlistPriority]++;
      }
      if (item.reminder_date) {
        stats.withReminders++;
      }
    });

    return stats;
  },

  async getDueReminders(userId: string): Promise<WatchlistWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('watchlist_with_details')
      .select('*')
      .eq('user_id', userId)
      .lte('reminder_date', today)
      .not('reminder_date', 'is', null);

    if (error) throw error;

    return z.array(WatchlistWithDetailsSchema).parse(data || []);
  },
};
