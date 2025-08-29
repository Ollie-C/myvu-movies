import { useQuery } from '@tanstack/react-query';
import { peopleService } from '@/services/supabase/people.service';
import type { Person } from '@/schemas/movie.schema';

export const directorKeys = {
  all: ['directors'] as const,
};

export function useDirectors(limit = 100) {
  return useQuery<Person[], Error>({
    queryKey: [...directorKeys.all, limit],
    queryFn: () => peopleService.listDirectors(limit),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
