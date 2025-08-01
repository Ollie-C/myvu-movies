// AUDITED 01/08/2025
import { useState, useRef } from 'react';
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
import StandardRatingModal from '@/components/movie/RatingModal';
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
  const userRating = userStatus?.watchedMovie?.rating || null;

  const handleToggleWatched = () => {
    if (!movie) return;
    toggleWatched.mutate({ movie, isWatched });
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;
    toggleWatchlist.mutate({ movie, isInWatchlist });
  };

  const handleRateMovie = async (rating: number) => {
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
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Your Rating</h3>
                {userRating && (
                  <div className='flex items-center gap-2'>
                    <div className='flex gap-1'>
                      {Array.from({ length: 10 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < userRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className='font-medium'>{userRating}/10</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setShowRatingModal(true)}
                className='flex items-center gap-2'
                disabled={updateRating.isPending}>
                <Star className='w-4 h-4' />
                {userRating ? 'Update Rating' : 'Rate Movie'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Standard Rating Modal */}
      {movie && userStatus?.watchedMovie && (
        <StandardRatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          movies={[
            {
              ...userStatus.watchedMovie,
              movie: {
                id: movie.movieId,
                title: movie.title,
                original_title: movie.original_title,
                original_language: movie.original_language,
                overview: movie.overview,
                release_date: movie.release_date,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                popularity: movie.popularity,
                vote_average: movie.vote_average,
                vote_count: movie.vote_count,
                runtime: movie.runtime || null,
                tagline: movie.tagline || null,
                credits: movie.credits || null,
                tmdb_id: movie.tmdbId,
                genres: movie.genres || [],
                created_at: null,
                updated_at: null,
              },
            },
          ]}
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
