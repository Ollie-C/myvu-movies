import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export interface MovieStatus {
  isWatched: boolean;
  isInWatchlist: boolean;
  movieId?: string | null;
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
      if (!user || tmdbIds.length === 0) return new Map();

      const { data: watchlistData, error: watchlistError } = await supabase
        .from('watchlist_with_details')
        .select('tmdb_id, movie_uuid')
        .eq('user_id', user.id)
        .in('tmdb_id', tmdbIds);

      if (watchlistError) throw watchlistError;

      const { data: watchedData, error: watchedError } = await supabase
        .from('watched_movies_with_details')
        .select('tmdb_id, movie_uuid')
        .eq('user_id', user.id)
        .in('tmdb_id', tmdbIds);

      if (watchedError) throw watchedError;

      const watchedMap = new Map(
        (watchedData || []).map((m) => [m.tmdb_id, m.movie_uuid])
      );
      const watchlistMap = new Map(
        (watchlistData || []).map((m) => [m.tmdb_id, m.movie_uuid])
      );

      const statusMap = new Map<number, MovieStatus>();
      tmdbIds.forEach((tmdbId) => {
        statusMap.set(tmdbId, {
          isWatched: watchedMap.has(tmdbId),
          isInWatchlist: watchlistMap.has(tmdbId),
          movieId: watchedMap.get(tmdbId) || watchlistMap.get(tmdbId) || null,
        });
      });

      return statusMap;
    },
    enabled: !!user?.id && tmdbIds.length > 0,
  });
};
