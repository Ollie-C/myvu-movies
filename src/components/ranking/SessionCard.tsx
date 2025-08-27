import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type { RankingList } from '@/schemas/ranking-list.schema';
import { useRankingSession } from '@/utils/hooks/supabase/ranking/useRankingSession';
import { useNavigate } from 'react-router-dom';

interface SessionCardProps {
  session: RankingList;
  variant: 'active' | 'completed';
}

export const SessionCard = ({ session, variant }: SessionCardProps) => {
  const navigate = useNavigate();
  const { convertToCollection, softDelete } = useRankingSession(session.id);

  return (
    <Card className='p-3 flex justify-between items-center'>
      <span>{session.name}</span>
      <div className='flex gap-2'>
        {variant === 'active' ? (
          <>
            <Button size='sm' onClick={() => navigate(`/versus/${session.id}`)}>
              Continue
            </Button>
            <Button size='sm' onClick={() => softDelete.mutate()}>
              Delete
            </Button>
          </>
        ) : (
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
            <Button size='sm' onClick={() => softDelete.mutate()}>
              Delete
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};
