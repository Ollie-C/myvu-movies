// AUDITED 06/08/2025
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Film, AlertCircle } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4'>
            <Film className='w-8 h-8 text-white' />
          </div>
          <h1 className='text-3xl font-bold'>Welcome back</h1>
          <p className='text-secondary mt-2'>Sign in to your Myvu account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <div className='flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm'>
                <AlertCircle className='w-4 h-4 flex-shrink-0' />
                <p>{error}</p>
              </div>
            )}

            <Input
              label='Email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              required
              autoComplete='email'
            />

            <Input
              label='Password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              required
              autoComplete='current-password'
            />

            <div className='flex items-center justify-between text-sm'>
              <Link
                to='/forgot-password'
                className='text-primary hover:underline'>
                Forgot password?
              </Link>
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='text-secondary'>Don't have an account? </span>
            <Link to='/signup' className='text-primary hover:underline'>
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
