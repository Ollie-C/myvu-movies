import { motion } from 'framer-motion';
import { Star, Calendar, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

interface VersusMovieCardProps {
  movie: any;
  ranking: any;
  onClick: () => void;
  disabled: boolean;
  position: 'left' | 'right';
}

export function VersusMovieCard({
  movie,
  ranking,
  onClick,
  disabled,
}: VersusMovieCardProps) {
  const releaseYear = new Date(movie.release_date).getFullYear();

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className='h-full'>
      <div
        className={cn(
          'h-full cursor-pointer transition-all duration-200 overflow-hidden group',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:ring-2 hover:ring-primary hover:shadow-xl'
        )}
        onClick={disabled ? undefined : onClick}>
        <div className='aspect-[2/3] relative overflow-hidden'>
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className='w-full h-full object-cover'
              loading='lazy'
            />
          ) : (
            <div className='w-full h-full bg-muted flex items-center justify-center'>
              <Info className='h-12 w-12 text-muted-foreground' />
            </div>
          )}

          {/* Gradient overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0' />

          {/* Movie info overlay */}
          <div className='absolute bottom-0 left-0 right-0 p-4 text-white'>
            <h3 className='text-lg font-bold mb-1 line-clamp-2'>
              {movie.title}
            </h3>
            <div className='flex items-center gap-3 text-sm'>
              <span className='flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                {releaseYear}
              </span>
              {movie.vote_average && (
                <span className='flex items-center gap-1'>
                  <Star className='h-3 w-3 fill-yellow-500 text-yellow-500' />
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className='p-4 space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-muted-foreground'>Current ELO</span>
            <span className='text-sm font-medium'>
              {ranking.elo_score || 1500}
            </span>
          </div>
          {ranking.position && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Rank</span>
              <span className='text-sm font-medium'>#{ranking.position}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
