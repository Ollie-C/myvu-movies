import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useMovieStore } from '@/stores/useMovieStore';

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
  const { setMultipleMovieStates } = useMovieStore.getState();

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
        .select('tmdb_id, movie_uuid, favorite, rating')
        .eq('user_id', user.id)
        .in('tmdb_id', tmdbIds);

      if (watchedError) throw watchedError;

      const watchedMap = new Map(
        (watchedData || []).map((m) => [m.tmdb_id, m])
      );
      const watchlistMap = new Map(
        (watchlistData || []).map((m) => [m.tmdb_id, m])
      );

      const statusMap = new Map<number, MovieStatus>();

      const updates: Array<{
        id: number;
        isWatched?: boolean;
        isInWatchlist?: boolean;
        isFavorite?: boolean;
        rating?: number;
        movie_uuid?: string | null;
      }> = [];

      tmdbIds.forEach((tmdbId) => {
        const watched = watchedMap.get(tmdbId);
        const inWatchlist = watchlistMap.get(tmdbId);

        const status: MovieStatus = {
          isWatched: !!watched,
          isInWatchlist: !!inWatchlist,
          movieId: watched?.movie_uuid || inWatchlist?.movie_uuid || null,
        };

        statusMap.set(tmdbId, status);

        updates.push({
          id: tmdbId,
          isWatched: !!watched,
          isInWatchlist: !!inWatchlist,
          isFavorite: watched?.favorite ?? undefined,
          rating: watched?.rating ?? undefined,
          movie_uuid: watched?.movie_uuid || inWatchlist?.movie_uuid || null,
        });
      });

      setMultipleMovieStates(updates);

      return statusMap;
    },
    enabled: !!user?.id && tmdbIds.length > 0,
  });
};
