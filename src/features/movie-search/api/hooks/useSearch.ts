import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/shared/utils/hooks/useDebounce';
import {
  movieSearchService,
  type MovieSearchResult,
} from '@/features/movie-search/api/movie-search.service';
import { useAuth } from '@/shared/context/AuthContext';
import { useMovieStore } from '@/shared/stores/useMovieStore';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

interface UseSearchReturn {
  searchQuery: string;
  debouncedQuery: string;
  isSearchFocused: boolean;
  searchResults: MovieSearchResult[] | undefined;
  isLoading: boolean;
  searchRef: React.RefObject<HTMLDivElement | null>;
  setSearchQuery: (query: string) => void;
  setIsSearchFocused: (focused: boolean) => void;
  clearSearch: () => void;
  showResults: boolean;
}

export const searchKeys = {
  all: ['hybrid-search'] as const,
  search: (query: string, userId?: string) =>
    ['hybrid-search', query, userId] as const,
};

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const { debounceMs = 300, minQueryLength = 2, enabled = true } = options;
  const { user } = useAuth();
  const hydrateFromSearchResults = useMovieStore(
    (state) => state.hydrateFromSearchResults
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  const { data: searchResults, isLoading } = useQuery<
    MovieSearchResult[],
    Error
  >({
    queryKey: searchKeys.search(debouncedQuery, user?.id),
    queryFn: () => {
      if (!debouncedQuery) return Promise.resolve([]);
      return movieSearchService.searchMovies(debouncedQuery, user?.id);
    },
    enabled: enabled && debouncedQuery.length > minQueryLength,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      hydrateFromSearchResults(searchResults);
    }
  }, [searchResults, hydrateFromSearchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchFocused(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchFocused(false);
  }, []);

  const showResults = isSearchFocused && searchQuery.length > minQueryLength;

  return {
    searchQuery,
    debouncedQuery,
    isSearchFocused,
    searchResults,
    isLoading,
    searchRef,
    setSearchQuery,
    setIsSearchFocused,
    clearSearch,
    showResults,
  };
};
