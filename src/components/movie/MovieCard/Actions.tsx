import React from 'react';
import { X, Plus, Eye } from 'lucide-react';
import type { OverlayMovie } from './Overlay';

interface MovieCardActionsProps {
  movie: OverlayMovie;
  isWatchlistView: boolean;
  onRemoveFromWatched?: (movieId: string) => void;
  onRemoveFromWatchlist?: (movieId: string) => void;
  onMarkAsWatched?: (movieId: string) => void;
  onAddToListClick: (e: React.MouseEvent) => void;
  plusButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const MovieCardActions = ({
  movie,
  isWatchlistView,
  onRemoveFromWatched,
  onRemoveFromWatchlist,
  onMarkAsWatched,
  onAddToListClick,
  plusButtonRef,
}: MovieCardActionsProps) => {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className='flex flex-col gap-1 mt-2 w-full'>
      <div className='flex justify-center gap-2'>
        {isWatchlistView ? (
          <>
            <button
              onClick={(e) =>
                handleActionClick(
                  e,
                  () =>
                    movie?.tmdb_id &&
                    onRemoveFromWatchlist?.(movie.tmdb_id.toString())
                )
              }
              className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
              title='Remove from Watchlist'>
              <X className='w-4 h-4' />
            </button>
            <button
              onClick={(e) =>
                handleActionClick(
                  e,
                  () =>
                    movie?.tmdb_id &&
                    onMarkAsWatched?.(movie.tmdb_id.toString())
                )
              }
              className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
              title='Mark as Watched'>
              <Eye className='w-4 h-4' />
            </button>
          </>
        ) : (
          <button
            onClick={(e) =>
              handleActionClick(
                e,
                () =>
                  movie?.tmdb_id &&
                  onRemoveFromWatched?.(movie.tmdb_id.toString())
              )
            }
            className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
            title='Remove from Watched'>
            <X className='w-4 h-4' />
          </button>
        )}
        <button
          ref={plusButtonRef}
          onClick={onAddToListClick}
          className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center relative'
          title='Add to Collection'>
          <Plus className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};
