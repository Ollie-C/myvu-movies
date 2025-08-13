// AUDITED 07/08/2025
import { useState, useCallback } from 'react';
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

import { useAuth } from '@/context/AuthContext';
import { useRankedMovies } from '@/utils/hooks/supabase/queries/useRanking';

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
  const { user } = useAuth();

  // Local modal state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Batch rating logic
  const batchRating = useBatchRating({
    movies,
    onRateMovie,
    onComplete: onClose,
  });

  // Data for advanced mode
  const { data: rankedMoviesResult, isLoading: isLoadingRanked } =
    useRankedMovies(user?.id);

  const rankedMovies = rankedMoviesResult?.data || [];

  // Simple handlers for rating input
  const handleStarClick = useCallback(
    (starRating: number) => {
      batchRating.setRating(starRating);
    },
    [batchRating.setRating]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (value === '') {
        batchRating.setRating(0);
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
        batchRating.setRating(numValue);
      }
    },
    [batchRating.setRating]
  );

  const handleInputBlur = useCallback(
    (value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const roundedValue = Math.round(numValue * 10) / 10;
        if (roundedValue >= 0 && roundedValue <= 10) {
          batchRating.setRating(roundedValue);
        }
      }
    },
    [batchRating.setRating]
  );

  // Calculate current position (simplified logic)
  const getCurrentPosition = useCallback(() => {
    let position = 1;
    for (const movie of rankedMovies) {
      if (movie.rating && movie.rating > (batchRating.rating || 0)) {
        position++;
      } else {
        break;
      }
    }

    return {
      position,
      totalRanked: rankedMovies.length,
    };
  }, [batchRating.rating, rankedMovies]);

  // Get league table snippet (simplified)
  const getLeagueTableSnippet = useCallback(() => {
    if (!batchRating.rating || !rankedMovies.length) return [];

    const currentPos = getCurrentPosition();
    if (!currentPos) return [];

    const position = currentPos.position;
    const startIndex = Math.max(0, position - 3);
    const endIndex = Math.min(rankedMovies.length, position + 2);

    const snippet = [];
    let currentInserted = false;

    for (let i = startIndex; i < endIndex; i++) {
      const rankedMovie = rankedMovies[i];
      const moviePosition = i + 1;

      // Insert current movie at correct position
      if (!currentInserted && moviePosition >= position) {
        snippet.push({
          movie_id: batchRating.currentMovie?.movie_id || 0,
          rating: batchRating.rating,
          movie: batchRating.currentMovie?.movie,
          position,
          isCurrent: true,
          displayPosition: position,
        });
        currentInserted = true;
      }

      // Add existing ranked movie
      if (rankedMovie) {
        snippet.push({
          ...rankedMovie,
          isCurrent: false,
          displayPosition: moviePosition,
        });
      }
    }

    // If current movie should be at the end
    if (!currentInserted) {
      snippet.push({
        movie_id: batchRating.currentMovie?.movie_id || 0,
        rating: batchRating.rating,
        movie: batchRating.currentMovie?.movie,
        position,
        isCurrent: true,
        displayPosition: position,
      });
    }

    return snippet.slice(0, 5); // Limit to 5 items
  }, [
    batchRating.rating,
    batchRating.currentMovie,
    rankedMovies,
    getCurrentPosition,
  ]);

  // Simplified position change (just adjust rating slightly)
  const handlePositionChange = useCallback(
    (direction: 'up' | 'down') => {
      const snippet = getLeagueTableSnippet();
      const currentIndex = snippet.findIndex((movie) => movie.isCurrent);

      if (direction === 'up' && currentIndex > 0) {
        const movieAbove = snippet[currentIndex - 1];
        const newRating = Math.min(10, (movieAbove.rating || 0) + 0.1);
        batchRating.setRating(newRating);
      } else if (direction === 'down' && currentIndex < snippet.length - 1) {
        const movieBelow = snippet[currentIndex + 1];
        const newRating = Math.max(0, (movieBelow.rating || 0) - 0.1);
        batchRating.setRating(newRating);
      }
    },
    [getLeagueTableSnippet, batchRating.setRating]
  );

  if (!isOpen || !batchRating.currentMovie) return null;

  const currentPosition = getCurrentPosition();
  const leagueTableSnippet = getLeagueTableSnippet();

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
                    onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                    variant={isAdvancedMode ? 'primary' : 'secondary'}
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
                            onClick={() => handleStarClick(star)}
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
                          onChange={(e) => handleInputChange(e.target.value)}
                          onBlur={(e) => handleInputBlur(e.target.value)}
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
              {isAdvancedMode && (
                <div className='w-1/2 p-6 overflow-y-auto'>
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-xl font-bold'>Your Rankings</h3>
                      {currentPosition && (
                        <div className='text-sm text-secondary'>
                          Position {currentPosition.position} of{' '}
                          {currentPosition.totalRanked}
                        </div>
                      )}
                    </div>

                    {isLoadingRanked ? (
                      <div className='text-center py-8'>
                        <p className='text-secondary'>
                          Loading your rankings...
                        </p>
                      </div>
                    ) : leagueTableSnippet.length > 0 ? (
                      <div className='space-y-4'>
                        {/* Position Controls */}
                        <div className='flex items-center justify-center gap-4'>
                          <Button
                            onClick={() => handlePositionChange('up')}
                            variant='secondary'
                            size='sm'
                            disabled={leagueTableSnippet[0]?.isCurrent}
                            className='flex items-center gap-2'>
                            <ChevronUp className='w-4 h-4' />
                            Move Up
                          </Button>
                          <Button
                            onClick={() => handlePositionChange('down')}
                            variant='secondary'
                            size='sm'
                            disabled={
                              leagueTableSnippet[leagueTableSnippet.length - 1]
                                ?.isCurrent
                            }
                            className='flex items-center gap-2'>
                            <ChevronDown className='w-4 h-4' />
                            Move Down
                          </Button>
                        </div>

                        {/* League Table */}
                        <div className='space-y-2'>
                          {leagueTableSnippet.map((movie, index) => (
                            <div
                              key={`${movie.movie_id}-${index}`}
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
