import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

interface MovieState {
  isWatched: boolean;
  isInWatchlist: boolean;
  isFavorite: boolean;
  rating?: number;
  movie_uuid?: string | null;
}

interface MovieStore {
  movieStates: Map<number, MovieState>;
  optimisticUpdates: Map<number, Partial<MovieState>>;

  setMovieState: (movieId: number, state: Partial<MovieState>) => void;
  setMultipleMovieStates: (
    movies: Array<{ id: number } & Partial<MovieState>>
  ) => void;
  setOptimisticUpdate: (movieId: number, update: Partial<MovieState>) => void;
  clearOptimisticUpdate: (movieId: number) => void;
  clearAllOptimisticUpdates: () => void;

  hydrateFromSearchResults: (
    results: Array<{
      id: number;
      is_watched?: boolean;
      is_in_watchlist?: boolean;
      is_favorite?: boolean;
      rating?: number;
    }>
  ) => void;

  hydrateFromWatchedMovies: (
    movies: Array<{
      movie_id: number;
      is_favorite: boolean;
      rating: number | null;
    }>
  ) => void;

  getMovieState: (movieId: number) => MovieState;
  hasOptimisticUpdate: (movieId: number) => boolean;

  clear: () => void;
}

const defaultMovieState: MovieState = {
  isWatched: false,
  isInWatchlist: false,
  isFavorite: false,
  rating: undefined,
  movie_uuid: null,
};

export const useMovieStore = create<MovieStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        movieStates: new Map(),
        optimisticUpdates: new Map(),

        setMovieState: (movieId, state) =>
          set(
            (store) => {
              const newMap = new Map(store.movieStates);
              const current = newMap.get(movieId) || { ...defaultMovieState };
              newMap.set(movieId, { ...current, ...state });
              return { movieStates: newMap };
            },
            false,
            'setMovieState'
          ),

        setMultipleMovieStates: (movies) =>
          set(
            (store) => {
              const newMap = new Map(store.movieStates);
              movies.forEach(({ id, ...state }) => {
                const current = newMap.get(id) || { ...defaultMovieState };
                newMap.set(id, { ...current, ...state });
              });
              return { movieStates: newMap };
            },
            false,
            'setMultipleMovieStates'
          ),

        setOptimisticUpdate: (movieId, update) =>
          set(
            (store) => {
              const newMap = new Map(store.optimisticUpdates);
              const current = newMap.get(movieId) || {};
              newMap.set(movieId, { ...current, ...update });
              return { optimisticUpdates: newMap };
            },
            false,
            'setOptimisticUpdate'
          ),

        clearOptimisticUpdate: (movieId) =>
          set(
            (store) => {
              const newMap = new Map(store.optimisticUpdates);
              newMap.delete(movieId);
              return { optimisticUpdates: newMap };
            },
            false,
            'clearOptimisticUpdate'
          ),

        clearAllOptimisticUpdates: () =>
          set(
            { optimisticUpdates: new Map() },
            false,
            'clearAllOptimisticUpdates'
          ),

        hydrateFromSearchResults: (
          results: Array<{
            tmdb_id: number;
            is_watched?: boolean;
            is_in_watchlist?: boolean;
            is_favorite?: boolean;
            rating?: number;
            movie_uuid?: string | null;
          }>
        ) =>
          set(
            (store) => {
              const newMap = new Map(store.movieStates);
              results.forEach((movie) => {
                const current = newMap.get(movie.tmdb_id) || {
                  ...defaultMovieState,
                };
                newMap.set(movie.tmdb_id, {
                  ...current,
                  isWatched: movie.is_watched ?? current.isWatched,
                  isInWatchlist: movie.is_in_watchlist ?? current.isInWatchlist,
                  isFavorite: movie.is_favorite ?? current.isFavorite,
                  rating: movie.rating ?? current.rating,
                  movie_uuid: movie.movie_uuid ?? current.movie_uuid,
                });
              });
              return { movieStates: newMap };
            },
            false,
            'hydrateFromSearchResults'
          ),

        hydrateFromWatchedMovies: (
          movies: Array<{
            tmdb_id: number;
            movie_uuid: string | null;
            favorite: boolean | null;
            rating: number | null;
          }>
        ) =>
          set(
            (store) => {
              const newMap = new Map(store.movieStates);
              movies.forEach((movie) => {
                const current = newMap.get(movie.tmdb_id) || {
                  ...defaultMovieState,
                };
                newMap.set(movie.tmdb_id, {
                  ...current,
                  isWatched: true,
                  isFavorite: movie.favorite ?? current.isFavorite,
                  rating: movie.rating ?? current.rating,
                  movie_uuid: movie.movie_uuid ?? current.movie_uuid,
                });
              });
              return { movieStates: newMap };
            },
            false,
            'hydrateFromWatchedMovies'
          ),

        hydrateFromWatchlistMovies: (
          movies: Array<{
            tmdb_id: number;
            movie_uuid: string | null;
          }>
        ) =>
          set(
            (store) => {
              const newMap = new Map(store.movieStates);
              movies.forEach((movie) => {
                const current = newMap.get(movie.tmdb_id) || {
                  ...defaultMovieState,
                };
                newMap.set(movie.tmdb_id, {
                  ...current,
                  isInWatchlist: true,
                  movie_uuid: movie.movie_uuid ?? current.movie_uuid,
                });
              });
              return { movieStates: newMap };
            },
            false,
            'hydrateFromWatchlistMovies'
          ),

        getMovieState: (movieId) => {
          const state = get();
          const baseState = state.movieStates.get(movieId) || {
            ...defaultMovieState,
          };
          const optimistic = state.optimisticUpdates.get(movieId);

          if (!optimistic) {
            return baseState;
          }

          return { ...baseState, ...optimistic };
        },

        hasOptimisticUpdate: (movieId) => {
          return get().optimisticUpdates.has(movieId);
        },

        clear: () =>
          set(
            {
              movieStates: new Map(),
              optimisticUpdates: new Map(),
            },
            false,
            'clear'
          ),
      }),
      {
        name: 'movie-store',
      }
    )
  )
);

