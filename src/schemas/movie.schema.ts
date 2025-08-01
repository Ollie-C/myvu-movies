import { z } from 'zod';
import type { Database } from '@/types/database.types';

type MovieRow = Database['public']['Tables']['movies']['Row'];

// Genre Schema
const GenreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Movie Schema
export const MovieSchema = z.object({
  id: z.number(),
  tmdb_id: z.number(),
  title: z.string().min(1, 'Title is required'),
  original_title: z.string().nullable(),
  original_language: z.string().length(2).nullable(),
  overview: z.string().nullable(),
  release_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable(),
  poster_path: z
    .string()
    .regex(/^\/[\w\-\.\/]+\.(jpg|jpeg|png)$/, 'Invalid poster path')
    .nullable(),
  backdrop_path: z
    .string()
    .regex(/^\/[\w\-\.\/]+\.(jpg|jpeg|png)$/, 'Invalid backdrop path')
    .nullable(),
  popularity: z.number().min(0).nullable(),
  vote_average: z.number().min(0).max(10).nullable(),
  vote_count: z.number().min(0).nullable(),
  genres: z.array(GenreSchema).nullable(),
  runtime: z.number().min(0).nullable(),
  tagline: z.string().nullable(),
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
    .nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
}) satisfies z.ZodType<MovieRow>;

export const MovieInsertSchema = MovieSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  tmdb_id: z.number(),
  title: z.string().min(1),
  genres: z.array(GenreSchema).default([]),
});

export const MovieUpdateSchema = MovieSchema.partial().omit({
  id: true,
  tmdb_id: true,
});

export const TMDBMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string(),
  original_language: z.string(),
  overview: z.string(),
  release_date: z.string(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  popularity: z.number(),
  vote_average: z.number(),
  vote_count: z.number(),
  genre_ids: z.array(z.number()).optional(),
  genres: z.array(GenreSchema).optional(),
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
export type TMDBMovie = z.infer<typeof TMDBMovieSchema>;

export const movieHelpers = {
  getPosterUrl(
    movie: Movie,
    size: 'w200' | 'w500' | 'original' = 'w500'
  ): string | null {
    if (!movie.poster_path) return null;
    return `https://image.tmdb.org/t/p/${size}${movie.poster_path}`;
  },

  getBackdropUrl(
    movie: Movie,
    size: 'w780' | 'w1280' | 'original' = 'w1280'
  ): string | null {
    if (!movie.backdrop_path) return null;
    return `https://image.tmdb.org/t/p/${size}${movie.backdrop_path}`;
  },

  getReleaseYear(movie: Movie): number | null {
    if (!movie.release_date) return null;
    return new Date(movie.release_date).getFullYear();
  },

  getDisplayTitle(movie: Movie): string {
    const year = movieHelpers.getReleaseYear(movie);
    return year ? `${movie.title} (${year})` : movie.title;
  },

  getGenreNames(movie: Movie): string[] {
    return movie.genres?.map((g) => g.name) || [];
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
      overview: tmdbMovie.overview,
      release_date: tmdbMovie.release_date,
      poster_path: tmdbMovie.poster_path,
      backdrop_path: tmdbMovie.backdrop_path,
      popularity: tmdbMovie.popularity,
      vote_average: tmdbMovie.vote_average,
      vote_count: tmdbMovie.vote_count,
      genres: tmdbMovie.genres || [],
      runtime: tmdbMovie.runtime || null,
      tagline: tmdbMovie.tagline || null,
      credits: tmdbMovie.credits || null,
    };
  },
};
