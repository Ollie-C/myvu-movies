import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { MoviePoster } from '@/components/common/MoviePoster';
import { useAuth } from '@/context/AuthContext';
import { movieService, type UserMovie } from '@/services/movie.service';
import MovieCard from '@/components/common/MovieCard';

const Movies = () => {
  const { user } = useAuth();
  const [showWatchlist, setShowWatchlist] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: moviesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'user-movies',
      user?.id,
      showWatchlist ? 'watchlist' : 'watched',
    ],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');

      return movieService.getUserMovies(user.id, {
        filter: showWatchlist ? 'watchlist' : 'watched',
        sortOrder: 'desc',
        limit: 50,
      });
    },
    enabled: !!user?.id,
  });

  const userMovies = moviesData?.data || [];

  // Handle removing movie from watched list
  const handleRemoveFromWatched = async (movieId: number) => {
    if (!user?.id) return;

    try {
      await movieService.toggleWatched(user.id, movieId, false);
      // Invalidate and refetch the movies query
      queryClient.invalidateQueries({
        queryKey: ['user-movies', user.id],
      });
    } catch (error) {
      console.error('Error removing movie from watched:', error);
      // TODO: Show error toast
    }
  };

  // Handle removing movie from watchlist
  const handleRemoveFromWatchlist = async (movieId: number) => {
    if (!user?.id) return;

    try {
      await movieService.toggleWatchlist(user.id, movieId, false);
      // Invalidate and refetch the movies query
      queryClient.invalidateQueries({
        queryKey: ['user-movies', user.id],
      });
    } catch (error) {
      console.error('Error removing movie from watchlist:', error);
      // TODO: Show error toast
    }
  };

  // Handle marking watchlist movie as watched
  const handleMarkAsWatched = async (movieId: number) => {
    if (!user?.id) return;

    try {
      await movieService.toggleWatched(user.id, movieId, true);
      // Invalidate and refetch the movies query
      queryClient.invalidateQueries({
        queryKey: ['user-movies', user.id],
      });
    } catch (error) {
      console.error('Error marking movie as watched:', error);
      // TODO: Show error toast
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
          <p className='text-secondary mt-2'>
            {showWatchlist
              ? 'Movies you want to watch'
              : 'Movies you have watched'}
          </p>
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
          <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9 gap-2'>
            {userMovies.map((userMovie) => (
              <MovieCard
                key={userMovie.movie.id}
                userMovie={userMovie}
                onRemoveFromWatched={handleRemoveFromWatched}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
                onMarkAsWatched={handleMarkAsWatched}
                isWatchlistView={showWatchlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Movies;
