// NOT AUDITED

import { useState, useCallback, useEffect } from 'react';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

interface UseBatchRatingProps {
  movies: WatchedMovieWithMovie[];
  onRateMovie: (
    movieId: number,
    rating: number,
    notes?: string
  ) => Promise<void>;
  onComplete?: () => void;
}

export const useBatchRating = ({
  movies,
  onRateMovie,
  onComplete,
}: UseBatchRatingProps) => {
  const [localMovies, setLocalMovies] = useState<WatchedMovieWithMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMovie = localMovies[currentIndex];
  const isLastMovie = currentIndex === localMovies.length - 1;
  const isFirstMovie = currentIndex === 0;

  // Initialize local movies when movies prop changes
  useEffect(() => {
    if (movies.length > 0) {
      setLocalMovies([...movies]);
      setCurrentIndex(0);
      setRating(null);
      setNotes('');
    }
  }, [movies]);

  // Handle next movie
  const handleNext = useCallback(async () => {
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
        onComplete?.();
      } else if (currentIndex >= updatedMovies.length) {
        // We were at the last movie, go to the new last movie
        setCurrentIndex(updatedMovies.length - 1);
      }
      // Otherwise stay at the same index

      // Reset rating and notes for next movie
      setRating(null);
      setNotes('');
    } catch (error) {
      console.error('Error rating movie:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    rating,
    currentMovie,
    notes,
    localMovies,
    currentIndex,
    onRateMovie,
    onComplete,
  ]);

  // Handle previous movie
  const handlePrevious = useCallback(() => {
    if (!isFirstMovie) {
      setCurrentIndex((prev) => prev - 1);
      setRating(null);
      setNotes('');
    }
  }, [isFirstMovie]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (isLastMovie) {
      onComplete?.();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setRating(null);
      setNotes('');
    }
  }, [isLastMovie, onComplete]);

  // Handle star click
  const handleStarClick = useCallback((starRating: number) => {
    setRating(starRating);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    if (value === '') {
      setRating(null);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      setRating(numValue);
    }
  }, []);

  // Handle input blur
  const handleInputBlur = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const roundedValue = Math.round(numValue * 10) / 10;
      if (roundedValue >= 0 && roundedValue <= 10) {
        setRating(roundedValue);
      }
    }
  }, []);

  return {
    // State
    currentMovie,
    currentIndex,
    rating,
    notes,
    isSubmitting,
    isLastMovie,
    isFirstMovie,
    totalMovies: localMovies.length,
    remainingMovies: localMovies.length,

    // Actions
    setRating,
    setNotes,
    handleNext,
    handlePrevious,
    handleSkip,
    handleStarClick,
    handleInputChange,
    handleInputBlur,
  };
};
