// NOT AUDITED
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <Loader2 className='w-8 h-8 animate-spin' />
      <span className='ml-2'>Confirming your account...</span>
    </div>
  );
}
