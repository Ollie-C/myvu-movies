// audited: 12/08/2025

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/supabase/user.service';
import { useAuth } from '@/context/AuthContext';
import type { UserMovie } from '@/services/supabase/user.service';

export const userMoviesKeys = {
  all: ['userMovies'] as const,
  allForUser: (userId: string) =>
    [...userMoviesKeys.all, 'all', userId] as const,
};

export const useAllUserMovies = () => {
  const { user } = useAuth();

  return useQuery<UserMovie[], Error>({
    queryKey: userMoviesKeys.allForUser(user?.id || ''),
    queryFn: () => userService.getAllUserMovies(user?.id || ''),
    enabled: !!user?.id,
  });
};
