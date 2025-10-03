import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

// Components
import { MovieCardActions } from './Actions';

export interface OverlayMovie {
  movie_id: string | null;
  tmdb_id: number | null;
  title: string | null;
  poster_path: string | null;
  release_date: string | null;
  genre_names?: string[];
  director_names?: string[];
}

interface MovieCardOverlayProps {
  movie: OverlayMovie;
  userRating: number | null;
  isHovered: boolean;
  hasInitiallyExpanded: boolean;
  isWatchlistView: boolean;
  isWatchedList: boolean;
  onRemoveFromWatched?: (movieId: string) => void;
  onRemoveFromWatchlist?: (movieId: string) => void;
  onMarkAsWatched?: (movieId: string) => void;
  onAddToListClick: (e: React.MouseEvent) => void;
  plusButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export const MovieCardOverlay = ({
  movie,
  userRating,
  isHovered,
  hasInitiallyExpanded,
  isWatchlistView,
  isWatchedList,
  onRemoveFromWatched,
  onRemoveFromWatchlist,
  onMarkAsWatched,
  onAddToListClick,
  plusButtonRef,
}: MovieCardOverlayProps) => {
  return (
    <motion.div
      className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 overflow-hidden'
      animate={{
        height: !hasInitiallyExpanded ? '100%' : isHovered ? '100%' : '0',
      }}
      initial={{ height: '100%' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}>
      <div className='px-2 py-1 flex flex-col h-full'>
        <div className='text-[9px] text-gray-800 font-bold flex justify-between'>
          <p className='truncate'>{isHovered ? movie.title : ''}</p>
          {isWatchedList && userRating && <p>{userRating.toFixed(1)}</p>}
        </div>

        {(!hasInitiallyExpanded || isHovered) && (
          <div className='flex-1 flex flex-col justify-between items-center'>
            {/* Rating Display */}
            <div className='text-xs'>
              {userRating && (
                <div className='flex items-center gap-1'>
                  <Star className='w-3 h-3 text-yellow-400 fill-current' />
                  <span className='text-yellow-600 font-medium'>
                    {userRating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Release Year */}
            <div className='my-2'>
              <div className='grid grid-cols-1 gap-2 text-[9px]'>
                <p className='text-gray-600 font-bold text-center'>DATE</p>
              </div>
              <div className='grid grid-cols-1 gap-2 text-[9px]'>
                <p className='text-gray-600 font-bold text-center'>
                  {movie.release_date?.split('-')[0] || 'Unknown'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <MovieCardActions
              movie={movie}
              isWatchlistView={isWatchlistView}
              onRemoveFromWatched={onRemoveFromWatched}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              onMarkAsWatched={onMarkAsWatched}
              onAddToListClick={onAddToListClick}
              plusButtonRef={plusButtonRef}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
