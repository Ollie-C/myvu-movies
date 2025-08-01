import React from 'react';
import { tmdb } from '@/lib/api/tmdb';

interface MovieHeroProps {
  movie: {
    title: string;
    backdrop_path: string | null;
    release_date: string;
    runtime?: number;
    genres: { id: number; name: string }[];
    vote_average: number;
    overview: string;
  };
  director?: {
    name: string;
  };
}

const MovieHero: React.FC<MovieHeroProps> = ({ movie, director }) => {
  const backdropUrl = movie.backdrop_path
    ? tmdb.getImageUrl(movie.backdrop_path, 'original')
    : '/movie-placeholder-backdrop.jpg';

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatReleaseDate = (dateString: string) => {
    return new Date(dateString).getFullYear();
  };

  return (
    <div className='relative'>
      {/* Backdrop Image */}
      <div className='relative h-96 md:h-[500px] overflow-hidden rounded-lg'>
        <img
          src={backdropUrl}
          alt={movie.title}
          className='w-full h-full object-cover'
        />
        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />

        {/* Content Overlay */}
        <div className='absolute bottom-0 left-0 right-0 p-6 md:p-8'>
          <div className='max-w-4xl'>
            <h1 className='text-3xl md:text-5xl font-bold text-white mb-4'>
              {movie.title}
            </h1>

            {/* Movie Meta Info */}
            <div className='flex flex-wrap items-center gap-4 text-white/90 mb-4'>
              {movie.release_date && (
                <span className='text-lg'>
                  {formatReleaseDate(movie.release_date)}
                </span>
              )}

              {movie.runtime && (
                <span className='text-lg'>{formatRuntime(movie.runtime)}</span>
              )}

              {director && (
                <span className='text-lg'>Directed by {director.name}</span>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-4'>
                {movie.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre.id}
                    className='px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm'>
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            <div className='flex items-center gap-2 mb-4'>
              <div className='flex items-center gap-1'>
                <span className='text-yellow-400 text-xl'>★</span>
                <span className='text-white font-semibold'>
                  {movie.vote_average.toFixed(1)}
                </span>
              </div>
              <span className='text-white/70'>/ 10</span>
            </div>

            {/* Overview */}
            {movie.overview && (
              <p className='text-white/90 text-lg leading-relaxed max-w-2xl line-clamp-3'>
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
