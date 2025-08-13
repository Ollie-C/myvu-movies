// Audited: 11/08/2025
import { Search, X, Loader2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { SearchResults } from '@/components/features/search/SearchResults';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/supabase/user.service';
import { useSearch } from '@/utils/hooks/useSearch';

const Header = () => {
  const { user } = useAuth();

  const {
    searchQuery,
    searchResults,
    isLoading,
    searchRef,
    setSearchQuery,
    setIsSearchFocused,
    clearSearch,
    showResults,
  } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => userService.getUserProfile(user!.id),
    enabled: !!user?.id,
  });

  const getUserInitials = () => {
    if (userProfile?.username) {
      return userProfile.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className='h-16 bg-transparent flex items-center justify-between px-12'>
      <Link
        to='/'
        className='flex items-center space-x-2 hover:opacity-80 transition-opacity'>
        <div className='w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center text-white text-[10px]'>
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.username || 'User'}
              className='w-5 h-5 rounded-full object-cover'
            />
          ) : (
            getUserInitials()
          )}
        </div>
        <div className='hidden sm:block'>
          <p className='text-sm font-light text-gray-900'>
            {userProfile?.username || user?.email?.split('@')[0] || 'User'}
          </p>
        </div>
        <ChevronDown className='w-4 h-4 text-tertiary' />
      </Link>

      <div className='flex-1 max-w-xl mx-6'>
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
          {searchQuery && (
            <button
              onClick={clearSearch}
              className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-hover rounded'>
              {isLoading ? (
                <Loader2 className='w-4 h-4 text-tertiary animate-spin' />
              ) : (
                <X className='w-4 h-4 text-tertiary' />
              )}
            </button>
          )}

          {showResults && searchResults && (
            <SearchResults results={searchResults} onClose={clearSearch} />
          )}
        </div>
      </div>

      <div className='w-10 h-10'></div>
    </header>
  );
};

export default Header;
