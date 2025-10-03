import { supabase } from '@/shared/lib/supabase';
import { tmdb } from '@/shared/lib/tmdb';

export interface MovieSearchResult {
  movie_uuid: string | null;
  tmdb_id: number;
  title: string;
  original_title: string | null;
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
  movie_uuid: string;
  tmdb_id: number;
  title: string;
  original_title: string | null;
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
  async searchMovies(
    query: string,
    userId?: string
  ): Promise<MovieSearchResult[]> {
    if (!query.trim()) return [];

    try {
      const localResults = await this.searchLocalMovies(query, userId);

      if (localResults.length >= 5) {
        return localResults.map((movie) => ({
          ...movie,
          source: 'local' as const,
        }));
      }

      const tmdbResults = await this.searchTMDB(query);
      const combinedResults = this.combineResults(localResults, tmdbResults);

      return combinedResults;
    } catch (error) {
      console.error('Search error:', error);
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

  async searchLocalMovies(
    query: string,
    userId?: string
  ): Promise<LocalMovieSearchResult[]> {
    try {
      const { data, error } = await supabase.rpc('search_local_movies', {
        search_query: query,
        user_id_param: userId || null,
      });

      if (error) {
        console.error('Local search RPC error:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        movie_uuid: row.movie_uuid,
        tmdb_id: row.tmdb_id,
        title: row.title,
        original_title: row.original_title,
        overview: row.overview,
        poster_path: row.poster_path,
        release_date: row.release_date,
        vote_average: row.vote_average,
        genres: row.genres,
        is_watched: row.is_watched,
        is_in_watchlist: row.is_in_watchlist,
        relevance_score: row.relevance_score,
      }));
    } catch (error) {
      console.error('Local search RPC error:', error);
      return [];
    }
  },

  async searchTMDB(query: string): Promise<MovieSearchResult[]> {
    try {
      const response = await tmdb.searchMovies(query);

      return response.results.map((movie) => ({
        movie_uuid: null,
        tmdb_id: movie.id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genres: null,
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

  combineResults(
    localResults: LocalMovieSearchResult[],
    tmdbResults: MovieSearchResult[]
  ): MovieSearchResult[] {
    const combined: MovieSearchResult[] = [];
    const seenTmdbIds = new Set<number>();

    for (const localMovie of localResults) {
      combined.push({
        ...localMovie,
        source: 'local' as const,
      });
      seenTmdbIds.add(localMovie.tmdb_id);
    }

    for (const tmdbMovie of tmdbResults) {
      if (!seenTmdbIds.has(tmdbMovie.tmdb_id)) {
        combined.push({
          ...tmdbMovie,
          source: 'tmdb' as const,
        });
        seenTmdbIds.add(tmdbMovie.tmdb_id);
      }
    }

    return combined.sort(
      (a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)
    );
  },
};
