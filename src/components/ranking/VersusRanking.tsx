// NOT AUDITED

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRankingBattle } from '@/utils/hooks/supabase/queries/useRankingBattle';
import MoviePoster from '@/components/movie/MoviePoster';
import { BattleStats } from '@/components/ranking/battle/BattleStats';

interface VersusRankingProps {
  rankingListId: string;
  rankingListName: string;
}

export function VersusRanking({
  rankingListId,
  rankingListName,
}: VersusRankingProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showStats, setShowStats] = useState(false);
  const [battleCount, setBattleCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());

  const { moviePair, isLoading, selectWinner, isProcessing, getNewPair } =
    useRankingBattle(rankingListId, user?.id || '');

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessing || !moviePair) return;

      if (e.key === '1' || e.key === 'ArrowLeft') {
        handleSelection(moviePair.movie1.movie_id!, moviePair.movie2.movie_id!);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        handleSelection(moviePair.movie2.movie_id!, moviePair.movie1.movie_id!);
      } else if (e.key === 'Escape') {
        navigate('/rankings');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moviePair, isProcessing, navigate]);

  const handleSelection = async (winnerId: number, loserId: number) => {
    try {
      await selectWinner(winnerId, loserId);
      setBattleCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to record battle result', error);
    }
  };

  const sessionDuration = Math.floor(
    (Date.now() - sessionStartTime) / 1000 / 60
  );

  if (isLoading || !moviePair) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Preparing your next battle...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className='max-w-7xl mx-auto mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => navigate('/rankings')}
              className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
              <ChevronLeft className='h-5 w-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold'>{rankingListName}</h1>
              <p className='text-muted-foreground'>Versus Mode</p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <button
              onClick={() => setShowStats(!showStats)}
              className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
              <Trophy className='h-4 w-4 mr-2' />
              Stats
            </button>
            <div className='text-right'>
              <p className='text-sm font-medium'>{battleCount} battles</p>
              <p className='text-xs text-muted-foreground'>
                {sessionDuration} min
              </p>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className='w-full bg-surface-hover rounded-full h-2'>
          <div
            className='bg-primary rounded-full h-2'
            style={{ width: `${(battleCount % 10) * 10}%` }}
          />
        </div>
      </motion.div>

      {/* Battle Arena */}
      <div className='max-w-7xl mx-auto'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={`${moviePair.movie1.id}-${moviePair.movie2.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative'>
            {/* Movie 1 */}
            <div className='relative'>
              <div className='versus-movie-card group'>
                <MoviePoster
                  movie={(moviePair.movie1 as any).movie}
                  onClick={() =>
                    handleSelection(
                      moviePair.movie1.movie_id!,
                      moviePair.movie2.movie_id!
                    )
                  }
                  disabled={isProcessing}
                  variant='rounded'
                  className={`w-full max-w-md mx-auto transform transition-all duration-200 ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 hover:shadow-2xl cursor-pointer'
                  }`}
                />
                {/* Optional: Add ranking info overlay */}
                <div className='absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs'>
                  Rank: {moviePair.movie1.current_rating || 'Unranked'}
                </div>
              </div>
              <div className='absolute -bottom-12 left-1/2 -translate-x-1/2 md:hidden'>
                <kbd className='px-2 py-1 text-xs bg-secondary rounded'>
                  Tap to select
                </kbd>
              </div>
            </div>

            {/* VS Indicator */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className='relative'>
                <div className='bg-background border-4 border-primary rounded-full p-4'>
                  <Zap className='h-8 w-8 text-primary' />
                </div>
              </motion.div>
              <div className='absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap'>
                <p className='text-sm font-bold text-center'>VERSUS</p>
              </div>
            </div>

            {/* Movie 2 */}
            <div className='relative'>
              <div className='versus-movie-card group'>
                <MoviePoster
                  movie={(moviePair.movie2 as any).movie}
                  onClick={() =>
                    handleSelection(
                      moviePair.movie2.movie_id!,
                      moviePair.movie1.movie_id!
                    )
                  }
                  disabled={isProcessing}
                  variant='rounded'
                  className={`w-full max-w-md mx-auto transform transition-all duration-200 ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 hover:shadow-2xl cursor-pointer'
                  }`}
                />
                {/* Optional: Add ranking info overlay */}
                <div className='absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs'>
                  Rank: {moviePair.movie2.current_rating || 'Unranked'}
                </div>
              </div>
              <div className='absolute -bottom-12 left-1/2 -translate-x-1/2 md:hidden'>
                <kbd className='px-2 py-1 text-xs bg-secondary rounded'>
                  Tap to select
                </kbd>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Keyboard hints (desktop) */}
        <div className='hidden md:flex justify-center gap-8 mt-12'>
          <kbd className='px-3 py-1 bg-secondary rounded text-sm'>← or 1</kbd>
          <span className='text-muted-foreground'>vs</span>
          <kbd className='px-3 py-1 bg-secondary rounded text-sm'>→ or 2</kbd>
        </div>

        {/* Skip button */}
        <div className='flex justify-center mt-8'>
          <button
            onClick={() => getNewPair()}
            disabled={isProcessing}
            className='bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50'>
            Skip this pair
          </button>
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && (
        <BattleStats
          rankingListId={rankingListId}
          onClose={() => setShowStats(false)}
          battleCount={battleCount}
          sessionDuration={sessionDuration}
        />
      )}
    </div>
  );
}
