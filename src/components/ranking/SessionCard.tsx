// components/ranking/SessionCard.tsx
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useRankingSession } from '@/utils/hooks/supabase/ranking/useRankingSession';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import type { RankingList } from '@/schemas/ranking-list.schema';

interface SessionCardProps {
  session: RankingList;
}

export const SessionCard = ({ session }: SessionCardProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { pause, resume, softDelete, convertToCollection } = useRankingSession(
    session.id
  );

  const handleDelete = async () => {
    if (confirm(`Delete session "${session.name}"? This cannot be undone.`)) {
      await softDelete.mutateAsync();
      showToast('success', 'Session deleted', `${session.name} removed.`);
    }
  };

  const handlePause = () => {
    pause.mutate(undefined, {
      onSuccess: () =>
        showToast('success', 'Session paused', 'You can resume at any time.'),
    });
  };

  const handleResume = () => {
    resume.mutate(undefined, {
      onSuccess: () => navigate(`/versus/${session.id}`),
    });
  };

  return (
    <Card className='p-3 flex justify-between items-center'>
      <span>{session.name}</span>
      <div className='flex gap-2'>
        {session.status === 'completed' ? (
          <>
            <Button
              size='sm'
              onClick={() => navigate(`/ranking-results/${session.id}`)}>
              Results
            </Button>
            <Button
              size='sm'
              variant='secondary'
              onClick={() => convertToCollection.mutate()}>
              To Collection
            </Button>
            <Button size='sm' onClick={handleDelete}>
              Delete
            </Button>
          </>
        ) : session.status === 'paused' ? (
          <>
            <Button size='sm' onClick={handleResume}>
              Resume
            </Button>
            <Button size='sm' onClick={handleDelete}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button size='sm' onClick={() => navigate(`/versus/${session.id}`)}>
              Continue
            </Button>
            <Button size='sm' variant='secondary' onClick={handlePause}>
              Pause
            </Button>
            <Button size='sm' onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
