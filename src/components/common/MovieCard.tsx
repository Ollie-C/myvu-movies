import React, { useState, useRef } from 'react';
import { X, Plus, Eye, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';
import type { WatchlistWithMovie } from '@/schemas/watchlist.schema';

interface MovieCardProps {
  userMovie: WatchedMovieWithMovie | WatchlistWithMovie;
  onRemoveFromWatched?: (movieId: number) => void;
  onRemoveFromWatchlist?: (movieId: number) => void;
  onMarkAsWatched?: (movieId: number) => void;
  isWatchlistView?: boolean;
  index?: number;
  isWatchedList?: boolean;
  disableLink?: boolean;
}

const MovieCard = ({
  userMovie,
  onRemoveFromWatched,
  onRemoveFromWatchlist,
  onMarkAsWatched,
  isWatchlistView = false,
  index = 0,
  isWatchedList = false,
  disableLink = false,
}: MovieCardProps) => {
  const { movie } = userMovie;
  const userRating = 'rating' in userMovie ? userMovie.rating : null;
  const navigate = useNavigate();
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInitiallyExpanded, setHasInitiallyExpanded] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg';

  // Initial animation delay
  React.useEffect(() => {
    const initialDelay = 200;
    const staggerDelay = 70;

    let cardDelay = initialDelay + index * staggerDelay;

    if (index > 80) {
      cardDelay = 0;
    }

    const timer = setTimeout(() => {
      setHasInitiallyExpanded(true);
    }, cardDelay);

    return () => clearTimeout(timer);
  }, [index]);

  const handleAddToListClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCollectionDropdown(!showCollectionDropdown);
  };

  return (
    <div className='relative flex flex-col'>
      {/* Ranking number for watched list */}
      {isWatchedList && (
        <span
          className={`absolute top-[-8px] left-[-3px] text-xs text-gray-800 mb-1 text-center font-bold z-10 bg-white rounded-[2px] p-1 px-1.5 ${
            index < 3 ? 'text-[12px]' : 'text-[9px]'
          } ${index === 0 ? 'text-lg text-black' : ''}`}>
          {index + 1}
        </span>
      )}

      <motion.div
        className='bg-white border border-gray-300 hover:border-black group relative transition-all duration-200 rounded-sm'
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}>
        <div
          className='block cursor-pointer'
          onClick={() => {
            if (!showCollectionDropdown && !disableLink) {
              navigate(`/movies/${movie.tmdb_id}`);
            }
          }}>
          <div className='relative pb-[150%]'>
            <img
              src={imageUrl}
              alt={movie.title}
              className='absolute inset-0 w-full h-full object-cover'
            />

            <motion.div
              className='absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 overflow-visible'
              animate={{
                height: !hasInitiallyExpanded
                  ? '100%'
                  : isHovered
                  ? '100%'
                  : '0',
              }}
              initial={{ height: '100%' }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}>
              <div className='px-2 py-1 flex flex-col'>
                <div className='text-[9px] text-gray-800 font-bold flex justify-between'>
                  <p className='truncate'>{isHovered ? movie.title : ''}</p>
                  {isWatchedList && userRating && (
                    <p>{userRating.toFixed(1)}</p>
                  )}
                </div>
                <AnimatePresence>
                  {(!hasInitiallyExpanded || isHovered) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className='flex-1 flex flex-col justify-between items-center'>
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
                      <div className='my-2'>
                        <div className='grid grid-cols-1 gap-2 text-[9px]'>
                          <p className='text-gray-600 font-bold text-center'>
                            DATE
                          </p>
                        </div>
                        <div className='grid grid-cols-1 gap-2 text-[9px]'>
                          <p className='text-gray-600 font-bold text-center'>
                            {movie.release_date?.split('-')[0] || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className='flex flex-col gap-1 mt-2 w-full'>
                        <div className='flex justify-center gap-2'>
                          {isWatchlistView ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onRemoveFromWatchlist?.(movie.id);
                                }}
                                className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
                                title='Remove from Watchlist'>
                                <X className='w-4 h-4' />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onMarkAsWatched?.(movie.id);
                                }}
                                className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
                                title='Mark as Watched'>
                                <Eye className='w-4 h-4' />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemoveFromWatched?.(movie.id);
                              }}
                              className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
                              title='Remove from Watched'>
                              <X className='w-4 h-4' />
                            </button>
                          )}
                          <button
                            ref={plusButtonRef}
                            onClick={handleAddToListClick}
                            className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center relative'
                            title='Add to Collection'>
                            <Plus className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Collection Dropdown */}
        <AnimatePresence>
          {showCollectionDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className='absolute top-full left-0 right-0 z-30 mt-1'>
              <CollectionDropdown
                isOpen={showCollectionDropdown}
                onClose={() => setShowCollectionDropdown(false)}
                movie={movie}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default MovieCard;
