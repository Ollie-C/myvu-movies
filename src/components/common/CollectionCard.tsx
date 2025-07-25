import { Card } from './Card';
import {
  type Collection,
  type CollectionWithItems,
} from '@/services/supabase/collection.service';
import { ChartBar } from 'lucide-react';
import MovieCollectionPreview from './MovieCollectionPreview';

interface CollectionCardProps {
  collection: Collection | CollectionWithItems;
  onNavigate: (id: string) => void;
  previewSize?: 'small' | 'medium' | 'large';
}

const CollectionCard = ({
  collection,
  onNavigate,
  previewSize = 'medium',
}: CollectionCardProps) => {
  const handleClick = () => {
    console.log('Collection card clicked:', {
      id: collection.id,
      name: collection.name,
    });
    onNavigate(collection.id);
  };

  // Type guard to check if we have collection items
  const hasItems = 'collection_items' in collection;
  const itemCount = hasItems
    ? collection.collection_items.length
    : collection._count?.collection_items || 0;

  console.log('collection', collection);

  return (
    <Card
      className='cursor-pointer relative overflow-hidden'
      onClick={handleClick}>
      {/* Content layout depends on whether we have preview data */}
      {hasItems && collection.collection_items.length > 0 ? (
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <MovieCollectionPreview
              collectionTitle={collection.name}
              // movies={collection.collection_items.map((item) => item.movie)}
              movies={[]}
              onCollectionClick={handleClick}
              size={previewSize}
            />
          </div>
          <div className='w-1/4 p-4'>
            <h3 className='text-xl font-semibold mb-2'>{collection.name}</h3>
            <p className='text-sm text-secondary mb-1'>{itemCount} movies</p>
            {collection.description && (
              <p className='text-sm text-secondary line-clamp-2'>
                {collection.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className='p-6'>
          <h3 className='text-xl font-semibold mb-2'>{collection.name}</h3>
          <p className='text-sm text-secondary mb-1'>{itemCount} movies</p>
          {collection.description && (
            <p className='text-sm text-secondary mb-2'>
              {collection.description}
            </p>
          )}
          {itemCount === 0 && (
            <p className='text-sm text-gray-400 italic mt-4'>
              No movies in collection yet
            </p>
          )}
        </div>
      )}

      {/* Ranked indicator */}
      {collection.is_ranked && (
        <div className='absolute top-4 right-4 z-10'>
          <div className='bg-amber-500 text-white p-1.5 rounded-full shadow-lg'>
            <ChartBar className='w-4 h-4' />
          </div>
        </div>
      )}
    </Card>
  );
};

export default CollectionCard;
