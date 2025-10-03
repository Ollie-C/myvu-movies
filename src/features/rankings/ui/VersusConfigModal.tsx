import { useState, useMemo } from 'react';

// Components
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Card } from '@/shared/ui/Card';
import MoviePoster from '@/features/movies/ui/MoviePoster';

// Schemas
import {
  VersusSessionConfigSchema,
  type VersusSessionConfig,
} from '@/features/rankings/models/versus-session-config.schema';

// Hooks
import { useWatchedMovies } from '@/features/watched-movies/api/hooks/useWatchedMovies';
import { useDirectors } from '@/features/movies/api/hooks/useDirectors';
import { useGenres } from '@/features/movies/api/hooks/useGenres';

// Helpers
import { cn } from '@/shared/utils/helpers/cn';

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
  const [movieSearchTerm, setMovieSearchTerm] = useState('');

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

  // Filter movies based on search term
  const filteredMovies = useMemo(() => {
    if (!watchedMovies?.data) return [];

    return watchedMovies.data
      .filter((m) => m.movie_id !== null)
      .filter(
        (movie) =>
          movieSearchTerm === '' ||
          movie.title?.toLowerCase().includes(movieSearchTerm.toLowerCase())
      );
  }, [watchedMovies?.data, movieSearchTerm]);

  function toggleMovie(movieId: string) {
    setSelectedMovieIds((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  }

  function selectAllMovies() {
    const allMovieIds = filteredMovies
      .filter((m) => m.movie_id !== null)
      .map((m) => m.movie_id!);
    setSelectedMovieIds(allMovieIds);
  }

  function deselectAllMovies() {
    setSelectedMovieIds([]);
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
    <Dialog
      open={isOpen}
      onClose={onClose}
      title='Configure Versus Session'
      size='4xl'>
      <div className='max-h-[80vh] overflow-y-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Left Column */}
          <div className='space-y-6'>
            {/* Session Details */}
            <Card className='p-4'>
              <h3 className='text-lg font-semibold mb-4'>Session Details</h3>
              <div className='space-y-4'>
                <Input
                  label='Session Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Enter session name'
                />

                <div>
                  <label className='block text-sm font-medium text-primary mb-2'>
                    Elo Handling
                  </label>
                  <select
                    value={eloHandling}
                    onChange={(e) => setEloHandling(e.target.value as any)}
                    className={cn(
                      'w-full px-4 py-2.5 rounded',
                      'bg-transparent border border-border',
                      'text-primary',
                      'transition-all duration-200',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                      'hover:border-border-strong'
                    )}>
                    <option value='local'>Local (session-only)</option>
                    <option value='global'>
                      Global (updates overall scores)
                    </option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Battle Configuration */}
            <Card className='p-4'>
              <h3 className='text-lg font-semibold mb-4'>
                Battle Configuration
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-primary mb-2'>
                    Battle Limit Type
                  </label>
                  <select
                    value={battleLimitType}
                    onChange={(e) => setBattleLimitType(e.target.value as any)}
                    className={cn(
                      'w-full px-4 py-2.5 rounded',
                      'bg-transparent border border-border',
                      'text-primary',
                      'transition-all duration-200',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                      'hover:border-border-strong'
                    )}>
                    <option value='complete'>Complete (all pairs)</option>
                    <option value='fixed'>Fixed number of battles</option>
                    <option value='per-movie'>Battles per movie</option>
                    <option value='infinite'>Infinite battles</option>
                  </select>
                </div>

                {(battleLimitType === 'fixed' ||
                  battleLimitType === 'per-movie') && (
                  <Input
                    type='number'
                    label={
                      battleLimitType === 'fixed'
                        ? 'Total Battles'
                        : 'Battles Per Movie'
                    }
                    placeholder='Enter number'
                    value={battleLimit ?? ''}
                    onChange={(e) => setBattleLimit(Number(e.target.value))}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            {/* Movie Selection */}
            <Card className='p-4 h-full'>
              <h3 className='text-lg font-semibold mb-4'>Movie Selection</h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-primary mb-2'>
                    Selection Mode
                  </label>
                  <select
                    value={movieSelection}
                    onChange={(e) => setMovieSelection(e.target.value as any)}
                    className={cn(
                      'w-full px-4 py-2.5 rounded',
                      'bg-transparent border border-border',
                      'text-primary',
                      'transition-all duration-200',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                      'hover:border-border-strong'
                    )}>
                    <option value='all'>All watched movies</option>
                    <option value='selection'>Pick specific movies</option>
                  </select>
                </div>

                {movieSelection === 'selection' && (
                  <div className='space-y-4'>
                    {/* Search and controls */}
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <div className='flex-1'>
                        <Input
                          placeholder='Search movies...'
                          value={movieSearchTerm}
                          onChange={(e) => setMovieSearchTerm(e.target.value)}
                          leftIcon={
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'>
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                              />
                            </svg>
                          }
                        />
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          onClick={selectAllMovies}
                          variant='secondary'
                          size='sm'
                          disabled={filteredMovies.length === 0}>
                          Select All
                        </Button>
                        <Button
                          onClick={deselectAllMovies}
                          variant='secondary'
                          size='sm'
                          disabled={selectedMovieIds.length === 0}>
                          Clear
                        </Button>
                      </div>
                    </div>

                    {/* Selected count */}
                    <div className='text-sm text-secondary'>
                      {selectedMovieIds.length} of {filteredMovies.length}{' '}
                      movies selected
                    </div>

                    {/* Movie poster grid */}
                    <div className='border border-border rounded-lg max-h-96 overflow-y-auto p-4'>
                      {isLoading ? (
                        <div className='p-8 text-center text-secondary'>
                          Loading movies...
                        </div>
                      ) : filteredMovies.length === 0 ? (
                        <div className='p-8 text-center text-secondary'>
                          {movieSearchTerm
                            ? 'No movies match your search'
                            : 'No watched movies found'}
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
                          {filteredMovies.map((movie) => {
                            const isSelected = selectedMovieIds.includes(
                              movie.movie_id!
                            );
                            return (
                              <div
                                key={movie.movie_id!}
                                className={cn(
                                  'relative cursor-pointer transition-all duration-200',
                                  'hover:scale-105 hover:shadow-lg',
                                  isSelected &&
                                    'ring-2 ring-primary ring-offset-2'
                                )}
                                onClick={() => toggleMovie(movie.movie_id!)}>
                                <div className='aspect-[2/3] relative overflow-hidden rounded-lg bg-surface'>
                                  <MoviePoster
                                    movie={movie}
                                    className='w-full h-full'
                                    variant='rounded'
                                  />

                                  {/* Checkmark overlay */}
                                  <div
                                    className={cn(
                                      'absolute top-2 right-2 w-6 h-6 rounded-full transition-all duration-200',
                                      'flex items-center justify-center',
                                      isSelected
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'bg-black/20 text-white/70 hover:bg-black/40'
                                    )}>
                                    {isSelected ? (
                                      <svg
                                        className='w-4 h-4'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'>
                                        <path
                                          fillRule='evenodd'
                                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                          clipRule='evenodd'
                                        />
                                      </svg>
                                    ) : (
                                      <div className='w-3 h-3 border-2 border-current rounded-full' />
                                    )}
                                  </div>

                                  {/* Movie title overlay on hover */}
                                  <div
                                    className={cn(
                                      'absolute bottom-0 left-0 right-0 p-2',
                                      'bg-gradient-to-t from-black/80 to-transparent',
                                      'text-white text-xs font-medium',
                                      'opacity-0 hover:opacity-100 transition-opacity duration-200'
                                    )}>
                                    <div className='truncate'>
                                      {movie.title}
                                    </div>
                                    {movie.release_date && (
                                      <div className='text-white/70 text-xs'>
                                        {new Date(
                                          movie.release_date
                                        ).getFullYear()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className='p-4 mb-6'>
          <h3 className='text-lg font-semibold mb-4'>Filters</h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Genres */}
            <div>
              <label className='block text-sm font-medium text-primary mb-2'>
                Genres
              </label>
              <select
                multiple
                value={genreIds}
                onChange={(e) =>
                  setGenreIds(
                    Array.from(e.target.selectedOptions, (opt) => opt.value)
                  )
                }
                className={cn(
                  'w-full px-3 py-2 rounded',
                  'bg-transparent border border-border',
                  'text-primary text-sm',
                  'transition-all duration-200',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                  'hover:border-border-strong',
                  'h-24'
                )}>
                {isGenresLoading ? (
                  <option disabled>Loading genres...</option>
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
              <label className='block text-sm font-medium text-primary mb-2'>
                Directors
              </label>
              <select
                multiple
                value={directorIds}
                onChange={(e) =>
                  setDirectorIds(
                    Array.from(e.target.selectedOptions, (opt) => opt.value)
                  )
                }
                className={cn(
                  'w-full px-3 py-2 rounded',
                  'bg-transparent border border-border',
                  'text-primary text-sm',
                  'transition-all duration-200',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                  'hover:border-border-strong',
                  'h-24'
                )}>
                {isDirectorsLoading ? (
                  <option disabled>Loading directors...</option>
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
              <label className='block text-sm font-medium text-primary mb-2'>
                Languages
              </label>
              <select
                multiple
                value={languages}
                onChange={(e) =>
                  setLanguages(
                    Array.from(e.target.selectedOptions, (opt) => opt.value)
                  )
                }
                className={cn(
                  'w-full px-3 py-2 rounded',
                  'bg-transparent border border-border',
                  'text-primary text-sm',
                  'transition-all duration-200',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
                  'hover:border-border-strong',
                  'h-24'
                )}>
                <option value='en'>English</option>
                <option value='ja'>Japanese</option>
                <option value='fr'>French</option>
                <option value='de'>German</option>
                <option value='es'>Spanish</option>
                <option value='it'>Italian</option>
                <option value='ko'>Korean</option>
                <option value='zh'>Chinese</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-600 text-sm'>{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className='flex gap-3 pt-4 border-t border-border'>
          <Button onClick={onClose} variant='secondary' className='flex-1'>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className='flex-1'>
            Start Session
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
