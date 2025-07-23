import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Star,
  Play,
  Plus,
  Eye,
  EyeOff,
  Bookmark,
  BookmarkX,
} from 'lucide-react';
import { tmdb } from '@/lib/api/tmdb';
import { movieService } from '@/services/movie.service';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';

interface TMDBMovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  runtime: number;
  genres: { id: number; name: string }[];
  original_language: string;
  original_title: string;
  popularity: number;
  tagline: string;
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      profile_path: string | null;
    }>;
  };
}

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState<number>(0);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const addToCollectionButtonRef = useRef<HTMLDivElement>(null);

  // Fetch movie details from TMDB
  const { data: movie, isLoading: movieLoading } = useQuery({
    queryKey: ['movie-details', id],
    queryFn: () => tmdb.getMovie(Number(id)),
    enabled: !!id,
  }) as { data: TMDBMovieDetails | undefined; isLoading: boolean };

  // Fetch user's interaction with this movie
  const { data: userMovie } = useQuery({
    queryKey: ['user-movie', user?.id, movie?.id],
    queryFn: async () => {
      if (!user?.id || !movie?.id) return null;

      // First check if movie is cached in our database
      const { data } = await supabase
        .from('movies')
        .select('id')
        .eq('tmdb_id', movie.id)
        .single();

      if (!data) return null;

      return movieService.getUserMovie(user.id, data.id);
    },
    enabled: !!user?.id && !!movie?.id,
  });

  // Mutations for user actions
  const toggleWatchedMutation = useMutation({
    mutationFn: async (watched: boolean) => {
      if (!user?.id || !movie) throw new Error('Missing required data');

      const cachedMovie = await movieService.cacheMovie(movie);
      return movieService.toggleWatched(user.id, cachedMovie.id, watched);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-movie'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
    },
  });

  const toggleWatchlistMutation = useMutation({
    mutationFn: async (inWatchlist: boolean) => {
      if (!user?.id || !movie) throw new Error('Missing required data');

      const cachedMovie = await movieService.cacheMovie(movie);
      return movieService.toggleWatchlist(user.id, cachedMovie.id, inWatchlist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-movie'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!user?.id || !movie) throw new Error('Missing required data');

      const cachedMovie = await movieService.cacheMovie(movie);
      return movieService.updateRating(user.id, cachedMovie.id, rating);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-movie'] });
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
    },
  });

  if (movieLoading) {
    return (
      <div className='animate-fade-in'>
        <div className='relative h-96 bg-surface-hover animate-pulse rounded-lg mb-8' />
        <div className='space-y-4'>
          <div className='h-8 bg-surface-hover animate-pulse rounded w-3/4' />
          <div className='h-4 bg-surface-hover animate-pulse rounded w-1/2' />
          <div className='h-20 bg-surface-hover animate-pulse rounded' />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className='text-center py-12'>
        <h1 className='text-2xl font-bold mb-4'>Movie not found</h1>
        <Button onClick={() => navigate('/movies')}>Back to Movies</Button>
      </div>
    );
  }

  const director = movie.credits?.crew?.find(
    (person) => person.job === 'Director'
  );
  const displayRating = userMovie?.rating ? userMovie.rating / 2 : 0;

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
      <div className='relative'>
        {movie.backdrop_path && (
          <div
            className='absolute inset-0 rounded-2xl bg-cover bg-center opacity-20'
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
            }}
          />
        )}

        <div className='relative bg-black/20 backdrop-blur-sm rounded-2xl p-8'>
          <div className='flex flex-col lg:flex-row gap-8'>
            {/* Poster */}
            <div className='flex-shrink-0'>
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : '/placeholder-movie.jpg'
                }
                alt={movie.title}
                className='w-64 h-96 object-cover rounded-xl shadow-2xl'
              />
            </div>

            {/* Movie Info */}
            <div className='flex-1 space-y-6'>
              <div>
                <h1 className='text-4xl font-bold text-white mb-2'>
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className='text-xl text-white/80 italic'>
                    {movie.tagline}
                  </p>
                )}
              </div>

              {/* Movie Details */}
              <div className='flex flex-wrap gap-4 text-white/90'>
                <span>{new Date(movie.release_date).getFullYear()}</span>
                <span>•</span>
                <span>
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
                <span>•</span>
                <div className='flex items-center gap-1'>
                  <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                  <span>{movie.vote_average.toFixed(1)}</span>
                </div>
              </div>

              {/* Genres */}
              <div className='flex flex-wrap gap-2'>
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className='px-3 py-1 bg-white/20 rounded-full text-sm text-white'>
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Director */}
              {director && (
                <p className='text-white/90'>
                  <span className='font-medium'>Directed by:</span>{' '}
                  {director.name}
                </p>
              )}

              {/* User Actions */}
              {user && (
                <div className='flex flex-wrap gap-3'>
                  <Button
                    variant={userMovie?.watched ? 'primary' : 'secondary'}
                    onClick={() =>
                      toggleWatchedMutation.mutate(!userMovie?.watched)
                    }
                    disabled={toggleWatchedMutation.isPending}
                    className='flex items-center gap-2'>
                    {userMovie?.watched ? (
                      <Eye className='w-4 h-4' />
                    ) : (
                      <EyeOff className='w-4 h-4' />
                    )}
                    {userMovie?.watched ? 'Watched' : 'Mark as Watched'}
                  </Button>

                  <Button
                    variant={userMovie?.watch_list ? 'primary' : 'secondary'}
                    onClick={() =>
                      toggleWatchlistMutation.mutate(!userMovie?.watch_list)
                    }
                    disabled={toggleWatchlistMutation.isPending}
                    className='flex items-center gap-2'>
                    {userMovie?.watch_list ? (
                      <Bookmark className='w-4 h-4' />
                    ) : (
                      <BookmarkX className='w-4 h-4' />
                    )}
                    {userMovie?.watch_list
                      ? 'In Watchlist'
                      : 'Add to Watchlist'}
                  </Button>

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
              )}

              {/* User Rating */}
              {user && (
                <div className='space-y-2'>
                  <p className='text-white/90 font-medium'>Your Rating:</p>
                  <div className='flex items-center gap-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => ratingMutation.mutate(star)}
                        disabled={ratingMutation.isPending}
                        className='p-1 hover:scale-110 transition-transform'>
                        <Star
                          className={`w-6 h-6 ${
                            star <= displayRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-white/40 hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    ))}
                    {displayRating > 0 && (
                      <span className='text-white/90 ml-2'>
                        {displayRating}/5
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card className='p-6'>
        <h2 className='text-xl font-bold mb-4'>Overview</h2>
        <p className='text-secondary leading-relaxed'>{movie.overview}</p>
      </Card>

      {/* Cast */}
      {movie.credits?.cast && movie.credits.cast.length > 0 && (
        <Card className='p-6'>
          <h2 className='text-xl font-bold mb-4'>Cast</h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
            {movie.credits.cast.slice(0, 12).map((person) => (
              <div key={person.id} className='text-center'>
                <div className='w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-surface-hover'>
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                      alt={person.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center'>
                      <span className='text-2xl text-tertiary'>👤</span>
                    </div>
                  )}
                </div>
                <p className='font-medium text-sm'>{person.name}</p>
                <p className='text-xs text-secondary'>{person.character}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Collection Dropdown */}
      {showCollectionDropdown && movie && (
        <CollectionDropdown
          isOpen={showCollectionDropdown}
          onClose={() => setShowCollectionDropdown(false)}
          movie={movie}
          position={{
            top: addToCollectionButtonRef.current
              ? addToCollectionButtonRef.current.getBoundingClientRect()
                  .bottom + 8
              : undefined,
            left: addToCollectionButtonRef.current
              ? addToCollectionButtonRef.current.getBoundingClientRect().left
              : undefined,
          }}
        />
      )}
    </div>
  );
};

export default MovieDetails;
