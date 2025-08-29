import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/supabase/user.service';
import { useAuth } from '@/context/AuthContext';
import type { UserMovie } from '@/types/userMovie';

export const userMoviesKeys = {
  all: ['userMovies'] as const,
  list: (userId: string) => [...userMoviesKeys.all, userId] as const,
};

export const useUserMovies = () => {
  const { user } = useAuth();

  return useQuery<UserMovie[], Error>({
    queryKey: userMoviesKeys.list(user?.id || ''),
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return userService.getAllUserMovies(user.id);
    },
    enabled: !!user?.id,
  });
};
