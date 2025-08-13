import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import {
  Star,
  BarChart3,
  ChevronRight,
  Zap,
  Trophy,
  Target,
  Brain,
} from 'lucide-react';

// Components
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import StandardRatingModal from '@/components/movie/RatingModal';

// Contexts
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Services
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';

// Updated hooks
import { useRankedMovies } from '@/utils/hooks/supabase/queries/useRanking';
import { useWatchedMovies } from '@/utils/hooks/supabase/queries/useWatchedMovies';

const Rankings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isStandardRatingOpen, setIsStandardRatingOpen] = useState(false);
  const [showRankedMovies, setShowRankedMovies] = useState(false);

  // Get unrated movies (watched but not rated)
  const { data: watchedMoviesData, isLoading: watchedLoading } =
    useWatchedMovies({
      onlyRated: false,
      sortBy: 'watched_date',
      sortOrder: 'desc',
    });

  // Get ranked movies (rated movies)
  const { data: rankedMoviesData, isLoading: rankedLoading } = useRankedMovies(
    user?.id
  );

  // Calculate unrated movies
  const unratedMovies =
    watchedMoviesData?.data?.filter((movie) => !movie.rating) || [];
  const rankedMovies = rankedMoviesData?.data || [];

  // Calculate stats from the data we have
  const ratingStats = watchedMoviesData?.data
    ? {
        totalWatched: watchedMoviesData.data.length,
        totalRated: watchedMoviesData.data.filter((movie) => movie.rating)
          .length,
        totalUnrated: watchedMoviesData.data.filter((movie) => !movie.rating)
          .length,
        averageRating:
          watchedMoviesData.data.filter((movie) => movie.rating).length > 0
            ? watchedMoviesData.data
                .filter((movie) => movie.rating)
                .reduce((sum, movie) => sum + (movie.rating || 0), 0) /
              watchedMoviesData.data.filter((movie) => movie.rating).length
            : 0,
        distribution: calculateRatingDistribution(
          watchedMoviesData.data.filter((movie) => movie.rating)
        ),
      }
    : null;

  // Helper function to calculate rating distribution
  function calculateRatingDistribution(ratedMovies: any[]) {
    const distribution = {
      '1-2': 0,
      '3-4': 0,
      '5-6': 0,
      '7-8': 0,
      '9-10': 0,
    };

    ratedMovies.forEach((movie) => {
      const rating = movie.rating;
      if (rating <= 2) distribution['1-2']++;
      else if (rating <= 4) distribution['3-4']++;
      else if (rating <= 6) distribution['5-6']++;
      else if (rating <= 8) distribution['7-8']++;
      else distribution['9-10']++;
    });

    return distribution;
  }

  const handleStartStandardRating = () => {
    setIsStandardRatingOpen(true);
    setShowRankedMovies(false);
  };

  const handleRateMovie = async (
    movieId: number,
    rating: number,
    notes?: string
  ) => {
    if (!user?.id) return;

    try {
      await watchedMoviesService.updateRating(user.id, movieId, rating);

      if (notes) {
        await watchedMoviesService.updateNotes(user.id, movieId, notes);
      }

      showToast('success', 'Movie rated successfully!');
    } catch (error) {
      showToast('error', 'Failed to rate movie');
    }
  };

  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Rankings</h1>
        <p>Please log in to access rankings.</p>
      </div>
    );
  }

  const isLoading = watchedLoading || rankedLoading;

  console.log('here', watchedMoviesData?.data.length);

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Hero Section */}
      <div className='text-left mb-12'>
        <div className='inline-flex items-center gap-3 mb-4'>
          <h1 className='text-4xl font-bold'>Arena</h1>
        </div>
        <p className='text-lg text-gray-600 max-w-2xl ml-0'>
          Rate and rank your watched movies to discover your favorites and build
          your personal movie hierarchy
        </p>
      </div>
      {/* Loading State */}
      {isLoading && (
        <div className='text-center py-8'>
          <p className='text-secondary'>Loading your movie data...</p>
        </div>
      )}
      {/* Ranking Methods */}
      {!isLoading && (
        <div className='mb-12'>
          <h2 className='text-2xl font-bold mb-6 flex items-center gap-3'>
            Ranking Methods
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            {/* Standard Rating */}
            <Card className='p-8 border-2 border-black hover:bg-gray-50 transition-all duration-300'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='p-4 border-2 border-black rounded-xl'>
                  <Star className='w-6 h-6' />
                </div>
                <div>
                  <h3 className='text-xl font-bold'>Standard Rating</h3>
                  <p className='text-sm text-gray-600'>
                    Rate movies one by one
                  </p>
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
                {watchedMoviesData?.data?.length !== 0 && (
                  <Button
                    onClick={handleStartStandardRating}
                    disabled={unratedMovies.length === 0}
                    className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300'>
                    {unratedMovies.length === 0
                      ? 'All Caught Up!'
                      : 'Rate Unrated Movies'}
                  </Button>
                )}

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
                  <BarChart3 className='w-6 h-6' />
                </div>
                <div>
                  <h3 className='text-xl font-bold'>Versus</h3>
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
                className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300 flex items-center justify-center'>
                Start Versus
                <ChevronRight className='w-4 h-4 ml-2' />
              </Button>
            </Card>

            {/* Tiers */}
            <Card className='p-8 border-2 border-black hover:bg-gray-50 transition-all duration-300'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='p-4 border-2 border-black rounded-xl'>
                  <Trophy className='w-6 h-6' />
                </div>
                <div>
                  <h3 className='text-xl font-bold'>Tiers</h3>
                  <p className='text-sm text-gray-600'>
                    Rank your movies into tiers
                  </p>
                </div>
              </div>
              <p className='text-gray-700 mb-6 leading-relaxed'>
                Rank your movies into tiers based on your ratings.
              </p>
              <Button
                onClick={() => navigate('/versus')}
                variant='secondary'
                className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300 flex items-center justify-center'>
                Build Tiers
                <ChevronRight className='w-4 h-4 ml-2' />
              </Button>
            </Card>

            {/* Smart Rankings */}
            <Card className='p-8 border-2 border-black hover:bg-gray-50 transition-all duration-300'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='p-4 border-2 border-black rounded-xl'>
                  <Brain className='w-6 h-6' />
                </div>
                <div>
                  <h3 className='text-xl font-bold'>Smart Rankings</h3>
                  <p className='text-sm text-gray-600'>
                    Rank your movies based on your ratings
                  </p>
                </div>
              </div>
              <p className='text-gray-700 mb-6 leading-relaxed'>
                Rank your movies based on your ratings.
              </p>
              <Button
                onClick={() => navigate('/versus')}
                variant='secondary'
                className='w-full border-2 border-black bg-white text-black hover:bg-black hover:text-white font-semibold py-3 transition-all duration-300 flex items-center justify-center'>
                Start Smart Rankings
                <ChevronRight className='w-4 h-4 ml-2' />
              </Button>
            </Card>
          </div>
        </div>
      )}
      {/* Rating Stats */}
      {!isLoading && ratingStats && (
        <div className='space-y-8'>
          <h2 className='text-2xl font-bold mb-6 flex items-center gap-3'>
            Your Stats
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
        movies={showRankedMovies ? rankedMovies : unratedMovies}
        onRateMovie={handleRateMovie}
      />
    </div>
  );
};

export default Rankings;
