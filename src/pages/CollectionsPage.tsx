// AUDITED 06/08/2025
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import { Plus, Folder } from 'lucide-react';

// Hooks
import { useCollectionsWithPreviews } from '@/utils/hooks/supabase/queries/useCollections';
import { useCreateCollection } from '@/utils/hooks/supabase/mutations/useCollectionMutations';
import { useAuth } from '@/context/AuthContext';

// Components
import { Card } from '@/components/common/Card';
import { CollectionModal } from '@/components/collections/CollectionModal';
import CollectionCard from '@/components/collections/CollectionCard';
import Loader from '@/components/common/Loader';

const Collections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: collections = [],
    isLoading,
    error,
  } = useCollectionsWithPreviews(20);

  const createCollectionMutation = useCreateCollection();

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
    <div className='container mx-auto px-4 py-8 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Collections</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className='p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors'>
          <Plus className='w-5 h-5 text-primary' />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && <Loader />}

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

      {/* All Collections */}
      {!isLoading && collections.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onNavigate={(id) => navigate(`/collections/${id}`)}
              previewSize='medium'
            />
          ))}
        </div>
      )}

      {/* Collection Creation Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          await createCollectionMutation.mutateAsync(data);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Collections;
