import { Plus, TrendingUp, BarChart3, Star, Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
// import { useAuth } from '@/context/AuthContext';
import {
  useFavoriteMovies,
  useRecentMovies,
} from '@/utils/hooks/supabase/queries/useWatchedMovies';
import { useWatchlistStats } from '@/utils/hooks/supabase/queries/useWatchlist';
// import { useUserStats } from '@/utils/hooks/supabase/queries/useUserStats';
import { useCollectionsWithPreviews } from '@/utils/hooks/supabase/queries/useCollections';
import { useRatingStats } from '@/utils/hooks/supabase/queries/useRanking';

// import { useActiveRankings } from '@/utils/hooks/supabase/queries/useRankings';
import CollectionCard from '@/components/collections/CollectionCard';
import MovieCard from '@/components/movie/MovieCard';
import TopTenMoviesModal from '@/components/features/TopTenMoviesModal';

const Dashboard = () => {
  // const { user } = useAuth();
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);

  // Use the new custom hooks
  // const { data: userStats } = useUserStats();
  const userStats = {
    totalWatched: 100,
    totalRankings: 10,
    totalCollections: 10,
    averageRating: 4.5,
    favoriteGenre: 'Action',
  };
  const { data: favoriteMovies } = useFavoriteMovies(10);
  const { data: recentMovies } = useRecentMovies(5);
  const { data: collections = [], isError: collectionsError } =
    useCollectionsWithPreviews({
      limit: 3,
    });
  const { data: ratingStats } = useRatingStats();

  // const { data: activeRankings } = useActiveRankings(3);
  const activeRankings = [
    {
      id: '1',
      name: 'Top 100 Movies',
      movieCount: 100,
      updated_at: '2024-01-01',
    },
    { id: '2', name: 'Best Sci-Fi', movieCount: 50, updated_at: '2024-01-02' },
    {
      id: '3',
      name: 'Classic Horror',
      movieCount: 30,
      updated_at: '2024-01-03',
    },
  ];
  const { data: watchlistStats } = useWatchlistStats();

  const formatWatchedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Calculate movies watched this month
  const getMoviesThisMonth = () => {
    if (!recentMovies) return 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return recentMovies.filter((item) => {
      const watchDate = new Date(item.watched_date);
      return (
        watchDate.getMonth() === thisMonth &&
        watchDate.getFullYear() === thisYear
      );
    }).length;
  };

  return (
    <div className='mx-auto px-0 py-8'>
      {/* Header with Lounge Title and Actions */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>Your Lounge</h1>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center space-x-3'>
          <Link to='/movies'>
            <button className='flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors'>
              <Plus className='w-4 h-4' />
              <span>Add movie</span>
            </button>
          </Link>
          <Link to='/collections/new'>
            <button className='flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors'>
              <Folder className='w-4 h-4' />
              <span>Add collection</span>
            </button>
          </Link>
          <Link to='/rankings/new'>
            <button className='flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors'>
              <BarChart3 className='w-4 h-4' />
              <span>Create ranking</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className='bg-white border border-gray-200 rounded-lg p-4 mb-8'>
        <div className='flex flex-wrap gap-6 text-sm'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {getMoviesThisMonth()}
            </span>
            <span className='text-gray-500'>movies this month</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {userStats?.totalWatched || 0}
            </span>
            <span className='text-gray-500'>total movies</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {userStats?.totalRankings || 0}
            </span>
            <span className='text-gray-500'>active rankings</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {userStats?.totalCollections || 0}
            </span>
            <span className='text-gray-500'>collections</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {watchlistStats?.total || 0}
            </span>
            <span className='text-gray-500'>watchlist</span>
          </div>
        </div>
      </div>

      {/* Favourite Films and Featured Collections */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        {/* Favourite Films */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
              <Star className='w-5 h-5 mr-2 text-gray-400' />
              Favourite films
            </h2>
            <button
              onClick={() => setIsFavoriteModalOpen(true)}
              className='text-sm text-gray-500 hover:text-gray-700'>
              Edit
            </button>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-2'>
            {favoriteMovies && favoriteMovies.length > 0 ? (
              favoriteMovies
                .slice(0, 10)
                .map((item) => (
                  <MovieCard key={item.movie.id} userMovie={item} />
                ))
            ) : (
              <div className='col-span-full text-center py-8 text-gray-500'>
                <p>No favorite movies yet</p>
                <p className='text-sm mt-1'>
                  Mark movies as favorites to see them here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Collections */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Featured collections
            </h2>
            <Link
              to='/collections'
              className='text-sm text-gray-500 hover:text-gray-700'>
              View all
            </Link>
          </div>

          <div className='grid grid-cols-1 gap-4'>
            {collections && collections.length > 0 ? (
              collections.slice(0, 3).map(
                (
                  collection // No type annotation needed
                ) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onNavigate={() => {}}
                    previewSize='small'
                  />
                )
              )
            ) : (
              <div className='col-span-full text-center py-8 text-gray-500'>
                <p>No collections yet</p>
                <p className='text-sm mt-1'>
                  Create collections to organize your movies
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Recent Activity */}
        <div className='lg:col-span-2'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Recent activity
            </h2>
            <Link
              to='/movies'
              className='text-sm text-gray-500 hover:text-gray-700'>
              View all
            </Link>
          </div>

          <div className='bg-white border border-gray-200 rounded-lg divide-y divide-gray-100'>
            {recentMovies && recentMovies.length > 0 ? (
              recentMovies.map((item) => (
                <Link key={item.movie.id} to={`/movies/${item.movie.id}`}>
                  <div className='p-4 hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          {item.movie.title}
                        </h3>
                        <p className='text-sm text-gray-500 mt-1'>
                          {formatWatchedDate(item.watched_date)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <div className='text-lg font-semibold text-gray-900'>
                          {item.rating ? (item.rating / 2).toFixed(1) : '—'}
                        </div>
                        <div className='text-xs text-gray-500'>/ 5</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className='p-8 text-center text-gray-500'>
                <p>No recent movies</p>
                <p className='text-sm mt-1'>
                  Mark movies as watched to see them here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Rankings */}
        <div>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Active rankings
            </h2>
            <Link
              to='/rankings'
              className='text-sm text-gray-500 hover:text-gray-700'>
              View all
            </Link>
          </div>

          <div className='space-y-3'>
            {activeRankings && activeRankings.length > 0 ? (
              activeRankings.map((ranking) => (
                <Link key={ranking.id} to={`/rankings/${ranking.id}`}>
                  <div className='bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer'>
                    <h3 className='font-medium text-gray-900 mb-2'>
                      {ranking.name}
                    </h3>
                    <div className='flex items-center justify-between text-sm text-gray-500'>
                      <span>{ranking.movieCount} movies</span>
                      <span>{formatWatchedDate(ranking.updated_at)}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className='bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500'>
                <p>No active rankings</p>
                <p className='text-sm mt-1'>Create a ranking to get started</p>
              </div>
            )}
          </div>

          {/* Quick Insights */}
          {userStats && userStats.totalWatched > 0 && (
            <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center space-x-2 mb-2'>
                <TrendingUp className='w-4 h-4 text-gray-400' />
                <h3 className='text-sm font-medium text-gray-900'>Stats</h3>
              </div>
              <p className='text-sm text-gray-600'>
                Average rating: {userStats.averageRating?.toFixed(1) || '0'}/5
              </p>
              {userStats.favoriteGenre && (
                <p className='text-sm text-gray-600 mt-1'>
                  Favorite genre: {userStats.favoriteGenre}
                </p>
              )}
              {watchlistStats && watchlistStats.byPriority.high > 0 && (
                <p className='text-sm text-gray-600 mt-1'>
                  High priority watchlist: {watchlistStats.byPriority.high}
                </p>
              )}
            </div>
          )}

          {/* Rating Progress Bar */}
          {ratingStats && ratingStats.totalWatched > 0 && (
            <div className='mt-6 p-4 bg-white border border-gray-200 rounded-lg'>
              <div className='space-y-3'>
                <div className='flex justify-between items-center'>
                  <h3 className='text-sm font-semibold text-gray-900'>
                    Rating Progress
                  </h3>
                  <span className='text-xs text-gray-500'>
                    {ratingStats.totalRated} of {ratingStats.totalWatched} rated
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${
                        (ratingStats.totalRated / ratingStats.totalWatched) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <p className='text-xs text-gray-500 text-center'>
                  {Math.round(
                    (ratingStats.totalRated / ratingStats.totalWatched) * 100
                  )}
                  % complete
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Ten Movies Modal */}
      <TopTenMoviesModal
        isOpen={isFavoriteModalOpen}
        onClose={() => setIsFavoriteModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
