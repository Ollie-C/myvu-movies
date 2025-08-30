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
import { useAuth } from '@/context/AuthContext';

// Components
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { RatingDisplay } from '@/components/movie/RatingDisplay';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import SimpleRatingModal from '@/components/movie/SimpleRatingModal';
import MovieHero from '@/components/movie/MovieHero';
// import MovieCast from '@/components/movie/MovieCast';

// Hooks
import {
  useMovieDetails,
  useUserMovieStatus,
} from '@/utils/hooks/supabase/useMovieDetails';
import {
  useToggleWatched,
  useToggleWatchlist,
  useUpdateRating,
} from '@/utils/hooks/supabase/useWatchedMovieMutations';

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

  console.log('Movie:', movie);

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
      <MovieHero movie={movie} />

      {/* Ratings Display */}
      {(movie.vote_average || userRating) && (
        <Card className='p-6'>
          <h2 className='text-xl font-bold mb-4'>Ratings</h2>
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
        <div className='space-y-6'>
          <div className='flex flex-wrap gap-3'>
            {/* Watched */}
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

            {/* Watchlist */}
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

            {/* Add to collection */}
            <Button
              variant='secondary'
              onClick={() => setShowCollectionDropdown(true)}
              className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              Add to Collection
            </Button>

            {/* Rating */}
            <Button
              onClick={() => setShowRatingModal(true)}
              className='flex items-center gap-2'
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
      <Card className='p-6'>
        <h2 className='text-xl font-bold mb-4'>Overview</h2>
        <p className='text-secondary leading-relaxed'>{movie.overview}</p>
      </Card>

      {/* Cast */}
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
            genre_names: movie.genre_names ?? [],
            director_names: movie.director_names ?? [],
          }}
        />
      )}
    </div>
  );
};

export default MovieDetails;
