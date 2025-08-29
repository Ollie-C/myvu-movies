import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { SessionFilters } from '@/schemas/versus-session-config.schema';

export function applyMovieFilters(
  query: PostgrestFilterBuilder<any, any, any>,
  filters?: SessionFilters
) {
  if (!filters) return query;

  const { genreIds, directorIds, releaseYear, runtimeMinutes, languages } =
    filters;

  // Languages
  if (languages && languages.length > 0) {
    query = query.in('movie.original_language', languages as any);
  }

  // Release Year
  if (releaseYear?.from) {
    query = query.gte('movie.release_date', `${releaseYear.from}-01-01`);
  }
  if (releaseYear?.to) {
    query = query.lte('movie.release_date', `${releaseYear.to}-12-31`);
  }

  // Runtime
  if (runtimeMinutes?.min) {
    query = query.gte('movie.runtime', runtimeMinutes.min);
  }
  if (runtimeMinutes?.max) {
    query = query.lte('movie.runtime', runtimeMinutes.max);
  }

  // Genres
  if (genreIds && genreIds.length > 0) {
    query = query.in('movie.movie_genres.genre_id', genreIds as any);
  }

  // Directors
  if (directorIds && directorIds.length > 0) {
    query = query.in('movie.movie_directors.person_id', directorIds as any);
  }

  return query;
}
