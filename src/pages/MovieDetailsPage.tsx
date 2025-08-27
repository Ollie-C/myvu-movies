// AUDITED 01/08/2025
import { useState, useEffect } from 'react';
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
import MovieCast from '@/components/movie/MovieCast';

// Hooks
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
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Log movie details page access
  // useEffect(() => {
  //   console.log('🎬 [MovieDetails] Page loaded:', {
  //     movieId: id,
  //     userId: user?.id,
  //     email: user?.email,
  //     pathname: window.location.pathname,
  //   });
  // }, [id, user]);

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
  const userRating = userStatus?.watchedMovie?.rating || null;

  const handleToggleWatched = () => {
    if (!movie) return;
    toggleWatched.mutate({ movie, isWatched });
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;
    toggleWatchlist.mutate({ movie, isInWatchlist });
  };

  const handleRateMovie = async (rating: number, notes?: string) => {
    if (!movie) return;
    updateRating.mutate({ movie, rating, isWatched });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!movie) {
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
      <MovieHero
        movie={{
          title: movie.title,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date || '',
          runtime: movie.runtime,
          genres: movie.genres || [],
          vote_average: movie.vote_average || 0,
          overview: movie.overview || '',
        }}
        director={director}
      />

      {/* Ratings Display */}
      {(movie.vote_average || userRating) && (
        <Card className='p-6'>
          <h2 className='text-xl font-bold mb-4'>Ratings</h2>
          <RatingDisplay
            tmdbRating={movie.vote_average}
            userRating={userRating}
            showLabels={true}
            size='lg'
          />
        </Card>
      )}

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

            <Button
              variant='secondary'
              onClick={() => setShowCollectionDropdown(true)}
              className='flex items-center gap-2'>
              <Plus className='w-4 h-4' />
              Add to Collection
            </Button>

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

      {/* Simple Rating Modal */}
      {movie && (
        <SimpleRatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          movie={movie}
          currentRating={userRating}
          onRateMovie={handleRateMovie}
        />
      )}

      {/* Overview */}
      <Card className='p-6'>
        <h2 className='text-xl font-bold mb-4'>Overview</h2>
        <p className='text-secondary leading-relaxed'>{movie.overview}</p>
      </Card>

      {/* Cast */}
      {movie.credits?.cast && (
        <MovieCast
          cast={movie.credits.cast.map((member, index) => ({
            ...member,
            order: index,
          }))}
        />
      )}

      {/* Collection Dropdown */}
      {showCollectionDropdown && movie && (
        <CollectionDropdown
          isOpen={showCollectionDropdown}
          onClose={() => setShowCollectionDropdown(false)}
          movie={{
            id: movie.movieId,
            tmdb_id: movie.tmdbId,
            title: movie.title,
            original_title: movie.original_title,
            original_language: movie.original_language,
            overview: movie.overview,
            release_date: movie.release_date,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            popularity: movie.popularity || 0,
            vote_average: movie.vote_average || 0,
            vote_count: movie.vote_count || 0,
            genres: movie.genres || [],
            runtime: movie.runtime || null,
            tagline: movie.tagline || null,
            credits: movie.credits || null,
            created_at: null,
            updated_at: null,
            search_vector: null,
          }}
        />
      )}
    </div>
  );
};

export default MovieDetails;
