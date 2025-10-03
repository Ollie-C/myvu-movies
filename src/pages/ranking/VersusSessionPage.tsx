import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useVersusSession } from '@/features/rankings/api/hooks/useVersusSession';

// Components
import { Button } from '@/shared/ui/Button';

// !
import { rankingSessionService } from '@/features/rankings/api/rankingSession.service';

export default function VersusSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [winnerSelected, setWinnerSelected] = useState<string | null>(null);

  const {
    session,
    nextPair,
    battle,
    progress,
    movies,
    completedPairs,
    pause,
    skipBattle,
  } = useVersusSession(id!);

  if (
    session.isLoading ||
    progress.isLoading ||
    movies.isLoading ||
    completedPairs.isLoading
  ) {
    return <p className='p-6 text-center'>Loading session...</p>;
  }

  if (!session.data) return <p>Session not found</p>;

  const { name, elo_handling } = session.data;

  const handleBattle = (winnerId: string, loserId: string) => {
    setWinnerSelected(winnerId);
    battle.mutate(
      { winnerId, loserId },
      {
        onSettled: () => setWinnerSelected(null),
      }
    );
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-2'>{name}</h1>
      <p className='text-sm text-gray-600 mb-6'>
        Mode: {elo_handling === 'global' ? 'Global Elo' : 'Local Elo'}
      </p>

      {nextPair ? (
        <div className='grid grid-cols-3 gap-6 items-center py-10'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={nextPair.movie1.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                handleBattle(
                  nextPair.movie1.movie_id!,
                  nextPair.movie2.movie_id!
                )
              }
              className='cursor-pointer flex flex-col items-center text-center'>
              <motion.img
                animate={
                  winnerSelected === nextPair.movie1.movie_id
                    ? {
                        scale: [1, 1.2, 1],
                        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.8)',
                      }
                    : {}
                }
                transition={{ duration: 0.4 }}
                src={`https://image.tmdb.org/t/p/w300${nextPair.movie1.movie?.poster_path}`}
                alt={nextPair.movie1.movie?.title}
                className='rounded shadow-lg mb-2 max-w-[280px] object-cover'
              />
            </motion.div>
          </AnimatePresence>

          <div className='flex flex-col items-center gap-4'>
            <span className='text-4xl font-extrabold text-gray-700'>VS</span>
            {progress.data && session.data.battle_limit_type !== 'infinite' && (
              <div className='w-40'>
                <p className='text-xs text-gray-500 text-center mb-1'>
                  {progress.data.completedBattles} /{' '}
                  {progress.data.targetBattles}
                </p>
                <div className='w-full bg-gray-200 rounded h-2'>
                  <div
                    className='bg-black h-2 rounded transition-all'
                    style={{
                      width: `${
                        progress.data.completionPercent?.toFixed(1) ?? 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              size='sm'
              variant='secondary'
              onClick={() => skipBattle.mutate()}>
              Skip
            </Button>
          </div>
          <AnimatePresence mode='wait'>
            <motion.div
              key={nextPair.movie2.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                handleBattle(
                  nextPair.movie2.movie_id!,
                  nextPair.movie1.movie_id!
                )
              }
              className='cursor-pointer flex flex-col items-center text-center'>
              <motion.img
                animate={
                  winnerSelected === nextPair.movie2.movie_id
                    ? {
                        scale: [1, 1.2, 1],
                        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.8)',
                      }
                    : {}
                }
                transition={{ duration: 0.4 }}
                src={`https://image.tmdb.org/t/p/w300${nextPair.movie2.movie?.poster_path}`}
                alt={nextPair.movie2.movie?.title}
                className='rounded shadow-lg mb-2 max-w-[280px] object-cover'
              />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <div className='text-center mt-12'>
          <p className='text-lg font-semibold mb-4'>No more pairs left! 🎉</p>
          <Button onClick={() => navigate(`/ranking-results/${id}`)}>
            View Results
          </Button>
        </div>
      )}

      <div className='mt-8 fixed bottom-1/8 left-1/2 -translate-x-1/2 flex flex-col gap-2 justify-between'>
        <Button
          variant='secondary'
          onClick={() =>
            pause.mutate(undefined, { onSuccess: () => navigate('/rankings') })
          }>
          Save & Exit
        </Button>

        {session.data.battle_limit_type === 'infinite' && (
          <Button
            variant='secondary'
            onClick={() => {
              rankingSessionService.update(id!, { status: 'completed' });
              navigate(`/ranking-results/${id}`);
            }}>
            Complete Session
          </Button>
        )}
      </div>
    </div>
  );
}
