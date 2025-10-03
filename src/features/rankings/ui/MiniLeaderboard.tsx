import { useRankingSession } from '@/features/rankings/api/hooks/useRankingSession';

interface MiniLeaderboardProps {
  sessionId: string;
}

export function MiniLeaderboard({ sessionId }: MiniLeaderboardProps) {
  const { leaderboard } = useRankingSession(sessionId);

  if (leaderboard.isLoading) {
    return <p className='text-xs text-gray-400'>Loading leaderboard…</p>;
  }

  if (!leaderboard.data || leaderboard.data.length === 0) {
    return <p className='text-xs text-gray-500'>No results</p>;
  }

  const top5 = leaderboard.data.slice(0, 5);

  return (
    <div className='mt-3 pt-3 border-t border-gray-100'>
      <h4 className='text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide'>
        Top Movies
      </h4>
      <div className='space-y-2 grid grid-cols-2 gap-2'>
        {top5.map((item, idx) => (
          <div
            key={item.id}
            className='flex items-center gap-2.5 text-sm group'>
            <div className='flex items-center gap-1.5 flex-shrink-0'>
              <span className='text-xs font-medium text-gray-500 w-3'>
                {idx + 1}
              </span>
            </div>

            {item.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                alt={item.title || ''}
                className='w-6 h-9 object-cover rounded flex-shrink-0'
              />
            )}

            <div className='flex-1 min-w-0'>
              <p className='font-medium text-gray-900 truncate text-sm'>
                {item.title}
              </p>
              <p className='text-xs text-gray-500'>Elo {item.elo_score}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
