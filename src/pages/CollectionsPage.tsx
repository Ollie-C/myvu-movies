import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
import { Plus, Folder } from 'lucide-react';

// Hooks
import { useCollectionsWithPreviews } from '@/utils/hooks/supabase/useCollections';
import { useCreateCollection } from '@/utils/hooks/supabase/mutations/useCollectionMutations';
import { useAuth } from '@/context/AuthContext';

// Components
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { CollectionModal } from '@/components/collections/CollectionModal';
import CollectionCard from '@/components/collections/CollectionCard';
import Loader from '@/components/common/Loader';

const Collections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'name'>(
    'updated_at'
  );

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

  const filteredCollections = useMemo(() => {
    const list = [...collections];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list.splice(
        0,
        list.length,
        ...list.filter((c) => c.name.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      return String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [collections, searchQuery, sortBy]);

  return (
    <div className='container mx-auto px-4 py-8 animate-fade-in'>
      {/* Hero / Header */}
      <div className='mb-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-gray-900'>
              Collections
            </h1>
            <p className='text-sm text-gray-600 mt-1'>
              Organize movies into shareable sets
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className='inline-flex items-center gap-2'>
            <Plus className='w-4 h-4' /> New collection
          </Button>
        </div>
        <div className='mt-4 flex flex-col sm:flex-row gap-3'>
          <div className='flex-1'>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search collections...'
              className='h-10'
            />
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className='h-10 px-3 border border-gray-300 rounded-lg bg-white text-sm inline-flex items-center'>
              <option value='updated_at'>Recently updated</option>
              <option value='created_at'>Recently created</option>
              <option value='name'>Name</option>
            </select>
          </div>
        </div>
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
      {!isLoading && filteredCollections.length > 0 && (
        <>
          <div className='text-sm text-gray-500 mb-3'>
            {filteredCollections.length} collection
            {filteredCollections.length === 1 ? '' : 's'}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onNavigate={(id) => navigate(`/collections/${id}`)}
                previewSize='medium'
              />
            ))}
          </div>
        </>
      )}

      {/* Collection Creation Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          // Ensure correct shape for create
          await createCollectionMutation.mutateAsync(
            'user_id' in (data as any) ? (data as any) : (data as any)
          );
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Collections;
