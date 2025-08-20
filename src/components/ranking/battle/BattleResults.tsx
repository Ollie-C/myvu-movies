import { useEffect, useMemo, useState } from 'react';
import { rankingService } from '@/services/supabase/ranking.service';

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

interface BattleResultsProps {
  onClose: () => void;
  sessionBattles: SessionBattle[];
  movieIdToTitle: Map<string, string>;
  onFinish: () => void;
}

export default function BattleResults({
  onClose,
  sessionBattles,
  movieIdToTitle,
  onFinish,
}: BattleResultsProps) {
  const [headToHeads, setHeadToHeads] = useState<
    Record<string, { aWins: number; bWins: number }>
  >({});

  // League table: by final ELO, with delta vs first battle
  const leagueTable = useMemo(() => {
    const movieStats = new Map<
      string,
      { title: string; firstElo: number; lastElo: number }
    >();

    sessionBattles.forEach((b) => {
      if (!b.elo) return;
      // Winner
      movieStats.set(b.winnerId, {
        title: movieIdToTitle.get(b.winnerId) || `#${b.winnerId}`,
        firstElo: movieStats.get(b.winnerId)?.firstElo ?? b.elo.winnerBefore,
        lastElo: b.elo.winnerAfter,
      });
      // Loser
      movieStats.set(b.loserId, {
        title: movieIdToTitle.get(b.loserId) || `#${b.loserId}`,
        firstElo: movieStats.get(b.loserId)?.firstElo ?? b.elo.loserBefore,
        lastElo: b.elo.loserAfter,
      });
    });

    return Array.from(movieStats.entries())
      .map(([id, { title, firstElo, lastElo }]) => ({
        id,
        title,
        elo: lastElo,
        delta: lastElo - firstElo,
      }))
      .sort((a, b) => b.elo - a.elo);
  }, [sessionBattles, movieIdToTitle]);

  // Fetch head-to-head totals for all unique pairs
  useEffect(() => {
    const loadHeadToHeads = async () => {
      const results: Record<string, { aWins: number; bWins: number }> = {};
      for (const b of sessionBattles) {
        if (!b.elo) continue;
        const key = [b.winnerId, b.loserId].sort().join('_');
        if (results[key]) continue; // skip if already loaded
        const battles = await rankingService.getBattleHistory(
          b.winnerId,
          b.loserId
        );
        let aWins = 0;
        let bWins = 0;
        battles.forEach((battle) => {
          if (battle.winner_movie_id === b.winnerId) aWins++;
          if (battle.winner_movie_id === b.loserId) bWins++;
        });
        results[key] = { aWins, bWins };
      }
      setHeadToHeads(results);
    };
    loadHeadToHeads();
  }, [sessionBattles]);

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[85vh] overflow-auto'>
        <h3 className='text-lg font-semibold mb-3'>Session complete</h3>
        <p className='text-sm text-gray-600 mb-4'>
          League standings & battle history
        </p>

        {/* League Table */}
        <div className='mb-6'>
          <h4 className='text-sm font-semibold mb-2'>League Table</h4>
          <div className='border border-gray-200 rounded-lg overflow-hidden'>
            <div className='grid grid-cols-12 bg-gray-50 text-xs text-gray-600 px-3 py-2'>
              <div className='col-span-8'>Movie</div>
              <div className='col-span-4 text-right'>ELO (Δ)</div>
            </div>
            {leagueTable.map((row, idx) => (
              <div
                key={row.id}
                className='grid grid-cols-12 px-3 py-2 text-sm border-t border-gray-100'>
                <div className='col-span-8 truncate'>
                  <span className='text-gray-900 font-medium'>
                    {idx + 1}. {row.title}
                  </span>
                </div>
                <div
                  className={`col-span-4 text-right font-semibold ${
                    row.delta >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {row.elo.toFixed(0)}{' '}
                  <span>
                    ({row.delta >= 0 ? '+' : ''}
                    {row.delta.toFixed(0)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Battle History */}
        <div className='divide-y divide-gray-100 border border-gray-200 rounded-lg'>
          {sessionBattles.length === 0 ? (
            <div className='p-6 text-center text-gray-500 text-sm'>
              No battles recorded.
            </div>
          ) : (
            sessionBattles.map((b, index) => {
              if (!b.elo) return null;

              const movieA = movieIdToTitle.get(b.winnerId) || `#${b.winnerId}`;
              const movieB = movieIdToTitle.get(b.loserId) || `#${b.loserId}`;
              const winnerDelta = b.elo.winnerAfter - b.elo.winnerBefore;
              const loserDelta = b.elo.loserAfter - b.elo.loserBefore;

              const key = [b.winnerId, b.loserId].sort().join('_');
              const head = headToHeads[key];

              return (
                <div key={index} className='grid grid-cols-2 gap-4 text-sm p-4'>
                  {/* Left: Winner */}
                  <div>
                    <strong>{movieA}</strong>
                    <div className='text-gray-700 text-xs'>
                      ELO: {b.elo.winnerAfter}
                      <span
                        className={
                          winnerDelta >= 0
                            ? 'text-green-600 ml-1'
                            : 'text-red-600 ml-1'
                        }>
                        ({winnerDelta >= 0 ? '+' : ''}
                        {winnerDelta.toFixed(0)})
                      </span>
                    </div>
                    {head && (
                      <div className='text-xs text-gray-500 mt-1'>
                        Wins vs {movieB}: {head.aWins}
                      </div>
                    )}
                  </div>

                  {/* Right: Loser */}
                  <div>
                    {movieB}
                    <div className='text-gray-700 text-xs'>
                      ELO: {b.elo.loserAfter}
                      <span
                        className={
                          loserDelta >= 0
                            ? 'text-green-600 ml-1'
                            : 'text-red-600 ml-1'
                        }>
                        ({loserDelta >= 0 ? '+' : ''}
                        {loserDelta.toFixed(0)})
                      </span>
                    </div>
                    {head && (
                      <div className='text-xs text-gray-500 mt-1'>
                        Wins vs {movieA}: {head.bWins}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className='mt-6 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 h-9 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300'>
            Close
          </button>
          <button
            onClick={onFinish}
            className='px-4 h-9 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800'>
            Finish & Return to Rankings
          </button>
        </div>
      </div>
    </div>
  );
}
