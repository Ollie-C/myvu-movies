import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { MoviePoster } from '@/components/common/MoviePoster';
import {
  Settings,
  User,
  ChevronRight,
  Upload,
  Download,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LetterboxdImportModal } from '@/components/import/LetterboxdImportModal';
import { ClearLibraryModal } from '@/components/common/ClearLibraryModal';

const Dashboard = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearLibraryModalOpen, setIsClearLibraryModalOpen] = useState(false);

  // Mock user data
  const user = {
    username: 'movie_enthusiast',
    email: 'user@example.com',
    avatar: null,
    joinDate: 'March 2024',
    moviesWatched: 247,
    collectionsCreated: 8,
    rankingsCompleted: 12,
  };

  // Mock movies data
  const recentMovies = [
    { id: 1, title: 'Inception', poster_path: '/path1.jpg', rating: 5 },
    { id: 2, title: 'Interstellar', poster_path: '/path2.jpg', rating: 4 },
    { id: 3, title: 'The Dark Knight', poster_path: '/path3.jpg', rating: 5 },
    { id: 4, title: 'Dunkirk', poster_path: '/path4.jpg', rating: 4 },
    { id: 5, title: 'Memento', poster_path: '/path5.jpg', rating: 4 },
    { id: 6, title: 'Tenet', poster_path: '/path6.jpg', rating: 3 },
  ];

  // Mock collections data
  const featuredCollections = [
    { id: 1, name: 'Top Nolan Movies', movieCount: 8, isRanked: true },
    { id: 2, name: 'Must Watch Again', movieCount: 12, isRanked: false },
    { id: 3, name: 'Best Sci-Fi Films', movieCount: 15, isRanked: true },
  ];

  // Mock ranking stats
  const rankingStats = {
    totalRankings: 12,
    moviesRanked: 156,
    averageRating: 4.2,
    favoriteGenre: 'Sci-Fi',
    rankingStreak: 5,
  };

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header with Settings */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Dashboard</h1>
          <p className='text-secondary mt-2'>
            Welcome back! Here's your movie journey overview
          </p>
        </div>
        <button className='p-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors'>
          <Settings className='w-5 h-5 text-primary' />
        </button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
        {/* Left Side - User Profile */}
        <div className='lg:col-span-1'>
          <Card className='p-6'>
            {/* Avatar */}
            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <User className='w-10 h-10 text-primary' />
            </div>

            {/* User Info */}
            <div className='text-center mb-6'>
              <h2 className='text-lg font-semibold mb-1'>{user.username}</h2>
              <p className='text-secondary text-sm mb-2'>{user.email}</p>
              <p className='text-secondary text-xs'>Joined {user.joinDate}</p>
            </div>

            {/* Quick Stats */}
            <div className='space-y-3 mb-6'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-secondary'>Movies</span>
                <span className='font-medium'>{user.moviesWatched}</span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-secondary'>Collections</span>
                <span className='font-medium'>{user.collectionsCreated}</span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-secondary'>Rankings</span>
                <span className='font-medium'>{user.rankingsCompleted}</span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Button size='sm' variant='ghost' className='w-full text-xs'>
              Edit Profile
            </Button>
          </Card>
        </div>

        {/* Right Side - Page Snippets */}
        <div className='lg:col-span-3 space-y-8'>
          {/* Import Section */}
          <div>
            <div className='flex items-center gap-2 mb-4'>
              <h3 className='text-lg font-semibold'>Import Data</h3>
            </div>

            <Card className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 rounded-lg'>
                    <Download className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <h4 className='font-medium'>Import from Letterboxd</h4>
                    <p className='text-sm text-secondary'>
                      Import your watched movies and ratings
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsImportModalOpen(true)}
                  size='sm'
                  className='bg-primary hover:bg-primary/90'>
                  <Upload className='w-4 h-4 mr-2' />
                  Import
                </Button>
              </div>
            </Card>
          </div>

          {/* Library Management Section */}
          <div>
            <div className='flex items-center gap-2 mb-4'>
              <h3 className='text-lg font-semibold'>Library Management</h3>
            </div>

            <Card className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-red-100 rounded-lg'>
                    <Trash2 className='w-5 h-5 text-red-600' />
                  </div>
                  <div>
                    <h4 className='font-medium'>Clear Library</h4>
                    <p className='text-sm text-secondary'>
                      Remove all movies from your library
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsClearLibraryModalOpen(true)}
                  size='sm'
                  variant='ghost'
                  className='text-red-600 hover:text-red-700 hover:bg-red-50'>
                  <Trash2 className='w-4 h-4 mr-2' />
                  Clear
                </Button>
              </div>
            </Card>
          </div>

          {/* Movies Section */}
          <div>
            <Link
              to='/movies'
              className='flex items-center gap-2 mb-4 hover:text-primary transition-colors group'>
              <h3 className='text-lg font-semibold'>Recent Movies</h3>
              <ChevronRight className='w-4 h-4 text-secondary group-hover:text-primary transition-colors' />
            </Link>

            <Card className='p-4'>
              <div className='grid grid-cols-4 sm:grid-cols-8 gap-3'>
                {recentMovies.map((movie) => (
                  <div key={movie.id} className='text-center'>
                    <MoviePoster
                      src={movie.poster_path}
                      alt={movie.title}
                      size='sm'
                    />
                    <div className='text-center mt-2'>
                      <span className='text-xs text-secondary'>
                        {movie.rating}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Collections Section */}
          <div>
            <Link
              to='/collections'
              className='flex items-center gap-2 mb-4 hover:text-primary transition-colors group'>
              <h3 className='text-lg font-semibold'>Featured Collections</h3>
              <ChevronRight className='w-4 h-4 text-secondary group-hover:text-primary transition-colors' />
            </Link>

            <Card className='p-4'>
              <div className='space-y-3'>
                {featuredCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className='flex items-center justify-between p-3 bg-surface-hover rounded-lg hover:bg-border transition-colors cursor-pointer'>
                    <div>
                      <h4 className='font-medium'>{collection.name}</h4>
                      <p className='text-sm text-secondary'>
                        {collection.movieCount} movies
                        {collection.isRanked && ' • Ranked'}
                      </p>
                    </div>
                    <ChevronRight className='w-4 h-4 text-tertiary' />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Rankings Section */}
          <div>
            <Link
              to='/rankings'
              className='flex items-center gap-2 mb-4 hover:text-primary transition-colors group'>
              <h3 className='text-lg font-semibold'>Ranking Statistics</h3>
              <ChevronRight className='w-4 h-4 text-secondary group-hover:text-primary transition-colors' />
            </Link>

            <Card className='p-4'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                <div className='text-center p-3 bg-surface-hover rounded-lg'>
                  <div className='text-xl font-bold'>
                    {rankingStats.totalRankings}
                  </div>
                  <div className='text-sm text-secondary'>Rankings</div>
                </div>

                <div className='text-center p-3 bg-surface-hover rounded-lg'>
                  <div className='text-xl font-bold'>
                    {rankingStats.moviesRanked}
                  </div>
                  <div className='text-sm text-secondary'>Movies Ranked</div>
                </div>

                <div className='text-center p-3 bg-surface-hover rounded-lg'>
                  <div className='text-xl font-bold'>
                    {rankingStats.averageRating}
                  </div>
                  <div className='text-sm text-secondary'>Avg Rating</div>
                </div>

                <div className='text-center p-3 bg-surface-hover rounded-lg'>
                  <div className='text-xl font-bold'>
                    {rankingStats.rankingStreak}
                  </div>
                  <div className='text-sm text-secondary'>Day Streak</div>
                </div>
              </div>

              <div className='p-3 bg-surface-hover rounded-lg'>
                <div className='flex items-center justify-between'>
                  <span className='text-secondary'>Favorite Genre</span>
                  <span className='font-medium'>
                    {rankingStats.favoriteGenre}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Letterboxd Import Modal */}
      <LetterboxdImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Clear Library Modal */}
      <ClearLibraryModal
        isOpen={isClearLibraryModalOpen}
        onClose={() => setIsClearLibraryModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
