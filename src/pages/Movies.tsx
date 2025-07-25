import { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { movieService, type UserMovie } from '@/services/movie.service';
import MovieCard from '@/components/common/MovieCard';

const Movies = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showWatchlist, setShowWatchlist] = useState(false);
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: moviesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'user-movies-infinite',
      user?.id,
      showWatchlist ? 'watchlist' : 'watched',
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!user?.id) throw new Error('User not authenticated');

      return movieService.getUserMovies(user.id, {
        filter: showWatchlist ? 'watchlist' : 'watched',
        sortOrder: 'desc',
        page: pageParam as number,
        limit: 24, // Smaller page size for better infinite scroll
      });
    },
    getNextPageParam: (
      lastPage: { data: UserMovie[]; count: number | null },
      allPages
    ) => {
      const totalCount = lastPage.count || 0;
      const currentCount = allPages.reduce(
        (acc, page) => acc + page.data.length,
        0
      );
      return currentCount < totalCount ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

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
      await movieService.toggleWatched(user.id, movieId, false);
      // Invalidate and refetch the movies query
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id],
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
      await movieService.toggleWatchlist(user.id, movieId, false);
      // Invalidate and refetch the movies query
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id],
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
      await movieService.toggleWatched(user.id, movieId, true);
      // Invalidate and refetch the movies query
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id],
      });
      showToast('success', 'Movie marked as watched');
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      showToast('error', 'Failed to mark movie as watched');
    }
  };

  const SkeletonCard = () => (
    <div className='flex-shrink-0 w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] xl:w-[calc(20%-0.8rem)] 2xl:w-[calc(16.666%-0.833rem)]'>
      <div className='relative overflow-hidden rounded-2xl bg-slate-800 animate-pulse'>
        <div className='aspect-[2/3] bg-slate-700' />
        <div className='absolute bottom-0 left-0 right-0 p-4'>
          <div className='h-5 bg-slate-700 rounded w-3/4 mb-2' />
          <div className='h-4 bg-slate-700 rounded w-1/2' />
        </div>
      </div>
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
        <div className='w-full'>
          <div className='flex flex-wrap gap-4'>
            {[...Array(12)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
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
        <div className='w-full'>
          <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2'>
            {userMovies.map((userMovie, index) => {
              // Add ref to the last element for infinite scroll
              if (index === userMovies.length - 1) {
                return (
                  <div key={userMovie.movie.id} ref={lastElementRef}>
                    <MovieCard
                      userMovie={userMovie}
                      onRemoveFromWatched={handleRemoveFromWatched}
                      onRemoveFromWatchlist={handleRemoveFromWatchlist}
                      onMarkAsWatched={handleMarkAsWatched}
                      isWatchlistView={showWatchlist}
                    />
                  </div>
                );
              }

              return (
                <MovieCard
                  key={userMovie.movie.id}
                  userMovie={userMovie}
                  onRemoveFromWatched={handleRemoveFromWatched}
                  onRemoveFromWatchlist={handleRemoveFromWatchlist}
                  onMarkAsWatched={handleMarkAsWatched}
                  isWatchlistView={showWatchlist}
                />
              );
            })}
          </div>

          {/* Loading indicator for next page */}
          {isFetchingNextPage && (
            <div className='flex justify-center mt-8'>
              <div className='flex flex-wrap gap-4'>
                {[...Array(6)].map((_, index) => (
                  <SkeletonCard key={`loading-${index}`} />
                ))}
              </div>
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
        </div>
      )}
    </div>
  );
};

export default Movies;
