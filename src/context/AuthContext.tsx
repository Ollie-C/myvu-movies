// NOT AUDITED

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialLoad(false);

      // Log initial auth state
      console.log('🔐 [AuthContext] Initial auth state:', {
        isAuthenticated: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        pathname: location.pathname,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Log auth state changes
      console.log('🔐 [AuthContext] Auth state changed:', {
        event,
        isAuthenticated: !!session?.user,
        userId: session?.user?.id,
        email: session?.user?.email,
        pathname: location.pathname,
      });

      if (!initialLoad) {
        if (event === 'SIGNED_IN') {
          console.log(
            '🔐 [AuthContext] User signed in, redirecting to dashboard'
          );
          if (
            location.pathname === '/login' ||
            location.pathname === '/signup'
          ) {
            navigate('/');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🔐 [AuthContext] User signed out, redirecting to login');
          navigate('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location, initialLoad]);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) throw error;

    return data;
  };
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: {
    username?: string;
    avatar_url?: string;
  }) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
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
