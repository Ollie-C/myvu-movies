import { useState, useEffect, useRef } from 'react';
import { Plus, Check, Folder, FolderPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collectionService,
  type Collection,
} from '@/services/supabase/collection.service';
import { movieService } from '@/services/supabase/movies.service';
import { useAuth } from '@/context/AuthContext';
import { CollectionModal } from './CollectionModal';
import type { TMDBMovie } from '@/lib/api/tmdb';

interface CollectionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  movie:
    | TMDBMovie
    | {
        id: number;
        tmdb_id: number;
        title: string;
        poster_path: string | null;
      };
  position?: { top?: number; bottom?: number; left?: number; right?: number };
}

export function CollectionDropdown({
  isOpen,
  onClose,
  movie,
  position = { top: 0, left: 0 },
}: CollectionDropdownProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user collections
  const { data: collections = [] } = useQuery({
    queryKey: ['user-collections', user?.id],
    queryFn: () => collectionService.getUserCollections(user!.id),
    enabled: !!user?.id && isOpen,
  });

  // Get movie's current collections
  const { data: movieCollections = [] } = useQuery({
    queryKey: ['movie-collections', user?.id, movie.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First ensure movie is cached
      const cachedMovie = await movieService.cacheMovie(movie as TMDBMovie);
      return collectionService.getCollectionsWithMovie(user.id, cachedMovie.id);
    },
    enabled: !!user?.id && isOpen,
  });

  // Mutation for adding/removing movies from collections
  const toggleMovieInCollectionMutation = useMutation({
    mutationFn: async ({
      collectionId,
      inCollection,
    }: {
      collectionId: string;
      inCollection: boolean;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const cachedMovie = await movieService.cacheMovie(movie as TMDBMovie);

      if (inCollection) {
        await collectionService.removeMovieFromCollection(
          collectionId,
          cachedMovie.id
        );
      } else {
        await collectionService.addMovieToCollection(
          collectionId,
          cachedMovie.id
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      queryClient.invalidateQueries({ queryKey: ['movie-collections'] });
      // Also invalidate any collection details queries that might be open
      queryClient.invalidateQueries({ queryKey: ['collection-details'] });
      // Force refetch any open collection details
      queryClient.refetchQueries({ queryKey: ['collection-details'] });
    },
    onSettled: () => {
      setLoadingCollectionId(null);
    },
  });

  // Mutation for creating new collection
  const createCollectionMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof collectionService.createCollection>[1]
    ) => collectionService.createCollection(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      setIsModalOpen(false);
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleToggleCollection = async (
    collectionId: string,
    inCollection: boolean
  ) => {
    console.log('Toggling collection:', {
      collectionId,
      inCollection,
      movieId: movie.id,
    });
    setLoadingCollectionId(collectionId);
    await toggleMovieInCollectionMutation.mutateAsync({
      collectionId,
      inCollection,
    });
  };

  if (!isOpen) return null;

  const isMovieInCollection = (collectionId: string) => {
    return (
      movieCollections.find((mc) => mc.collection.id === collectionId)
        ?.inCollection || false
    );
  };

  return (
    <>
      <div
        ref={dropdownRef}
        className='fixed z-50 bg-surface border border-border rounded-lg shadow-2xl min-w-[240px] max-w-[300px]'
        style={{
          top: position.top,
          bottom: position.bottom,
          left: position.left,
          right: position.right,
        }}>
        <div className='p-3 border-b border-border'>
          <h3 className='font-medium text-primary text-sm'>
            Add to Collection
          </h3>
          <p className='text-xs text-secondary truncate'>{movie.title}</p>
        </div>

        <div className='max-h-64 overflow-y-auto'>
          {collections.length === 0 ? (
            <div className='p-4 text-center text-secondary'>
              <p className='text-sm'>No collections yet</p>
            </div>
          ) : (
            <div className='py-2'>
              {collections.map((collection) => {
                const inCollection = isMovieInCollection(collection.id);
                const isLoading = loadingCollectionId === collection.id;

                return (
                  <button
                    key={collection.id}
                    onClick={() =>
                      handleToggleCollection(collection.id, inCollection)
                    }
                    disabled={isLoading}
                    className='w-full px-4 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 disabled:opacity-50'>
                    <div className='flex-shrink-0'>
                      {inCollection ? (
                        <Check className='w-4 h-4 text-green-600' />
                      ) : (
                        <Folder className='w-4 h-4 text-secondary' />
                      )}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-sm text-primary truncate'>
                        {collection.name}
                      </p>
                      <p className='text-xs text-secondary'>
                        {collection._count?.collection_items || 0} movies
                        {collection.is_ranked && ' • Ranked'}
                      </p>
                    </div>

                    {isLoading && (
                      <div className='w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin' />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className='p-2 border-t border-border'>
          <button
            onClick={() => setIsModalOpen(true)}
            className='w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 rounded'>
            <FolderPlus className='w-4 h-4 text-primary' />
            <span className='font-medium text-sm text-primary'>
              Create New Collection
            </span>
          </button>
        </div>
      </div>

      {/* Collection Creation Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await createCollectionMutation.mutateAsync(data);
        }}
        title='Create New Collection'
      />
    </>
  );
}
