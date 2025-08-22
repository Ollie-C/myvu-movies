// AUDITED 12/08/2025

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Trophy,
  Zap,
  Save,
  CircleX,
  CheckCircle2,
} from 'lucide-react';
import MoviePoster from '@/components/movie/MoviePoster';
import { useVersusRankingPairs } from '@/utils/hooks/supabase/queries/useRanking';
import { useAuth } from '@/context/AuthContext';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';
import { rankingService } from '@/services/supabase/ranking.service';
import { useToast } from '@/context/ToastContext';
import BattleResults from './battle/BattleResults';
import BattleStats from './battle/BattleStats';

interface VersusRankingProps {
  watchedMovies: WatchedMovieWithMovie[];
  rankingListName: string;
}

type SessionBattle = {
  winnerId: string;
  loserId: string;
  elo?: {
    winnerBefore: number;
    winnerAfter: number;
    loserBefore: number;
    loserAfter: number;
  };
  created_at: string;
};

export function VersusRanking({
  watchedMovies,
  rankingListName,
}: VersusRankingProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showStats, setShowStats] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [battleCount, setBattleCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [rankingListId, setRankingListId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionBattles, setSessionBattles] = useState<SessionBattle[]>([]);
  const [history, setHistory] = useState<{
    aWins: number;
    bWins: number;
  } | null>(null);

  const movieIdToTitle = useMemo(() => {
    const map = new Map<string, string>();
    watchedMovies.forEach((wm) => {
      if (wm.movie?.id) map.set(wm.movie.id, wm.movie.title);
    });
    return map;
  }, [watchedMovies]);

  const { currentPair, isProcessing, processBattle, nextPair, hasNextPair } =
    useVersusRankingPairs(watchedMovies, rankingListId || undefined);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;
      const list = await rankingService.getOrCreateDefaultVersusList(user.id);
      setRankingListId(list.id);
    };
    init();
  }, [user?.id]);

  // Fetch head-to-head history when pair changes
  useEffect(() => {
    const loadHistory = async () => {
      if (
        !rankingListId ||
        !currentPair?.movie1.movie_id ||
        !currentPair?.movie2.movie_id
      )
        return;
      const battles = await rankingService.getBattleHistory(
        currentPair.movie1.movie_id,
        currentPair.movie2.movie_id
      );
      setHistory(battles);
    };
    loadHistory();
  }, [rankingListId, currentPair]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessing || !currentPair) return;

      if (e.key === '1' || e.key === 'ArrowLeft') {
        if (currentPair.movie1.movie_id && currentPair.movie2.movie_id) {
          handleSelection(
            currentPair.movie1.movie_id,
            currentPair.movie2.movie_id
          );
        }
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        if (currentPair.movie1.movie_id && currentPair.movie2.movie_id) {
          handleSelection(
            currentPair.movie2.movie_id,
            currentPair.movie1.movie_id
          );
        }
      } else if (e.key === 'Escape') {
        setShowExitConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPair, isProcessing]);

  const handleSelection = async (winnerId: string, loserId: string) => {
    if (!user?.id) return;

    try {
      const result = await processBattle(winnerId, loserId);
      setBattleCount((prev) => prev + 1);

      // Debug: Log the actual result structure
      console.log('Battle result:', result);

      setSessionBattles((prev) => [
        {
          winnerId,
          loserId,
          elo: result?.eloResult
            ? {
                winnerBefore: result.eloResult.winner_elo_before,
                winnerAfter: result.eloResult.winner_elo_after,
                loserBefore: result.eloResult.loser_elo_before,
                loserAfter: result.eloResult.loser_elo_after,
              }
            : undefined,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      if ((result as any)?.done) {
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Failed to record battle result', error);
    }
  };

  const sessionDuration = Math.floor(
    (Date.now() - sessionStartTime) / 1000 / 60
  );

  if (!currentPair) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-gray-600'>Preparing your next battle...</p>
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
        className='max-w-6xl mx-auto mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => navigate('/rankings')}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'>
              <ChevronLeft className='h-5 w-5' />
            </button>
            <div>
              <h1 className='text-xl font-semibold'>{rankingListName}</h1>
              <p className='text-xs text-gray-500'>Versus Mode</p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {rankingListId && (
              <div className='px-2 py-1 border border-gray-300 rounded text-xs text-gray-700'>
                Battle ID: {rankingListId.substring(0, 8)}
              </div>
            )}
            <button
              onClick={() => setShowExitConfirm(true)}
              className='px-3 h-8 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 inline-flex items-center gap-2'>
              <CircleX className='w-4 h-4' /> Exit
            </button>
            <button
              onClick={async () => {
                if (!rankingListId) return;
                await rankingService.updateRankingListStatus(
                  rankingListId,
                  'active'
                );
                showToast('success', 'Progress saved');
              }}
              className='px-3 h-8 border border-gray-300 rounded-lg text-xs hover:bg-gray-50 inline-flex items-center gap-2'>
              <Save className='w-4 h-4' /> Save
            </button>
            <button
              onClick={async () => {
                if (!rankingListId) return;
                await rankingService.updateRankingListStatus(
                  rankingListId,
                  'complete'
                );
                setShowSummary(true);
              }}
              className='px-3 h-8 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800 inline-flex items-center gap-2'>
              <CheckCircle2 className='w-4 h-4' /> Complete
            </button>
            <button
              onClick={() => setShowStats(true)}
              className='px-2 h-8 hover:bg-gray-100 rounded-lg transition-colors text-xs inline-flex items-center gap-2'>
              <Trophy className='h-4 w-4' /> Stats
            </button>
            <div className='text-right'>
              <p className='text-sm font-medium'>{battleCount} battles</p>
              <p className='text-xs text-gray-500'>{sessionDuration} min</p>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className='w-full bg-gray-100 rounded-full h-1.5'>
          <div
            className='bg-gray-900 rounded-full h-1.5'
            style={{ width: `${(battleCount % 10) * 10}%` }}
          />
        </div>
      </motion.div>

      {/* Battle Arena */}
      <div className='max-w-6xl mx-auto'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={`${currentPair.movie1.movie_id}-${currentPair.movie2.movie_id}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className='grid grid-cols-1 md:grid-cols-2 gap-6 relative items-start'>
            {/* Movie 1 */}
            <div className='relative'>
              <div className='versus-movie-card group'>
                <div className='text-center mb-2'>
                  <span className='inline-block px-2 py-0.5 rounded bg-black/80 text-white text-[10px]'>
                    ELO: {currentPair.movie1.elo_score || 'Unranked'}
                  </span>
                </div>
                <MoviePoster
                  movie={currentPair.movie1.movie}
                  onClick={() => {
                    if (
                      currentPair.movie1.movie_id &&
                      currentPair.movie2.movie_id
                    ) {
                      handleSelection(
                        currentPair.movie1.movie_id,
                        currentPair.movie2.movie_id
                      );
                    }
                  }}
                  disabled={isProcessing}
                  variant='rounded'
                  className={`w-48 mx-auto transform transition-all duration-200 ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.03] hover:shadow-xl cursor-pointer'
                  }`}
                />
              </div>
              {history && (
                <p className='mt-2 text-xs text-gray-600 text-center'>
                  Head-to-head: {history.aWins}W - {history.bWins}L
                </p>
              )}
            </div>

            {/* VS Indicator */}
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className='relative'>
                <div className='bg-white border-2 border-gray-900 rounded-full p-3'>
                  <Zap className='h-6 w-6 text-gray-900' />
                </div>
              </motion.div>
              <div className='absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap'>
                <p className='text-xs font-bold text-center tracking-wide'>
                  VERSUS
                </p>
              </div>
            </div>

            {/* Movie 2 */}
            <div className='relative'>
              <div className='versus-movie-card group'>
                <div className='text-center mb-2'>
                  <span className='inline-block px-2 py-0.5 rounded bg-black/80 text-white text-[10px]'>
                    ELO: {currentPair.movie2.elo_score || 'Unranked'}
                  </span>
                </div>
                <MoviePoster
                  movie={currentPair.movie2.movie}
                  onClick={() => {
                    if (
                      currentPair.movie1.movie_id &&
                      currentPair.movie2.movie_id
                    ) {
                      handleSelection(
                        currentPair.movie2.movie_id,
                        currentPair.movie1.movie_id
                      );
                    }
                  }}
                  disabled={isProcessing}
                  variant='rounded'
                  className={`w-48 mx-auto transform transition-all duration-200 ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.03] hover:shadow-xl cursor-pointer'
                  }`}
                />
              </div>
              {history && (
                <p className='mt-2 text-xs text-gray-600 text-center'>
                  Head-to-head: {history.bWins}W - {history.aWins}L
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Keyboard hints (desktop) */}
        <div className='hidden md:flex justify-center gap-8 mt-8'>
          <kbd className='px-3 py-1 bg-gray-100 rounded text-xs'>← or 1</kbd>
          <span className='text-gray-500'>vs</span>
          <kbd className='px-3 py-1 bg-gray-100 rounded text-xs'>→ or 2</kbd>
        </div>

        {/* Skip button */}
        <div className='flex justify-center mt-6'>
          <button
            onClick={nextPair}
            disabled={isProcessing || !hasNextPair}
            className='bg-gray-900 text-white px-4 py-2 rounded-md disabled:opacity-50 text-sm'>
            Skip this pair
          </button>
        </div>
      </div>

      {/* Exit Confirm */}
      {showExitConfirm && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-sm'>
            <h3 className='text-lg font-semibold mb-2'>Exit session?</h3>
            <p className='text-sm text-gray-600 mb-4'>
              Do you want to save your progress before exiting?
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => navigate('/rankings')}
                className='px-3 h-8 border border-gray-300 rounded-lg text-xs hover:bg-gray-50'>
                No save
              </button>
              <button
                onClick={async () => {
                  if (rankingListId) {
                    await rankingService.updateRankingListStatus(
                      rankingListId,
                      'active'
                    );
                  }
                  navigate('/rankings');
                }}
                className='px-3 h-8 bg-gray-900 text-white rounded-lg text-xs hover:bg-gray-800'>
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal - rebuilt */}
      {showStats && (
        <BattleStats
          onClose={() => setShowStats(false)}
          battleCount={battleCount}
          sessionDuration={sessionDuration}
        />
      )}

      {/* Session Summary Modal */}
      {showSummary && (
        <BattleResults
          onClose={() => setShowSummary(false)}
          sessionBattles={sessionBattles}
          movieIdToTitle={movieIdToTitle}
          onFinish={async () => {
            try {
              // Mark ranking as completed
              if (rankingListId) {
                await rankingService.updateRankingListStatus(
                  rankingListId,
                  'completed'
                );
                showToast('success', 'Ranking completed successfully!');
              }
              // Navigate back to rankings page
              navigate('/rankings');
            } catch (error) {
              console.error('Failed to complete ranking:', error);
              showToast('error', 'Failed to complete ranking');
            }
          }}
        />
      )}
    </div>
  );
}
