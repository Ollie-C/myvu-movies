// NOT AUDITED
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  useSimilarMovies,
  useEnhancedRating,
  useRankedMovies,
  useCurrentMoviePosition,
  useLeagueTableSnippet,
} from './supabase/queries/useRanking';

interface UseRatingModalProps {
  movieId?: number;
  rating?: number | null;
  currentMovie?: {
    title: string;
    poster_path: string | null;
    release_date: string | null;
  };
  onRatingChange?: (rating: number) => void;
  onRatingComplete?: (rating: number, notes?: string) => void;
}

export const useRatingModal = ({
  movieId,
  rating = 0,
  currentMovie,
  onRatingChange,
  onRatingComplete,
}: UseRatingModalProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Use the new hooks instead of inline queries
  const { data: rankedMovies = [] } = useRankedMovies(user?.id);
  const { data: currentPosition } = useCurrentMoviePosition(
    user?.id,
    movieId || undefined,
    rating || undefined,
    currentMovie
  );
  const { data: leagueTableSnippet = [] } = useLeagueTableSnippet(
    user?.id,
    movieId || undefined,
    rating || undefined,
    currentMovie
  );

  // Enhanced rating mutation
  const enhancedRatingMutation = useEnhancedRating();

  // Similar movies query (legacy - keeping for compatibility)
  const {
    data: similarMovies = [],
    isLoading: isLoadingSimilar,
    error: similarMoviesError,
  } = useSimilarMovies(
    user?.id,
    movieId,
    isAdvancedMode && rating && rating > 0 ? rating : undefined
  );

  // Handle position change (up/down arrows)
  const handlePositionChange = useCallback(
    async (direction: 'up' | 'down') => {
      if (!currentPosition || !user?.id || !movieId) return;

      const position = currentPosition.position;
      const currentIndex = leagueTableSnippet.findIndex(
        (movie) => movie.isCurrent
      );

      console.log('🔄 Position Change Attempt:', {
        direction,
        currentPosition: position,
        currentIndex,
        snippetLength: leagueTableSnippet.length,
        currentMovie: currentMovie?.title,
        snippetMovies: leagueTableSnippet.map((m) => ({
          title: m.movie.title,
          position: m.displayPosition,
          isCurrent: m.isCurrent,
          rating: m.rating,
        })),
      });

      if (direction === 'up' && currentIndex > 0) {
        // Move up - swap with movie above
        const movieAbove = leagueTableSnippet[currentIndex - 1];
        const newRating = movieAbove.rating + 0.1; // Slightly higher than movie above
        const finalRating = Math.min(10, newRating);

        console.log('⬆️ Moving Up:', {
          movieAbove: movieAbove.movie.title,
          movieAboveRating: movieAbove.rating,
          newRating: finalRating,
          oldRating: rating,
        });

        onRatingChange?.(finalRating);
      } else if (
        direction === 'down' &&
        currentIndex < leagueTableSnippet.length - 1
      ) {
        // Move down - swap with movie below
        const movieBelow = leagueTableSnippet[currentIndex + 1];
        const newRating = movieBelow.rating - 0.1; // Slightly lower than movie below
        const finalRating = Math.max(0, newRating);

        console.log('⬇️ Moving Down:', {
          movieBelow: movieBelow.movie.title,
          movieBelowRating: movieBelow.rating,
          newRating: finalRating,
          oldRating: rating,
        });

        onRatingChange?.(finalRating);
      } else {
        console.log('❌ Position change not possible:', {
          direction,
          currentIndex,
          snippetLength: leagueTableSnippet.length,
          canMoveUp: currentIndex > 0,
          canMoveDown: currentIndex < leagueTableSnippet.length - 1,
        });
      }
    },
    [
      currentPosition,
      leagueTableSnippet,
      user?.id,
      movieId,
      onRatingChange,
      currentMovie,
      rating,
    ]
  );

  // Handle star click
  const handleStarClick = useCallback(
    (starRating: number) => {
      onRatingChange?.(starRating);
    },
    [onRatingChange]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (value: string) => {
      if (value === '') {
        onRatingChange?.(0);
        return;
      }

      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
        onRatingChange?.(numValue);
      }
    },
    [onRatingChange]
  );

  // Handle input blur (round to 1 decimal)
  const handleInputBlur = useCallback(
    (value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const roundedValue = Math.round(numValue * 10) / 10;
        if (roundedValue >= 0 && roundedValue <= 10) {
          onRatingChange?.(roundedValue);
        }
      }
    },
    [onRatingChange]
  );

  // Handle rating submission
  const handleSubmitRating = useCallback(async () => {
    if (!user?.id || !movieId || !rating || rating === 0) return;

    try {
      if (isAdvancedMode) {
        // Use enhanced rating with ELO calculations
        await enhancedRatingMutation.mutateAsync({
          userId: user.id,
          movieId,
          rating,
          notes: notes || undefined,
        });
      } else {
        // Simple rating - just save the rating
        await enhancedRatingMutation.mutateAsync({
          userId: user.id,
          movieId,
          rating,
          notes: notes || undefined,
        });
      }

      onRatingComplete?.(rating, notes);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  }, [
    user?.id,
    movieId,
    rating,
    notes,
    isAdvancedMode,
    enhancedRatingMutation,
    onRatingComplete,
  ]);

  // Reset modal state
  const resetModal = useCallback(() => {
    setNotes('');
    setIsAdvancedMode(false);
  }, []);

  return {
    // State
    rating,
    notes,
    isAdvancedMode,
    similarMovies,
    isLoadingSimilar,
    similarMoviesError,
    isSubmitting: enhancedRatingMutation.isPending,

    // League table data
    leagueTableSnippet,
    isLoadingRanked: false, // This is now handled by the individual hooks
    currentPosition: currentPosition?.position,
    totalRanked: rankedMovies.length,

    // Actions
    setNotes,
    setIsAdvancedMode,
    handleStarClick,
    handleInputChange,
    handleInputBlur,
    handleSubmitRating,
    handlePositionChange,
    resetModal,
  };
};
