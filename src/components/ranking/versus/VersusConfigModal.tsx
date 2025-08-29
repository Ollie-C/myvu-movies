import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Dialog } from '@/components/common/Dialog';
import {
  VersusSessionConfigSchema,
  type VersusSessionConfig,
} from '@/schemas/versus-session-config.schema';
import { useWatchedMovies } from '@/utils/hooks/supabase/useWatchedMovies';
import { useDirectors } from '@/utils/hooks/supabase/useDirectors';
import { useGenres } from '@/utils/hooks/supabase/useGenres';

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

  // new state for filters
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [directorIds, setDirectorIds] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // options loaded from Supabase
  const { data: genres = [], isLoading: isGenresLoading } = useGenres();
  const { data: directors = [], isLoading: isDirectorsLoading } =
    useDirectors();

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
      filters: {
        genreIds,
        directorIds,
        languages,
      },
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
                    {movie.title}
                  </label>
                ))
            )}
            {watchedMovies?.data?.length === 0 && (
              <p className='text-sm text-gray-500'>No watched movies found.</p>
            )}
          </div>
        )}

        {/* Filters (new!) */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium'>Filters</label>

          {/* Genres */}
          <div>
            <label className='block text-xs mb-1'>Genres</label>
            <select
              multiple
              value={genreIds}
              onChange={(e) =>
                setGenreIds(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className='border p-2 w-full h-24'>
              {isGenresLoading ? (
                <option>Loading genres...</option>
              ) : (
                genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Directors */}
          <div>
            <label className='block text-xs mb-1'>Directors</label>
            <select
              multiple
              value={directorIds}
              onChange={(e) =>
                setDirectorIds(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className='border p-2 w-full h-24'>
              {isDirectorsLoading ? (
                <option>Loading directors...</option>
              ) : (
                directors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Languages */}
          <div>
            <label className='block text-xs mb-1'>Languages</label>
            <select
              multiple
              value={languages}
              onChange={(e) =>
                setLanguages(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className='border p-2 w-full h-24'>
              {/* You could hardcode for now */}
              <option value='en'>English</option>
              <option value='ja'>Japanese</option>
              <option value='fr'>French</option>
              <option value='de'>German</option>
              <option value='es'>Spanish</option>
            </select>
          </div>
        </div>

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
