import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, BarChart3, Trophy, Brain } from 'lucide-react';

// Components
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import VersusConfigModal from '@/features/rankings/ui/VersusConfigModal';
import { SessionCard } from '@/features/rankings/ui/SessionCard';

// Contexts
import { useAuth } from '@/shared/context/AuthContext';

// Hooks
import { useWatchedMovies } from '@/features/watched-movies/api/hooks/useWatchedMovies';
import { useRankingDashboard } from '@/features/rankings/api/hooks/useRankingDashboard';
import { useRankingSession } from '@/features/rankings/api/hooks/useRankingSession';

// !
import type { VersusSessionConfig } from '@/features/rankings/models/versus-session-config.schema';

type RankingMethod = 'standard' | 'versus' | 'tiers' | 'smart';

const RankingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<RankingMethod | null>(
    null
  );
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [isVersusConfigOpen, setIsVersusConfigOpen] = useState(false);

  // Queries
  const { data: watchedMoviesData, isLoading: watchedLoading } =
    useWatchedMovies({ onlyRated: false, sortOrder: 'desc', limit: 24 });

  const unratedMovies = watchedMoviesData?.data?.filter((m) => !m.rating) || [];
  const ratedMovies = watchedMoviesData?.data?.filter((m) => m.rating) || [];

  const { sessions, activeSessions, completedSessions, pausedSessions } =
    useRankingDashboard(user?.id ?? '');

  const { create: createSession } = useRankingSession('');

  const handleStartMethod = () => {
    if (!selectedMethod) return;
    switch (selectedMethod) {
      case 'standard':
        setIsStandardOpen(true);
        break;
      case 'versus':
        setIsVersusConfigOpen(true);
        break;
      case 'tiers':
      case 'smart':
        alert('Coming soon!');
        break;
    }
  };

  function handleCreateVersusSession(config: VersusSessionConfig) {
    if (!user?.id) return;
    createSession.mutate(
      { method: 'versus', ...config },
      {
        onSuccess: (session) => {
          setIsVersusConfigOpen(false);
          navigate(`/versus/${session.id}`);
        },
      }
    );
  }

  function calculateStats() {
    if (!watchedMoviesData?.data) return null;
    const totalWatched = watchedMoviesData.data.length;
    const totalRated = ratedMovies.length;
    const averageRating =
      totalRated > 0
        ? ratedMovies.reduce((sum, m) => sum + (m.rating || 0), 0) / totalRated
        : 0;
    return {
      totalWatched,
      totalRated,
      unrated: unratedMovies.length,
      averageRating,
    };
  }

  const stats = calculateStats();

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Hero */}
      <h1 className='text-2xl font-semibold mb-2'>Arena</h1>
      <p className='text-sm text-gray-600 mb-8'>
        Rate and rank your movies using different methods
      </p>

      {/* Main content */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Left: Stats */}
        <div>
          <div className='space-y-4'>
            <div className='flex justify-between bg-gray-50 p-3 rounded'>
              <span>Total Watched</span>
              <span className='font-semibold'>{stats?.totalWatched ?? 0}</span>
            </div>
            <div className='flex justify-between bg-gray-50 p-3 rounded'>
              <span>Average Rating</span>
              <span className='font-semibold'>
                {stats?.averageRating.toFixed(1) ?? '0.0'}
              </span>
            </div>
            <div className='flex justify-between bg-gray-50 p-3 rounded'>
              <span>Progress</span>
              <span className='font-semibold'>
                {stats ? `${stats.totalRated}/${stats.totalWatched}` : '0/0'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Methods */}
        <div>
          <h2 className='text-lg font-semibold mb-4'>Start a new ranking</h2>
          <div className='grid grid-cols-2 gap-4'>
            {/* Cards */}
            <Card
              className={`p-5 border cursor-pointer ${
                selectedMethod === 'standard'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedMethod('standard')}>
              <Star className='mb-4' />
              <h3 className='font-semibold'>Standard Rating</h3>
              <p className='text-xs'>Rate each movie individually</p>
            </Card>

            <Card
              className={`p-5 border cursor-pointer ${
                selectedMethod === 'versus'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedMethod('versus')}>
              <BarChart3 className='mb-4' />
              <h3 className='font-semibold'>Versus</h3>
              <p className='text-xs'>Head-to-head comparisons</p>
            </Card>

            <Card
              className='p-5 border cursor-pointer'
              onClick={() => setSelectedMethod('tiers')}>
              <Trophy className='mb-4' />
              <h3 className='font-semibold'>Tiers</h3>
              <p className='text-xs'>Organize into tiers</p>
            </Card>

            <Card
              className='p-5 border cursor-pointer'
              onClick={() => setSelectedMethod('smart')}>
              <Brain className='mb-4' />
              <h3 className='font-semibold'>Smart Rankings</h3>
              <p className='text-xs'>AI-assisted rankings</p>
            </Card>
          </div>

          {selectedMethod && (
            <Button onClick={handleStartMethod} className='mt-6 w-full'>
              Start {selectedMethod}
            </Button>
          )}
        </div>
      </div>

      {/* Sessions Overview */}
      <div className='mt-12'>
        <h2 className='text-lg font-semibold mb-4'>Your Ranking Sessions</h2>
        {sessions.isLoading && <p>Loading...</p>}

        {!sessions.isLoading && (
          <>
            <h3 className='font-medium mt-4 mb-2'>Active</h3>
            {activeSessions.length === 0 && <p>No active sessions</p>}
            <div className='space-y-2'>
              {activeSessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>

            <h3 className='font-medium mt-6 mb-2'>Paused</h3>
            {pausedSessions.length === 0 && <p>No paused sessions</p>}
            <div className='space-y-2'>
              {pausedSessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>

            <h3 className='font-medium mt-6 mb-2'>Completed</h3>
            {completedSessions.length === 0 && <p>No completed sessions</p>}
            <div className='space-y-2'>
              {completedSessions.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </>
        )}
      </div>

      <VersusConfigModal
        isOpen={isVersusConfigOpen}
        onClose={() => setIsVersusConfigOpen(false)}
        onSubmit={handleCreateVersusSession}
      />
    </div>
  );
};

export default RankingsPage;
