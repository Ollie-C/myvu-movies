import { useState, useCallback, useEffect } from 'react';
import type { WatchedMovie } from '@/shared/types/userMovie';

interface UseBatchRatingProps {
  movies: WatchedMovie[];
  onRateMovie: (
    movie_uuid: string,
    tmdb_id: number,
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
  const [localMovies, setLocalMovies] = useState<WatchedMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMovie = localMovies[currentIndex];
  const isLastMovie = currentIndex === localMovies.length - 1;
  const isFirstMovie = currentIndex === 0;

  useEffect(() => {
    if (movies.length > 0) {
      setLocalMovies([...movies]);
      setCurrentIndex(0);
      setRating(null);
      setNotes('');
    }
  }, [movies]);

  const handleNext = useCallback(async () => {
    if (!rating || !currentMovie) return;

    setIsSubmitting(true);
    try {
      if (!currentMovie.movie_uuid || !currentMovie.tmdb_id) {
        throw new Error('Invalid movie, missing IDs');
      }

      await onRateMovie(
        currentMovie.movie_uuid,
        currentMovie.tmdb_id,
        rating,
        notes
      );

      const updatedMovies = localMovies.filter(
        (m) => m.movie_uuid !== currentMovie.movie_uuid
      );
      setLocalMovies(updatedMovies);

      if (updatedMovies.length === 0) {
        onComplete?.();
      } else if (currentIndex >= updatedMovies.length) {
        setCurrentIndex(updatedMovies.length - 1);
      }

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

  const handlePrevious = useCallback(() => {
    if (!isFirstMovie) {
      setCurrentIndex((prev) => prev - 1);
      setRating(null);
      setNotes('');
    }
  }, [isFirstMovie]);

  const handleSkip = useCallback(() => {
    if (isLastMovie) {
      onComplete?.();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setRating(null);
      setNotes('');
    }
  }, [isLastMovie, onComplete]);

  const handleStarClick = useCallback((starRating: number) => {
    setRating(starRating);
  }, []);

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

  const handleInputBlur = useCallback((value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const rounded = Math.round(numValue * 10) / 10;
      if (rounded >= 0 && rounded <= 10) {
        setRating(rounded);
      }
    }
  }, []);

  return {
    currentMovie,
    currentIndex,
    rating,
    notes,
    isSubmitting,
    isLastMovie,
    isFirstMovie,
    totalMovies: localMovies.length,
    remainingMovies: localMovies.length,

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
