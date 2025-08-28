import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';
import {
  VersusSessionConfigSchema,
  type VersusSessionConfig,
} from '@/schemas/versus-session-config.schema';
import { useWatchedMovies } from '@/utils/hooks/supabase/queries/useWatchedMovies';

export default function VersusConfigModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: VersusSessionConfig) => void;
}) {
  const [name, setName] = useState('New Versus Session');
  const [eloHandling, setEloHandling] = useState<'global' | 'local'>('local');
  const [movieSelection, setMovieSelection] = useState<'all' | 'selection'>(
    'all'
  );
  const [battleLimitType, setBattleLimitType] = useState<
    'complete' | 'fixed' | 'per-movie' | 'infinite'
  >('complete');
  const [battleLimit, setBattleLimit] = useState<number | undefined>();
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const { data: watchedMovies, isLoading } = useWatchedMovies({
    onlyRated: false,
    sortBy: 'title',
    sortOrder: 'asc',
  });

  function toggleMovie(movieId: string) {
    setSelectedMovieIds((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  }

  function handleSubmit() {
    const rawConfig = {
      name,
      elo_handling: eloHandling,
      movieSelection,
      movieIds: movieSelection === 'selection' ? selectedMovieIds : undefined,
      battle_limit_type: battleLimitType,
      battle_limit: battleLimit,
    };

    const parsed = VersusSessionConfigSchema.safeParse(rawConfig);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid configuration');
      return;
    }

    setError(null);
    onSubmit(parsed.data);
  }

  return (
    <Dialog open={isOpen} onClose={onClose} title='Configure Versus Session'>
      <div className='space-y-4'>
        {/* Name */}
        <div>
          <label className='block text-sm'>Session Name</label>
          <input
            className='border p-2 w-full'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Elo handling */}
        <div>
          <label className='block text-sm mb-1'>Elo Handling</label>
          <select
            value={eloHandling}
            onChange={(e) => setEloHandling(e.target.value as any)}
            className='border p-2 w-full'>
            <option value='local'>Local (session-only)</option>
            <option value='global'>Global (updates overall scores)</option>
          </select>
        </div>

        {/* Movie selection */}
        <div>
          <label className='block text-sm mb-1'>Movie Selection</label>
          <select
            value={movieSelection}
            onChange={(e) => setMovieSelection(e.target.value as any)}
            className='border p-2 w-full'>
            <option value='all'>All watched</option>
            <option value='selection'>Pick selection</option>
          </select>
        </div>

        {movieSelection === 'selection' && (
          <div className='border rounded p-2 h-64 max-h-64 overflow-y-auto'>
            {isLoading ? (
              <p className='text-sm text-gray-500'>Loading movies...</p>
            ) : (
              watchedMovies?.data
                ?.filter((m) => m.movie_id !== null)
                .map((movie) => (
                  <label
                    key={movie.movie_id!}
                    className='flex items-center gap-2 cursor-pointer text-sm py-1'>
                    <input
                      type='checkbox'
                      checked={selectedMovieIds.includes(movie.movie_id!)}
                      onChange={() => toggleMovie(movie.movie_id!)}
                    />
                    {movie.movie?.title}
                  </label>
                ))
            )}
            {watchedMovies?.data?.length === 0 && (
              <p className='text-sm text-gray-500'>No watched movies found.</p>
            )}
          </div>
        )}

        {/* Battle limit */}
        <div>
          <label className='block text-sm mb-1'>Battle Limit</label>
          <select
            value={battleLimitType}
            onChange={(e) => setBattleLimitType(e.target.value as any)}
            className='border p-2 w-full mb-2'>
            <option value='complete'>Complete (all pairs)</option>
            <option value='fixed'>Fixed number</option>
            <option value='per-movie'>Per movie</option>
            <option value='infinite'>Infinite</option>
          </select>
          {(battleLimitType === 'fixed' || battleLimitType === 'per-movie') && (
            <input
              type='number'
              className='border p-2 w-full'
              placeholder='Limit'
              value={battleLimit ?? ''}
              onChange={(e) => setBattleLimit(Number(e.target.value))}
            />
          )}
        </div>

        {/* Errors */}
        {error && <p className='text-red-500 text-sm'>{error}</p>}

        <Button onClick={handleSubmit} className='w-full'>
          Start Session
        </Button>
      </div>
    </Dialog>
  );
}
