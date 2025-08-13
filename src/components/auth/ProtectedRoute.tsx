// AUDITED 07/08/2025

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🔒 [ProtectedRoute] Route access check:', {
      pathname: location.pathname,
      isAuthenticated: !!user,
      isLoading: loading,
      userId: user?.id,
      email: user?.email,
    });
  }, [location.pathname, user, loading]);

  if (loading) {
    console.log('🔒 [ProtectedRoute] Loading authentication state...');
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!user) {
    console.log(
      '🔒 [ProtectedRoute] User not authenticated, redirecting to login'
    );
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  console.log(
    '🔒 [ProtectedRoute] User authenticated, rendering protected content'
  );
  return <>{children}</>;
}
