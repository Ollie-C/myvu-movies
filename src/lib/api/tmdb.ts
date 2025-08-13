import type { TMDBMovie } from '@/schemas/movie.schema';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const REQUEST_TIMEOUT = 10000;
const CACHE_DURATION = 5 * 60 * 1000;

export class TMDBError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'TMDBError';
  }
}

const cache = new Map<string, { data: any; timestamp: number }>();
let apiCallCount = 0;

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 40;
  private readonly windowMs = 10000;

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const fetchWithTimeout = async (url: string, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TMDBError('Request timeout');
    }
    throw error;
  }
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new TMDBError(
      errorData.status_message ||
        `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData.status_code
    );
  }
  return response.json();
};

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export const tmdb = {
  searchMovies: async (
    query: string,
    page = 1
  ): Promise<TMDBSearchResponse> => {
    const cacheKey = `search:${query}:${page}`;
    const cached = getCached<TMDBSearchResponse>(cacheKey);
    if (cached) return cached;

    await rateLimiter.checkLimit();
    apiCallCount++;

    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      query
    )}&page=${page}&include_adult=false`;

    const response = await fetchWithTimeout(url);
    const data = await handleResponse(response);

    setCache(cacheKey, data);
    return data;
  },

  getMovie: async (id: number): Promise<TMDBMovie> => {
    const cacheKey = `movie:${id}`;
    const cached = getCached<TMDBMovie>(cacheKey);
    if (cached) return cached;

    await rateLimiter.checkLimit();
    apiCallCount++;
    console.log(`TMDB API call #${apiCallCount} for movie ${id}`);

    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;

    const response = await fetchWithTimeout(url);
    const data = await handleResponse(response);

    setCache(cacheKey, data);
    return data;
  },

  getImageUrl: (
    path: string | null,
    size: 'w200' | 'w500' | 'w780' | 'original' = 'w500'
  ): string => {
    if (!path) return '/movie-placeholder.png';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  getPopularMovies: async (page = 1): Promise<TMDBSearchResponse> => {
    const cacheKey = `popular:${page}`;
    const cached = getCached<TMDBSearchResponse>(cacheKey);
    if (cached) return cached;

    await rateLimiter.checkLimit();
    apiCallCount++;

    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;

    const response = await fetchWithTimeout(url);
    const data = await handleResponse(response);

    setCache(cacheKey, data);
    return data;
  },

  clearCache: () => cache.clear(),
  getApiCallCount: () => apiCallCount,
  resetApiCallCount: () => {
    apiCallCount = 0;
  },
};
