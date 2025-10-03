import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/context/AuthContext';
import { watchedMoviesService } from '@/features/watched-movies/api/watched-movies.service';
import { collectionService } from '@/features/collections/api/collection.service';
import type { WatchedMovie } from '@/shared/types/userMovie';

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

      const movies = watchedMovies.data as WatchedMovie[];

      const moviesThisMonth = movies.filter((item) => {
        const watchDate = new Date(item.watched_date);
        return (
          watchDate.getMonth() === thisMonth &&
          watchDate.getFullYear() === thisYear
        );
      }).length;

      const moviesThisYear = movies.filter((item) => {
        const watchDate = new Date(item.watched_date);
        return watchDate.getFullYear() === thisYear;
      }).length;

      const ratedMovies = movies.filter((item) => item.rating !== null);
      const averageRating =
        ratedMovies.length > 0
          ? ratedMovies.reduce((sum, item) => sum + (item.rating || 0), 0) /
            ratedMovies.length
          : 0;

      const genreCounts: Record<string, number> = {};
      movies.forEach((item) => {
        (item.genre_names || []).forEach((name) => {
          genreCounts[name] = (genreCounts[name] || 0) + 1;
        });
      });

      const favoriteGenre = Object.entries(genreCounts).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0];

      return {
        totalWatched: watchedMovies.count || 0,
        totalCollections: collections.length,
        totalRankings: 0, // TODO: query ranking_lists table if needed
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
