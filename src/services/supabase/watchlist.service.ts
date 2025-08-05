// NOT AUDITED

import { supabase } from '@/lib/supabase';
import {
  WatchlistSchema,
  WatchlistWithMovieSchema,
  type Watchlist,
  type WatchlistWithMovie,
  type WatchlistPriority,
} from '@/schemas/watchlist.schema';
import { z } from 'zod';

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
  ): Promise<{ data: WatchlistWithMovie[]; count: number | null }> {
    const {
      sortBy = 'priority',
      sortOrder = 'asc',
      page = 1,
      limit = 24,
      priority,
    } = options || {};

    let query = supabase
      .from('watchlist')
      .select(
        `
        *,
        movie:movies (*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId);

    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    if (sortBy === 'priority') {
      // For priority, we need custom ordering
      // Using CASE in raw SQL would be better, but for now:
      query = query.order('priority', { ascending: true });
    } else if (sortBy === 'title') {
      // Can't directly sort by movie title with Supabase
      // Will need to sort in memory after fetching
      query = query.order('added_date', { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;

    // Validate data
    let validatedData = z.array(WatchlistWithMovieSchema).parse(data || []);

    // Sort by movie title if needed (post-query sorting)
    if (sortBy === 'title' && validatedData.length > 0) {
      validatedData.sort((a, b) => {
        const titleA = a.movie?.title || '';
        const titleB = b.movie?.title || '';
        return sortOrder === 'asc'
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      });
    }

    // Sort by priority with proper order
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
    movieId: number
  ): Promise<Watchlist | null> {
    try {
      // Try a more explicit query structure
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .maybeSingle();

      if (error) {
        console.error('Watchlist query error:', error);
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      if (!data) return null;

      return WatchlistSchema.parse(data);
    } catch (error) {
      console.error('Error in getWatchlistItem:', error);
      throw error;
    }
  },

  async addToWatchlist(
    userId: string,
    movieId: number,
    priority: WatchlistPriority = 'medium',
    notes?: string
  ): Promise<Watchlist> {
    const { data, error } = await supabase
      .from('watchlist')
      .upsert(
        {
          user_id: userId,
          movie_id: movieId,
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
    return WatchlistSchema.parse(data);
  },

  async removeFromWatchlist(userId: string, movieId: number): Promise<void> {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId);

    if (error) {
      if (error.code === 'PGRST116') return; // Already removed
      throw error;
    }
  },

  async updatePriority(
    userId: string,
    movieId: number,
    priority: WatchlistPriority
  ): Promise<Watchlist> {
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
    return WatchlistSchema.parse(data);
  },

  async updateNotes(
    userId: string,
    movieId: number,
    notes: string
  ): Promise<Watchlist> {
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
    return WatchlistSchema.parse(data);
  },

  async setReminder(
    userId: string,
    movieId: number,
    reminderDate: string | null
  ): Promise<Watchlist> {
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
    return WatchlistSchema.parse(data);
  },

  // Additional useful methods
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

  async isMovieInWatchlist(userId: string, movieId: number): Promise<boolean> {
    const item = await this.getWatchlistItem(userId, movieId);
    return !!item;
  },

  async getDueReminders(userId: string): Promise<WatchlistWithMovie[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('watchlist')
      .select(
        `
        *,
        movie:movies (*)
      `
      )
      .eq('user_id', userId)
      .lte('reminder_date', today)
      .not('reminder_date', 'is', null);

    if (error) throw error;

    return z.array(WatchlistWithMovieSchema).parse(data || []);
  },
};
