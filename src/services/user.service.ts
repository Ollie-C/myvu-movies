import { supabase } from '@/lib/supabase';

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
  // Get user profile from profiles table
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Get user statistics for dashboard
  async getUserStats(userId: string): Promise<UserStats> {
    // Get watched movies count
    const { count: moviesWatched } = await supabase
      .from('user_movies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('watched', true);

    // Get total movies count
    const { count: totalMovies } = await supabase
      .from('user_movies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get collections count
    const { count: collectionsCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get rankings count (collections that are ranked)
    const { count: rankingsCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_ranked', true);

    // Get average rating
    const { data: ratingData } = await supabase
      .from('user_movies')
      .select('rating')
      .eq('user_id', userId)
      .not('rating', 'is', null);

    const averageRating =
      ratingData && ratingData.length > 0
        ? ratingData.reduce((sum, movie) => sum + (movie.rating || 0), 0) /
          ratingData.length /
          2 // Convert from 10-point to 5-point scale
        : 0;

    // Get favorite genre (simplified - could be enhanced with more complex logic)
    const { data: genreData } = await supabase
      .from('user_movies')
      .select(
        `
        movie:movies(genres)
      `
      )
      .eq('user_id', userId)
      .eq('watched', true)
      .limit(100); // Sample for performance

    let favoriteGenre = null;
    if (genreData && genreData.length > 0) {
      const genreCounts: Record<string, number> = {};
      genreData.forEach((item: any) => {
        if (item.movie?.genres) {
          item.movie.genres.forEach((genre: any) => {
            genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
          });
        }
      });

      const sortedGenres = Object.entries(genreCounts).sort(
        ([, a], [, b]) => b - a
      );
      favoriteGenre = sortedGenres[0]?.[0] || null;
    }

    return {
      moviesWatched: moviesWatched || 0,
      collectionsCount: collectionsCount || 0,
      rankingsCount: rankingsCount || 0,
      totalMovies: totalMovies || 0,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      favoriteGenre,
    };
  },

  // Get favorite movies (user-marked favorites)
  async getFavoriteMovies(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_movies')
      .select(
        `
        user_id,
        movie_id,
        rating,
        watched,
        watched_date,
        watch_list,
        watchlist_added_date,
        favorite,
        notes,
        created_at,
        updated_at,
        movie:movies(
          id,
          tmdb_id,
          title,
          poster_path,
          backdrop_path,
          overview,
          release_date,
          vote_average,
          genres,
          original_language,
          original_title,
          popularity
        )
      `
      )
      .eq('user_id', userId)
      .eq('favorite', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching favorite movies:', error);
      return [];
    }

    return data || [];
  },

  // Get all user movies (for search functionality)
  async getAllUserMovies(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_movies')
      .select(
        `
        user_id,
        movie_id,
        rating,
        watched,
        watched_date,
        watch_list,
        watchlist_added_date,
        favorite,
        notes,
        created_at,
        updated_at,
        movie:movies(
          id,
          tmdb_id,
          title,
          poster_path,
          backdrop_path,
          overview,
          release_date,
          vote_average,
          genres,
          original_language,
          original_title,
          popularity
        )
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching all user movies:', error);
      return [];
    }
    return data || [];
  },

  // Get recent movies (most recently watched)
  async getRecentMovies(userId: string, limit: number = 6): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_movies')
      .select(
        `
        user_id,
        movie_id,
        rating,
        watched,
        watched_date,
        watch_list,
        watchlist_added_date,
        favorite,
        notes,
        created_at,
        updated_at,
        movie:movies(
          id,
          tmdb_id,
          title,
          poster_path,
          backdrop_path,
          overview,
          release_date,
          vote_average,
          genres,
          original_language,
          original_title,
          popularity
        )
      `
      )
      .eq('user_id', userId)
      .eq('watched', true)
      .not('watched_date', 'is', null)
      .order('watched_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent movies:', error);
      return [];
    }

    return data || [];
  },

  // Get featured collections (most recently updated)
  async getFeaturedCollections(
    userId: string,
    limit: number = 3
  ): Promise<any[]> {
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
      console.error('Error fetching featured collections:', error);
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
  async getActiveRankings(userId: string, limit: number = 3): Promise<any[]> {
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
      console.error('Error fetching active rankings:', error);
      return [];
    }

    // Transform the data to include count
    return (data || []).map((collection) => ({
      ...collection,
      movieCount: collection.collection_items?.[0]?.count || 0,
    }));
  },
};
