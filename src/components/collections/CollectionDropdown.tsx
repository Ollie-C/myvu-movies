import { useState, useEffect, useRef } from 'react';
import { Check, Folder, FolderPlus, AlertCircle } from 'lucide-react';
import { CollectionModal } from './CollectionModal';

import {
  useCollections,
  useCollectionsWithMovie,
} from '@/utils/hooks/supabase/useCollections';
import {
  useCreateCollection,
  useToggleMovieInCollection,
} from '@/utils/hooks/supabase/useCollectionMutations';
import type { CollectionInsert } from '@/schemas/collection.schema';
import type { OverlayMovie } from '@/components/movie/MovieCard/Overlay';

interface CollectionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  movie: OverlayMovie;
}

export function CollectionDropdown({
  isOpen,
  onClose,
  movie,
}: CollectionDropdownProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCollectionId, setLoadingCollectionId] = useState<string | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data: collections = [],
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useCollections({
    withCounts: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const movieUuid = movie.movie_id ?? undefined;

  const {
    data: movieCollections = [],
    isLoading: movieCollectionsLoading,
    error: movieCollectionsError,
  } = useCollectionsWithMovie(movieUuid);

  const createCollectionMutation = useCreateCollection();
  const toggleMovieInCollection = useToggleMovieInCollection();

  const handleToggleCollection = async (
    collectionId: string,
    movieUuid: string
  ) => {
    try {
      setLoadingCollectionId(collectionId);
      await toggleMovieInCollection.mutateAsync({
        collectionId,
        movie_uuid: movieUuid,
      });
    } catch (error) {
      console.error('Error toggling collection:', error);
    } finally {
      setLoadingCollectionId(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const isMovieInCollection = (collectionId: string) =>
    movieCollections.find((mc) => mc.collection.id === collectionId)
      ?.inCollection || false;

  if (!isOpen) return null;

  const hasError = collectionsError || movieCollectionsError;
  console.log('hasError', hasError);
  const isLoading = collectionsLoading || movieCollectionsLoading;

  return (
    <>
      <div
        ref={dropdownRef}
        className='relative z-50 bg-surface border border-border rounded-lg shadow-2xl min-w-[240px] max-w-[300px]'
        role='dialog'
        aria-modal='true'
        aria-labelledby='dropdown-title'>
        {/* Header */}
        <div className='p-3 border-b border-border'>
          <h3 id='dropdown-title' className='font-medium text-primary text-sm'>
            Add to Collection
          </h3>
          <p
            className='text-xs text-secondary truncate'
            title={movie.title || ''}>
            {movie.title}
          </p>
        </div>

        {/* Content */}
        <div className='max-h-64 overflow-y-auto'>
          {hasError ? (
            <div className='p-4 text-center'>
              <AlertCircle className='w-8 h-8 text-red-500 mx-auto mb-2' />
              <p className='text-sm text-red-600'>Failed to load collections</p>
            </div>
          ) : isLoading ? (
            <div className='p-4 text-center'>
              <div className='w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2' />
              <p className='text-sm text-secondary'>Loading collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className='p-4 text-center text-secondary'>
              <Folder className='w-8 h-8 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>No collections yet</p>
              <p className='text-xs mt-1'>Create your first collection below</p>
            </div>
          ) : (
            <div className='py-2'>
              {collections.map((collection) => {
                const inCollection = isMovieInCollection(collection.id);
                const isCollectionLoading =
                  loadingCollectionId === collection.id;

                return (
                  <button
                    key={collection.id}
                    onClick={() =>
                      movieUuid &&
                      handleToggleCollection(collection.id, movieUuid)
                    }
                    disabled={isCollectionLoading || !movieUuid}
                    className='w-full px-4 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed'
                    aria-pressed={inCollection}>
                    <div className='flex-shrink-0'>
                      {inCollection ? (
                        <Check
                          className='w-4 h-4 text-green-600'
                          aria-label='In collection'
                        />
                      ) : (
                        <Folder
                          className='w-4 h-4 text-secondary'
                          aria-label='Not in collection'
                        />
                      )}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-sm text-primary truncate'>
                        {collection.name}
                      </p>
                      <p className='text-xs text-secondary'>
                        {collection._count?.collection_items || 0} movies
                        {collection.is_ranked && ' • Ranked'}
                        {collection.is_public && ' • Public'}
                      </p>
                    </div>

                    {isCollectionLoading && (
                      <div
                        className='w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin'
                        aria-label='Updating collection'
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-2 border-t border-border'>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={createCollectionMutation.isPending}
            className='w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors flex items-center gap-3 rounded disabled:opacity-50 disabled:cursor-not-allowed'>
            <FolderPlus className='w-4 h-4 text-primary' />
            <span className='font-medium text-sm text-primary'>
              {createCollectionMutation.isPending
                ? 'Creating...'
                : 'Create New Collection'}
            </span>
          </button>
        </div>
      </div>

      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await createCollectionMutation.mutateAsync(data as CollectionInsert);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
