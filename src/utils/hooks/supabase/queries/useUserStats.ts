// hooks/queries/useUserStats.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { watchedMoviesService } from '@/services/supabase/watched-movies.service';
import { watchlistService } from '@/services/supabase/watchlist.service';
import { collectionService } from '@/services/supabase/collection.service';
import { rankingService } from '@/services/supabase/ranking.service';

// Query keys factory
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

      // Fetch all necessary data in parallel
      const [watchedMovies, collections, rankings] = await Promise.all([
        watchedMoviesService.getWatchedMovies(user.id, { limit: 1000 }),
        collectionService.getUserCollections(user.id),
        rankingService.getUserRankings(user.id),
      ]);

      // Calculate stats
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const moviesThisMonth = watchedMovies.data.filter((item) => {
        const watchDate = new Date(item.watched_date);
        return (
          watchDate.getMonth() === thisMonth &&
          watchDate.getFullYear() === thisYear
        );
      }).length;

      const moviesThisYear = watchedMovies.data.filter((item) => {
        const watchDate = new Date(item.watched_date);
        return watchDate.getFullYear() === thisYear;
      }).length;

      // Calculate average rating
      const ratedMovies = watchedMovies.data.filter(
        (item) => item.rating !== null
      );
      const averageRating =
        ratedMovies.length > 0
          ? ratedMovies.reduce((sum, item) => sum + (item.rating || 0), 0) /
            ratedMovies.length /
            2 // Convert to 5-star
          : 0;

      // Calculate favorite genre (simplified - you might want a more sophisticated approach)
      const genreCounts: Record<string, number> = {};
      watchedMovies.data.forEach((item) => {
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
        totalRankings: rankings.filter((r) => r.ranking_method).length,
        averageRating,
        favoriteGenre,
        moviesThisMonth,
        moviesThisYear,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
