// AUDITED 11/08/2025

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';

interface RatingDisplayProps {
  tmdbRating?: number | null;
  userRating?: number | null;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  userOnly?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  tmdbRating,
  userRating,
  showLabels = true,
  size = 'md',
  className,
  userOnly = false,
}) => {
  const sizeClasses = {
    sm: {
      container: 'gap-2',
      stars: 'w-3 h-3',
      text: 'text-xs',
    },
    md: {
      container: 'gap-3',
      stars: 'w-4 h-4',
      text: 'text-sm',
    },
    lg: {
      container: 'gap-4',
      stars: 'w-5 h-5',
      text: 'text-base',
    },
  };

  const currentSize = sizeClasses[size];

  const renderStars = (rating: number, color: string) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 10; i++) {
      const isFilled = i <= fullStars;
      const isHalf = i === fullStars + 1 && hasHalfStar;

      stars.push(
        <Star
          key={i}
          className={cn(
            currentSize.stars,
            'transition-colors',
            isFilled || isHalf ? `text-${color} fill-current` : 'text-gray-300'
          )}
        />
      );
    }
    return stars;
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  return (
    <div className={cn('flex items-center', currentSize.container, className)}>
      {/* TMDB Rating - only show if not userOnly */}
      {!userOnly && tmdbRating !== null && tmdbRating !== undefined && (
        <div className='flex items-center gap-1'>
          {showLabels && (
            <span className={cn('text-secondary', currentSize.text)}>
              TMDB:
            </span>
          )}
          <span className={cn('font-medium text-blue-600', currentSize.text)}>
            {formatRating(tmdbRating)}
          </span>
        </div>
      )}

      {/* User Rating */}
      {userRating !== null && userRating !== undefined && (
        <div className='flex items-center gap-1'>
          {showLabels && !userOnly && (
            <span className={cn('text-secondary', currentSize.text)}>You:</span>
          )}
          <div className='flex gap-0.5'>
            {renderStars(userRating, 'yellow-400')}
          </div>
          <span className={cn('font-medium text-yellow-600', currentSize.text)}>
            {formatRating(userRating)}
          </span>
        </div>
      )}

      {/* No ratings */}
      {(!tmdbRating || tmdbRating === null) &&
        (!userRating || userRating === null) && (
          <div className='flex items-center gap-1'>
            <span className={cn('text-secondary', currentSize.text)}>
              No ratings
            </span>
          </div>
        )}
    </div>
  );
};

// Compact version for small spaces
export const CompactRatingDisplay: React.FC<{
  tmdbRating?: number | null;
  userRating?: number | null;
  className?: string;
}> = ({ tmdbRating, userRating, className }) => {
  const formatRating = (rating: number) => rating.toFixed(1);

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      {tmdbRating && (
        <div className='flex items-center gap-1'>
          <span className='text-blue-600 font-medium'>
            {formatRating(tmdbRating)}
          </span>
          <span className='text-secondary'>TMDB</span>
        </div>
      )}

      {userRating && (
        <div className='flex items-center gap-1'>
          <span className='text-yellow-600 font-medium'>
            {formatRating(userRating)}
          </span>
          <span className='text-secondary'>You</span>
        </div>
      )}
    </div>
  );
};
