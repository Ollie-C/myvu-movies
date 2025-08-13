// NOT AUDITED

import { motion } from 'framer-motion';
import { X, Trophy, Timer, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface BattleStatsProps {
  rankingListId: string;
  onClose: () => void;
  battleCount: number;
  sessionDuration: number;
}

export function BattleStats({
  rankingListId,
  onClose,
  battleCount,
  sessionDuration,
}: BattleStatsProps) {
  // Fetch top movies
  const { data: topMovies } = useQuery({
    queryKey: ['ranking-stats', rankingListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ranking_list_items')
        .select(
          `
          *,
          movie:movies(title, poster_path)
        `
        )
        .eq('ranking_list_id', rankingListId)
        .order('elo_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className='w-full max-w-2xl'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold'>Battle Statistics</h2>
            <button
              onClick={onClose}
              className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
              <X className='h-4 w-4' />
            </button>
          </div>

          {/* Session Stats */}
          <div className='grid grid-cols-3 gap-4 mb-8'>
            <div className='text-center'>
              <div className='flex items-center justify-center mb-2'>
                <Trophy className='h-8 w-8 text-yellow-500' />
              </div>
              <p className='text-2xl font-bold'>{battleCount}</p>
              <p className='text-sm text-muted-foreground'>Battles</p>
            </div>

            <div className='text-center'>
              <div className='flex items-center justify-center mb-2'>
                <Timer className='h-8 w-8 text-blue-500' />
              </div>
              <p className='text-2xl font-bold'>{sessionDuration}</p>
              <p className='text-sm text-muted-foreground'>Minutes</p>
            </div>

            <div className='text-center'>
              <div className='flex items-center justify-center mb-2'>
                <TrendingUp className='h-8 w-8 text-green-500' />
              </div>
              <p className='text-2xl font-bold'>
                {sessionDuration > 0
                  ? Math.round((battleCount / sessionDuration) * 60)
                  : 0}
              </p>
              <p className='text-sm text-muted-foreground'>Per Hour</p>
            </div>
          </div>

          {/* Top Movies */}
          {topMovies && topMovies.length > 0 && (
            <div>
              <h3 className='text-lg font-semibold mb-4'>Current Top 5</h3>
              <div className='space-y-3'>
                {topMovies.map((item, index) => (
                  <div
                    key={item.id}
                    className='flex items-center gap-3 p-2 rounded-lg bg-secondary/20'>
                    <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center'>
                      <span className='text-sm font-bold'>{index + 1}</span>
                    </div>
                    {item.movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.movie.poster_path}`}
                        alt={item.movie.title}
                        className='w-10 h-14 object-cover rounded'
                      />
                    )}
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>{item.movie.title}</p>
                      <p className='text-sm text-muted-foreground'>
                        ELO: {Math.round(item.elo_score || 1200)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational message */}
          <div className='mt-6 p-4 bg-primary/10 rounded-lg text-center'>
            <p className='text-sm'>
              {battleCount < 10
                ? 'Great start! Keep going to build your rankings!'
                : battleCount < 50
                ? "You're doing amazing! Your rankings are taking shape!"
                : "Wow! You're a ranking champion! 🏆"}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
