import React from 'react';
import { tmdb } from '@/shared/lib/tmdb';

// Types
import type { BaseMovieDetails } from '@/shared/types/userMovie';

interface MovieHeroProps {
  movie: BaseMovieDetails;
}

const MovieHero: React.FC<MovieHeroProps> = ({ movie }) => {
  const backdropUrl = movie.backdrop_path
    ? tmdb.getImageUrl(movie.backdrop_path, 'original')
    : '/movie-placeholder-backdrop.jpg';

  const formatReleaseDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  return (
    <div className='relative'>
      {/* Backdrop Image */}
      <div className='relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden rounded-lg'>
        <img
          src={backdropUrl}
          alt={movie.title || ''}
          className='w-full h-full object-cover'
        />
        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

        {/* Content Overlay */}
        <div className='absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8'>
          <div className='max-w-4xl'>
            <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight'>
              {movie.title}
            </h1>

            {/* Movie Meta Info */}
            <div className='flex flex-wrap items-center gap-2 sm:gap-4 text-white/90 mb-2 sm:mb-4'>
              {movie.release_date && (
                <span className='text-base sm:text-lg'>
                  {formatReleaseDate(movie.release_date)}
                </span>
              )}

              {/* {movie.director && (
                <span className='text-base sm:text-lg'>Directed by {director.name}</span>
              )} */}
            </div>

            {/* Genres */}
            {movie.genre_names && movie.genre_names.length > 0 && (
              <div className='flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-4'>
                {movie.genre_names.slice(0, 3).map((genre, idx) => (
                  <span
                    key={genre + idx}
                    className='px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm'>
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <p className='text-white/90 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-3'>
                {movie.overview}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHero;
