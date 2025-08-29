import { supabase } from '@/lib/supabase';
import type { UserMovie } from '@/types/userMovie';
import type { WatchedMovieWithDetails } from '@/schemas/watched-movies-with-details.schema';
import type { WatchlistWithDetails } from '@/schemas/watchlist.schema';
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

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },

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
      averageRating: Math.round(Number(stats.average_rating) * 10) / 10,
      favoriteGenre: stats.favorite_genre || null,
    };
  },

  async getFavoriteMovies(
    userId: string,
    limit: number = 10
  ): Promise<WatchedMovieWithDetails[]> {
    const { data, error } = await supabase
      .from('watched_movies_with_details')
      .select('*')
      .eq('user_id', userId)
      .eq('favorite', true)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []) as WatchedMovieWithDetails[];
  },

  async getAllUserMovies(userId: string): Promise<UserMovie[]> {
    const { data: watchedData, error: watchedError } = await supabase
      .from('watched_movies_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('watched_date', { ascending: false });

    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlist_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('added_date', { ascending: false });

    if (watchedError || watchlistError) {
      return [];
    }

    const watchedMovies = (watchedData || []) as WatchedMovieWithDetails[];
    const watchlistMovies = (watchlistData || []) as WatchlistWithDetails[];

    const allMovies: UserMovie[] = [...watchedMovies, ...watchlistMovies];

    const getDate = (m: UserMovie): string | null => {
      if ('watched_updated_at' in m) {
        return m.watched_updated_at || m.watched_date || null;
      }
      if ('watchlist_updated_at' in m) {
        return m.watchlist_updated_at || m.added_date || null;
      }
      if ('added_at' in m) {
        return m.added_at || null;
      }
      return null;
    };

    return allMovies.sort((a, b) => {
      const dateA = getDate(a);
      const dateB = getDate(b);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  },

  async getRecentMovies(
    userId: string,
    limit: number = 6
  ): Promise<WatchedMovieWithDetails[]> {
    const { data, error } = await supabase
      .from('watched_movies_with_details')
      .select('*')
      .eq('user_id', userId)
      .not('watched_date', 'is', null)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data || []) as WatchedMovieWithDetails[];
  },

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

    if (error) return [];

    return (data || []).map((collection) => ({
      ...collection,
      movieCount: collection.collection_items?.[0]?.count || 0,
    }));
  },

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

    if (error) return [];

    return (data || []).map((collection) => ({
      ...collection,
      movieCount: collection.collection_items?.[0]?.count || 0,
    }));
  },

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
};
