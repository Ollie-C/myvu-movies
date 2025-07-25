import { cn } from '@/utils/cn';
import { Film } from 'lucide-react';

interface MoviePosterProps {
  src: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'compact';
}

export function MoviePoster({ src, alt, size = 'md' }: MoviePosterProps) {
  const sizeClasses = {
    sm: 'w-16 h-24',
    md: 'w-32 h-48',
    lg: 'w-48 h-72',
    compact: 'w-[133px] h-[200px]', // Optimized for ~200px height with 2:3 aspect ratio
  };

  if (!src) {
    return (
      <div
        className={cn(
          'bg-surface-hover rounded flex items-center justify-center',
          sizeClasses[size]
        )}>
        <Film className='w-8 h-8 text-tertiary' />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover rounded', sizeClasses[size])}
    />
  );
}
