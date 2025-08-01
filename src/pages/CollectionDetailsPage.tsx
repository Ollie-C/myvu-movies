import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Trash2, Users, Calendar, X } from 'lucide-react';
import {
  collectionService,
  type CollectionWithItems,
} from '@/services/supabase/collection.service';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import MovieCard from '@/components/movie/MovieCard';
import { CollectionModal } from '@/components/collections/CollectionModal';

const CollectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Validate the collection ID (UUID format)
  const collectionId = id || null;
  const isValidId =
    collectionId && typeof collectionId === 'string' && collectionId.length > 0;

  console.log('URL params:', { id, collectionId, isValidId });

  // Fetch collection details
  const {
    data: collection,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['collection-details', collectionId],
    queryFn: () => collectionService.getCollection(collectionId!),
    enabled: !!isValidId,
    refetchOnWindowFocus: false,
  });

  console.log('CollectionDetails query state:', {
    collectionId,
    isValidId,
    isLoading,
    hasData: !!collection,
    movieCount: collection?.collection_items?.length || 0,
  });

  // Update collection mutation
  const updateCollectionMutation = useMutation({
    mutationFn: (
      updates: Parameters<typeof collectionService.updateCollection>[1]
    ) => collectionService.updateCollection(collectionId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-details', collectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      setIsEditModalOpen(false);
    },
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: () => collectionService.deleteCollection(collectionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      navigate('/collections');
    },
  });

  // Remove movie from collection mutation
  const removeMovieMutation = useMutation({
    mutationFn: (movieId: number) =>
      collectionService.removeMovieFromCollection(collectionId!, movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['collection-details', collectionId],
      });
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
    },
  });

  const handleDeleteCollection = async () => {
    await deleteCollectionMutation.mutateAsync();
    setShowDeleteConfirm(false);
  };

  const handleRemoveMovie = async (movieId: number) => {
    await removeMovieMutation.mutateAsync(movieId);
  };

  // Handle invalid collection ID
  if (!isValidId) {
    return (
      <div className='space-y-6 animate-fade-in'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/collections')}
          className='flex items-center gap-2'>
          <ArrowLeft className='w-4 h-4' />
          Back to Collections
        </Button>

        <Card className='p-12 text-center'>
          <h2 className='text-xl font-bold mb-2'>Invalid Collection</h2>
          <p className='text-secondary mb-6'>
            The collection ID in the URL is not valid.
          </p>
          <Button onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-6 animate-fade-in'>
        {/* Header Skeleton */}
        <div className='space-y-4'>
          <div className='h-8 bg-surface-hover animate-pulse rounded w-1/4'></div>
          <div className='h-6 bg-surface-hover animate-pulse rounded w-1/2'></div>
          <div className='h-4 bg-surface-hover animate-pulse rounded w-3/4'></div>
        </div>

        {/* Grid Skeleton */}
        <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9 gap-4'>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className='bg-surface-hover animate-pulse rounded-lg aspect-[2/3]'></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className='space-y-6 animate-fade-in'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/collections')}
          className='flex items-center gap-2'>
          <ArrowLeft className='w-4 h-4' />
          Back to Collections
        </Button>

        <Card className='p-12 text-center'>
          <h2 className='text-xl font-bold mb-2'>Collection not found</h2>
          <p className='text-secondary mb-6'>
            This collection doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </Card>
      </div>
    );
  }

  // Check if user owns this collection
  const isOwner = user?.id === collection.user_id;

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Back Button */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => navigate('/collections')}
        className='flex items-center gap-2'>
        <ArrowLeft className='w-4 h-4' />
        Back to Collections
      </Button>

      {/* Collection Header */}
      <div className='flex items-start justify-between'>
        <div className='flex-1 min-w-0'>
          <h1 className='text-3xl font-bold text-primary mb-2'>
            {collection.name}
          </h1>

          {collection.description && (
            <p className='text-secondary mb-4 leading-relaxed'>
              {collection.description}
            </p>
          )}

          <div className='flex items-center gap-6 text-sm text-secondary'>
            <div className='flex items-center gap-2'>
              <Users className='w-4 h-4' />
              <span>{collection.collection_items?.length || 0} movies</span>
            </div>

            {collection.is_ranked && (
              <div className='flex items-center gap-2'>
                <span className='w-2 h-2 bg-primary rounded-full'></span>
                <span>Ranked Collection</span>
              </div>
            )}

            <div className='flex items-center gap-2'>
              <Calendar className='w-4 h-4' />
              <span>
                Created {new Date(collection.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Collection Actions */}
        {isOwner && (
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setIsEditModalOpen(true)}
              className='flex items-center gap-2'>
              <Edit2 className='w-4 h-4' />
              Edit
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowDeleteConfirm(true)}
              className='flex items-center gap-2 text-red-600 hover:bg-red-50'>
              <Trash2 className='w-4 h-4' />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {(!collection.collection_items ||
        collection.collection_items.length === 0) && (
        <Card className='p-12 text-center'>
          <div className='w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4'>
            <Users className='w-8 h-8 text-tertiary' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>No movies yet</h3>
          <p className='text-secondary mb-6'>
            Add movies to this collection by clicking the + button on movie
            cards.
          </p>
          <Button onClick={() => navigate('/movies')}>Browse Movies</Button>
        </Card>
      )}

      {/* Movies Grid */}
      {collection.collection_items &&
        collection.collection_items.length > 0 && (
          <div className='space-y-4'>
            <h2 className='text-xl font-semibold text-primary'>
              Movies {collection.is_ranked && '(Ranked Order)'}
            </h2>

            <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-9 gap-4'>
              {collection.collection_items
                .sort((a, b) => (a.position || 0) - (b.position || 0))
                .map((item) => (
                  <div key={item.id} className='relative group'>
                    {/* Remove from collection button */}
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveMovie(item.movie.id)}
                        className='absolute -top-2 -right-2 z-20 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                        title='Remove from collection'>
                        <X className='w-3 h-3' />
                      </button>
                    )}

                    {/* Position indicator for ranked collections */}
                    {collection.is_ranked && item.position && (
                      <div className='absolute top-2 left-2 z-10 bg-black/80 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center'>
                        {item.position}
                      </div>
                    )}

                    {/* Movie Card - Convert collection item to UserMovie format */}
                    <MovieCard
                      userMovie={{
                        user_id: collection.user_id,
                        movie_id: item.movie.id,
                        rating: null, // Collection items don't have ratings
                        watched: false,
                        watched_date: null,
                        watch_list: false,
                        watchlist_added_date: null,
                        favorite: false,
                        notes: null,
                        created_at: item.added_at,
                        updated_at: item.added_at,
                        movie: {
                          ...item.movie,
                          original_language: null,
                          original_title: null,
                          popularity: null,
                        },
                      }}
                      isWatchlistView={false}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Edit Collection Modal */}
      <CollectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (data) => {
          await updateCollectionMutation.mutateAsync(data);
        }}
        collection={collection}
        title='Edit Collection'
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            onClick={() => setShowDeleteConfirm(false)}
          />

          <div className='relative bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6'>
            <h3 className='text-lg font-bold text-primary mb-2'>
              Delete Collection
            </h3>
            <p className='text-secondary mb-6'>
              Are you sure you want to delete "{collection.name}"? This action
              cannot be undone.
            </p>

            <div className='flex gap-3'>
              <Button
                variant='secondary'
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteCollectionMutation.isPending}
                className='flex-1'>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCollection}
                disabled={deleteCollectionMutation.isPending}
                className='flex-1 bg-red-600 hover:bg-red-700 text-white'>
                {deleteCollectionMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetails;
