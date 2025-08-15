import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import {
  Star,
  BarChart3,
  ChevronRight,
  Zap,
  Trophy,
  Brain,
} from 'lucide-react';

// Components
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import AdvancedRatingModal from '@/components/movie/AdvancedRatingModal';

// Contexts
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Services
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';

// Updated hooks
import { useRankedMovies } from '@/utils/hooks/supabase/queries/useRanking';
import { useWatchedMovies } from '@/utils/hooks/supabase/queries/useWatchedMovies';
import { useUpdateRating } from '@/utils/hooks/supabase/mutations/useWatchedMovieMutations';
import { useMovieStore } from '@/stores/useMovieStore';

// Nivo Chart
import { ResponsivePie } from '@nivo/pie';

type RankingMethod = 'standard' | 'versus' | 'tiers' | 'smart';

const Rankings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isStandardRatingOpen, setIsStandardRatingOpen] = useState(false);
  const [showRankedMovies, setShowRankedMovies] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<RankingMethod | null>(
    null
  );

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

  // Convert distribution to Nivo chart data
  const chartData = ratingStats?.distribution
    ? Object.entries(ratingStats.distribution)
        .filter(([_, count]) => count > 0)
        .map(([range, count]) => ({
          id: range,
          label: `${range} stars`,
          value: count,
          color: getRatingColor(range),
        }))
    : [];

  // Helper function to get colors for rating ranges
  function getRatingColor(range: string) {
    const colors = {
      '1-2': '#ef4444', // red
      '3-4': '#f97316', // orange
      '5-6': '#eab308', // yellow
      '7-8': '#22c55e', // green
      '9-10': '#3b82f6', // blue
    };
    return colors[range as keyof typeof colors] || '#6b7280';
  }

  const handleStartStandardRating = () => {
    setIsStandardRatingOpen(true);
    setShowRankedMovies(false);
  };

  const updateRatingMutation = useUpdateRating();
  const { setMovieState } = useMovieStore();

  const handleRateMovie = async (
    movieId: number,
    rating: number,
    notes?: string
  ) => {
    if (!user?.id) return;

    try {
      // Update Zustand for instant UI feedback
      setMovieState(movieId, {
        isWatched: true,
        rating: rating,
      });

      // Use the mutation instead of direct service call
      await updateRatingMutation.mutateAsync({
        movie: { movieId, tmdbId: movieId },
        rating,
        isWatched: true,
      });

      // Update notes if provided
      if (notes) {
        await watchedMoviesService.updateNotes(user.id, movieId, notes);
      }

      showToast('success', 'Movie rated successfully!');
    } catch (error) {
      showToast('error', 'Failed to rate movie');
      // Revert Zustand on error
      setMovieState(movieId, {
        isWatched: false,
        rating: undefined,
      });
    }
  };

  const handleMethodSelect = (method: RankingMethod) => {
    setSelectedMethod(selectedMethod === method ? null : method);
  };

  const handleStartMethod = () => {
    if (!selectedMethod) return;

    switch (selectedMethod) {
      case 'standard':
        handleStartStandardRating();
        break;
      case 'versus':
        navigate('/versus');
        break;
      case 'tiers':
        navigate('/versus'); // TODO: Update when tiers route is available
        break;
      case 'smart':
        navigate('/versus'); // TODO: Update when smart rankings route is available
        break;
    }
  };

  const isLoading = watchedLoading || rankedLoading;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Hero Section */}
      <div className='text-left mb-12'>
        <div className='inline-flex items-center gap-3 mb-4'>
          <h1 className='text-4xl font-bold'>Arena</h1>
        </div>
        <p className='text-sm text-gray-600 max-w-2xl ml-0'>
          Rate and rank your movies
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='text-center py-8'>
          <p className='text-secondary'>Loading your movie data...</p>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      {!isLoading && (
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Left Column - Stats */}
          <div className='lg:w-1/2'>
            {/* Compact Stats List */}
            <div className='space-y-2 mb-8'>
              <div className='flex items-center justify-between p-2 px-0 bg-gray-50 rounded-lg border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <span className='font-medium'>Total Watched</span>
                </div>
                <span className='text-2xl font-bold'>
                  {ratingStats?.totalWatched || 0}
                </span>
              </div>

              <div className='flex items-center justify-between p-2 px-0 bg-gray-50 rounded-lg border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <span className='font-medium'>Average Rating</span>
                </div>
                <span className='text-2xl font-bold'>
                  {ratingStats?.averageRating.toFixed(1) || '0.0'}
                </span>
              </div>

              <div className='flex items-center justify-between p-2 px-0 bg-gray-50 rounded-lg border-b border-gray-200'>
                <div className='flex items-center gap-3'>
                  <span className='font-medium'>Progress</span>
                </div>
                <div className='w-full border-2 border-gray-300 rounded-full h-4 overflow-hidden max-w-[50%]'>
                  {ratingStats && ratingStats.totalWatched > 0 && (
                    <div
                      className='bg-black h-4 transition-all duration-500'
                      style={{
                        width: `${
                          (ratingStats.totalRated / ratingStats.totalWatched) *
                          100
                        }%`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}

            {/* Rating Distribution Chart */}
            {ratingStats && ratingStats.totalRated > 0 && (
              <div className='mb-8'>
                <Card className='p-6 border-2 border-transparent'>
                  <div className='h-64'>
                    <ResponsivePie
                      data={chartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={{ scheme: 'nivo' }}
                      borderWidth={1}
                      borderColor={{
                        from: 'color',
                        modifiers: [['darker', 0.2]],
                      }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor='#333333'
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{
                        from: 'color',
                        modifiers: [['darker', 2]],
                      }}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 56,
                          itemsSpacing: 0,
                          itemWidth: 100,
                          itemHeight: 18,
                          itemTextColor: '#999',
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 18,
                          symbolShape: 'circle',
                        },
                      ]}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column - Ranking Methods */}
          <div className='lg:w-1/2'>
            <h2 className='text-2xl font-bold mb-6 flex items-center gap-3'>
              Start a new ranking
            </h2>

            <div className='space-y-4 grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Standard Rating */}
              <Card
                className={`p-6 border-2 transition-all duration-300 cursor-pointer h-full ${
                  selectedMethod === 'standard'
                    ? 'border-black bg-black text-white'
                    : 'border-black hover:bg-gray-50'
                }`}
                onClick={() => handleMethodSelect('standard')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border-2 rounded-xl ${
                      selectedMethod === 'standard'
                        ? 'border-white bg-white text-black'
                        : 'border-black'
                    }`}>
                    <Star className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold'>Standard Rating</h3>
                    <p
                      className={`text-sm ${
                        selectedMethod === 'standard'
                          ? 'text-gray-200'
                          : 'text-gray-600'
                      }`}>
                      Rate movies one by one
                    </p>
                  </div>
                </div>
              </Card>

              {/* Versus Rating */}
              <Card
                className={`p-6 border-2 transition-all duration-300 cursor-pointer h-full ${
                  selectedMethod === 'versus'
                    ? 'border-black bg-black text-white'
                    : 'border-black hover:bg-gray-50'
                }`}
                onClick={() => handleMethodSelect('versus')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border-2 rounded-xl ${
                      selectedMethod === 'versus'
                        ? 'border-white bg-white text-black'
                        : 'border-black'
                    }`}>
                    <BarChart3 className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold'>Versus</h3>
                    <p
                      className={`text-sm ${
                        selectedMethod === 'versus'
                          ? 'text-gray-200'
                          : 'text-gray-600'
                      }`}>
                      Head-to-head comparisons
                    </p>
                  </div>
                </div>
              </Card>

              {/* Tiers */}
              <Card
                className={`p-6 border-2 transition-all duration-300 cursor-pointer h-full ${
                  selectedMethod === 'tiers'
                    ? 'border-black bg-black text-white'
                    : 'border-black hover:bg-gray-50'
                }`}
                onClick={() => handleMethodSelect('tiers')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border-2 rounded-xl ${
                      selectedMethod === 'tiers'
                        ? 'border-white bg-white text-black'
                        : 'border-black'
                    }`}>
                    <Trophy className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold'>Tiers</h3>
                    <p
                      className={`text-sm ${
                        selectedMethod === 'tiers'
                          ? 'text-gray-200'
                          : 'text-gray-600'
                      }`}>
                      Rank your movies into tiers
                    </p>
                  </div>
                </div>
              </Card>

              {/* Smart Rankings */}
              <Card
                className={`p-6 border-2 transition-all duration-300 cursor-pointer h-full ${
                  selectedMethod === 'smart'
                    ? 'border-black bg-black text-white'
                    : 'border-black hover:bg-gray-50'
                }`}
                onClick={() => handleMethodSelect('smart')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border-2 rounded-xl ${
                      selectedMethod === 'smart'
                        ? 'border-white bg-white text-black'
                        : 'border-black'
                    }`}>
                    <Brain className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-bold'>Smart Rankings</h3>
                    <p
                      className={`text-sm ${
                        selectedMethod === 'smart'
                          ? 'text-gray-200'
                          : 'text-gray-600'
                      }`}>
                      Rank your movies based on your ratings
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            {/* Start Button - Only shown when a method is selected */}
            {selectedMethod && (
              <div className='mt-6'>
                <Button
                  onClick={handleStartMethod}
                  className='w-full border-2 border-black bg-black text-white hover:bg-white hover:text-black font-semibold py-4 text-lg transition-all duration-300'>
                  Start{' '}
                  {selectedMethod === 'standard'
                    ? 'Standard Rating'
                    : selectedMethod === 'versus'
                    ? 'Versus'
                    : selectedMethod === 'tiers'
                    ? 'Tiers'
                    : 'Smart Rankings'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Rating Modal */}
      <AdvancedRatingModal
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
