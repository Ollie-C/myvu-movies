// ---- Base ----
export interface BaseMovieDetails {
  movie_id: string | null;
  movie_uuid: string | null;
  tmdb_id: number | null;
  title: string | null;
  original_title: string | null;
  original_language: string | null;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  tagline: string | null;
  runtime: number | null;
  popularity: number | null;
  vote_average: number | null;
  vote_count: number | null;
  genre_ids: string[] | null;
  genre_names: string[] | null;
  director_ids: string[] | null;
  director_names: string[] | null;
}

// ---- Watched ----
export interface WatchedMovie extends BaseMovieDetails {
  watched_movie_id: string;
  user_id: string | null;
  watched_date: string;
  rating: number | null;
  notes: string | null;
  favorite: boolean | null;
  elo_score: number | null;
  watched_created_at: string | null;
  watched_updated_at: string | null;
}

// ---- Watchlist ----
export interface WatchlistMovie extends BaseMovieDetails {
  watchlist_id: string;
  user_id: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  notes: string | null;
  reminder_date: string | null;
  added_date: string | null;
  watchlist_updated_at: string | null;
}

// ---- Collection ----
export interface CollectionItemMovie extends BaseMovieDetails {
  collection_item_id: string;
  collection_id: string;
  position: number | null;
  notes: string | null;
  added_at: string | null;
}

/**
 * Union type: any movie row belonging to the user.
 */
export type UserMovie = WatchedMovie | WatchlistMovie | CollectionItemMovie;
