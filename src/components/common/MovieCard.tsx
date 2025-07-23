import { useState, useRef } from 'react';
import { X, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CollectionDropdown } from '@/components/collections/CollectionDropdown';
import type { UserMovie } from '@/services/movie.service';

interface MovieCardProps {
  userMovie: UserMovie;
  onRemoveFromWatched?: (movieId: number) => void;
  onRemoveFromWatchlist?: (movieId: number) => void;
  onMarkAsWatched?: (movieId: number) => void;
  isWatchlistView?: boolean;
}

const MovieCard = ({
  userMovie,
  onRemoveFromWatched,
  onRemoveFromWatchlist,
  onMarkAsWatched,
  isWatchlistView = false,
}: MovieCardProps) => {
  const { movie, rating: userRating } = userMovie;
  const navigate = useNavigate();
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder-movie.jpg';

  // Convert user rating from 10-point scale to 5-star scale, or show no rating
  const displayRating = userRating ? (userRating / 2).toFixed(1) : null;

  return (
    <div
      className='relative group cursor-pointer'
      onClick={() => {
        if (!showCollectionDropdown) {
          navigate(`/movies/${movie.tmdb_id}`);
        }
      }}>
      {/* Action Buttons - Appear on hover from behind */}
      <div className='absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-300 ease-out'>
        <div className='flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-full px-3 py-2 border border-white/20'>
          {isWatchlistView ? (
            <>
              {/* Remove from Watchlist */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromWatchlist?.(movie.id);
                }}
                className='p-1 rounded-full hover:bg-white/20 transition-colors duration-200'
                title='Remove from watchlist'>
                <X className='w-4 h-4 text-white' />
              </button>

              {/* Mark as Watched */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsWatched?.(movie.id);
                }}
                className='p-1 rounded-full hover:bg-white/20 transition-colors duration-200'
                title='Mark as watched'>
                <Eye className='w-4 h-4 text-white' />
              </button>
            </>
          ) : (
            /* Remove from Watched */
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromWatched?.(movie.id);
              }}
              className='p-1 rounded-full hover:bg-white/20 transition-colors duration-200'
              title='Remove from watched'>
              <X className='w-4 h-4 text-white' />
            </button>
          )}

          {/* Add to Collection */}
          <button
            ref={plusButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowCollectionDropdown(true);
            }}
            className='p-1 rounded-full hover:bg-white/20 transition-colors duration-200'
            title='Add to collection'>
            <Plus className='w-4 h-4 text-white' />
          </button>
        </div>
      </div>

      {/* Movie Card - Moves down slightly on hover to accommodate buttons */}
      <div className='relative overflow-hidden bg-slate-900 rounded transition-all duration-500 hover:shadow-cyan-500/25 group-hover:translate-y-1'>
        {/* Poster Image */}
        <div className='aspect-[2/3] overflow-hidden bg-slate-800'>
          <img
            src={imageUrl}
            alt={movie.title}
            className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
            loading='lazy'
          />

          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60' />
        </div>

        {/* Rating Badge - Top Left with Glass Effect (only show if user has rated) */}
        {displayRating && (
          <div className='absolute top-2 left-2'>
            <div className='flex items-center space-x-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/20'>
              <span className='text-white font-medium text-xs'>
                ⭐ {displayRating}
              </span>
            </div>
          </div>
        )}

        {/* Movie Info - Bottom */}
        <div className='absolute bottom-0 left-0 right-0 p-2'>
          <h3 className='text-white font-medium text-xs leading-tight mb-1 drop-shadow-lg'>
            {movie.title}
          </h3>
        </div>
      </div>

      {/* Collection Dropdown */}
      {showCollectionDropdown && (
        <CollectionDropdown
          isOpen={showCollectionDropdown}
          onClose={() => setShowCollectionDropdown(false)}
          movie={movie}
          position={{
            top: plusButtonRef.current
              ? plusButtonRef.current.getBoundingClientRect().bottom + 8
              : undefined,
            left: plusButtonRef.current
              ? plusButtonRef.current.getBoundingClientRect().left
              : undefined,
          }}
        />
      )}
    </div>
  );
};

export default MovieCard;
