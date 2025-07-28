import type { TMDBMovie } from '@/schemas/movie.schema';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export const tmdb = {
  searchMovies: async (query: string): Promise<TMDBSearchResponse> => {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        query
      )}&include_adult=false`
    );

    if (!response.ok) {
      throw new Error('Failed to search movies');
    }

    return response.json();
  },

  getImageUrl: (
    path: string | null,
    size: 'w200' | 'w500' | 'original' = 'w200'
  ) => {
    if (!path) return '/movie-placeholder.png'; // Add a placeholder image
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  getMovie: async (id: number): Promise<TMDBMovie> => {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch movie');
    }

    return response.json();
  },
};
