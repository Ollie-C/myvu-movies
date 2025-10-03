import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { AuthProvider } from '@/shared/context/AuthContext';
import { ToastProvider } from '@/shared/context/ToastContext';

// Components
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute';
import Layout from '@/shared/ui/layout/Layout';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

// Pages
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import { AuthCallback } from '@/pages/auth/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import Movies from '@/pages/MoviesPage';
import MovieDetails from '@/pages/MovieDetailsPage';
import Rankings from '@/pages/RankingsPage';
import Collections from '@/pages/CollectionsPage';
import CollectionDetails from '@/pages/CollectionDetailsPage';
import Settings from '@/pages/Settings';
import ActivityPage from '@/pages/ActivityPage';
import VersusSessionPage from '@/pages/ranking/VersusSessionPage';
import RankingResultsPage from '@/pages/ranking/RankingResultsPage';

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
                {/* Public Auth routes */}
                <Route path='/auth/callback' element={<AuthCallback />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<Signup />} />

                {/* Protected + Layout routes */}
                <Route
                  path='/'
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }>
                  <Route index element={<Dashboard />} />
                  <Route path='movies' element={<Movies />} />
                  <Route path='movies/:id' element={<MovieDetails />} />
                  <Route path='rankings' element={<Rankings />} />
                  <Route path='collections' element={<Collections />} />
                  <Route
                    path='collections/:id'
                    element={<CollectionDetails />}
                  />
                  <Route path='settings' element={<Settings />} />
                  <Route path='activity' element={<ActivityPage />} />
                  <Route path='versus/:id' element={<VersusSessionPage />} />
                  <Route
                    path='ranking-results/:id'
                    element={<RankingResultsPage />}
                  />
                  <Route path='*' element={<Navigate to='/' replace />} />
                </Route>
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
