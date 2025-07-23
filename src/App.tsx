import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';

// Pages
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import Movies from '@/pages/Movies';
import MovieDetails from '@/pages/MovieDetails';
import Rankings from '@/pages/Rankings';
import Collections from '@/pages/Collections';
import CollectionDetails from '@/pages/CollectionDetails';
import Dashboard from '@/pages/Dashboard';
import { AuthCallback } from './pages/auth/AuthCallback';

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
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
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
                      <Route path='/movies/:id' element={<MovieDetails />} />
                      <Route path='/rankings' element={<Rankings />} />
                      <Route path='/collections' element={<Collections />} />
                      <Route
                        path='/collections/:id'
                        element={<CollectionDetails />}
                      />
                      <Route path='*' element={<Navigate to='/' replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
