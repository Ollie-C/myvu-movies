import { useState } from 'react';
import { Check, Eye, Clock, Loader2 } from 'lucide-react';
import type { TMDBMovie } from '@/lib/api/tmdb';
import { tmdb } from '@/lib/api/tmdb';
import { Button } from '@/components/common/Button';
import { movieService } from '@/services/supabase/movies.service';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { useAuth } from '@/utils/hooks/supabase/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SearchResultsProps {
  results: TMDBMovie[];
  onClose: () => void;
}

interface MovieStatus {
  isWatched: boolean;
  isInWatchlist: boolean;
  movieId?: number;
}

export function SearchResults({ results, onClose }: SearchResultsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>(
    {}
  );

  const tmdbIds = results.map((movie) => movie.id);

  // Fetch movie statuses
  const { data: movieStatuses } = useQuery({
    queryKey: ['movie-statuses', tmdbIds],
    queryFn: async () => {
      if (!user) return new Map<number, MovieStatus>();

      // First, get all movies from our database that match these TMDB IDs
      const { data: movies, error: moviesError } = await supabase
        .from('movies')
        .select('id, tmdb_id')
        .in('tmdb_id', tmdbIds);

      if (moviesError) throw moviesError;

      const movieIdMap = new Map<number, number>();
      movies?.forEach((movie) => {
        movieIdMap.set(movie.tmdb_id, movie.id);
      });

      // Get watched movies
      const { data: watchedMovies, error: watchedError } = await supabase
        .from('watched_movies')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', Array.from(movieIdMap.values()));

      if (watchedError) throw watchedError;

      const watchedSet = new Set(watchedMovies?.map((w) => w.movie_id) || []);

      // Get watchlist items
      const { data: watchlistItems, error: watchlistError } = await supabase
        .from('watchlist')
        .select('movie_id')
        .eq('user_id', user.id)
        .in('movie_id', Array.from(movieIdMap.values()));

      if (watchlistError) throw watchlistError;

      const watchlistSet = new Set(
        watchlistItems?.map((w) => w.movie_id) || []
      );

      // Build status map
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

  const watchedMutation = useMutation({
    mutationFn: async ({
      tmdbMovie,
      currentlyWatched,
    }: {
      tmdbMovie: TMDBMovie;
      currentlyWatched: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const cachedMovie = await movieService.cacheMovie(tmdbMovie);

      if (currentlyWatched) {
        return watchedMoviesService.removeWatched(user.id, cachedMovie.id);
      } else {
        return watchedMoviesService.markAsWatched(user.id, cachedMovie.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies-infinite'] });
    },
  });

  const watchlistMutation = useMutation({
    mutationFn: async ({
      tmdbMovie,
      currentlyInWatchlist,
    }: {
      tmdbMovie: TMDBMovie;
      currentlyInWatchlist: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const cachedMovie = await movieService.cacheMovie(tmdbMovie);

      if (currentlyInWatchlist) {
        return watchlistService.removeFromWatchlist(user.id, cachedMovie.id);
      } else {
        return watchlistService.addToWatchlist(
          user.id,
          cachedMovie.id,
          'medium'
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movie-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies-infinite'] });
    },
  });

  const toggleWatched = async (movie: TMDBMovie) => {
    setLoadingStates((prev) => ({ ...prev, [movie.id]: 'watched' }));
    const status = movieStatuses?.get(movie.id);
    try {
      await watchedMutation.mutateAsync({
        tmdbMovie: movie,
        currentlyWatched: status?.isWatched || false,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [movie.id]: '' }));
    }
  };

  const toggleWatchlist = async (movie: TMDBMovie) => {
    setLoadingStates((prev) => ({ ...prev, [movie.id]: 'watchlist' }));
    const status = movieStatuses?.get(movie.id);
    try {
      await watchlistMutation.mutateAsync({
        tmdbMovie: movie,
        currentlyInWatchlist: status?.isInWatchlist || false,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [movie.id]: '' }));
    }
  };

  if (results.length === 0) {
    return (
      <div className='absolute top-full mt-2 w-full bg-surface rounded-lg shadow-neo-lg border border-border p-8 text-center'>
        <p className='text-secondary'>No movies found</p>
      </div>
    );
  }

  return (
    <div className='absolute top-full mt-2 w-full bg-surface rounded-lg shadow-neo-lg border border-border max-h-[600px] overflow-y-auto scrollbar-thin z-20'>
      <div className='p-2'>
        {results.map((movie) => {
          const status = movieStatuses?.get(movie.id) || {
            isWatched: false,
            isInWatchlist: false,
          };
          const isLoadingWatched = loadingStates[movie.id] === 'watched';
          const isLoadingWatchlist = loadingStates[movie.id] === 'watchlist';

          return (
            <div
              key={movie.id}
              className='flex gap-3 p-2 hover:bg-surface-hover rounded transition-colors'>
              {/* Movie Poster */}
              <img
                src={tmdb.getImageUrl(movie.poster_path, 'w200')}
                alt={movie.title}
                className='w-14 h-20 object-cover rounded'
              />

              {/* Movie Info */}
              <div className='flex-1 min-w-0 flex flex-col justify-between'>
                <h4 className='font-medium text-primary truncate'>
                  {movie.title}
                </h4>
                <p className='text-sm text-secondary'>
                  {movie.release_date
                    ? new Date(movie.release_date).getFullYear()
                    : 'N/A'}
                </p>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-2 items-end'>
                {/* Action Buttons */}
                <div className='flex gap-1'>
                  <Button
                    size='sm'
                    variant={status.isWatched ? 'primary' : 'secondary'}
                    onClick={() => toggleWatched(movie)}
                    disabled={isLoadingWatched}
                    title={
                      status.isWatched ? 'Mark as unwatched' : 'Mark as watched'
                    }>
                    {isLoadingWatched ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : status.isWatched ? (
                      <Check className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </Button>

                  <Button
                    size='sm'
                    variant={status.isInWatchlist ? 'primary' : 'secondary'}
                    onClick={() => toggleWatchlist(movie)}
                    disabled={isLoadingWatchlist}
                    title={
                      status.isInWatchlist
                        ? 'Remove from watchlist'
                        : 'Add to watchlist'
                    }>
                    {isLoadingWatchlist ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : status.isInWatchlist ? (
                      <Check className='w-4 h-4' />
                    ) : (
                      <Clock className='w-4 h-4' />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className='border-t border-border p-3 text-center'>
        <button
          onClick={onClose}
          className='text-sm text-secondary hover:text-primary transition-colors'>
          Press ESC to close
        </button>
      </div>
    </div>
  );
}
