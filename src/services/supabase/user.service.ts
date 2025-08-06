// AUDITED 06/08/2025
import { supabase } from '@/lib/supabase';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';
import type { WatchlistWithMovie } from '@/schemas/watchlist.schema';
import type { Collection } from '@/schemas/collection.schema';

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UserStats {
  moviesWatched: number;
  collectionsCount: number;
  rankingsCount: number;
  totalMovies: number;
  averageRating: number;
  favoriteGenre: string | null;
}

export interface UserMovieWithType extends WatchedMovieWithMovie {
  type: 'watched';
}

export interface WatchlistItemWithType extends WatchlistWithMovie {
  type: 'watchlist';
}

export type UserMovie = UserMovieWithType | WatchlistItemWithType;

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  // Get user statistics for dashboard
  async getUserStats(userId: string): Promise<UserStats> {
    const { data, error } = await supabase.rpc('get_user_stats', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        moviesWatched: 0,
        collectionsCount: 0,
        rankingsCount: 0,
        totalMovies: 0,
        averageRating: 0,
        favoriteGenre: null,
      };
    }

    const stats = data?.[0];
    if (!stats) {
      return {
        moviesWatched: 0,
        collectionsCount: 0,
        rankingsCount: 0,
        totalMovies: 0,
        averageRating: 0,
        favoriteGenre: null,
      };
    }

    return {
      moviesWatched: Number(stats.movies_watched) || 0,
      collectionsCount: Number(stats.collections_count) || 0,
      rankingsCount: Number(stats.rankings_count) || 0,
      totalMovies: Number(stats.total_movies) || 0,
      averageRating: Math.round(Number(stats.average_rating) * 10) / 10, // Round to 1 decimal
      favoriteGenre: stats.favorite_genre || null,
    };
  },

  // Get favorite movies (user-marked favorites)
  async getFavoriteMovies(
    userId: string,
    limit: number = 10
  ): Promise<WatchedMovieWithMovie[]> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .eq('favorite', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data || [];
  },

  // Get all user movies (for search functionality)
  async getAllUserMovies(userId: string): Promise<UserMovie[]> {
    // Get watched movies
    const { data: watchedData, error: watchedError } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Get watchlist movies
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (watchedError || watchlistError) {
      return [];
    }

    // Combine and sort by updated_at
    const allMovies: UserMovie[] = [
      ...(watchedData || []).map(
        (item: WatchedMovieWithMovie): UserMovieWithType => ({
          ...item,
          type: 'watched',
        })
      ),
      ...(watchlistData || []).map(
        (item: WatchlistWithMovie): WatchlistItemWithType => ({
          ...item,
          type: 'watchlist',
        })
      ),
    ];

    return allMovies.sort((a, b) => {
      const dateA = a.updated_at || a.created_at;
      const dateB = b.updated_at || b.created_at;
      if (!dateA || !dateB) return 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  },

  // Get recent movies (most recently watched)
  async getRecentMovies(
    userId: string,
    limit: number = 6
  ): Promise<WatchedMovieWithMovie[]> {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*, movie:movies(*)')
      .eq('user_id', userId)
      .not('watched_date', 'is', null)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data || [];
  },

  // Get featured collections (most recently updated)
  async getFeaturedCollections(
    userId: string,
    limit: number = 3
  ): Promise<(Collection & { movieCount: number })[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items(count)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    // Transform the data to include count
    return (data || []).map((collection) => ({
      ...collection,
      movieCount: collection.collection_items?.[0]?.count || 0,
    }));
  },

  // Update user profile
  async updateProfile(
    userId: string,
    updates: { username?: string; avatar_url?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
  },

  // Get active rankings (collections that are ranked)
  async getActiveRankings(
    userId: string,
    limit: number = 3
  ): Promise<(Collection & { movieCount: number })[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(
        `
        *,
        collection_items(count)
      `
      )
      .eq('user_id', userId)
      .eq('is_ranked', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    // Transform the data to include count
    return (data || []).map((collection) => ({
      ...collection,
      movieCount: collection.collection_items?.[0]?.count || 0,
    }));
  },
};
