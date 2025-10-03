import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { tmdb } from '@/shared/lib/tmdb';

interface Movie {
  id: string;
  poster_path: string;
  title: string;
  size: 'small' | 'medium' | 'large';
}

interface CollectionPreviewProps {
  collectionTitle: string;
  movies: Movie[];
  onCollectionClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const CollectionPreview: React.FC<CollectionPreviewProps> = ({
  movies,
  onCollectionClick,
  size = 'medium',
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div className='cursor-pointer' onClick={onCollectionClick}>
      <div
        className='relative h-[220px] w-full max-w-[300px]'
        style={{ perspective: '1000px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        {displayMovies.map((movie, index) => {
          const baseRotation = isHovered ? -15 + index * 6 : -3 + index * 1;
          const xOffset = isHovered ? index * 40 : index * 20;
          const yOffset = isHovered ? Math.sin(index * 0.5) * 10 : 0;
          const zIndex = 6 - index;

          return (
            <motion.div
              key={movie.id || `movie-${index}`}
              className={clsx(
                'absolute top-0 left-0',
                getCardSize(),
                'rounded-lg overflow-hidden shadow-2xl',
                'bg-gray-200'
              )}
              style={{
                zIndex,
                transformOrigin: 'bottom center',
              }}
              initial={{
                rotate: 0,
                x: 0,
                scale: 0.8,
                opacity: 0,
              }}
              animate={{
                rotate: baseRotation,
                x: xOffset,
                y: yOffset,
                scale: 1,
                opacity: 1,
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
                    e.currentTarget.src = '/placeholder-movie-poster.jpg';
                  }}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center bg-gray-300'>
                  <span className='text-gray-500 text-center p-4'>
                    {movie.title || 'No Title'}
                  </span>
                </div>
              )}

              {!isHovered && index > 0 && (
                <div className='absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none' />
              )}

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

export default CollectionPreview;
