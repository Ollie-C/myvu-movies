import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ChevronRight, Star, BarChart3, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useUnratedMovies,
  useUpdateRating,
  useRatingStats,
} from '@/utils/hooks/supabase/queries/useRankings';
import StandardRatingModal from '@/components/ranking/StandardRatingModal';
import { useNavigate } from 'react-router-dom';

const Rankings = () => {
  const { user } = useAuth();
  const [isStandardRatingOpen, setIsStandardRatingOpen] = useState(false);
  const navigate = useNavigate();
  // Hooks for ranking functionality
  const { data: unratedMovies = [], isLoading: isLoadingUnrated } =
    useUnratedMovies();
  const { data: ratingStats } = useRatingStats();
  const updateRatingMutation = useUpdateRating();

  const handleStartStandardRating = () => {
    if (unratedMovies.length > 0) {
      setIsStandardRatingOpen(true);
    }
  };

  const handleRateMovie = async (
    movieId: number,
    rating: number,
    notes?: string
  ) => {
    await updateRatingMutation.mutateAsync({ movieId, rating, notes });
  };

  if (!user) {
    return (
      <div className='space-y-8 animate-fade-in'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Rankings</h1>
          <p className='text-secondary mt-2'>
            Please log in to view your rankings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Rankings</h1>
          <p className='text-secondary mt-2'>
            Rate and rank your watched movies
          </p>
        </div>
      </div>

      {/* Rating Stats */}
      {ratingStats && (
        <div className='space-y-6'>
          {/* Main Stats Row */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-blue-500 rounded-lg'>
                  <BarChart3 className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm text-blue-600 font-medium'>
                    Total Watched
                  </p>
                  <p className='text-2xl font-bold text-blue-800'>
                    {ratingStats.totalWatched}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-green-500 rounded-lg'>
                  <Star className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm text-green-600 font-medium'>Rated</p>
                  <p className='text-2xl font-bold text-green-800'>
                    {ratingStats.totalRated}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-yellow-500 rounded-lg'>
                  <Star className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm text-yellow-600 font-medium'>To Rate</p>
                  <p className='text-2xl font-bold text-yellow-800'>
                    {ratingStats.totalUnrated}
                  </p>
                </div>
              </div>
            </Card>

            <Card className='p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-purple-500 rounded-lg'>
                  <BarChart3 className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm text-purple-600 font-medium'>
                    Avg Rating
                  </p>
                  <p className='text-2xl font-bold text-purple-800'>
                    {ratingStats.averageRating}/10
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Progress Bar */}
          {ratingStats.totalWatched > 0 && (
            <Card className='p-6'>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <h3 className='text-lg font-semibold text-primary'>
                    Rating Progress
                  </h3>
                  <span className='text-sm text-secondary'>
                    {ratingStats.totalRated} of {ratingStats.totalWatched} rated
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-3'>
                  <div
                    className='bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300'
                    style={{
                      width: `${
                        (ratingStats.totalRated / ratingStats.totalWatched) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <p className='text-xs text-secondary text-center'>
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

      {/* Standard Rating Section */}
      <div>
        <h2 className='text-xl font-semibold mb-6 text-primary'>
          Rating Methods
        </h2>

        <Card
          className='p-6 hover:bg-surface-hover transition-colors cursor-pointer'
          onClick={handleStartStandardRating}>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-primary/10 rounded-lg'>
                <Star className='w-6 h-6 text-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>Standard Rating</h3>
                <p className='text-secondary text-sm'>
                  Rate your unrated movies one by one
                </p>
                {unratedMovies.length > 0 && (
                  <p className='text-sm text-primary mt-1'>
                    {unratedMovies.length} movie
                    {unratedMovies.length !== 1 ? 's' : ''} to rate
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center gap-4'>
              {unratedMovies.length > 0 ? (
                <Button size='sm' className='flex items-center gap-2'>
                  Start Rating
                  <ChevronRight className='w-4 h-4' />
                </Button>
              ) : (
                <div className='text-sm text-secondary'>All caught up!</div>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-primary/10 rounded-lg'>
                <Zap className='w-6 h-6 text-primary' />
              </div>
              <div>
                <h3 className='text-lg font-semibold'>Versus Rating</h3>
                <p className='text-secondary text-sm'>
                  Rate your movies against each other
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              {unratedMovies.length > 0 ? (
                <Button
                  size='sm'
                  className='flex items-center gap-2'
                  onClick={() => navigate('/versus')}>
                  Start Versus Rating
                  <ChevronRight className='w-4 h-4' />
                </Button>
              ) : (
                <div className='text-sm text-secondary'>All caught up!</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Rating Distribution */}
      {ratingStats && ratingStats.totalRated > 0 && (
        <div>
          <h2 className='text-xl font-semibold mb-4 text-primary'>
            Rating Distribution
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Object.entries(ratingStats.ratingDistribution).map(
              ([range, count]) => (
                <Card key={range} className='p-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-secondary'>{range}</span>
                    <span className='font-semibold'>{count}</span>
                  </div>
                  {count > 0 && (
                    <div className='mt-2'>
                      <div className='h-2 bg-surface-hover rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-primary rounded-full transition-all'
                          style={{
                            width: `${(count / ratingStats.totalRated) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              )
            )}
          </div>
        </div>
      )}

      {/* Standard Rating Modal */}
      <StandardRatingModal
        isOpen={isStandardRatingOpen}
        onClose={() => setIsStandardRatingOpen(false)}
        movies={unratedMovies}
        onRateMovie={handleRateMovie}
      />
    </div>
  );
};

export default Rankings;
