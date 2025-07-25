import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { tmdb } from '@/lib/api/tmdb';

interface Movie {
  id: string;
  poster_path: string;
  title: string;
  size: 'small' | 'medium' | 'large';
}

interface MovieCollectionPreviewProps {
  collectionTitle: string;
  movies: Movie[]; // Array of up to 6 movies
  onCollectionClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const MovieCollectionPreview: React.FC<MovieCollectionPreviewProps> = ({
  collectionTitle,
  movies,
  onCollectionClick,
  size = 'medium',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Take only the first 6 movies
  const displayMovies = movies.slice(0, 6);

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return 'w-[100px] h-[150px]';
      case 'medium':
        return 'w-[120px] h-[180px]';
      case 'large':
        return 'w-[150px] h-[225px]';
      default:
    }
  };

  // Debug log to check movie count
  console.log(
    `Collection "${collectionTitle}" has ${displayMovies.length} movies for preview`
  );

  return (
    <div className='cursor-pointer' onClick={onCollectionClick}>
      <div
        className='relative h-[220px] w-full max-w-[300px]'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        {displayMovies.map((movie, index) => {
          // Reduced angles - more subtle rotation
          const baseRotation = isHovered ? 0.1 : -2 + index * 0.3;
          const xOffset = isHovered ? index * 40 : index * 20;
          const yOffset = 0;
          const zIndex = 6 - index;

          return (
            <motion.div
              key={movie.id || `movie-${index}`} // Fallback key if id is missing
              className={clsx(
                'absolute top-0 left-0',
                getCardSize(),
                'rounded-lg overflow-hidden shadow-2xl',
                'bg-gray-200'
              )}
              style={{
                zIndex,
                transformOrigin: 'bottom left',
              }}
              initial={false}
              animate={{
                rotate: baseRotation,
                x: xOffset,
                y: yOffset,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.05,
              }}
              whileHover={
                isHovered
                  ? {
                      scale: 1.05,
                      zIndex: 10,
                      y: -10,
                    }
                  : {}
              }>
              {movie.poster_path ? (
                <img
                  src={tmdb.getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className='w-full h-full object-cover'
                  loading='lazy'
                  onError={(e) => {
                    console.error(`Failed to load poster for ${movie.title}`);
                    e.currentTarget.src = '/placeholder-movie-poster.jpg'; // Fallback image
                  }}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center bg-gray-300'>
                  <span className='text-gray-500 text-center p-4'>
                    {movie.title || 'No Title'}
                  </span>
                </div>
              )}

              {/* Gradient overlay for depth when stacked */}
              {!isHovered && index > 0 && (
                <div className='absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none' />
              )}

              {/* Movie title overlay on hover */}
              <motion.div
                className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4'
                animate={{
                  opacity: isHovered ? 1 : 0,
                }}>
                <motion.p
                  className='text-white text-sm font-medium drop-shadow-lg'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 10,
                  }}
                  transition={{ delay: index * 0.05 }}>
                  {movie.title}
                </motion.p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MovieCollectionPreview;
