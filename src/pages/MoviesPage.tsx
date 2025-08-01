import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Components
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import MovieCard from '@/components/movie/MovieCard';

// Contexts
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Schemas
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';
import type { WatchlistWithMovie } from '@/schemas/watchlist.schema';

// Services
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';

// Hooks
import { useWatchlistInfinite } from '@/utils/hooks/supabase/queries/useWatchlist';
import { useWatchedMoviesInfinite } from '@/utils/hooks/supabase/queries/useWatchedMovies';
import { useRankedMovies } from '@/utils/hooks/supabase/queries/useRanking';

type UserMovie = WatchedMovieWithMovie | WatchlistWithMovie;

type SortOption = 'watched_date' | 'rating' | 'ranked';

const Movies = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // States
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('watched_date');

  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Queries
  const watchedQuery = useWatchedMoviesInfinite({
    sortBy: sortOption,
    sortOrder: 'desc',
    limit: 24,
  });

  const watchlistQuery = useWatchlistInfinite({
    sortBy: 'priority',
    sortOrder: 'asc',
    limit: 24,
  });

  // Ranked movies query for position calculation (only needed for position display)
  const { data: rankedMovies = [] } = useRankedMovies(user?.id);

  // Data
  const {
    data: moviesData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = showWatchlist ? watchlistQuery : watchedQuery;

  // Flatten all pages into a single array with proper typing
  const userMovies: UserMovie[] = (moviesData?.pages.flatMap(
    (page) => page.data
  ) || []) as UserMovie[];

  // Calculate positions for watched movies when using ranked sort
  const getMoviePosition = (userMovie: UserMovie): number => {
    if (sortOption !== 'ranked' || showWatchlist || !('rating' in userMovie))
      return 0;

    // When using ranked sort, the movies are already in the correct order
    // We can use the array index + 1 as the position
    const index = userMovies.findIndex(
      (movie) => movie.movie.id === userMovie.movie.id
    );
    return index >= 0 ? index + 1 : 0;
  };

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

  // Remove movie from watched list
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

  // Remove movie from watchlist
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

  // Mark movie as watched
  const handleMarkAsWatched = async (movieId: number) => {
    if (!user?.id) return;

    try {
      await watchedMoviesService.markAsWatched(user.id, movieId);
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id, 'watchlist'],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-movies-infinite', user.id, 'watched'],
      });
      showToast('success', 'Movie marked as watched');
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      showToast('error', 'Failed to mark movie as watched');
    }
  };

  const isWatchlistItem = (item: any): item is WatchlistWithMovie => {
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

        <div className='flex items-center gap-4'>
          {/* Sort Options (only for watched movies) */}
          {!showWatchlist && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600'>Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className='text-sm border border-gray-300 rounded px-2 py-1 bg-white'>
                <option value='watched_date'>Date Watched</option>
                <option value='rating'>Rating</option>
                <option value='ranked'>Ranked</option>
              </select>
            </div>
          )}

          {/* View Toggle */}
          <Button
            variant='secondary'
            size='sm'
            onClick={() => setShowWatchlist(!showWatchlist)}>
            {showWatchlist ? 'View Watched' : 'View Watchlist'}
          </Button>
        </div>
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
            {userMovies.map((userMovie: UserMovie, index: number) => {
              const isLastElement = index === userMovies.length - 1;
              const position = getMoviePosition(userMovie);

              return (
                <div
                  key={userMovie.movie.id}
                  ref={isLastElement ? lastElementRef : null}>
                  {/* Rating and ELO info above card */}
                  {!showWatchlist &&
                    'rating' in userMovie &&
                    userMovie.rating && (
                      <div className='text-[6px] text-gray-500 flex justify-between mb-1 px-1'>
                        <span>Rating: {userMovie.rating.toFixed(1)}</span>
                        <span>ELO: {Math.round(userMovie.rating * 200)}</span>
                      </div>
                    )}

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
                    index={position - 1} // Pass position for ranking display
                    isWatchedList={sortOption === 'ranked' && !showWatchlist}
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
