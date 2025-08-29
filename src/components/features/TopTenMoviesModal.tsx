// AUDITED 11/08/2025

import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useAllUserMovies } from '@/utils/hooks/supabase/useUserMovies';
import { useFavoriteMovies } from '@/utils/hooks/supabase/useWatchedMovies';
import { useToggleFavorite } from '@/utils/hooks/supabase/mutations/useWatchedMovieMutations';
import { Input } from '@/components/common/Input';
import MoviePoster from '@/components/movie/MoviePoster';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

interface TopTenMoviesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TopTenMoviesModal = ({ isOpen, onClose }: TopTenMoviesModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allUserMovies = [] } = useAllUserMovies();
  const { data: currentFavorites = [] } = useFavoriteMovies(50);
  const toggleFavoriteMutation = useToggleFavorite();

  const watchedMovies = allUserMovies.filter(
    (userMovie) => userMovie.type === 'watched'
  ) as WatchedMovieWithMovie[];
  const filteredMovies = watchedMovies.filter((userMovie) =>
    userMovie.movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteMovieIds = new Set(currentFavorites.map((fav) => fav.movie.id));

  const handleToggleFavorite = async (movieId: number) => {
    try {
      await toggleFavoriteMutation.mutateAsync(movieId);
      // Optional: could log a top_ten_changed aggregate in the future
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Edit Favorite Movies
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Search Bar */}
        <div className='p-6 border-b border-gray-200 flex-shrink-0'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <Input
              type='search'
              placeholder='Search your movies...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10 w-full'
            />
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
          {/* Top Section - Current Favorites */}
          <div className='p-6 border-b border-gray-200 flex-shrink-0'>
            <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
              Top 10{' '}
              <span className='text-sm text-gray-500'>
                ({currentFavorites.length}/10)
              </span>
            </h3>
            {currentFavorites.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-1'>
                {currentFavorites.map((userMovie, index) => (
                  <MoviePoster
                    key={`favorite-${userMovie.movie.id}-${index}`}
                    userMovie={userMovie}
                    onClick={() => handleToggleFavorite(userMovie.movie.id)}
                    className='w-full h-auto hover:opacity-75 transition-opacity'
                  />
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-center py-8'>
                No favorite movies yet
              </p>
            )}
          </div>

          {/* Bottom Section - Remaining Movies - Scrollable */}
          <div className='flex-1 flex flex-col overflow-hidden'>
            <div className='p-6 border-b border-gray-200 flex-shrink-0'>
              <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
                Select from your library
              </h3>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
              {filteredMovies.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-1'>
                  {filteredMovies
                    .filter(
                      (userMovie) => !favoriteMovieIds.has(userMovie.movie.id)
                    )
                    .map((userMovie, index) => {
                      const isAtLimit = currentFavorites.length >= 10;
                      return (
                        <MoviePoster
                          key={`available-${userMovie.movie.id}-${index}`}
                          userMovie={userMovie as WatchedMovieWithMovie}
                          disabled={isAtLimit}
                          onClick={() => {
                            if (!isAtLimit) {
                              handleToggleFavorite(userMovie.movie.id);
                            }
                          }}
                          className={`w-full h-auto transition-opacity ${
                            isAtLimit
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:opacity-75 cursor-pointer'
                          }`}
                        />
                      );
                    })}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-8'>
                  {searchQuery
                    ? 'No movies found matching your search'
                    : 'No movies in your library'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0'>
          <div className='flex justify-between items-center'>
            <p className='text-sm text-gray-600'>
              You can have up to 10 favorite movies
            </p>
            <button
              onClick={onClose}
              className='px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors'>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopTenMoviesModal;
