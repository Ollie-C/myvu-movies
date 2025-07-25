import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import MovieCard from '@/components/common/MovieCard';
import type { WatchedMovie } from '@/schemas/watched-movie.schema';
import type { Watchlist } from '@/schemas/watchlist.schema';
import { useWatchlistInfinite } from '@/utils/hooks/supabase/queries/useWatchlist';
import { useWatchedMoviesInfinite } from '@/utils/hooks/supabase/queries/useWatchedMovies';

// Union type for both movie types
type UserMovie = WatchedMovie | Watchlist;

const Movies = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showWatchlist, setShowWatchlist] = useState(false);
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const watchedQuery = useWatchedMoviesInfinite({
    sortBy: 'watched_date',
    sortOrder: 'desc',
    limit: 24,
  });

  const watchlistQuery = useWatchlistInfinite({
    sortBy: 'priority',
    sortOrder: 'asc',
    limit: 24,
  });

  const {
    data: moviesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = showWatchlist ? watchlistQuery : watchedQuery;

  // Flatten all pages into a single array
  const userMovies = moviesData?.pages.flatMap((page) => page.data) || [];

  // Intersection Observer for infinite scroll
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Handle removing movie from watched list
  const handleRemoveFromWatched = async (movieId: number) => {
    if (!user?.id) return;

    try {
      await watchedMoviesService.removeWatched(user.id, movieId);
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id, 'watched'],
      });
      showToast('success', 'Movie removed from watched list');
    } catch (error) {
      console.error('Error removing movie from watched:', error);
      showToast('error', 'Failed to remove movie from watched list');
    }
  };

  // Handle removing movie from watchlist
  const handleRemoveFromWatchlist = async (movieId: number) => {
    if (!user?.id) return;

    try {
      await watchlistService.removeFromWatchlist(user.id, movieId);
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id, 'watchlist'],
      });
      showToast('success', 'Movie removed from watchlist');
    } catch (error) {
      console.error('Error removing movie from watchlist:', error);
      showToast('error', 'Failed to remove movie from watchlist');
    }
  };

  // Handle marking watchlist movie as watched
  const handleMarkAsWatched = async (movieId: number) => {
    if (!user?.id) return;

    try {
      // Add to watched movies
      await watchedMoviesService.markAsWatched(user.id, movieId);
      // Remove from watchlist
      await watchlistService.removeFromWatchlist(user.id, movieId);

      // Invalidate both queries
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id],
      });
      showToast('success', 'Movie marked as watched');
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      showToast('error', 'Failed to mark movie as watched');
    }
  };

  // Type guard to check if item is from watchlist
  const isWatchlistItem = (item: UserMovie): item is Watchlist => {
    return 'priority' in item;
  };

  const SkeletonCard = () => (
    <div className='animate-pulse'>
      <div className='aspect-[2/3] bg-slate-700 rounded-lg' />
    </div>
  );

  if (!user) {
    return (
      <div className='space-y-8 animate-fade-in'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Your Movies</h1>
          <p className='text-secondary mt-2'>
            Please log in to view your movies
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>
            {showWatchlist ? 'Your Watchlist' : 'Your Movies'}
          </h1>
          {userMovies.length > 0 && (
            <p className='text-secondary mt-1'>
              {userMovies.length}{' '}
              {showWatchlist ? 'movies in watchlist' : 'watched movies'}
            </p>
          )}
        </div>

        {/* View Toggle */}
        <Button
          variant='secondary'
          size='sm'
          onClick={() => setShowWatchlist(!showWatchlist)}>
          {showWatchlist ? 'View Watched' : 'View Watchlist'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2'>
          {[...Array(24)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className='p-8 text-center'>
          <p className='text-secondary'>
            Error loading movies:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && userMovies.length === 0 && (
        <Card className='p-12 text-center'>
          <h3 className='text-lg font-semibold mb-2'>
            {showWatchlist
              ? 'No movies in your watchlist yet'
              : 'No watched movies yet'}
          </h3>
          <p className='text-secondary mb-6'>
            {showWatchlist
              ? 'Add movies to your watchlist to keep track of what you want to watch.'
              : 'Mark movies as watched to see them here.'}
          </p>
          <Button>Discover Movies</Button>
        </Card>
      )}

      {/* Movies Grid */}
      {!isLoading && !error && userMovies.length > 0 && (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2'>
            {userMovies.map((userMovie, index) => {
              const isLastElement = index === userMovies.length - 1;

              return (
                <div
                  key={userMovie.movie.id}
                  ref={isLastElement ? lastElementRef : null}>
                  <MovieCard
                    userMovie={userMovie}
                    onRemoveFromWatched={
                      !isWatchlistItem(userMovie)
                        ? handleRemoveFromWatched
                        : undefined
                    }
                    onRemoveFromWatchlist={
                      isWatchlistItem(userMovie)
                        ? handleRemoveFromWatchlist
                        : undefined
                    }
                    onMarkAsWatched={
                      isWatchlistItem(userMovie)
                        ? handleMarkAsWatched
                        : undefined
                    }
                    isWatchlistView={showWatchlist}
                  />
                </div>
              );
            })}
          </div>

          {/* Loading indicator for next page */}
          {isFetchingNextPage && (
            <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 mt-4'>
              {[...Array(12)].map((_, index) => (
                <SkeletonCard key={`loading-${index}`} />
              ))}
            </div>
          )}

          {/* End of results indicator */}
          {!hasNextPage && userMovies.length > 0 && (
            <div className='text-center mt-8 py-4'>
              <p className='text-secondary text-sm'>
                You've reached the end of your{' '}
                {showWatchlist ? 'watchlist' : 'watched movies'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Movies;
