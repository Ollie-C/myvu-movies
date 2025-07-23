import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Plus, Trophy, ChevronRight } from 'lucide-react';
import { MoviePoster } from '@/components/common/MoviePoster';

const Rankings = () => {
  // Mock data for demonstration
  const toRankCollections = [
    {
      id: 1,
      title: 'Top Nolan Movies',
      movies: [
        { id: 1, title: 'Inception', poster_path: '/path1.jpg' },
        { id: 2, title: 'Interstellar', poster_path: '/path2.jpg' },
        { id: 3, title: 'The Dark Knight', poster_path: '/path3.jpg' },
        { id: 4, title: 'Dunkirk', poster_path: '/path4.jpg' },
        { id: 5, title: 'Memento', poster_path: '/path5.jpg' },
      ],
    },
    {
      id: 2,
      title: 'Best Sci-Fi Films',
      movies: [
        { id: 6, title: 'Blade Runner 2049', poster_path: '/path6.jpg' },
        { id: 7, title: 'Arrival', poster_path: '/path7.jpg' },
        { id: 8, title: 'Ex Machina', poster_path: '/path8.jpg' },
        { id: 9, title: 'Her', poster_path: '/path9.jpg' },
      ],
    },
  ];

  const completedRankings = [
    { id: 1, title: 'Marvel MCU Movies', count: 25, method: 'Versus Mode' },
    { id: 2, title: 'Tarantino Films', count: 8, method: 'Tier List' },
  ];

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Rankings</h1>
          <p className='text-secondary mt-2'>
            Create and manage your movie rankings
          </p>
        </div>
        <button className='p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors'>
          <Plus className='w-5 h-5 text-primary' />
        </button>
      </div>

      {/* To Rank Section - Main Focus */}
      <div>
        <h2 className='text-xl font-semibold mb-6 text-primary'>To Rank</h2>
        <div className='space-y-6'>
          {toRankCollections.map((collection) => (
            <div key={collection.id} className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-medium'>{collection.title}</h3>
                <Button size='sm' className='flex items-center gap-2'>
                  Continue Ranking
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>

              <div className='flex gap-4 overflow-x-auto pb-2'>
                {collection.movies.map((movie) => (
                  <div key={movie.id} className='flex-shrink-0'>
                    <MoviePoster
                      src={movie.poster_path}
                      alt={movie.title}
                      size='sm'
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completed Rankings Section */}
      <div>
        <h2 className='text-xl font-semibold mb-4 text-primary'>
          Completed Rankings
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {completedRankings.map((ranking) => (
            <Card key={ranking.id} hover className='cursor-pointer'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-primary/5 rounded-lg'>
                  <Trophy className='w-6 h-6 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold'>{ranking.title}</h3>
                  <p className='text-sm text-secondary'>
                    {ranking.count} movies • {ranking.method}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {completedRankings.length === 0 && (
          <Card className='text-center py-12'>
            <Trophy className='w-12 h-12 text-tertiary mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              No completed rankings yet
            </h3>
            <p className='text-secondary mb-6 max-w-sm mx-auto'>
              Start ranking your collections above to see completed rankings
              here
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Rankings;
