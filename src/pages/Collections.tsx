import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Plus, Folder } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  collectionService,
  type Collection,
} from '@/services/collection.service';
import { CollectionModal } from '@/components/collections/CollectionModal';

const Collections = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user collections
  const {
    data: collections = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-collections', user?.id],
    queryFn: () => collectionService.getUserCollections(user!.id),
    enabled: !!user?.id,
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: (
      data: Parameters<typeof collectionService.createCollection>[1]
    ) => collectionService.createCollection(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      setIsModalOpen(false);
    },
  });

  // Split collections by type
  const rankedCollections = collections.filter((c) => c.is_ranked);
  const unrankedCollections = collections.filter((c) => !c.is_ranked);

  console.log('Collections data:', {
    collections,
    rankedCollections,
    unrankedCollections,
  });

  if (!user) {
    return (
      <div className='space-y-8 animate-fade-in'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Collections</h1>
          <p className='text-secondary mt-2'>
            Please log in to view your collections
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Collections</h1>
          <p className='text-secondary mt-2'>
            Organize your favorite movies into themed collections
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className='p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors'>
          <Plus className='w-5 h-5 text-primary' />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='bg-surface-hover animate-pulse rounded-lg h-20'
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className='p-8 text-center'>
          <p className='text-secondary'>
            Error loading collections:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && collections.length === 0 && (
        <Card className='p-12 text-center'>
          <Folder className='w-16 h-16 text-tertiary mx-auto mb-4' />
          <h3 className='text-lg font-semibold mb-2'>No collections yet</h3>
          <p className='text-secondary mb-6'>
            Create your first collection to organize your favorite movies
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors'>
            Create Collection
          </button>
        </Card>
      )}

      {/* Ranked Collections Section */}
      {!isLoading && rankedCollections.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold mb-4 text-primary'>
            Ranked Collections
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {rankedCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onNavigate={(id) => navigate(`/collections/${id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Non-Ranked Collections Section */}
      {!isLoading && unrankedCollections.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold mb-4 text-primary'>
            Non-Ranked Collections
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {unrankedCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onNavigate={(id) => navigate(`/collections/${id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Collection Creation Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await createCollectionMutation.mutateAsync(data);
        }}
        title='Create New Collection'
      />
    </div>
  );
};

// Collection Card Component
interface CollectionCardProps {
  collection: Collection;
  onNavigate: (id: string) => void;
}

function CollectionCard({ collection, onNavigate }: CollectionCardProps) {
  const handleClick = () => {
    console.log('Collection card clicked:', {
      id: collection.id,
      name: collection.name,
    });
    onNavigate(collection.id);
  };

  return (
    <Card hover className='cursor-pointer' onClick={handleClick}>
      <div className='flex items-center gap-4'>
        <div className='p-3 bg-primary/5 rounded-lg'>
          <Folder className='w-6 h-6 text-primary' />
        </div>
        <div className='flex-1 min-w-0'>
          <h3 className='font-semibold truncate'>{collection.name}</h3>
          <p className='text-sm text-secondary'>
            {collection._count?.collection_items || 0} movies
            {collection.is_ranked && ' • Ranked'}
          </p>
          {collection.description && (
            <p className='text-xs text-tertiary truncate mt-1'>
              {collection.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

export default Collections;
