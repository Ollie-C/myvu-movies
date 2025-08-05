// NOT AUDITED

import { Card } from '../common/Card';
import type { CollectionPreview } from '@/schemas/collection-combined.schema';
import { ChartBar } from 'lucide-react';
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

  // console.log('collection', collection);

  return (
    <Card
      className='cursor-pointer relative overflow-hidden'
      onClick={handleClick}>
      {/* Content layout depends on whether we have preview data */}
      {hasItems ? (
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <MovieCollectionPreview
              collectionTitle={collection.name}
              movies={collection.collection_items.map((item) => ({
                id: item.movie.id.toString(),
                poster_path: item.movie.poster_path || '',
                title: item.movie.title,
                size: previewSize,
              }))}
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