export const useMovieState = (movieId: number) => {
  const baseState = useMovieStore(
    (state) => state.movieStates.get(movieId) || defaultMovieState
  );
  const optimisticUpdate = useMovieStore((state) =>
    state.optimisticUpdates.get(movieId)
  );

  if (!optimisticUpdate) {
    return baseState;
  }

  return { ...baseState, ...optimisticUpdate };
};

export const useIsMovieWatched = (movieId: number) => {
  const baseState = useMovieStore(
    (state) => state.movieStates.get(movieId)?.isWatched ?? false
  );
  const optimistic = useMovieStore(
    (state) => state.optimisticUpdates.get(movieId)?.isWatched
  );

  return optimistic !== undefined ? optimistic : baseState;
};

export const useIsMovieInWatchlist = (movieId: number) => {
  const baseState = useMovieStore(
    (state) => state.movieStates.get(movieId)?.isInWatchlist ?? false
  );
  const optimistic = useMovieStore(
    (state) => state.optimisticUpdates.get(movieId)?.isInWatchlist
  );

  return optimistic !== undefined ? optimistic : baseState;
};

export const useIsMovieFavorite = (movieId: number) => {
  const baseState = useMovieStore(
    (state) => state.movieStates.get(movieId)?.isFavorite ?? false
  );
  const optimistic = useMovieStore(
    (state) => state.optimisticUpdates.get(movieId)?.isFavorite
  );

  return optimistic !== undefined ? optimistic : baseState;
};

export const useMovieStates = (movieIds: number[]) => {
  const movieStates = useMovieStore((state) => state.movieStates);
  const optimisticUpdates = useMovieStore((state) => state.optimisticUpdates);

  const states: Record<number, MovieState> = {};

  movieIds.forEach((id) => {
    const baseState = movieStates.get(id) || { ...defaultMovieState };
    const optimistic = optimisticUpdates.get(id);

    states[id] = optimistic ? { ...baseState, ...optimistic } : baseState;
  });

  return states;
};

if (process.env.NODE_ENV === 'development') {
  (window as any).movieStore = useMovieStore;
}
