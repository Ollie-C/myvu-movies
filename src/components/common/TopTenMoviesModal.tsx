import React, { useState } from 'react';
import { X, Search, Heart } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { movieService } from '@/services/movie.service';
import { useAuth } from '@/lib/utils/hooks/useAuth';
import { Input } from './Input';
import TopTenMovieCard from '../moviecard/TopTenMovieCard';

interface TopTenMoviesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TopTenMoviesModal = ({ isOpen, onClose }: TopTenMoviesModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all user movies for search
  const { data: allUserMovies = [] } = useQuery({
    queryKey: ['all-user-movies', user?.id],
    queryFn: () => userService.getAllUserMovies(user?.id || ''),
    enabled: !!user?.id && isOpen,
  });

  // Fetch current favorite movies
  const { data: currentFavorites = [] } = useQuery({
    queryKey: ['favorite-movies', user?.id],
    queryFn: () => userService.getFavoriteMovies(user?.id || '', 50), // Get more for editing
    enabled: !!user?.id && isOpen,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({
      movieId,
      isFavorite,
    }: {
      movieId: number;
      isFavorite: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return movieService.toggleFavorite(user.id, movieId, isFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['favorite-movies', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['all-user-movies', user?.id],
      });
    },
  });

  // Filter movies based on search query
  const filteredMovies = allUserMovies.filter((userMovie: any) =>
    userMovie.movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current favorite movie IDs for quick lookup
  const favoriteMovieIds = new Set(currentFavorites.map((fav) => fav.movie.id));

  const handleToggleFavorite = (movieId: number, isFavorite: boolean) => {
    toggleFavoriteMutation.mutate({ movieId, isFavorite });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
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
        <div className='p-6 border-b border-gray-200'>
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

        {/* Content */}
        <div className='flex-1 flex flex-col overflow-hidden p-6 min-h-0'>
          {/* Top Section - Current Favorites */}
          <div className='mb-6 flex flex-col items-center justify-center'>
            <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
              Top 10{' '}
              <span className='text-sm text-gray-500'>
                ({currentFavorites.length}/10)
              </span>
            </h3>
            {currentFavorites.length > 0 ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-1'>
                {currentFavorites.map((userMovie: any) => (
                  <TopTenMovieCard
                    key={userMovie.movie.id}
                    userMovie={userMovie}
                    onClick={() =>
                      handleToggleFavorite(userMovie.movie.id, false)
                    }
                  />
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-center py-8'>
                No favorite movies yet
              </p>
            )}
          </div>

          {/* Bottom Section - Remaining Movies */}
          <div className='flex-1 flex flex-col'>
            <h3 className='text-lg font-medium text-gray-900 mb-4 text-center'>
              Select from your library
            </h3>
            <div className='flex-1 overflow-y-auto'>
              {filteredMovies.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-1'>
                  {filteredMovies
                    .filter(
                      (userMovie: any) =>
                        !favoriteMovieIds.has(userMovie.movie.id)
                    )
                    .map((userMovie: any) => {
                      const isAtLimit = currentFavorites.length >= 10;
                      return (
                        <TopTenMovieCard
                          key={userMovie.movie.id}
                          userMovie={userMovie}
                          disabled={isAtLimit}
                          onClick={() => {
                            if (!isAtLimit) {
                              handleToggleFavorite(userMovie.movie.id, true);
                            }
                          }}
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
        <div className='p-6 border-t border-gray-200 bg-gray-50'>
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
