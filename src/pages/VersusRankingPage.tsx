// AUDITED 12/08/2025

import { useNavigate } from 'react-router-dom';
import { VersusRanking } from '@/components/ranking/VersusRanking';
import { useVersusRanking } from '@/utils/hooks/supabase/queries/useRanking';
import { useAuth } from '@/context/AuthContext';

export default function VersusRankingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: watchedMovies, isLoading } = useVersusRanking(user?.id);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!watchedMovies || watchedMovies.length < 2) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-xl font-bold mb-4'>Not Enough Movies</h2>
          <p className='text-secondary mb-6'>
            You need at least 2 watched movies to start versus ranking.
          </p>
          <button
            onClick={() => navigate('/movies')}
            className='bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors'>
            Browse Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <VersusRanking
        watchedMovies={watchedMovies}
        rankingListName='Versus Rankings'
      />
    </div>
  );
}
