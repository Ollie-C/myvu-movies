import { useNavigate } from 'react-router-dom';
import { VersusRanking } from '@/components/ranking/VersusRanking';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function VersusRankingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Create or get default ranking list for versus mode
  const { data: rankingList, isLoading } = useQuery({
    queryKey: ['versus-ranking-list', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Try to get existing versus ranking list
      let { data: existingList } = await supabase
        .from('ranking_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Versus Rankings')
        .single();

      if (!existingList) {
        // Create default versus ranking list
        const { data: newList, error } = await supabase
          .from('ranking_lists')
          .insert({
            user_id: user.id,
            name: 'Versus Rankings',
            description: 'Default ranking list for versus mode',
            ranking_method: 'versus',
            is_public: false,
          })
          .select()
          .single();

        if (error) throw error;
        existingList = newList;
      }

      return existingList;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!rankingList) {
    navigate('/rankings');
    return null;
  }

  return (
    <div className='min-h-screen bg-background'>
      <VersusRanking
        rankingListId={rankingList.id}
        rankingListName={rankingList.name}
      />
    </div>
  );
}
