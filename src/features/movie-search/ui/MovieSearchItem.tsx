import { tmdb } from '@/shared/lib/tmdb';

import { Database, Globe, Check, Eye, Clock, Loader2 } from 'lucide-react';
// !
import type { MovieSearchResult } from '@/features/movie-search/api/movie-search.service';

// Contexts
import { useMovieState } from '@/shared/stores/useMovieStore';

// Components
import { Button } from '@/shared/ui/Button';

export const MovieSearchItem = ({
  movie,
  onToggleWatched,
  onToggleWatchlist,
  isLoadingWatched,
  isLoadingWatchlist,
}: {
  movie: MovieSearchResult;
  onToggleWatched: (movie: MovieSearchResult, isWatched: boolean) => void;
  onToggleWatchlist: (movie: MovieSearchResult, isInWatchlist: boolean) => void;
  isLoadingWatched: boolean;
  isLoadingWatchlist: boolean;
}) => {
  const movieState = useMovieState(movie.tmdb_id);
  const isWatched = movieState.isWatched;
  const isInWatchlist = movieState.isInWatchlist;

  return (
    <div
      key={movie.tmdb_id}
      className='flex gap-3 p-2 hover:bg-surface-hover rounded transition-colors'>
      {/* Movie Poster */}
      <img
        src={
          movie.poster_path
            ? tmdb.getImageUrl(movie.poster_path, 'w200')
            : '/placeholder-movie.svg'
        }
        alt={movie.title}
        className='w-14 h-20 object-cover rounded'
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/placeholder-movie.svg';
        }}
      />

      {/* Movie Info */}
      <div className='flex-1 min-w-0 flex flex-col justify-between'>
        <div className='flex items-center gap-2'>
          <h4 className='font-medium text-primary truncate'>{movie.title}</h4>
          {/* Source indicator */}
          <div className='flex items-center gap-1 text-xs'>
            {movie.source === 'local' ? (
              <Database className='w-3 h-3 text-blue-500' />
            ) : (
              <Globe className='w-3 h-3 text-green-500' />
            )}
            <span className='text-muted'>
              {movie.source === 'local' ? 'Local' : 'TMDB'}
            </span>
          </div>
        </div>
        <p className='text-sm text-secondary'>
          {movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : 'N/A'}
        </p>
        {movie.source === 'local' && movie.relevance_score !== undefined && (
          <p className='text-xs text-muted'>
            Relevance: {movie.relevance_score.toFixed(2)}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className='flex flex-col gap-2 items-end'>
        <div className='flex gap-1'>
          <Button
            size='sm'
            variant={isWatched ? 'primary' : 'secondary'}
            onClick={() => onToggleWatched(movie, isWatched)}
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
            onClick={() => onToggleWatchlist(movie, isInWatchlist)}
            disabled={isLoadingWatchlist}
            title={
              isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'
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
};
