import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Search, Filter } from 'lucide-react';

const Movies = () => {
  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-primary'>Movies</h1>
        <p className='text-secondary mt-2'>
          Discover and add movies to your collection
        </p>
      </div>

      {/* Search Bar */}
      <div className='flex gap-4'>
        <div className='flex-1'>
          <Input
            type='search'
            placeholder='Search for movies...'
            leftIcon={<Search className='w-5 h-5' />}
          />
        </div>
        <Button variant='secondary'>
          <Filter className='w-4 h-4 mr-2' />
          Filters
        </Button>
      </div>

      {/* Movie Grid Placeholder */}
      <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6'>
        {[...Array(12)].map((_, i) => (
          <div key={i} className='space-y-2'>
            <div className='aspect-[2/3] bg-surface rounded-lg animate-pulse' />
            <div className='h-4 bg-surface rounded animate-pulse' />
            <div className='h-3 bg-surface rounded w-2/3 animate-pulse' />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Movies;
