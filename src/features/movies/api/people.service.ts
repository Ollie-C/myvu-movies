import { supabase } from '@/shared/lib/supabase';
import {
  PersonSchema,
  type Person,
} from '@/features/movies/models/movie.schema';

export const peopleService = {
  async listDirectors(limit = 100): Promise<Person[]> {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('name')
      .limit(limit);
    if (error) throw error;
    return (data || []).map((p) => PersonSchema.parse(p));
  },
};
