// NOT AUDITED

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  BarChart3,
  ChevronRight,
  Zap,
  Trophy,
  Target,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import {
  useUnratedMovies,
  useUpdateRating,
  useRatingStats,
  useRankedMovies,
} from '@/utils/hooks/supabase/queries/useRanking';
import StandardRatingModal from '@/components/movie/RatingModal';

const Rankings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isStandardRatingOpen, setIsStandardRatingOpen] = useState(false);
  const [showRankedMovies, setShowRankedMovies] = useState(false);

  // Use the new hooks with userId
  const { data: unratedMovies = [], isLoading: isLoadingUnrated } =
    useUnratedMovies(user?.id);
  const { data: rankedMovies = [] } = useRankedMovies(user?.id);
  const { data: ratingStats } = useRatingStats(user?.id);
  const updateRatingMutation = useUpdateRating();

  const handleStartStandardRating = () => {
    if (!user?.id) return;
    setIsStandardRatingOpen(true);
  };

  const handleRateMovie = async (
    movieId: number,
    rating: number,
    notes?: string
  ) => {
    if (!user?.id) return;

    try {
      await updateRatingMutation.mutateAsync({
        userId: user.id,
        movieId,
        rating,
        notes,
      });
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  // Convert ranked movies to the format expected by StandardRatingModal
  const rankedMoviesForModal = rankedMovies.map((rankedMovie) => ({
    id: `ranked-${rankedMovie.movie_id}`, // Generate a unique ID for ranked movies
    movie_id: rankedMovie.movie_id,
    rating: rankedMovie.rating,
    elo_score: rankedMovie.elo_score,
    movie: rankedMovie.movie,
    // Add other required fields with default values
    user_id: user?.id || '',
    watched_date: new Date().toISOString().split('T')[0],
    notes: null,
    favorite: false,
    rewatch_count: 0,
    created_at: null,
    updated_at: null,
  }));

  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Rankings</h1>
        <p>Please log in to access rankings.</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Hero Section */}
      <div className='text-center mb-12'>
        <div className='inline-flex items-center gap-3 mb-4'>
          <div className='p-3 border-2 border-black rounded-full'>
            <Trophy className='w-8 h-8' />
          </div>
          <h1 className='text-4xl font-bold'>Movie Rankings</h1>
        </div>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          Rate and rank your watched movies to discover your favorites and build
          your personal movie hierarchy
        </p>
      </div>

      {/* Rating Methods */}
      <div className='mb-12'>
        <h2 className='text-2xl font-bold mb-6 flex items-center gap-3'>
          <Target className='w-6 h-6' />
          Rating Methods
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Standard Rating */}
          <Card className='p-8 border-2 border-black hover:bg-gray-50 transition-all duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-4 border-2 border-black rounded-xl'>
                <Star className='w-8 h-8' />
              </div>
              <div>
                <h3 className='text-xl font-bold'>Standard Rating</h3>
                <p className='text-sm text-gray-600'>Rate movies one by one</p>
              </div>
            </div>
            <p className='text-gray-700 mb-6 leading-relaxed'>
              Go through your unrated movies systematically. Rate each one and
              see how it fits into your overall rankings.
            </p>
            {unratedMovies.length > 0 && (
              <div className='mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50'>
                <p className='text-sm font-medium'>
                  {unratedMovies.length} movie
                  {unratedMovies.length !== 1 ? 's' : ''} waiting to be rated
                </p>
              </div>
            )}
            <div className='space-y-3'>
              <Button
                onClick={handleStartStandardRating}
                disabled={unratedMovies.length === 0}
                className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300'>
                {unratedMovies.length === 0
                  ? 'All Caught Up!'
                  : 'Rate Unrated Movies'}
              </Button>

              <Button
                onClick={() => {
                  setShowRankedMovies(true);
                  setIsStandardRatingOpen(true);
                }}
                disabled={rankedMovies.length === 0}
                variant='secondary'
                className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300'>
                View Ranked Movies ({rankedMovies.length})
              </Button>
            </div>
          </Card>

          {/* Versus Rating */}
          <Card className='p-8 border-2 border-black hover:bg-gray-50 transition-all duration-300'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='p-4 border-2 border-black rounded-xl'>
                <BarChart3 className='w-8 h-8' />
              </div>
              <div>
                <h3 className='text-xl font-bold'>Versus Rating</h3>
                <p className='text-sm text-gray-600'>
                  Head-to-head comparisons
                </p>
              </div>
            </div>
            <p className='text-gray-700 mb-6 leading-relaxed'>
              Compare movies directly against each other. Make quick decisions
              to build your rankings through battle.
            </p>
            <Button
              onClick={() => navigate('/versus')}
              variant='secondary'
              className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300'>
              Start Versus
              <ChevronRight className='w-4 h-4 ml-2' />
            </Button>
          </Card>
        </div>
      </div>

      {/* Rating Stats */}
      {ratingStats && (
        <div className='space-y-8'>
          <h2 className='text-2xl font-bold mb-6 flex items-center gap-3'>
            <BarChart3 className='w-6 h-6' />
            Your Statistics
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {/* Total Watched */}
            <Card className='p-6 border-2 border-black'>
              <div className='flex items-center gap-4'>
                <div className='p-3 border-2 border-black rounded-lg'>
                  <BarChart3 className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Total Watched</p>
                  <p className='text-3xl font-bold'>
                    {ratingStats.totalWatched}
                  </p>
                </div>
              </div>
            </Card>

            {/* Total Rated */}
            <Card className='p-6 border-2 border-black'>
              <div className='flex items-center gap-4'>
                <div className='p-3 border-2 border-black rounded-lg'>
                  <Star className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Total Rated</p>
                  <p className='text-3xl font-bold'>{ratingStats.totalRated}</p>
                </div>
              </div>
            </Card>

            {/* Average Rating */}
            <Card className='p-6 border-2 border-black'>
              <div className='flex items-center gap-4'>
                <div className='p-3 border-2 border-black rounded-lg'>
                  <Star className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Average Rating</p>
                  <p className='text-3xl font-bold'>
                    {ratingStats.averageRating.toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Unrated Movies */}
            <Card className='p-6 border-2 border-black'>
              <div className='flex items-center gap-4'>
                <div className='p-3 border-2 border-black rounded-lg'>
                  <Zap className='w-6 h-6' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>To Rate</p>
                  <p className='text-3xl font-bold'>
                    {ratingStats.totalUnrated}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Rating Distribution */}
          {ratingStats.totalRated > 0 && (
            <Card className='p-8 border-2 border-black'>
              <h3 className='text-xl font-bold mb-6'>Rating Distribution</h3>
              <div className='space-y-4'>
                {Object.entries(ratingStats.distribution).map(
                  ([range, count]) => {
                    const percentage = (count / ratingStats.totalRated) * 100;

                    return (
                      <div key={range} className='flex items-center gap-4'>
                        <span className='w-16 text-sm font-semibold'>
                          {range}
                        </span>
                        <div className='flex-1 border-2 border-gray-300 rounded-full h-3 overflow-hidden'>
                          <div
                            className='bg-black h-3 transition-all duration-500'
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className='text-sm font-semibold w-12 text-right'>
                          {count}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>
          )}

          {/* Progress Bar */}
          {ratingStats.totalWatched > 0 && (
            <Card className='p-8 border-2 border-black'>
              <h3 className='text-xl font-bold mb-6'>Rating Progress</h3>
              <div className='space-y-4'>
                <div className='flex justify-between text-sm font-medium'>
                  <span>Rated Movies</span>
                  <span>
                    {ratingStats.totalRated} / {ratingStats.totalWatched}
                  </span>
                </div>
                <div className='w-full border-2 border-gray-300 rounded-full h-4 overflow-hidden'>
                  <div
                    className='bg-black h-4 transition-all duration-500'
                    style={{
                      width: `${
                        (ratingStats.totalRated / ratingStats.totalWatched) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <p className='text-sm text-gray-600 text-center'>
                  {Math.round(
                    (ratingStats.totalRated / ratingStats.totalWatched) * 100
                  )}
                  % complete
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Standard Rating Modal */}
      <StandardRatingModal
        isOpen={isStandardRatingOpen}
        onClose={() => {
          setIsStandardRatingOpen(false);
          setShowRankedMovies(false);
        }}
        movies={showRankedMovies ? rankedMoviesForModal : unratedMovies}
        onRateMovie={handleRateMovie}
      />
    </div>
  );
};

export default Rankings;
