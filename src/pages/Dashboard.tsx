// Audited: 2025-08-05
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, BarChart3, Folder } from 'lucide-react';

// Contexts
import { useAuth } from '@/context/AuthContext';

// Hooks
import {
  useFavoriteMovies,
  useRecentMovies,
} from '@/utils/hooks/supabase/useWatchedMovies';
import { useRecentActivity } from '@/utils/hooks/supabase/useUserActivity';
import { useWatchlistStats } from '@/utils/hooks/supabase/useWatchlist';
import { useCollectionsWithPreviews } from '@/utils/hooks/supabase/useCollections';
import { useUserStats } from '@/utils/hooks/supabase/useUserStats';

// Components
import CollectionCard from '@/components/collections/CollectionCard';
import MovieCard from '@/components/movie/MovieCard/MovieCard';
import TopTenMoviesModal from '@/components/features/TopTenMoviesModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false);

  const { data: userStats, isLoading: userStatsLoading } = useUserStats();
  const { data: favoriteMovies } = useFavoriteMovies(10);
  const { data: recentMovies } = useRecentMovies(5);
  const { data: activities = [] } = useRecentActivity(10);
  const { data: collections = [], isLoading: collectionsLoading } =
    useCollectionsWithPreviews(3);
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

  if (userStatsLoading || collectionsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='mx-auto px-0 py-8'>
      {/* Header with Lounge Title and Actions */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900'>Lounge</h1>
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
              {userStatsLoading ? '...' : userStats?.moviesThisMonth || 0}
            </span>
            <span className='text-gray-500'>movies this month</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {userStatsLoading ? '...' : userStats?.totalWatched || 0}
            </span>
            <span className='text-gray-500'>total movies</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {userStatsLoading ? '...' : userStats?.totalRankings || 0}
            </span>
            <span className='text-gray-500'>active rankings</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-gray-900'>
              {userStatsLoading ? '...' : userStats?.totalCollections || 0}
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
              Top Ten
            </h2>
            <button
              onClick={() => setIsFavoriteModalOpen(true)}
              className='text-sm text-gray-500 hover:text-gray-700'>
              Edit
            </button>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5  2xl:grid-cols-5 gap-2'>
            {favoriteMovies && favoriteMovies.length > 0 ? (
              favoriteMovies
                .slice(0, 10)
                .map((item) => (
                  <MovieCard key={item.movie_uuid} userMovie={item} />
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
              to='/activity'
              className='text-sm text-gray-500 hover:text-gray-700'>
              View all
            </Link>
          </div>

          <div className='bg-white border border-gray-200 rounded-lg divide-y divide-gray-100'>
            {activities.length > 0 ? (
              activities.map((act) => {
                const link = act.movie?.tmdb_id
                  ? `/movies/${act.movie.tmdb_id}`
                  : act.collection_id
                  ? `/collections/${act.collection_id}`
                  : '#';
                const label = (() => {
                  switch (act.type) {
                    case 'watched_added':
                      return (
                        <>
                          <strong className='font-semibold'>
                            {act.movie?.title || 'Movie'}
                          </strong>{' '}
                          was marked as watched
                        </>
                      );
                    case 'watched_removed':
                      return (
                        <>
                          <strong className='font-semibold'>
                            {act.movie?.title || 'Movie'}
                          </strong>{' '}
                          was unmarked as watched
                        </>
                      );
                    case 'rated_movie':
                      return (
                        <>
                          You rated{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'movie'}
                          </strong>{' '}
                          {String((act.metadata as any)?.rating ?? '')}/10
                        </>
                      );
                    case 'favorite_added':
                      return (
                        <>
                          You added{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'movie'}
                          </strong>{' '}
                          to your Top 10
                        </>
                      );
                    case 'favorite_removed':
                      return (
                        <>
                          You removed{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'movie'}
                          </strong>{' '}
                          from your Top 10
                        </>
                      );
                    case 'notes_updated':
                      return (
                        <>
                          You updated notes for{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'an item'}
                          </strong>
                        </>
                      );
                    case 'watchlist_added':
                      return (
                        <>
                          <strong className='font-semibold'>
                            {act.movie?.title || 'Movie'}
                          </strong>{' '}
                          was added to your watchlist
                        </>
                      );
                    case 'watchlist_removed':
                      return (
                        <>
                          <strong className='font-semibold'>
                            {act.movie?.title || 'Movie'}
                          </strong>{' '}
                          was removed from your watchlist
                        </>
                      );
                    case 'watchlist_priority_updated':
                      return (
                        <>
                          You updated watchlist priority for{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'movie'}
                          </strong>
                        </>
                      );
                    case 'collection_created':
                      return (
                        <>
                          You created a collection: '
                          <span className='font-semibold'>
                            {act.collection?.name || 'collection'}
                          </span>
                          '
                        </>
                      );
                    case 'collection_updated':
                      return (
                        <>
                          You updated the collection: '
                          <span className='font-semibold'>
                            {act.collection?.name || 'collection'}
                          </span>
                          '
                        </>
                      );
                    case 'collection_movie_added':
                      return (
                        <>
                          You added{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'movie'}
                          </strong>{' '}
                          to '
                          <span className='font-semibold'>
                            {act.collection?.name || 'collection'}
                          </span>
                          '
                        </>
                      );
                    case 'collection_movie_removed':
                      return (
                        <>
                          You removed{' '}
                          <strong className='font-semibold'>
                            {act.movie?.title || 'movie'}
                          </strong>{' '}
                          from '
                          <span className='font-semibold'>
                            {act.collection?.name || 'collection'}
                          </span>
                          '
                        </>
                      );
                    case 'ranking_battle':
                      return <>You completed a Versus battle</>;
                    case 'top_ten_changed':
                      return <>You updated your Top 10</>;
                    default:
                      return 'Activity';
                  }
                })();

                return (
                  <Link key={act.id} to={link}>
                    <div className='p-4 hover:bg-gray-50 transition-colors'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-medium text-gray-900'>{label}</h3>
                          <p className='text-sm text-gray-500 mt-1'>
                            {formatWatchedDate(act.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className='p-8 text-center text-gray-500'>
                <p>No recent activity</p>
                <p className='text-sm mt-1'>Your actions will show up here.</p>
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
            {/* No active rankings data available in useUserStats, so this section is empty */}
            <div className='bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500'>
              <p>No active rankings</p>
              <p className='text-sm mt-1'>Create a ranking to get started</p>
            </div>
          </div>

          {/* Quick Insights */}
          {userStats && userStats.totalWatched > 0 && (
            <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center space-x-2 mb-2'>
                <TrendingUp className='w-4 h-4 text-gray-400' />
                <h3 className='text-sm font-medium text-gray-900'>Stats</h3>
              </div>
              <p className='text-sm text-gray-600'>
                Average rating:{' '}
                {userStatsLoading
                  ? '...'
                  : userStats.averageRating?.toFixed(1) || '0'}
                /10
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
