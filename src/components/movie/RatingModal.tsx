// NOT AUDITED

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';
import { useBatchRating } from '@/utils/hooks/useBatchRating';
import { useRatingModal } from '@/utils/hooks/useRatingModal';

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

export default function StandardRatingModal({
  isOpen,
  onClose,
  movies,
  onRateMovie,
}: StandardRatingModalProps) {
  const batchRating = useBatchRating({
    movies,
    onRateMovie,
    onComplete: onClose,
  });

  const ratingModal = useRatingModal({
    movieId: batchRating.currentMovie?.movie_id || undefined,
    rating: batchRating.rating,
    currentMovie: batchRating.currentMovie
      ? {
          title: batchRating.currentMovie.movie.title,
          poster_path: batchRating.currentMovie.movie.poster_path,
          release_date: batchRating.currentMovie.movie.release_date,
        }
      : undefined,
    onRatingChange: batchRating.setRating,
    onRatingComplete: batchRating.handleNext,
  });

  if (ratingModal.leagueTableSnippet) {
    console.log(
      'ratingModal.leagueTableSnippet',
      ratingModal.leagueTableSnippet
    );
  }

  if (!isOpen || !batchRating.currentMovie) return null;

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
            className='bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <div className='flex items-center gap-4'>
                <h2 className='text-2xl font-bold'>Rate Your Movies</h2>
                <div className='flex items-center gap-2'>
                  <Button
                    onClick={() =>
                      ratingModal.setIsAdvancedMode(!ratingModal.isAdvancedMode)
                    }
                    variant={
                      ratingModal.isAdvancedMode ? 'primary' : 'secondary'
                    }
                    size='sm'
                    className='flex items-center gap-2'>
                    <TrendingUp className='w-4 h-4' />
                    Advanced
                  </Button>
                </div>
              </div>
              <Button onClick={onClose} variant='ghost' size='sm'>
                <X className='w-5 h-5' />
              </Button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-hidden flex'>
              {/* Left Panel - Movie Info & Rating */}
              <div className='w-1/2 p-6 border-r border-gray-200 overflow-y-auto'>
                <div className='space-y-6'>
                  {/* Movie Info */}
                  <div className='flex gap-6'>
                    <MoviePoster movie={batchRating.currentMovie.movie} />
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold mb-2'>
                        {batchRating.currentMovie.movie.title}
                      </h3>
                      <p className='text-secondary mb-4'>
                        {batchRating.currentMovie.movie.release_date
                          ? new Date(
                              batchRating.currentMovie.movie.release_date
                            ).getFullYear()
                          : 'Unknown Year'}
                      </p>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className='space-y-4'>
                    <h4 className='text-lg font-medium'>Your Rating</h4>

                    {/* Star Rating */}
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-1'>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <button
                            key={star}
                            onClick={() => ratingModal.handleStarClick(star)}
                            className='p-0.5 transition-colors hover:scale-110'>
                            <Star
                              className={`w-6 h-6 ${
                                star <= (batchRating.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Numerical Input */}
                      <div className='flex items-center gap-2'>
                        <input
                          type='number'
                          min='0'
                          max='10'
                          step='0.1'
                          value={batchRating.rating || ''}
                          onChange={(e) =>
                            ratingModal.handleInputChange(e.target.value)
                          }
                          onBlur={(e) =>
                            ratingModal.handleInputBlur(e.target.value)
                          }
                          className='w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm'
                          placeholder='0.0'
                        />
                        <span className='text-sm text-secondary'>/ 10</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>
                      Notes (optional)
                    </label>
                    <Textarea
                      value={batchRating.notes}
                      onChange={(e) => batchRating.setNotes(e.target.value)}
                      placeholder='Add your thoughts about this movie...'
                      className='min-h-[100px]'
                    />
                  </div>

                  {/* Navigation */}
                  <div className='flex items-center justify-between pt-4'>
                    <Button
                      onClick={batchRating.handlePrevious}
                      disabled={batchRating.isFirstMovie}
                      variant='secondary'
                      className='flex items-center gap-2'>
                      <ChevronLeft className='w-4 h-4' />
                      Previous
                    </Button>

                    <div className='flex items-center gap-2'>
                      <Button
                        onClick={batchRating.handleSkip}
                        variant='secondary'
                        size='sm'>
                        Skip
                      </Button>
                      <Button
                        onClick={batchRating.handleNext}
                        disabled={
                          !batchRating.rating || batchRating.isSubmitting
                        }
                        className='flex items-center gap-2'>
                        {batchRating.isLastMovie ? 'Finish' : 'Next'}
                        <ChevronRight className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - League Table (Advanced Mode) */}
              {ratingModal.isAdvancedMode && (
                <div className='w-1/2 p-6 overflow-y-auto'>
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-xl font-bold'>Your Rankings</h3>
                      {ratingModal.currentPosition && (
                        <div className='text-sm text-secondary'>
                          Position {ratingModal.currentPosition} of{' '}
                          {ratingModal.totalRanked}
                        </div>
                      )}
                    </div>

                    {ratingModal.isLoadingRanked ? (
                      <div className='text-center py-8'>
                        <p className='text-secondary'>
                          Loading your rankings...
                        </p>
                      </div>
                    ) : ratingModal.leagueTableSnippet.length > 0 ? (
                      <div className='space-y-4'>
                        {/* Position Controls */}
                        <div className='flex items-center justify-center gap-4'>
                          <Button
                            onClick={() =>
                              ratingModal.handlePositionChange('up')
                            }
                            variant='secondary'
                            size='sm'
                            disabled={
                              ratingModal.leagueTableSnippet[0]?.isCurrent
                            }
                            className='flex items-center gap-2'>
                            <ChevronUp className='w-4 h-4' />
                            Move Up
                          </Button>
                          <Button
                            onClick={() =>
                              ratingModal.handlePositionChange('down')
                            }
                            variant='secondary'
                            size='sm'
                            disabled={
                              ratingModal.leagueTableSnippet[
                                ratingModal.leagueTableSnippet.length - 1
                              ]?.isCurrent
                            }
                            className='flex items-center gap-2'>
                            <ChevronDown className='w-4 h-4' />
                            Move Down
                          </Button>
                        </div>

                        {/* League Table */}
                        <div className='space-y-2'>
                          {ratingModal.leagueTableSnippet.map((movie) => (
                            <div
                              key={movie.movie_id}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                movie.isCurrent
                                  ? 'bg-primary/10 border-primary shadow-md'
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                              <div className='w-12 text-center'>
                                <div className='text-2xl font-bold text-gray-600'>
                                  {movie.displayPosition}
                                </div>
                              </div>

                              <MoviePoster movie={movie.movie} />

                              <div className='flex-1 min-w-0'>
                                <h5 className='font-semibold truncate'>
                                  {movie.movie.title}
                                </h5>
                                <p className='text-sm text-secondary'>
                                  {movie.rating}/10
                                </p>
                              </div>

                              {movie.isCurrent && (
                                <div className='text-primary font-bold text-sm'>
                                  CURRENT
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-8'>
                        <p className='text-secondary'>
                          No ranked movies found. Rate more movies to see your
                          rankings!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
