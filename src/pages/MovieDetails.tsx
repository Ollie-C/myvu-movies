// MovieDetails.tsx
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkX,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import MovieHero from '@/components/movie/MovieHero';
import MovieRating from '@/components/movie/MovieRating';
import MovieCast from '@/components/movie/MovieCast';
import {
  useMovieDetails,
  useUserMovieStatus,
} from '@/utils/hooks/supabase/queries/useMovieDetails';
import {
  useToggleWatched,
  useToggleWatchlist,
  useUpdateRating,
} from '@/utils/hooks/supabase/mutations/useWatchedMovieMutations';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const addToCollectionButtonRef = useRef<HTMLDivElement>(null);

  // Fetch movie details and user status
  const { data: movie, isLoading } = useMovieDetails(id);
  const { data: userStatus } = useUserMovieStatus(movie?.tmdbId);

  // Mutations
  const toggleWatched = useToggleWatched();
  const toggleWatchlist = useToggleWatchlist();
  const updateRating = useUpdateRating();

  // Derived state
  const isWatched = !!userStatus?.watchedMovie;
  const isInWatchlist = !!userStatus?.watchlistItem;
  const userRating = userStatus?.watchedMovie?.rating
    ? userStatus.watchedMovie.rating / 2 // Convert from 10-point to 5-star
    : 0;

  // Handlers
  const handleToggleWatched = () => {
    if (!movie) return;
    toggleWatched.mutate({ movie, isWatched });
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;
    toggleWatchlist.mutate({ movie, isInWatchlist });
  };

  const handleUpdateRating = (rating: number) => {
    if (!movie) return;
    updateRating.mutate({ movie, rating, isWatched });
  };

  if (isLoading) {
    // return <MovieDetailsSkeleton />;
    return <div>Loading...</div>;
  }

  if (!movie) {
    // return <MovieNotFound onBack={() => navigate('/movies')} />;
    return <div>Movie not found</div>;
  }

  const director = movie.credits?.crew?.find(
    (person: { job: string }) => person.job === 'Director'
  );

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Back Button */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => navigate(-1)}
        className='flex items-center gap-2'>
        <ArrowLeft className='w-4 h-4' />
        Back
      </Button>

      {/* Hero Section */}
      <MovieHero movie={movie} director={director} />

      {/* User Actions */}
      {user && (
        <div className='space-y-6'>
          <div className='flex flex-wrap gap-3'>
            <Button
              variant={isWatched ? 'primary' : 'secondary'}
              onClick={handleToggleWatched}
              disabled={toggleWatched.isPending}
              className='flex items-center gap-2'>
              {isWatched ? (
                <Eye className='w-4 h-4' />
              ) : (
                <EyeOff className='w-4 h-4' />
              )}
              {isWatched ? 'Watched' : 'Mark as Watched'}
            </Button>

            {!isWatched && (
              <Button
                variant={isInWatchlist ? 'primary' : 'secondary'}
                onClick={handleToggleWatchlist}
                disabled={toggleWatchlist.isPending}
                className='flex items-center gap-2'>
                {isInWatchlist ? (
                  <Bookmark className='w-4 h-4' />
                ) : (
                  <BookmarkX className='w-4 h-4' />
                )}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
            )}

            <div ref={addToCollectionButtonRef}>
              <Button
                variant='secondary'
                onClick={() => setShowCollectionDropdown(true)}
                className='flex items-center gap-2'>
                <Plus className='w-4 h-4' />
                Add to Collection
              </Button>
            </div>
          </div>

          {/* Rating */}
          {isWatched && (
            <MovieRating
              rating={userRating}
              onRate={handleUpdateRating}
              isPending={updateRating.isPending}
            />
          )}
        </div>
      )}

      {/* Overview */}
      <Card className='p-6'>
        <h2 className='text-xl font-bold mb-4'>Overview</h2>
        <p className='text-secondary leading-relaxed'>{movie.overview}</p>
      </Card>

      {/* Cast */}
      {movie.credits?.cast && <MovieCast cast={movie.credits.cast} />}

      {/* Collection Dropdown */}
      {showCollectionDropdown && movie && (
        <CollectionDropdown
          isOpen={showCollectionDropdown}
          onClose={() => setShowCollectionDropdown(false)}
          movie={movie}
          position={{
            top: addToCollectionButtonRef.current?.offsetTop,
            left: addToCollectionButtonRef.current?.offsetLeft,
          }}
        />
      )}
    </div>
  );
};

export default MovieDetails;
