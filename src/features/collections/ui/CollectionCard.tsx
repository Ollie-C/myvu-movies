import { ChartBar } from 'lucide-react';

// Collections
import { Card } from '@/shared/ui/Card';

// Schemas
import type { CollectionPreview } from '@/features/collections/models/collection-combined.schema';

// Components
import MovieCollectionPreview from './CollectionPreview';

interface CollectionCardProps {
  collection: CollectionPreview;
  onNavigate: (id: string) => void;
  previewSize?: 'small' | 'medium' | 'large';
}

const CollectionCard = ({
  collection,
  onNavigate,
  previewSize = 'medium',
}: CollectionCardProps) => {
  const handleClick = () => {
    onNavigate(collection.id);
  };

  const itemCount = collection._count?.collection_items || 0;
  const hasItems = collection.collection_items.length > 0;

  return (
    <Card
      className='cursor-pointer relative overflow-hidden hover:shadow-lg transition-shadow'
      onClick={handleClick}>
      <div className='flex items-stretch gap-4 p-4'>
        <div className='flex-1 min-w-0'>
          <MovieCollectionPreview
            collectionTitle={collection.name}
            movies={collection.collection_items.map((item) => ({
              id: item.movie_uuid || '',
              poster_path: item.poster_path || '',
              title: item.title || '',
              size: previewSize,
            }))}
            onCollectionClick={handleClick}
            size={previewSize}
          />
        </div>
        <div className='w-1/3 min-w-[180px] flex flex-col justify-center'>
          <h3 className='text-base font-semibold truncate'>
            {collection.name}
          </h3>
          <p className='text-xs text-secondary mb-2'>{itemCount} movies</p>
          {collection.description && (
            <p className='text-sm text-secondary line-clamp-3'>
              {collection.description}
            </p>
          )}
          {!hasItems && (
            <p className='text-sm text-gray-400 italic mt-2'>No movies yet</p>
          )}
        </div>
      </div>

      {collection.is_ranked && (
        <div className='absolute top-3 right-3 z-10'>
          <div className='bg-amber-500 text-white p-1.5 rounded-full shadow-lg'>
            <ChartBar className='w-4 h-4' />
          </div>
        </div>
      )}
    </Card>
  );
};

export default CollectionCard;
