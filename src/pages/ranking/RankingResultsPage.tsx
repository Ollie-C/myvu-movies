import { useParams, useNavigate } from 'react-router-dom';

// Hooks
import { useRankingResults } from '@/features/rankings/api/hooks/useRankingResults';
import { useRankingSession } from '@/features/rankings/api/hooks/useRankingSession';

// Components
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';

export default function RankingResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { convertToCollection } = useRankingSession(id!);
  const { session, leaderboard, battles } = useRankingResults(id!);

  if (session.isLoading || leaderboard.isLoading || battles.isLoading) {
    return <p className='p-6 text-center'>Loading results...</p>;
  }

  if (!session.data) return <p>Session not found</p>;

  const top5 = leaderboard.data?.slice(0, 5) || [];
  const rest = leaderboard.data?.slice(5) || [];

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <h1 className='text-2xl font-bold mb-1'>{session.data.name}</h1>
      <p className='text-sm text-gray-600 mb-8'>
        Method: {session.data.ranking_method} ·{' '}
        {session.data.elo_handling === 'global' ? 'Global Elo' : 'Local Elo'}
      </p>

      {/* Top 5 Leaderboard */}
      <section className='mb-10'>
        <h2 className='text-xl font-semibold mb-4'>Top 5 Movies</h2>
        {top5.length === 0 ? (
          <p>No results</p>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
            {top5.map((item, idx) => (
              <Card
                key={item.id}
                className={`p-4 flex flex-col items-center text-center ${
                  idx === 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : idx === 1
                    ? 'bg-gray-100 border-gray-200'
                    : idx === 2
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white'
                }`}>
                {item.movie?.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${item.movie.poster_path}`}
                    alt={item.movie?.title}
                    className='rounded-md shadow-md mb-3 w-full max-w-[140px] object-cover'
                  />
                )}
                <span className='font-semibold'>{item.movie?.title}</span>
                <span className='text-xs text-gray-500 mt-1'>
                  Elo: {item.elo_score}
                </span>
                <span className='text-sm font-bold mt-2'>#{idx + 1}</span>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Full leaderboard (if more than 5) */}
      {rest.length > 0 && (
        <section className='mb-10'>
          <h2 className='text-lg font-semibold mb-4'>Full Ranking</h2>
          <ol className='space-y-2'>
            {rest.map((item, idx) => (
              <li key={item.id}>
                <Card className='p-3 flex justify-between items-center'>
                  <div>
                    <span className='font-semibold mr-2'>#{idx + 6}</span>
                    {item.movie?.title}
                  </div>
                  <span className='text-sm text-gray-500'>
                    Elo: {item.elo_score}
                  </span>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Battle History */}
      <section>
        <h2 className='text-lg font-semibold mb-4'>Battle History</h2>
        {battles.data?.length === 0 ? (
          <p>No battles recorded</p>
        ) : (
          <ul className='space-y-2 max-h-[600px] overflow-y-auto pr-2'>
            {battles.data?.map((b) => (
              <Card
                key={b.id}
                className='p-3 flex justify-between items-center'>
                <span>
                  <strong>{b.winner?.title}</strong> beat{' '}
                  <span className='text-gray-700'>{b.loser?.title}</span>
                </span>
                <span className='text-xs text-gray-400'>
                  {new Date(b.created_at!).toLocaleString()}
                </span>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {/* Back button */}
      <div className='mt-12'>
        <Button onClick={() => navigate('/ranking')}>Back to Rankings</Button>
      </div>
      <Button variant='secondary' onClick={() => convertToCollection.mutate()}>
        Save As Ranked Collection
      </Button>
    </div>
  );
}
