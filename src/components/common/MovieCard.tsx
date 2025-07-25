import React, { useState, useRef } from 'react';
import { X, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import type { UserMovie } from '@/services/movie.service';

// Unique Rating Display Component
const RatingDisplay = ({ rating }: { rating: number }) => {
  const percentage = (rating / 10) * 100;

  // Color coding based on rating
  const getColor = (rating: number) => {
    if (rating >= 8) return '#10b981'; // Green for excellent
    if (rating >= 6) return '#f59e0b'; // Amber for good
    if (rating >= 4) return '#ef4444'; // Red for poor
    return '#6b7280'; // Gray for very poor
  };

  // Top Right Rating Box
  const TopRightRatingBox = () => {
    const getColor = (rating: number) => {
      if (rating >= 8) return '#10b981'; // Green for excellent
      if (rating >= 6) return '#f59e0b'; // Amber for good
      if (rating >= 4) return '#ef4444'; // Red for poor
      return '#6b7280'; // Gray for very poor
    };

    return (
      <div className='absolute -top-2 -right-2 bg-white opacity-80 backdrop-blur-lg px-2 py-2 rounded-sm shadow-lg z-20 flex items-center justify-center'>
        <span className='text-black font-bold tracking-widest text-xs'>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return <TopRightRatingBox />;
};

interface MovieCardProps {
  userMovie: UserMovie;
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
  const { movie, rating: userRating } = userMovie;
  const navigate = useNavigate();
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInitiallyExpanded, setHasInitiallyExpanded] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg';

  // Convert user rating from 10-point scale to 5-star scale, or show no rating
  const displayRating = userRating ? (userRating / 2).toFixed(1) : null;

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

            {/* Rating Display */}
            {displayRating && <RatingDisplay rating={userRating || 0} />}

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
                  {isWatchedList && displayRating && <p>{displayRating}</p>}
                </div>
                <AnimatePresence>
                  {(!hasInitiallyExpanded || isHovered) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className='flex-1 flex flex-col justify-between items-center'>
                      <div>{displayRating}</div>
                      <div className='my-2'>
                        <div className='grid grid-cols-2 gap-2 text-[9px]'>
                          <p className='text-gray-600 font-bold text-center'>
                            DATE
                          </p>
                          {movie.vote_average && (
                            <p className='text-gray-600 font-bold text-center'>
                              IMDB
                            </p>
                          )}
                        </div>
                        <div className='grid grid-cols-2 gap-2 text-[9px]'>
                          <p className='text-gray-600 font-bold text-center'>
                            {movie.release_date?.split('-')[0] || 'Unknown'}
                          </p>
                          {movie.vote_average && (
                            <p className='text-gray-600 font-bold text-center'>
                              {movie.vote_average.toFixed(1)}
                            </p>
                          )}
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
                            <>
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
                              <button
                                onClick={handleAddToListClick}
                                className='bg-white text-black w-8 h-8 border border-black hover:bg-gray-100 cursor-pointer flex items-center justify-center'
                                title='Add to List'>
                                <Plus className='w-4 h-4' />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Collection Dropdown */}
      {showCollectionDropdown && (
        <CollectionDropdown
          isOpen={showCollectionDropdown}
          onClose={() => setShowCollectionDropdown(false)}
          movie={movie}
          position={{
            top: plusButtonRef.current
              ? plusButtonRef.current.getBoundingClientRect().bottom + 8
              : undefined,
            left: plusButtonRef.current
              ? plusButtonRef.current.getBoundingClientRect().left
              : undefined,
          }}
        />
      )}
    </div>
  );
};

export default MovieCard;
