import { useParams, useNavigate } from 'react-router-dom';
import { useVersusSession } from '@/utils/hooks/supabase/ranking/useVersusSession';
import { Button } from '@/components/common/Button';

export default function VersusSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { session, nextPair, battle, progress, movies, completedPairs, pause } =
    useVersusSession(id!);

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
    battle.mutate({ winnerId, loserId });
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-2'>{name}</h1>
      <p className='text-sm text-gray-600 mb-6'>
        Mode: {elo_handling === 'global' ? 'Global Elo' : 'Local Elo'}
      </p>

      {progress.data && (
        <div className='mb-6'>
          <p className='text-sm text-gray-500 mb-1'>
            {progress.data.completedBattles} / {progress.data.targetBattles}{' '}
            battles
          </p>
          <div className='w-full bg-gray-200 rounded h-3'>
            <div
              className='bg-black h-3 rounded transition-all'
              style={{
                width: `${progress.data.completionPercent.toFixed(1)}%`,
              }}
            />
          </div>
        </div>
      )}
      <Button
        variant='secondary'
        onClick={() =>
          pause.mutate(undefined, { onSuccess: () => navigate('/rankings') })
        }>
        Pause & Exit
      </Button>

      {nextPair ? (
        <div className='flex gap-6 justify-center items-center'>
          <Button
            onClick={() =>
              handleBattle(nextPair.movie1.movie_id!, nextPair.movie2.movie_id!)
            }
            className='flex-1 py-6'>
            {nextPair.movie1.movie?.title}
          </Button>

          <span className='font-bold text-xl'>vs</span>

          <Button
            onClick={() =>
              handleBattle(nextPair.movie2.movie_id!, nextPair.movie1.movie_id!)
            }
            className='flex-1 py-6'>
            {nextPair.movie2.movie?.title}
          </Button>
        </div>
      ) : (
        <div className='text-center mt-12'>
          <p className='text-lg font-semibold mb-4'>No more pairs left! 🎉</p>
          <Button onClick={() => navigate(`/ranking-results/${id}`)}>
            View Results
          </Button>
        </div>
      )}
    </div>
  );
}
