import { supabase } from '@/lib/supabase';
import { tmdb } from '@/lib/api/tmdb';

export interface MovieSearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  genres: string[] | null;
  source: 'local' | 'tmdb';
  is_watched?: boolean;
  is_in_watchlist?: boolean;
  relevance_score?: number;
}

export interface LocalMovieSearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  genres: string[] | null;
  is_watched: boolean;
  is_in_watchlist: boolean;
  relevance_score: number;
}

export const movieSearchService = {
  /**
   * Main search function that orchestrates local and TMDB search
   */
  async searchMovies(
    query: string,
    userId?: string
  ): Promise<MovieSearchResult[]> {
    if (!query.trim()) return [];

    try {
      // First, search local database
      const localResults = await this.searchLocalMovies(query, userId);

      // If we have enough local results, return them
      if (localResults.length >= 5) {
        return localResults.map((movie) => ({
          ...movie,
          source: 'local' as const,
        }));
      }

      // If local results are sparse, search TMDB and combine
      const tmdbResults = await this.searchTMDB(query);
      const combinedResults = this.combineResults(localResults, tmdbResults);

      return combinedResults;
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to TMDB only if local search fails
      try {
        console.log('Falling back to TMDB search due to local search error');
        const tmdbResults = await this.searchTMDB(query);
        return tmdbResults.map((movie) => ({
          ...movie,
          source: 'tmdb' as const,
        }));
      } catch (tmdbError) {
        console.error('TMDB fallback error:', tmdbError);
        return [];
      }
    }
  },

  /**
   * Search local movies using PostgreSQL full-text search
   */
  async searchLocalMovies(
    query: string,
    userId?: string
  ): Promise<LocalMovieSearchResult[]> {
    try {
      console.log(
        'Searching local movies with query:',
        query,
        'userId:',
        userId
      );

      const { data, error } = await supabase.rpc('search_local_movies', {
        search_query: query,
        user_id_param: userId || null,
      });

      if (error) {
        console.error('Local search RPC error:', error);
        return [];
      }

      console.log('Local search results:', data);
      return data || [];
    } catch (error) {
      console.error('Local search RPC error:', error);
      return [];
    }
  },

  /**
   * Search TMDB API
   */
  async searchTMDB(query: string): Promise<MovieSearchResult[]> {
    try {
      const response = await tmdb.searchMovies(query);

      return response.results.map((movie) => ({
        id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genres: null, // TMDB doesn't provide genres in search results
        source: 'tmdb' as const,
        is_watched: false,
        is_in_watchlist: false,
        relevance_score: 0,
      }));
    } catch (error) {
      console.error('TMDB search error:', error);
      return [];
    }
  },

  /**
   * Combine and deduplicate local and TMDB results
   */
  combineResults(
    localResults: LocalMovieSearchResult[],
    tmdbResults: MovieSearchResult[]
  ): MovieSearchResult[] {
    const combined: MovieSearchResult[] = [];
    const seenIds = new Set<number>();

    // Add local results first (they have higher priority)
    for (const localMovie of localResults) {
      combined.push({
        ...localMovie,
        source: 'local' as const,
      });
      seenIds.add(localMovie.id);
    }

    // Add TMDB results that aren't already in local results
    for (const tmdbMovie of tmdbResults) {
      if (!seenIds.has(tmdbMovie.id)) {
        combined.push({
          ...tmdbMovie,
          source: 'tmdb' as const,
        });
        seenIds.add(tmdbMovie.id);
      }
    }

    // Sort by relevance (local results first, then by score)
    return combined.sort((a, b) => {
      if (a.source === 'local' && b.source === 'tmdb') return -1;
      if (a.source === 'tmdb' && b.source === 'local') return 1;

      // Within same source, sort by relevance score
      return (b.relevance_score || 0) - (a.relevance_score || 0);
    });
  },
};
