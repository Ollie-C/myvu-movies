import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Icons
import {
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkX,
  Star,
} from 'lucide-react';

// Contexts
import { useAuth } from '@/shared/context/AuthContext';

// Components
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { RatingDisplay } from '@/features/movies/ui/RatingDisplay';
import { CollectionDropdown } from '@/features/collections/ui/CollectionDropdown';
import SimpleRatingModal from '@/features/movies/ui/SimpleRatingModal';
import MovieHero from '@/features/movies/ui/MovieHero';

// Hooks
import {
  useMovieDetails,
  useUserMovieStatus,
} from '@/features/movies/api/hooks/useMovieDetails';
import {
  useToggleWatched,
  useToggleWatchlist,
  useUpdateRating,
} from '@/features/watched-movies/api/hooks/useWatchedMovieMutations';

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const { data: movie, isLoading } = useMovieDetails(id);

  const { data: userStatus } = useUserMovieStatus(movie?.tmdb_id || undefined);

  const toggleWatched = useToggleWatched();
  const toggleWatchlist = useToggleWatchlist();
  const updateRating = useUpdateRating();

  const isWatched = !!userStatus?.watchedMovie;
  const isInWatchlist = !!userStatus?.watchlistItem;
  const userRating = userStatus?.watchedMovie?.rating || null;

  const handleToggleWatched = () => {
    if (!movie) return;
    toggleWatched.mutate({
      movie_uuid: movie.movie_uuid || '',
      tmdb_id: movie.tmdb_id || 0,
      isWatched,
      title: movie.title || '',
    });
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;
    toggleWatchlist.mutate({
      movie_uuid: movie.movie_uuid || '',
      tmdb_id: movie.tmdb_id || 0,
      isInWatchlist,
      title: movie.title || '',
    });
  };

  const handleRateMovie = async (rating: number) => {
    if (!movie) return;
    updateRating.mutate({
      movie_uuid: movie.movie_uuid || '',
      tmdb_id: movie.tmdb_id || 0,
      rating,
      isWatched,
      title: movie.title || '',
    });
  };

  if (isLoading) {
    return (
      <div className='space-y-6 animate-fade-in'>
        <p>Loading...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className='space-y-6 animate-fade-in'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/movies')}
          className='flex items-center gap-2'>
          <ArrowLeft className='w-4 h-4' />
          Back to Movies
        </Button>
        <Card className='p-8 text-center'>
          <h2 className='text-xl font-bold mb-2'>Movie Not Found</h2>
          <p className='text-secondary mb-6'>
            This movie doesn’t exist or couldn’t be loaded.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6 sm:space-y-8 animate-fade-in px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
      {/* Back Button */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => navigate(-1)}
        className='flex items-center gap-2 -ml-2'>
        <ArrowLeft className='w-4 h-4' />
        Back
      </Button>

      {/* Hero Section */}
      <MovieHero movie={movie} />

      {/* Ratings Display */}
      {(movie.vote_average || userRating) && (
        <Card className='p-4 sm:p-6'>
          <h2 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4'>Ratings</h2>
          <RatingDisplay
            tmdbRating={movie.vote_average}
            userRating={userRating}
            showLabels
            size='lg'
          />
        </Card>
      )}

      {/* User Actions */}
      {user && (
        <div className='space-y-4 sm:space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3'>
            <Button
              variant={isWatched ? 'primary' : 'secondary'}
              onClick={handleToggleWatched}
              disabled={toggleWatched.isPending}
              className='flex items-center justify-center gap-2 w-full lg:w-auto'>
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
                className='flex items-center justify-center gap-2 w-full lg:w-auto'>
                {isInWatchlist ? (
                  <Bookmark className='w-4 h-4' />
                ) : (
                  <BookmarkX className='w-4 h-4' />
                )}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
            )}

            <Button
              variant='secondary'
              onClick={() => setShowCollectionDropdown(true)}
              className='flex items-center justify-center gap-2 w-full lg:w-auto'>
              <Plus className='w-4 h-4' />
              Add to Collection
            </Button>

            <Button
              onClick={() => setShowRatingModal(true)}
              className='flex items-center justify-center gap-2 w-full lg:w-auto'
              disabled={updateRating.isPending}>
              <Star className='w-4 h-4' />
              {userRating ? 'Update Rating' : 'Rate Movie'}
            </Button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <SimpleRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        movie={movie}
        currentRating={userRating}
        onRateMovie={handleRateMovie}
      />

      {/* Overview */}
      <Card className='p-4 sm:p-6'>
        <h2 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4'>Overview</h2>
        <p className='text-secondary leading-relaxed text-sm sm:text-base'>
          {movie.overview}
        </p>
      </Card>

      {/* Details Section: Genres + Directors */}
      <Card className='p-4 sm:p-6'>
        <h2 className='text-lg sm:text-xl font-bold mb-3 sm:mb-4'>Details</h2>
        <div className='space-y-2 sm:space-y-3 text-secondary text-sm sm:text-base'>
          {movie.genre_names && movie.genre_names.length > 0 && (
            <p>
              <strong className='text-primary'>Genres:</strong>{' '}
              {movie.genre_names.join(', ')}
            </p>
          )}
          {movie.director_names && movie.director_names.length > 0 && (
            <p>
              <strong className='text-primary'>
                Director{movie.director_names.length > 1 ? 's' : ''}:
              </strong>{' '}
              {movie.director_names.join(', ')}
            </p>
          )}
        </div>
      </Card>

      {/* Future: Cast (if you later enrich credits) */}
      {/* {movie.credits?.cast && <MovieCast cast={movie.credits.cast} />} */}

      {/* Collections Dropdown */}
      {showCollectionDropdown && (
        <CollectionDropdown
          isOpen={showCollectionDropdown}
          onClose={() => setShowCollectionDropdown(false)}
          movie={{
            movie_id: movie.movie_id,
            tmdb_id: movie.tmdb_id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            genre_names: movie.genre_names || undefined,
            director_names: movie.director_names || undefined,
          }}
        />
      )}
    </div>
  );
};

export default MovieDetails;
