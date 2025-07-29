import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { MoviePoster } from '@/components/common/MoviePoster';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

// Custom half-star component
const HalfStar = ({ className }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <Star className='w-6 h-6 text-gray-300' />
    <div className='absolute inset-0 overflow-hidden' style={{ width: '50%' }}>
      <Star className='w-6 h-6 text-yellow-400 fill-current' />
    </div>
  </div>
);

interface StandardRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: WatchedMovieWithMovie[];
  onRateMovie: (
    movieId: number,
    rating: number,
    notes?: string
  ) => Promise<void>;
}

const StandardRatingModal: React.FC<StandardRatingModalProps> = ({
  isOpen,
  onClose,
  movies,
  onRateMovie,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMovies, setLocalMovies] = useState<WatchedMovieWithMovie[]>([]);

  const currentMovie = localMovies[currentIndex];
  const isLastMovie = currentIndex === localMovies.length - 1;
  const isFirstMovie = currentIndex === 0;

  // Initialize local movies when modal opens
  useEffect(() => {
    if (isOpen && movies.length > 0) {
      setLocalMovies([...movies]);
      setCurrentIndex(0);
      setRating(null);
      setNotes('');
    }
  }, [isOpen, movies]);

  const handleNext = async () => {
    if (!rating || !currentMovie) return;

    setIsSubmitting(true);
    try {
      await onRateMovie(currentMovie.movie_id!, rating, notes);

      // Remove the rated movie from local list
      const updatedMovies = localMovies.filter(
        (movie) => movie.movie_id !== currentMovie.movie_id
      );
      setLocalMovies(updatedMovies);

      if (updatedMovies.length === 0) {
        // All movies rated
        onClose();
      } else if (currentIndex >= updatedMovies.length) {
        // We were at the last movie, go to the new last movie
        setCurrentIndex(updatedMovies.length - 1);
      }
      // Otherwise stay at the same index
    } catch (error) {
      console.error('Error rating movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstMovie) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (isLastMovie) {
      onClose();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleInputChange = (value: string) => {
    // Allow empty input for clearing
    if (value === '') {
      setRating(null);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      setRating(numValue);
    }
  };

  const handleInputBlur = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Round to 1 decimal place
      const roundedValue = Math.round(numValue * 10) / 10;
      if (roundedValue >= 0 && roundedValue <= 10) {
        setRating(roundedValue);
      }
    }
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;
    const halfStarPosition = fullStars + 1;

    for (let i = 1; i <= 10; i++) {
      const isFilled = i <= fullStars;
      const isHalf = i === halfStarPosition && hasHalfStar;

      stars.push(
        <button
          key={i}
          onClick={() => handleStarClick(i)}
          className={`p-1 transition-colors ${
            isFilled || isHalf ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}>
          {isHalf ? (
            <HalfStar />
          ) : (
            <Star className={`w-6 h-6 ${isFilled ? 'fill-current' : ''}`} />
          )}
        </button>
      );
    }
    return stars;
  };

  if (!isOpen || !currentMovie) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className='bg-surface rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-border'>
          <div>
            <h2 className='text-xl font-semibold text-primary'>
              Standard Rating
            </h2>
            <p className='text-secondary text-sm'>
              Rate your movies • {currentIndex + 1} of {localMovies.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
            <X className='w-5 h-5 text-secondary' />
          </button>
        </div>

        {/* Content */}
        <div className='flex flex-col lg:flex-row'>
          {/* Movie Info - Left Side */}
          <div className='lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-border'>
            <div className='flex flex-col items-center text-center space-y-4'>
              <MoviePoster
                src={currentMovie.movie.poster_path}
                alt={currentMovie.movie.title}
                size='lg'
              />

              <div className='space-y-2'>
                <h3 className='text-xl font-semibold text-primary'>
                  {currentMovie.movie.title}
                </h3>
                {currentMovie.movie.release_date && (
                  <p className='text-secondary text-sm'>
                    {new Date(currentMovie.movie.release_date).getFullYear()}
                  </p>
                )}
                {currentMovie.watched_date && (
                  <p className='text-secondary text-sm'>
                    Watched:{' '}
                    {new Date(currentMovie.watched_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rating Section - Right Side */}
          <div className='lg:w-1/2 p-6'>
            <div className='space-y-6'>
              {/* Rating Stars */}
              <div>
                <h4 className='text-lg font-medium text-primary mb-4'>
                  Rate this movie (1-10)
                </h4>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='flex justify-center space-x-1'>
                    {renderStars()}
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='number'
                      min='0'
                      max='10'
                      step='0.1'
                      value={rating || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onBlur={(e) => handleInputBlur(e.target.value)}
                      className='w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent'
                      placeholder='0.0'
                    />
                    <span className='text-sm text-secondary'>/ 10</span>
                  </div>
                </div>
                {rating && (
                  <p className='text-center text-secondary'>
                    Rating: {rating.toFixed(1)}/10
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className='block text-sm font-medium text-primary mb-2'>
                  Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Add your thoughts about this movie...'
                  rows={4}
                  className='w-full'
                />
              </div>

              {/* Navigation */}
              <div className='flex justify-between items-center pt-4'>
                <Button
                  onClick={handlePrevious}
                  disabled={isFirstMovie}
                  variant='secondary'
                  size='sm'
                  className='flex items-center gap-2'>
                  <ChevronLeft className='w-4 h-4' />
                  Previous
                </Button>

                <div className='flex gap-2'>
                  <Button onClick={handleSkip} variant='secondary' size='sm'>
                    Skip
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={!rating || isSubmitting}
                    size='sm'
                    className='flex items-center gap-2'>
                    {isSubmitting
                      ? 'Saving...'
                      : isLastMovie
                      ? 'Finish'
                      : 'Next'}
                    {!isLastMovie && <ChevronRight className='w-4 h-4' />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StandardRatingModal;
