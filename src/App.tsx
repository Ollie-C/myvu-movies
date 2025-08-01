import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Pages
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import Movies from '@/pages/MoviesPage';
import MovieDetails from '@/pages/MovieDetailsPage';
import Rankings from '@/pages/RankingsPage';
import Collections from '@/pages/CollectionsPage';
import CollectionDetails from '@/pages/CollectionDetailsPage';
import Dashboard from './pages/Dashboard';
import Settings from '@/pages/Settings';
import { AuthCallback } from './pages/auth/AuthCallback';
import VersusRankingPage from './pages/VersusRankingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                {/* Auth routes */}
                <Route path='/auth/callback' element={<AuthCallback />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Signup />} />

                {/* Protected routes */}
                <Route
                  path='/*'
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path='/' element={<Dashboard />} />
                          <Route path='/movies' element={<Movies />} />
                          <Route
                            path='/movies/:id'
                            element={<MovieDetails />}
                          />
                          <Route path='/rankings' element={<Rankings />} />
                          <Route
                            path='/collections'
                            element={<Collections />}
                          />
                          <Route
                            path='/collections/:id'
                            element={<CollectionDetails />}
                          />
                          <Route path='/settings' element={<Settings />} />
                          <Route
                            path='/versus'
                            element={<VersusRankingPage />}
                          />
                          <Route
                            path='*'
                            element={<Navigate to='/' replace />}
                          />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
