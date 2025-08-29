// Audited: 2025-08-05
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { collectionService } from '@/services/supabase/collection.service';
import type { WatchedMovieWithMovie } from '@/schemas/watched-movie.schema';

export const userStatsKeys = {
  all: ['userStats'] as const,
  stats: (userId: string) => [...userStatsKeys.all, userId] as const,
};

interface UserStats {
  totalWatched: number;
  totalCollections: number;
  totalRankings: number;
  averageRating: number;
  favoriteGenre?: string;
  moviesThisMonth: number;
  moviesThisYear: number;
}

export const useUserStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: userStatsKeys.stats(user?.id || ''),
    queryFn: async (): Promise<UserStats> => {
      if (!user?.id) throw new Error('User not authenticated');

      const [watchedMovies, collections] = await Promise.all([
        watchedMoviesService.getWatchedMovies(user.id, { limit: 1000 }),
        collectionService.getUserCollections(user.id),
      ]);

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const moviesThisMonth = watchedMovies.data.filter(
        (item: WatchedMovieWithMovie) => {
          const watchDate = new Date(item.watched_date);
          return (
            watchDate.getMonth() === thisMonth &&
            watchDate.getFullYear() === thisYear
          );
        }
      ).length;

      const moviesThisYear = watchedMovies.data.filter(
        (item: WatchedMovieWithMovie) => {
          const watchDate = new Date(item.watched_date);
          return watchDate.getFullYear() === thisYear;
        }
      ).length;

      const ratedMovies = watchedMovies.data.filter(
        (item: WatchedMovieWithMovie) => item.rating !== null
      );
      const averageRating =
        ratedMovies.length > 0
          ? ratedMovies.reduce(
              (sum: number, item: WatchedMovieWithMovie) =>
                sum + (item.rating || 0),
              0
            ) /
            ratedMovies.length /
            2
          : 0;

      const genreCounts: Record<string, number> = {};
      watchedMovies.data.forEach((item: WatchedMovieWithMovie) => {
        if (item.movie?.genres) {
          item.movie.genres.forEach((genre: any) => {
            genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
          });
        }
      });

      const favoriteGenre = Object.entries(genreCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      return {
        totalWatched: watchedMovies.count || 0,
        totalCollections: collections.length,
        totalRankings: 0,
        averageRating,
        favoriteGenre,
        moviesThisMonth,
        moviesThisYear,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
};
