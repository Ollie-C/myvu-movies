import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Card } from '@/components/common/Card';

interface MovieRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  isPending?: boolean;
}

const MovieRating: React.FC<MovieRatingProps> = ({
  rating,
  onRate,
  isPending = false,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (starRating: number) => {
    if (!isPending) {
      onRate(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!isPending) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!isPending) {
      setHoveredRating(0);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Card className='p-6'>
      <h3 className='text-lg font-semibold mb-4'>Your Rating</h3>

      <div className='flex items-center gap-4'>
        {/* Star Rating */}
        <div
          className='flex items-center gap-1'
          onMouseLeave={handleMouseLeave}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type='button'
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={isPending}
              className={`transition-colors duration-200 ${
                isPending
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer hover:scale-110'
              }`}>
              <Star
                className={`w-8 h-8 ${
                  star <= displayRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Rating Text */}
        <div className='flex items-center gap-2'>
          <span className='text-2xl font-bold text-gray-900'>
            {displayRating}
          </span>
          <span className='text-gray-500'>/ 5</span>
          {rating > 0 && (
            <span className='text-sm text-gray-500'>({rating} stars)</span>
          )}
        </div>

        {/* Clear Rating Button */}
        {rating > 0 && (
          <button
            type='button'
            onClick={() => handleStarClick(0)}
            disabled={isPending}
            className='text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50'>
            Clear rating
          </button>
        )}
      </div>

      {/* Loading State */}
      {isPending && (
        <div className='mt-2 text-sm text-gray-500'>Updating rating...</div>
      )}
    </Card>
  );
};

export default MovieRating;
