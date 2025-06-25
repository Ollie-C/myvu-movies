import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Plus, Folder } from 'lucide-react';

const Collections = () => {
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
        <Button>
          <Plus className='w-4 h-4 mr-2' />
          New Collection
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Card hover className='cursor-pointer'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <Folder className='w-6 h-6 text-primary' />
            </div>
            <div>
              <h3 className='font-semibold'>All-Time Favorites</h3>
              <p className='text-sm text-secondary'>0 movies</p>
            </div>
          </div>
        </Card>

        <Card hover className='cursor-pointer'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <Folder className='w-6 h-6 text-primary' />
            </div>
            <div>
              <h3 className='font-semibold'>Must Watch Again</h3>
              <p className='text-sm text-secondary'>0 movies</p>
            </div>
          </div>
        </Card>

        <Card
          hover
          className='cursor-pointer border-2 border-dashed border-border bg-transparent'>
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <Plus className='w-6 h-6 text-primary' />
            </div>
            <div>
              <h3 className='font-semibold'>Create Collection</h3>
              <p className='text-sm text-secondary'>Start organizing</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className='text-center py-12'>
        <Folder className='w-12 h-12 text-tertiary mx-auto mb-4' />
        <h3 className='text-lg font-semibold mb-2'>No collections yet</h3>
        <p className='text-secondary mb-6 max-w-sm mx-auto'>
          Create your first collection to start organizing your favorite movies
        </p>
        <Button>Create Your First Collection</Button>
      </Card>
    </div>
  );
};

export default Collections;
