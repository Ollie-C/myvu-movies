// Schemas
import type { BaseMovieDetails } from '@/shared/types/userMovie';

interface MoviePosterProps {
  movie?: BaseMovieDetails;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  showTitle?: boolean;
  variant?: 'default' | 'rounded';
}

const MoviePoster = ({
  movie,
  disabled = false,
  onClick,
  className = '',
  showTitle = false,
  variant = 'default',
}: MoviePosterProps) => {
  const movieData = movie;

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
      title={movieData.title ?? undefined}>
      <div
        className={`w-auto h-auto bg-gray-200 overflow-hidden flex items-center justify-center ${
          variant === 'rounded' ? 'rounded' : ''
        }`}>
        <img
          src={imageUrl}
          alt={movieData.title ?? undefined}
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
