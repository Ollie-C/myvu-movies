// AUDITED 11/08/2025

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ user: User | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    username?: string;
    avatar_url?: string;
  }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          console.log('🔐 [AuthContext] Initial auth state:', {
            isAuthenticated: !!session?.user,
            userId: session?.user?.id,
            email: session?.user?.email,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Auth initialization failed'
          );
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setError(null); // Clear any previous errors

      console.log('🔐 [AuthContext] Auth state changed:', {
        event,
        isAuthenticated: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      // Handle navigation
      const currentPath = window.location.pathname;

      if (event === 'SIGNED_IN') {
        if (currentPath === '/login' || currentPath === '/signup') {
          navigate('/', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        // Only redirect if not already on public pages
        if (!['/login', '/signup', '/'].includes(currentPath)) {
          navigate('/login', { replace: true });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove all dependencies to avoid re-runs

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      setError(null);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

        if (error) throw error;
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign up failed';
        setError(message);
        throw err;
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: { username?: string; avatar_url?: string }) => {
      if (!user) throw new Error('No user logged in');

      setError(null);
      try {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (error) throw error;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Profile update failed';
        setError(message);
        throw err;
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        updateProfile,
        clearError,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
