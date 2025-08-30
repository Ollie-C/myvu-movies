import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';

import MoviePoster from '@/components/movie/MoviePoster';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';

import type { BaseMovieDetails } from '@/types/userMovie';

interface SimpleRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: BaseMovieDetails;
  currentRating: number | null;
  onRateMovie: (rating: number, notes?: string) => Promise<void>;
}

export default function SimpleRatingModal({
  isOpen,
  onClose,
  movie,
  currentRating,
  onRateMovie,
}: SimpleRatingModalProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleInputChange = (value: string) => {
    if (value === '') {
      setRating(0);
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
      const roundedValue = Math.round(numValue * 10) / 10;
      if (roundedValue >= 0 && roundedValue <= 10) {
        setRating(roundedValue);
      }
    }
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await onRateMovie(rating, notes || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to rate movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto'>
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <h2 className='text-2xl font-bold'>Rate Movie</h2>
              <Button onClick={onClose} variant='ghost' size='sm'>
                <X className='w-5 h-5' />
              </Button>
            </div>

            {/* Content */}
            <div className='p-6 space-y-6'>
              {/* Movie Info */}
              <div className='flex gap-4'>
                <div className='flex-shrink-0'>
                  <MoviePoster movie={movie} className='w-24 h-36' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-xl font-bold mb-2 truncate'>
                    {movie.title}
                  </h3>
                  <p className='text-secondary mb-4'>
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : 'Unknown Year'}
                  </p>
                </div>
              </div>

              {/* Rating Section */}
              <div className='space-y-4'>
                <h4 className='text-lg font-medium'>Your Rating</h4>

                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                  {/* Star Rating */}
                  <div className='flex items-center gap-1'>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(star)}
                        className='p-0.5 transition-colors hover:scale-110'>
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Numeric input */}
                  <div className='flex items-center gap-2'>
                    <input
                      type='number'
                      min='0'
                      max='10'
                      step='0.1'
                      value={rating || ''}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onBlur={(e) => handleInputBlur(e.target.value)}
                      className='w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm'
                      placeholder='0.0'
                    />
                    <span className='text-sm text-secondary'>/ 10</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Notes (optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Add your thoughts…'
                  className='min-h-[80px]'
                />
              </div>

              {/* Actions */}
              <div className='flex items-center justify-end gap-3 pt-4'>
                <Button
                  onClick={onClose}
                  variant='secondary'
                  disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!rating || isSubmitting}
                  className='flex items-center gap-2'>
                  {isSubmitting ? 'Saving…' : 'Save Rating'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
