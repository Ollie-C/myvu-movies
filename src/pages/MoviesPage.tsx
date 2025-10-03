import { useState, useCallback, useRef, useMemo } from 'react';

// Components
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import MovieCard from '@/features/movies/ui/MovieCard/MovieCard';
import Loader from '@/shared/ui/Loader';

// Contexts
import { useAuth } from '@/shared/context/AuthContext';

// Schemas
import type { WatchlistWithDetails } from '@/features/watchlist/models/watchlist.schema';
import type { WatchedMovieWithDetails } from '@/features/watched-movies/models/watched-movies-with-details.schema';

// Hooks
import { useWatchlistInfinite } from '@/features/watchlist/api/hooks/useWatchlist';
import { useWatchedMoviesInfinite } from '@/features/watched-movies/api/hooks/useWatchedMovies';
import {
  useToggleWatched,
  useToggleWatchlist,
} from '@/features/watched-movies/api/hooks/useWatchedMovieMutations';

type UserMovie = WatchedMovieWithDetails | WatchlistWithDetails;
type SortOption = 'watched_date' | 'rating' | 'ranked';

const Movies = () => {
  const { user } = useAuth();
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('watched_date');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // --- Queries ---
  const watchedQuery = useWatchedMoviesInfinite({
    sortBy: sortOption as 'title' | 'rating' | 'watched_date',
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

  const userMovies: UserMovie[] = useMemo(() => {
    if (!moviesData?.pages) return [];
    if (showWatchlist) {
      return moviesData.pages.flatMap((p) => p.data as WatchlistWithDetails[]);
    }
    return moviesData.pages.flatMap((p) => p.data as WatchedMovieWithDetails[]);
  }, [moviesData?.pages, showWatchlist]);

  const moviePositions = useMemo(() => {
    if (sortOption !== 'ranked' || showWatchlist)
      return new Map<string, number>();

    const positions = new Map<string, number>();
    userMovies.forEach((movie, index) => {
      if ('watched_movie_id' in movie) {
        positions.set(movie.movie_id!, index + 1);
      }
    });
    return positions;
  }, [userMovies, sortOption, showWatchlist]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // --- MUTATIONS ---
  const toggleWatchedMutation = useToggleWatched();
  const toggleWatchlistMutation = useToggleWatchlist();

  const handleRemoveFromWatched = useCallback(
    (movieUuid: string, tmdb_id: number) => {
      if (!user?.id) return;
      toggleWatchedMutation.mutate({
        movie_uuid: movieUuid,
        tmdb_id,
        isWatched: true, // we’re *removing* from watched
        title: '',
      });
    },
    [user?.id, toggleWatchedMutation]
  );

  const handleRemoveFromWatchlist = useCallback(
    (movieUuid: string, tmdb_id: number) => {
      if (!user?.id) return;
      toggleWatchlistMutation.mutate({
        movie_uuid: movieUuid,
        tmdb_id,
        isInWatchlist: true, // we’re *removing* from watchlist
        title: '',
      });
    },
    [user?.id, toggleWatchlistMutation]
  );

  const handleMarkAsWatched = useCallback(
    (movieUuid: string, tmdb_id: number) => {
      if (!user?.id) return;
      toggleWatchedMutation.mutate({
        movie_uuid: movieUuid,
        tmdb_id,
        isWatched: false, // not watched → marking as watched
        title: '',
      });
    },
    [user?.id, toggleWatchedMutation]
  );

  // --- UI ---
  const EmptyState = () => (
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
      <p className='text-secondary mb-6 italic'>
        Use the search bar above to find movies.
      </p>
    </Card>
  );

  const MoviesGrid = () => (
    <>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4'>
        {userMovies.map((userMovie, index) => {
          const isLastElement = index === userMovies.length - 1;
          const position =
            'watched_movie_id' in userMovie
              ? moviePositions.get(userMovie.movie_id!) || 0
              : 0;

          return (
            <div
              key={userMovie.movie_id}
              ref={isLastElement ? lastElementRef : null}>
              {/* Rating/ELO bar (only for watched movies) */}
              {!showWatchlist &&
                'watched_movie_id' in userMovie &&
                userMovie.elo_score && (
                  <div className='text-[8px] sm:text-[10px] text-gray-500 flex justify-between mb-1 px-1'>
                    <span>Rating: {userMovie.rating?.toFixed(1)}</span>
                    <span>ELO: {userMovie.elo_score}</span>
                  </div>
                )}

              <MovieCard
                userMovie={userMovie}
                onRemoveFromWatched={
                  'watched_movie_id' in userMovie
                    ? () =>
                        handleRemoveFromWatched(
                          userMovie.movie_uuid!,
                          userMovie.tmdb_id
                        )
                    : undefined
                }
                onRemoveFromWatchlist={
                  'watchlist_id' in userMovie
                    ? () =>
                        handleRemoveFromWatchlist(
                          userMovie.movie_uuid!,
                          userMovie.tmdb_id
                        )
                    : undefined
                }
                onMarkAsWatched={
                  'watchlist_id' in userMovie
                    ? () =>
                        handleMarkAsWatched(
                          userMovie.movie_uuid!,
                          userMovie.tmdb_id
                        )
                    : undefined
                }
                isWatchlistView={showWatchlist}
                index={position - 1}
                isWatchedList={sortOption === 'ranked' && !showWatchlist}
              />
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && <Loader />}
      {!hasNextPage && (
        <div className='text-center mt-6 sm:mt-8 py-4'>
          <p className='text-secondary text-sm px-4'>
            You've reached the end of your{' '}
            {showWatchlist ? 'watchlist' : 'watched movies'}
          </p>
        </div>
      )}
    </>
  );

  // --- Early returns ---
  if (!user) {
    return (
      <div className='space-y-8 animate-fade-in'>
        <h1 className='text-3xl font-bold text-primary'>Your Movies</h1>
        <p className='text-secondary mt-2'>Please log in to view your movies</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8 animate-fade-in space-y-6'>
        <h1 className='text-3xl font-bold text-primary'>Your Movies</h1>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8 animate-fade-in space-y-6'>
        <h1 className='text-3xl font-bold text-primary'>Your Movies</h1>
        <Card className='p-8 text-center'>
          <p className='text-secondary'>
            Error loading movies:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </Card>
      </div>
    );
  }

  // --- Main return ---
  return (
    <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='min-w-0 flex-1'>
          <h1 className='text-2xl sm:text-3xl font-bold text-primary truncate'>
            {showWatchlist ? 'Your Watchlist' : 'Your Movies'}
          </h1>
          {userMovies.length > 0 && (
            <p className='text-secondary mt-1 text-sm sm:text-base'>
              {userMovies.length}{' '}
              {showWatchlist ? 'movies in watchlist' : 'watched movies'}
            </p>
          )}
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0'>
          {!showWatchlist && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600 whitespace-nowrap'>
                Sort by:
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className='text-sm border border-gray-300 rounded px-2 py-1.5 bg-white min-w-0 flex-1 sm:flex-initial'>
                <option value='watched_date'>Date Watched</option>
                <option value='rating'>Rating</option>
                <option value='ranked'>Ranked</option>
              </select>
            </div>
          )}
          <Button
            variant='secondary'
            size='sm'
            onClick={() => setShowWatchlist(!showWatchlist)}
            className='w-full sm:w-auto'>
            {showWatchlist ? 'View Watched' : 'View Watchlist'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {userMovies.length === 0 ? <EmptyState /> : <MoviesGrid />}
    </div>
  );
};

export default Movies;
