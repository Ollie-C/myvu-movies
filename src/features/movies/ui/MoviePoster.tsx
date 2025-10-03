// Schemas
import type { Movie } from '@/features/movies/models/movie.schema';
import type { WatchedMovieWithDetails } from '@/features/watched-movies/models/watched-movies-with-details.schema';

interface MoviePosterProps {
  movie?: Movie;
  userMovie?: WatchedMovieWithDetails;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  showTitle?: boolean;
  variant?: 'default' | 'rounded';
}

const MoviePoster = ({
  movie,
  userMovie,
  disabled = false,
  onClick,
  className = '',
  showTitle = false,
  variant = 'default',
}: MoviePosterProps) => {
  const movieData = movie || userMovie;

  if (!movieData) {
    return null;
  }

  const imageUrl = movieData.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
    : '/placeholder-movie.jpg';

  const baseClasses =
    'flex flex-col items-center transition-colors select-none';
  const cursorClass = disabled ? '' : 'cursor-pointer';
  const roundedClass = variant === 'rounded' ? 'rounded-lg' : '';

  const combinedClassName =
    `${baseClasses} ${cursorClass} ${roundedClass} ${className}`.trim();

  return (
    <div
      className={combinedClassName}
      onClick={disabled ? undefined : onClick}
      title={movieData.title}>
      <div
        className={`w-auto h-auto bg-gray-200 overflow-hidden flex items-center justify-center ${
          variant === 'rounded' ? 'rounded' : ''
        }`}>
        <img
          src={imageUrl}
          alt={movieData.title}
          className='w-full h-full object-cover'
          draggable={false}
        />
      </div>
      {showTitle && (
        <p className='mt-2 text-sm text-center truncate max-w-full'>
          {movieData.title}
        </p>
      )}
    </div>
  );
};

export default MoviePoster;
