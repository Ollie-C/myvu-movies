import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Trophy, Swords, Grid3x3, ListOrdered } from 'lucide-react';

const Rankings = () => {
  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-primary'>Rankings</h1>
        <p className='text-secondary mt-2'>
          Create and manage your movie rankings using different methods
        </p>
      </div>

      {/* Ranking Methods */}
      <div>
        <h2 className='text-xl font-semibold mb-4'>Choose a Ranking Method</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card hover className='cursor-pointer'>
            <div className='text-center py-4'>
              <div className='p-4 bg-primary/5 rounded-lg inline-block mb-4'>
                <Swords className='w-8 h-8 text-primary' />
              </div>
              <h3 className='font-semibold text-lg mb-2'>Versus Mode</h3>
              <p className='text-secondary text-sm mb-4'>
                Compare movies head-to-head in battles
              </p>
              <Button size='sm' className='w-full'>
                Start Battle
              </Button>
            </div>
          </Card>

          <Card hover className='cursor-pointer'>
            <div className='text-center py-4'>
              <div className='p-4 bg-primary/5 rounded-lg inline-block mb-4'>
                <Grid3x3 className='w-8 h-8 text-primary' />
              </div>
              <h3 className='font-semibold text-lg mb-2'>Tier List</h3>
              <p className='text-secondary text-sm mb-4'>
                Organize movies into S, A, B, C, D, F tiers
              </p>
              <Button size='sm' className='w-full'>
                Create Tier List
              </Button>
            </div>
          </Card>

          <Card hover className='cursor-pointer'>
            <div className='text-center py-4'>
              <div className='p-4 bg-primary/5 rounded-lg inline-block mb-4'>
                <ListOrdered className='w-8 h-8 text-primary' />
              </div>
              <h3 className='font-semibold text-lg mb-2'>Manual Ranking</h3>
              <p className='text-secondary text-sm mb-4'>
                Drag and drop to create ordered lists
              </p>
              <Button size='sm' className='w-full'>
                Create List
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Rankings */}
      <div>
        <h2 className='text-xl font-semibold mb-4'>Your Rankings</h2>
        <Card className='text-center py-12'>
          <Trophy className='w-12 h-12 text-tertiary mx-auto mb-4' />
          <h3 className='text-lg font-semibold mb-2'>No rankings yet</h3>
          <p className='text-secondary mb-6 max-w-sm mx-auto'>
            Choose a ranking method above to create your first movie ranking
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Rankings;
