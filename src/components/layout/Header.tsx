// src/components/layout/Header.tsx
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { SearchResults } from '@/components/features/search/SearchResults';
import { useQuery } from '@tanstack/react-query';
import { tmdb } from '@/lib/api/tmdb';
import { useDebounce } from '@/lib/utils/hooks/useDebounce';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search movies
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => tmdb.searchMovies(debouncedQuery),
    enabled: debouncedQuery.length > 2,
  });

  // Handle click outside
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

  // Handle ESC key
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

  const showResults = isSearchFocused && searchQuery.length > 2;

  return (
    <header className='h-16 bg-surface border-b border-border flex items-center justify-end px-6'>
      <div className='flex-1 max-w-xl'>
        <div className='relative' ref={searchRef}>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary' />

          <Input
            type='search'
            placeholder='Search movies...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            className='pl-10 pr-10 w-full'
          />

          {/* Loading/Clear button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-hover rounded'>
              {isLoading ? (
                <Loader2 className='w-4 h-4 text-tertiary animate-spin' />
              ) : (
                <X className='w-4 h-4 text-tertiary' />
              )}
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && searchResults && (
            <SearchResults
              results={searchResults.results}
              onClose={() => {
                setIsSearchFocused(false);
                setSearchQuery('');
              }}
            />
          )}
        </div>
      </div>

      <div className='flex items-center gap-4 ml-6'>
        <button className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
          <User className='w-5 h-5 text-secondary' />
        </button>
      </div>
    </header>
  );
};

export default Header;
