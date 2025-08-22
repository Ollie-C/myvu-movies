import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import {
  Star,
  BarChart3,
  Trophy,
  Brain,
  Edit3,
  Check,
  X,
  Trash2,
} from 'lucide-react';

// Components
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import AdvancedRatingModal from '@/components/movie/AdvancedRatingModal';

// Contexts
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Mutation hooks
import {
  useUpdateRankingListName,
  useDeleteRankingList,
  useConvertRankingToCollection,
} from '@/utils/hooks/supabase/mutations/useRankingMutations';
import { useUpdateWatchedMovieNotes } from '@/utils/hooks/supabase/mutations/useWatchedMovieMutations';

// Updated hooks
import {
  useRankedMovies,
  useUserRankingLists,
} from '@/utils/hooks/supabase/queries/useRanking';
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
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

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
  const { data: allRankingLists = [], refetch: refetchRankingLists } =
    useUserRankingLists({
      onlyActive: false,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    });

  // Separate active and completed rankings
  const activeRankings = allRankingLists.filter(
    (list: any) => list.status === 'active' || list.status === 'paused'
  );
  const completedRankings = allRankingLists.filter(
    (list: any) => list.status === 'completed'
  );

  console.log(completedRankings);

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
  const updateWatchedMovieNotesMutation = useUpdateWatchedMovieNotes();
  const updateRankingListNameMutation = useUpdateRankingListName();
  const deleteRankingListMutation = useDeleteRankingList();
  const convertRankingToCollectionMutation = useConvertRankingToCollection();
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
        await updateWatchedMovieNotesMutation.mutateAsync({
          movieId,
          notes,
        });
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

  const handleEditName = (listId: string, currentName: string) => {
    setEditingListId(listId);
    setEditingName(currentName);
  };

  const handleSaveName = async (listId: string) => {
    if (!editingName.trim()) return;

    try {
      await updateRankingListNameMutation.mutateAsync({
        listId,
        name: editingName.trim(),
      });
      await refetchRankingLists();
      showToast('success', 'Ranking name updated successfully!');
      setEditingListId(null);
      setEditingName('');
    } catch (error) {
      showToast('error', 'Failed to update ranking name');
    }
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditingName('');
  };

  const handleConvertToCollection = async (rankingListId: string) => {
    try {
      const { newCollectionId } =
        await convertRankingToCollectionMutation.mutateAsync(rankingListId);

      showToast('success', 'Ranking converted into a collection!');
      navigate(`/collections/${newCollectionId}`);
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to convert ranking into collection.');
    }
  };

  const handleDeleteRanking = async (listId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this ranking? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeletingListId(listId);
    try {
      await deleteRankingListMutation.mutateAsync(listId);
      await refetchRankingLists();
      showToast('success', 'Ranking deleted successfully!');
    } catch (error) {
      showToast('error', 'Failed to delete ranking');
    } finally {
      setDeletingListId(null);
    }
  };

  const isLoading = watchedLoading || rankedLoading;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Hero Section */}
      <div className='text-left mb-8'>
        <div className='inline-flex items-center gap-3 mb-2'>
          <h1 className='text-2xl font-semibold text-gray-900'>Arena</h1>
        </div>
        <p className='text-sm text-gray-600 max-w-2xl ml-0'>
          Rate and rank your movies using different methods
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
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Left Column - Stats */}
          <div className='lg:w-1/2'>
            {/* Compact Stats List */}
            <div className='space-y-2 mb-6'>
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
                <Card className='p-6 border border-gray-200 rounded-lg'>
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
          <div className='lg:w-full'>
            <h2 className='text-lg font-semibold mb-4'>Start a new ranking</h2>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4'>
              {/* Standard Rating */}
              <Card
                className={`p-5 border transition-all duration-200 cursor-pointer h-full ${
                  selectedMethod === 'standard'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMethodSelect('standard')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border rounded-xl ${
                      selectedMethod === 'standard'
                        ? 'border-white bg-white text-black'
                        : 'border-gray-200'
                    }`}>
                    <Star className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-base font-semibold'>Standard Rating</h3>
                    <p
                      className={`text-xs ${
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
                className={`p-5 border transition-all duration-200 cursor-pointer h-full ${
                  selectedMethod === 'versus'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMethodSelect('versus')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border rounded-xl ${
                      selectedMethod === 'versus'
                        ? 'border-white bg-white text-black'
                        : 'border-gray-200'
                    }`}>
                    <BarChart3 className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-base font-semibold'>Versus</h3>
                    <p
                      className={`text-xs ${
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
                className={`p-5 border transition-all duration-200 cursor-pointer h-full ${
                  selectedMethod === 'tiers'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMethodSelect('tiers')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border rounded-xl ${
                      selectedMethod === 'tiers'
                        ? 'border-white bg-white text-black'
                        : 'border-gray-200'
                    }`}>
                    <Trophy className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-base font-semibold'>Tiers</h3>
                    <p
                      className={`text-xs ${
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
                className={`p-5 border transition-all duration-200 cursor-pointer h-full ${
                  selectedMethod === 'smart'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMethodSelect('smart')}>
                <div className='flex flex-col items-start gap-4 mb-4'>
                  <div
                    className={`p-3 border rounded-xl ${
                      selectedMethod === 'smart'
                        ? 'border-white bg-white text-black'
                        : 'border-gray-200'
                    }`}>
                    <Brain className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='text-base font-semibold'>Smart Rankings</h3>
                    <p
                      className={`text-xs ${
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
            {/* Start Button */}
            {selectedMethod && (
              <div className='mt-6'>
                <Button
                  onClick={handleStartMethod}
                  className='w-full border border-gray-900 bg-gray-900 text-white hover:bg-white hover:text-gray-900 font-semibold py-3 text-sm transition-all duration-200 rounded-lg'>
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
            {!selectedMethod && (
              <p className='text-xs text-gray-500 mt-2'>
                Select a method to begin
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rankings Sections */}
      <div className='mt-10 space-y-8'>
        {/* Active Rankings */}
        <div>
          <h2 className='text-lg font-semibold mb-4'>Active rankings</h2>
          {activeRankings.length === 0 ? (
            <div className='border border-gray-200 rounded-lg p-6 text-gray-500 text-sm'>
              No active rankings. Start a new ranking above to get started.
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {activeRankings.map((list: any) => (
                <div
                  key={list.id}
                  className='border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <div className='text-sm text-gray-500'>
                          {String(list.ranking_method).toUpperCase()}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${
                            list.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {list.status}
                        </div>
                      </div>
                      <div className='flex items-center gap-2 mt-1'>
                        {editingListId === list.id ? (
                          <div className='flex items-center gap-2 flex-1'>
                            <input
                              type='text'
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className='text-base font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 flex-1'
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(list.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveName(list.id)}
                              className='text-green-600 hover:text-green-700'>
                              <Check className='w-4 h-4' />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className='text-red-600 hover:text-red-700'>
                              <X className='w-4 h-4' />
                            </button>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 flex-1'>
                            <div className='text-base font-semibold text-gray-900 flex-1'>
                              {list.name}
                            </div>
                            <button
                              onClick={() => handleEditName(list.id, list.name)}
                              className='text-gray-400 hover:text-gray-600'>
                              <Edit3 className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDeleteRanking(list.id)}
                              disabled={deletingListId === list.id}
                              className='text-gray-400 hover:text-red-600 disabled:opacity-50'>
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='text-sm text-gray-600 ml-4'>
                      {list._count?.ranking_list_items || 0} items
                    </div>
                  </div>
                  <div className='mt-3 flex items-center gap-2'>
                    <Button
                      onClick={() => navigate('/versus')}
                      className='h-9 px-3 text-sm'>
                      Continue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Rankings */}
        {completedRankings.length > 0 && (
          <div>
            <h2 className='text-lg font-semibold mb-4'>Completed rankings</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {completedRankings.map((list: any) => (
                <div
                  key={list.id}
                  className='border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors opacity-75'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <div className='text-sm text-gray-500'>
                          {String(list.ranking_method).toUpperCase()}
                        </div>
                        <div className='text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600'>
                          completed
                        </div>
                      </div>

                      <div className='flex items-center gap-2 mt-1'>
                        {editingListId === list.id ? (
                          <div className='flex items-center gap-2 flex-1'>
                            <input
                              type='text'
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className='text-base font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 flex-1'
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(list.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveName(list.id)}
                              className='text-green-600 hover:text-green-700'>
                              <Check className='w-4 h-4' />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className='text-red-600 hover:text-red-700'>
                              <X className='w-4 h-4' />
                            </button>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 flex-1'>
                            <div className='text-base font-semibold text-gray-900 flex-1'>
                              {list.name}
                            </div>
                            <button
                              onClick={() => handleEditName(list.id, list.name)}
                              className='text-gray-400 hover:text-gray-600'>
                              <Edit3 className='w-4 h-4' />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='text-sm text-gray-600 ml-4'>
                      {list._count?.ranking_list_items || 0} items
                    </div>
                  </div>
                  <div className='mt-3 flex items-center gap-2'>
                    <Button
                      onClick={() => navigate('/versus')}
                      className='h-9 px-3 text-sm'
                      variant='secondary'>
                      View Results
                    </Button>
                    <div className='mt-3 flex items-center gap-2'>
                      {0 !== list.collections?.length ? (
                        <Button
                          onClick={() =>
                            navigate(`/collections/${list.collections[0].id}`)
                          }
                          className='h-9 px-3 text-sm'
                          variant='secondary'>
                          View Collection
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConvertToCollection(list.id)}
                          className='h-9 px-3 text-sm'>
                          Convert to Collection
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeRankings.length === 0 && completedRankings.length === 0 && (
          <div className='border border-gray-200 rounded-lg p-6 text-gray-500 text-sm'>
            You have no rankings yet. Create one above to get started.
          </div>
        )}
      </div>

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
