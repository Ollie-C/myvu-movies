// NOT AUDITED

import type { Movie } from '@/schemas/movie.schema';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

interface MoviePosterProps {
  movie?: Movie;
  userMovie?: WatchedMovieWithMovie;
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
  // Handle both movie and userMovie props
  const movieData = movie || userMovie?.movie;

  if (!movieData) {
    console.warn('MoviePoster: Either movie or userMovie prop is required');
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
