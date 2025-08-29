import { z } from 'zod';
import type { BaseMovieDetails } from '@/types/userMovie';

export const GenreSchema = z.object({
  id: z.uuid(),
  tmdb_id: z.number().nullable(),
  name: z.string(),
});

export const PersonSchema = z.object({
  id: z.uuid(),
  tmdb_id: z.number().nullable(),
  name: z.string(),
  profile_path: z.string().nullable(),
});

export const MovieSchema = z.object({
  id: z.uuid(),
  tmdb_id: z.number(),
  title: z.string().min(1, 'Title is required'),
  original_title: z.string().nullable(),
  original_language: z.string().length(2).nullable(),
  overview: z.string().nullable(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  popularity: z.number().nullable(),
  vote_average: z.number().nullable(),
  vote_count: z.number().nullable(),
  runtime: z.number().nullable(),
  tagline: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const MovieInsertSchema = MovieSchema.pick({
  tmdb_id: true,
  title: true,
  original_title: true,
  original_language: true,
  overview: true,
  release_date: true,
  poster_path: true,
  backdrop_path: true,
  popularity: true,
  vote_average: true,
  vote_count: true,
  runtime: true,
  tagline: true,
});
export const MovieUpdateSchema = MovieInsertSchema.partial();

export const TMDBMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string(),
  original_language: z.string(),
  overview: z.string().nullable(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  popularity: z.number(),
  vote_average: z.number(),
  vote_count: z.number(),
  genre_ids: z.array(z.number()).optional(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  runtime: z.number().optional(),
  tagline: z.string().optional(),
  credits: z
    .object({
      cast: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            character: z.string(),
            profile_path: z.string().nullable(),
          })
        )
        .optional(),
      crew: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            job: z.string(),
            profile_path: z.string().nullable(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type Movie = z.infer<typeof MovieSchema>;
export type MovieInsert = z.infer<typeof MovieInsertSchema>;
export type MovieUpdate = z.infer<typeof MovieUpdateSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type TMDBMovie = z.infer<typeof TMDBMovieSchema>;

export const movieHelpers = {
  getPosterUrl(
    movie: BaseMovieDetails,
    size: 'w200' | 'w500' | 'original' = 'w500'
  ): string | null {
    return movie.poster_path
      ? `https://image.tmdb.org/t/p/${size}${movie.poster_path}`
      : null;
  },

  getBackdropUrl(
    movie: BaseMovieDetails,
    size: 'w780' | 'w1280' | 'original' = 'w1280'
  ): string | null {
    return movie.backdrop_path
      ? `https://image.tmdb.org/t/p/${size}${movie.backdrop_path}`
      : null;
  },

  getReleaseYear(movie: BaseMovieDetails): number | null {
    return movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : null;
  },

  getDisplayTitle(movie: BaseMovieDetails): string {
    const year = movieHelpers.getReleaseYear(movie);
    return year ? `${movie.title} (${year})` : movie.title ?? '';
  },

  isRecent(movie: Movie, days: number = 30): boolean {
    if (!movie.release_date) return false;
    const releaseDate = new Date(movie.release_date);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    return releaseDate > daysAgo;
  },

  fromTMDB(tmdbMovie: TMDBMovie): MovieInsert {
    return {
      tmdb_id: tmdbMovie.id,
      title: tmdbMovie.title,
      original_title: tmdbMovie.original_title,
      original_language: tmdbMovie.original_language,
      overview: tmdbMovie.overview ?? null,
      release_date: tmdbMovie.release_date ?? null,
      poster_path: tmdbMovie.poster_path,
      backdrop_path: tmdbMovie.backdrop_path,
      popularity: tmdbMovie.popularity,
      vote_average: tmdbMovie.vote_average,
      vote_count: tmdbMovie.vote_count,
      runtime: tmdbMovie.runtime ?? null,
      tagline: tmdbMovie.tagline ?? null,
    };
  },
};
