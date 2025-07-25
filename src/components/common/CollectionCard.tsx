import { Card } from './Card';
import { type CollectionWithItems } from '@/services/collection.service';
import { ChartBar } from 'lucide-react';
import MovieCollectionPreview from './MovieCollectionPreview';

// Collection Card Component
interface CollectionCardProps {
  collection: CollectionWithItems;
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

  console.log('collection', collection);

  return (
    <Card
      className='cursor-pointer relative flex items-center justify-between h-50'
      onClick={handleClick}>
      {/* Ranked/Non-ranked tag */}
      <div className='absolute top-2 right-2 z-10'>
        {collection.is_ranked && (
          <div className='bg-amber-500 text-white p-1 rounded-full shadow-lg'>
            <ChartBar className='w-4 h-4' />
          </div>
        )}
      </div>
      {collection.collection_items.length > 0 ? (
        <MovieCollectionPreview
          collectionTitle={collection.name}
          movies={collection.collection_items.map((item) => item.movie) as any}
          onCollectionClick={handleClick}
          size={previewSize}
        />
      ) : (
        <p className='text-sm text-secondary'>No movies in collection</p>
      )}

      <div className='w-1/4'>
        {' '}
        <h3 className='text-xl font-semibold mb-4'>{collection.name}</h3>
        <p className='text-sm text-secondary'>
          {collection._count?.collection_items || 0} movies
        </p>
        <p className='text-sm text-secondary'>{collection.description}</p>
      </div>
    </Card>
  );
};

export default CollectionCard;
