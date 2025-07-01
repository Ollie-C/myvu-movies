import { useState } from 'react';
import { Check, Eye, Clock, Loader2 } from 'lucide-react';
import type { TMDBMovie } from '@/lib/api/tmdb';
import { tmdb } from '@/lib/api/tmdb';
import { Button } from '@/components/common/Button';
import { movieService } from '@/services/movie.service';
import { useAuth } from '@/lib/utils/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface SearchResultsProps {
  results: TMDBMovie[];
  onClose: () => void;
}

export function SearchResults({ results, onClose }: SearchResultsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>(
    {}
  );

  const tmdbIds = results.map((movie) => movie.id);
  const { data: userMoviesData } = useQuery({
    queryKey: ['user-movies-search', tmdbIds],
    queryFn: async () => {
      if (!user) return new Map();

      const { data, error } = await supabase
        .from('user_movies')
        .select(
          `
          *,
          movies!inner(id, tmdb_id)
        `
        )
        .eq('user_id', user.id)
        .in('movies.tmdb_id', tmdbIds);

      if (error) throw error;

      const map = new Map();
      data?.forEach((item) => {
        map.set(item.movies.tmdb_id, item);
      });
      return map;
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
      return movieService.toggleWatched(
        user.id,
        cachedMovie.id,
        !currentlyWatched
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-movies-search'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
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
      return movieService.toggleWatchlist(
        user.id,
        cachedMovie.id,
        !currentlyInWatchlist
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-movies-search'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
    },
  });

  const toggleWatched = async (movie: TMDBMovie) => {
    setLoadingStates((prev) => ({ ...prev, [movie.id]: 'watched' }));
    const userMovie = userMoviesData?.get(movie.id);
    try {
      await watchedMutation.mutateAsync({
        tmdbMovie: movie,
        currentlyWatched: userMovie?.watched || false,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [movie.id]: '' }));
    }
  };

  const toggleWatchlist = async (movie: TMDBMovie) => {
    setLoadingStates((prev) => ({ ...prev, [movie.id]: 'watchlist' }));
    const userMovie = userMoviesData?.get(movie.id);
    try {
      await watchlistMutation.mutateAsync({
        tmdbMovie: movie,
        currentlyInWatchlist: userMovie?.watch_list || false,
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
          const userMovie = userMoviesData?.get(movie.id);
          const isWatched = userMovie?.watched || false;
          const isInWatchlist = userMovie?.watch_list || false;
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
                    variant={isWatched ? 'primary' : 'secondary'}
                    onClick={() => toggleWatched(movie)}
                    disabled={isLoadingWatched}
                    title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}>
                    {isLoadingWatched ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : isWatched ? (
                      <Check className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </Button>

                  <Button
                    size='sm'
                    variant={isInWatchlist ? 'primary' : 'secondary'}
                    onClick={() => toggleWatchlist(movie)}
                    disabled={isLoadingWatchlist}
                    title={
                      isInWatchlist
                        ? 'Remove from watchlist'
                        : 'Add to watchlist'
                    }>
                    {isLoadingWatchlist ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : isInWatchlist ? (
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
