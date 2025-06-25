import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components & Pages
import Collections from '@/pages/Collections';
import Dashboard from '@/pages/Dashboard';
import Layout from '@/components/layout/Layout';
import Movies from '@/pages/Movies';
import Rankings from '@/pages/Rankings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path='/' element={<Dashboard />} />
            <Route path='/movies' element={<Movies />} />
            <Route path='/rankings' element={<Rankings />} />
            <Route path='/collections' element={<Collections />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
