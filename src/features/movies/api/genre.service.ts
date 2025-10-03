import { supabase } from '@/shared/lib/supabase';
import { GenreSchema, type Genre } from '@/features/movies/models/movie.schema';

export const genreService = {
  async listGenres(): Promise<Genre[]> {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map((g) => GenreSchema.parse(g));
  },
};
