import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import { MovieCardOverlay } from './MovieCard/Overlay';
import { MovieCardRanking } from './MovieCard/Ranking';
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

export const MovieCard = ({
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

  const handleCardClick = () => {
    if (!showCollectionDropdown && !disableLink) {
      navigate(`/movies/${movie.tmdb_id}`);
    }
  };

  const handleAddToListClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCollectionDropdown(!showCollectionDropdown);
  };

  return (
    <div className='relative flex flex-col'>
      {isWatchedList && <MovieCardRanking index={index} />}

      <motion.div
        className='bg-white border border-gray-300 hover:border-black group relative transition-all duration-200 rounded-sm'
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}>
        <div className='block cursor-pointer' onClick={handleCardClick}>
          <div className='relative pb-[150%]'>
            <img
              src={imageUrl}
              alt={movie.title}
              className='absolute inset-0 w-full h-full object-cover'
            />

            <MovieCardOverlay
              movie={movie}
              userRating={userRating}
              isHovered={isHovered}
              hasInitiallyExpanded={hasInitiallyExpanded}
              isWatchlistView={isWatchlistView}
              isWatchedList={isWatchedList}
              onRemoveFromWatched={onRemoveFromWatched}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              onMarkAsWatched={onMarkAsWatched}
              onAddToListClick={handleAddToListClick}
              plusButtonRef={plusButtonRef}
            />
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
