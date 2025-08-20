// Audited: 11/08/2025

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import { MovieCardOverlay } from './Overlay';
import { MovieCardRanking } from './Ranking';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';
import type { WatchlistWithMovie } from '@/schemas/watchlist.schema';

interface MovieCardProps {
  userMovie: WatchedMovieWithMovie | WatchlistWithMovie;
  onRemoveFromWatched?: (movieId: string) => void;
  onRemoveFromWatchlist?: (movieId: string) => void;
  onMarkAsWatched?: (movieId: string) => void;
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

  const plusButtonRef = useRef<HTMLButtonElement>(null);

  const ANIMATION_CONFIG = {
    INITIAL_DELAY: 200,
    STAGGER_DELAY: 70,
    MAX_ANIMATED_ITEMS: 80,
  };

  const [cardState, setCardState] = useState<{
    isHovered: boolean;
    hasInitiallyExpanded: boolean;
    showCollectionDropdown: boolean;
  }>({
    isHovered: false,
    hasInitiallyExpanded: false,
    showCollectionDropdown: false,
  });

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg';

  // Initial animation delay
  React.useEffect(() => {
    let cardDelay =
      ANIMATION_CONFIG.INITIAL_DELAY + index * ANIMATION_CONFIG.STAGGER_DELAY;

    if (index > ANIMATION_CONFIG.MAX_ANIMATED_ITEMS) {
      cardDelay = 0;
    }

    const timer = setTimeout(() => {
      setCardState((prev) => ({
        ...prev,
        hasInitiallyExpanded: true,
      }));
    }, cardDelay);

    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = () => {
    if (!cardState.showCollectionDropdown && !disableLink) {
      navigate(`/movies/${movie.tmdb_id}`);
    }
  };

  const handleAddToListClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCardState((prev) => ({
      ...prev,
      showCollectionDropdown: !prev.showCollectionDropdown,
    }));
  };

  return (
    <div className='relative flex flex-col'>
      {isWatchedList && <MovieCardRanking index={index} />}

      <motion.div
        className='bg-white border border-gray-300 hover:border-black group relative transition-all duration-200 rounded-sm'
        onHoverStart={() =>
          setCardState((prev) => ({ ...prev, isHovered: true }))
        }
        onHoverEnd={() =>
          setCardState((prev) => ({ ...prev, isHovered: false }))
        }>
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
              isHovered={cardState.isHovered}
              hasInitiallyExpanded={cardState.hasInitiallyExpanded}
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
          {cardState.showCollectionDropdown && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className='absolute top-full left-0 right-0 z-30 mt-1'>
              <CollectionDropdown
                isOpen={cardState.showCollectionDropdown}
                onClose={() =>
                  setCardState((prev) => ({
                    ...prev,
                    showCollectionDropdown: false,
                  }))
                }
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
