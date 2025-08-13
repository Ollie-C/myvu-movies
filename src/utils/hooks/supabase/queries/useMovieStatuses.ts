// Audited: 11/08/2025
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface MovieStatus {
  isWatched: boolean;
  isInWatchlist: boolean;
  movieId?: number;
}

export const movieStatusKeys = {
  all: ['movie-statuses'] as const,
  byTmdbIds: (tmdbIds: number[]) => [...movieStatusKeys.all, tmdbIds] as const,
};

export const useMovieStatuses = (tmdbIds: number[]) => {
  const { user } = useAuth();

  return useQuery<Map<number, MovieStatus>, Error>({
    queryKey: movieStatusKeys.byTmdbIds(tmdbIds),
    queryFn: async () => {
      if (!user) return new Map<number, MovieStatus>();

      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('id, tmdb_id')
        .in('tmdb_id', tmdbIds);

      if (moviesError) throw moviesError;

      const movieIdMap = new Map<number, number>();
      movies?.forEach((movie) => {
        movieIdMap.set(movie.tmdb_id, movie.id);
      });

      const { data: watchedMovies, error: watchedError } = await supabase
        .from('watched_movies')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', Array.from(movieIdMap.values()));

      if (watchedError) throw watchedError;

      const watchedSet = new Set(watchedMovies?.map((w) => w.movie_id) || []);

      const { data: watchlistItems, error: watchlistError } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', Array.from(movieIdMap.values()));

      if (watchlistError) throw watchlistError;

      const watchlistSet = new Set(
        watchlistItems?.map((w) => w.movie_id) || []
      );

      const statusMap = new Map<number, MovieStatus>();
      tmdbIds.forEach((tmdbId) => {
        const movieId = movieIdMap.get(tmdbId);
        statusMap.set(tmdbId, {
          isWatched: movieId ? watchedSet.has(movieId) : false,
          isInWatchlist: movieId ? watchlistSet.has(movieId) : false,
          movieId,
        });
      });

      return statusMap;
    },
    enabled: !!user && tmdbIds.length > 0,
  });
};
