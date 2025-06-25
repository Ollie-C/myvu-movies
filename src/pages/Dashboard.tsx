import { Card } from '@/components/common/Card';
import { Film, Trophy, BarChart3, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  // Mock data
  const stats = {
    moviesWatched: 127,
    rankings: 8,
    collections: 12,
    thisWeek: 5,
  };

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <h1 className='text-3xl font-bold text-primary'>Welcome back!</h1>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-secondary text-sm'>Movies Watched</p>
              <p className='text-3xl font-bold mt-1'>{stats.moviesWatched}</p>
            </div>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <Film className='w-6 h-6 text-primary' />
            </div>
          </div>
        </Card>

        <Card>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-secondary text-sm'>Rankings</p>
              <p className='text-3xl font-bold mt-1'>{stats.rankings}</p>
            </div>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <BarChart3 className='w-6 h-6 text-primary' />
            </div>
          </div>
        </Card>

        <Card>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-secondary text-sm'>Collections</p>
              <p className='text-3xl font-bold mt-1'>{stats.collections}</p>
            </div>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <Trophy className='w-6 h-6 text-primary' />
            </div>
          </div>
        </Card>

        <Card>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-secondary text-sm'>This Week</p>
              <p className='text-3xl font-bold mt-1'>+{stats.thisWeek}</p>
            </div>
            <div className='p-3 bg-primary/5 rounded-lg'>
              <TrendingUp className='w-6 h-6 text-primary' />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className='text-xl font-semibold mb-4'>Recent Activity</h2>
        <Card>
          <p className='text-secondary text-center py-8'>
            No recent activity. Start ranking some movies!
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
