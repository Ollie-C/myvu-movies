import { useParams, useNavigate } from 'react-router-dom';
import { useRankingResults } from '@/utils/hooks/supabase/ranking/useRankingResults';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

export default function RankingResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { session, leaderboard, battles } = useRankingResults(id!);

  if (session.isLoading || leaderboard.isLoading || battles.isLoading) {
    return <p className='p-6 text-center'>Loading results...</p>;
  }

  if (!session.data) return <p>Session not found</p>;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <h1 className='text-2xl font-bold mb-2'>{session.data.name}</h1>
      <p className='text-sm text-gray-600 mb-6'>
        Method: {session.data.ranking_method} ·{' '}
        {session.data.elo_handling === 'global' ? 'Global Elo' : 'Local Elo'}
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Leaderboard */}
        <div>
          <h2 className='text-lg font-semibold mb-4'>🏆 Leaderboard</h2>
          {leaderboard.data?.length === 0 ? (
            <p>No results</p>
          ) : (
            <ol className='space-y-2'>
              {leaderboard.data?.map((item, idx) => (
                <li key={item.id}>
                  <Card className='p-3 flex justify-between items-center'>
                    <div>
                      <span className='font-semibold mr-2'>#{idx + 1}</span>
                      {item.movie?.title}
                    </div>
                    <span className='text-sm text-gray-500'>
                      Elo: {item.elo_score}
                    </span>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Battle history */}
        <div>
          <h2 className='text-lg font-semibold mb-4'>⚔️ Battle History</h2>
          {battles.data?.length === 0 ? (
            <p>No battles recorded</p>
          ) : (
            <ul className='space-y-2 max-h-[600px] overflow-y-auto pr-2'>
              {battles.data?.map((b) => (
                <Card key={b.id} className='p-3 flex justify-between'>
                  <span>
                    <strong>{b.winner?.title}</strong> beat{' '}
                    <span className='text-gray-700'>{b.loser?.title}</span>
                  </span>
                  <span className='text-xs text-gray-400'>
                    {new Date(b.created_at).toLocaleString()}
                  </span>
                </Card>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className='mt-8'>
        <Button onClick={() => navigate('/ranking')}>← Back to Rankings</Button>
      </div>
    </div>
  );
}
