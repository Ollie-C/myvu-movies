import { useState } from 'react';

// !
import type { MovieSearchResult } from '@/features/movie-search/api/movie-search.service';

// Hooks
import {
  useToggleWatched,
  useToggleWatchlist,
} from '@/features/watched-movies/api/hooks/useWatchedMovieMutations';

// Contexts
import { useMovieStore } from '@/shared/stores/useMovieStore';

// Components
import { MovieSearchItem } from './MovieSearchItem';

interface SearchResultsProps {
  results: MovieSearchResult[];
  onClose: () => void;
}

export function SearchResults({ results, onClose }: SearchResultsProps) {
  const [loadingStates, setLoadingStates] = useState<Record<number, string>>(
    {}
  );

  const toggleWatchedMutation = useToggleWatched();
  const toggleWatchlistMutation = useToggleWatchlist();

  const { setOptimisticUpdate, clearOptimisticUpdate, setMovieState } =
    useMovieStore();

  const handleToggleWatched = async (
    movie: MovieSearchResult,
    isWatched: boolean
  ) => {
    const storeKey = movie.tmdb_id;

    setLoadingStates((prev) => ({ ...prev, [storeKey]: 'watched' }));
    setOptimisticUpdate(storeKey, { isWatched: !isWatched });

    try {
      await toggleWatchedMutation.mutateAsync({
        movie_uuid: movie.movie_uuid,
        tmdb_id: movie.tmdb_id,
        isWatched,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      });

      setMovieState(storeKey, { isWatched: !isWatched });
      clearOptimisticUpdate(storeKey);
    } catch (error) {
      clearOptimisticUpdate(storeKey);
      console.error('Failed to toggle watched status:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [storeKey]: '' }));
    }
  };

  const handleToggleWatchlist = async (
    movie: MovieSearchResult,
    isInWatchlist: boolean
  ) => {
    const storeKey = movie.tmdb_id;

    setLoadingStates((prev) => ({ ...prev, [storeKey]: 'watchlist' }));
    setOptimisticUpdate(storeKey, { isInWatchlist: !isInWatchlist });

    try {
      await toggleWatchlistMutation.mutateAsync({
        movie_uuid: movie.movie_uuid,
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        isInWatchlist,
      });

      setMovieState(storeKey, { isInWatchlist: !isInWatchlist });
      clearOptimisticUpdate(storeKey);
    } catch (error) {
      clearOptimisticUpdate(storeKey);
      console.error('Failed to toggle watchlist status:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [storeKey]: '' }));
    }
  };

  if (!results || results.length === 0) {
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
          return (
            <MovieSearchItem
              key={movie.tmdb_id}
              movie={movie}
              onToggleWatched={handleToggleWatched}
              onToggleWatchlist={handleToggleWatchlist}
              isLoadingWatched={loadingStates[movie.tmdb_id] === 'watched'}
              isLoadingWatchlist={loadingStates[movie.tmdb_id] === 'watchlist'}
            />
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
