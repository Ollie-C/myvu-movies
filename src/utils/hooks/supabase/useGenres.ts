import { useQuery } from '@tanstack/react-query';
import { genreService } from '@/services/supabase/genre.service';
import type { Genre } from '@/schemas/movie.schema';

export const genreKeys = {
  all: ['genres'] as const,
};

export function useGenres() {
  return useQuery<Genre[], Error>({
    queryKey: genreKeys.all,
    queryFn: () => genreService.listGenres(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
