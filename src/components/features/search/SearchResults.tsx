import { useState } from 'react';
import type { MovieSearchResult } from '@/services/supabase/movie-search.service';
import type { TMDBMovie } from '@/schemas/movie.schema';
import {
  useToggleWatched,
  useToggleWatchlist,
} from '@/utils/hooks/supabase/mutations/useWatchedMovieMutations';
import { useMovieStore } from '@/stores/useMovieStore';
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

  // Get store actions
  const { setOptimisticUpdate, clearOptimisticUpdate, setMovieState } =
    useMovieStore();

  const handleToggleWatched = async (
    movie: MovieSearchResult,
    isWatched: boolean
  ) => {
    setLoadingStates((prev) => ({ ...prev, [movie.id]: 'watched' }));

    // Set optimistic update immediately for instant UI feedback
    setOptimisticUpdate(movie.id, { isWatched: !isWatched });

    try {
      if (movie.source === 'tmdb') {
        const tmdbMovie: TMDBMovie = {
          id: movie.id,
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview || '',
          poster_path: movie.poster_path,
          release_date: movie.release_date || '',
          vote_average: movie.vote_average || 0,
          vote_count: 0,
          popularity: 0,
          original_language: 'en',
          backdrop_path: null,
          genre_ids: [],
          genres: undefined,
          runtime: undefined,
          tagline: undefined,
          credits: undefined,
        };
        await toggleWatchedMutation.mutateAsync({
          movie: tmdbMovie,
          isWatched,
        });
      } else {
        const movieData = {
          movieId: movie.id,
          tmdbId: movie.id,
          ...movie,
        };
        await toggleWatchedMutation.mutateAsync({
          movie: movieData,
          isWatched,
        });
      }

      // On success, update the permanent state
      setMovieState(movie.id, { isWatched: !isWatched });
      clearOptimisticUpdate(movie.id);
    } catch (error) {
      // On error, clear optimistic update (reverts to original state)
      clearOptimisticUpdate(movie.id);
      console.error('Failed to toggle watched status:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [movie.id]: '' }));
    }
  };

  const handleToggleWatchlist = async (
    movie: MovieSearchResult,
    isInWatchlist: boolean
  ) => {
    setLoadingStates((prev) => ({ ...prev, [movie.id]: 'watchlist' }));

    // Set optimistic update
    setOptimisticUpdate(movie.id, { isInWatchlist: !isInWatchlist });

    try {
      if (movie.source === 'tmdb') {
        const tmdbMovie: TMDBMovie = {
          id: movie.id,
          title: movie.title,
          original_title: movie.original_title,
          overview: movie.overview || '',
          poster_path: movie.poster_path,
          release_date: movie.release_date || '',
          vote_average: movie.vote_average || 0,
          vote_count: 0,
          popularity: 0,
          original_language: 'en',
          backdrop_path: null,
          genre_ids: [],
          genres: undefined,
          runtime: undefined,
          tagline: undefined,
          credits: undefined,
        };
        await toggleWatchlistMutation.mutateAsync({
          movie: tmdbMovie,
          isInWatchlist,
        });
      } else {
        const movieData = {
          movieId: movie.id,
          tmdbId: movie.id,
          ...movie,
        };
        await toggleWatchlistMutation.mutateAsync({
          movie: movieData,
          isInWatchlist,
        });
      }

      // Update permanent state
      setMovieState(movie.id, { isInWatchlist: !isInWatchlist });
      clearOptimisticUpdate(movie.id);
    } catch (error) {
      // Revert on error
      clearOptimisticUpdate(movie.id);
      console.error('Failed to toggle watchlist status:', error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [movie.id]: '' }));
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
          // Use a separate component to ensure proper re-renders
          return (
            <MovieSearchItem
              key={movie.id}
              movie={movie}
              onToggleWatched={handleToggleWatched}
              onToggleWatchlist={handleToggleWatchlist}
              isLoadingWatched={loadingStates[movie.id] === 'watched'}
              isLoadingWatchlist={loadingStates[movie.id] === 'watchlist'}
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
