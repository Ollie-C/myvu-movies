// NOT AUDITED
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { Film, AlertCircle, CheckCircle } from 'lucide-react';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, username);
      setSuccess(true);
      // Optionally auto-redirect after signup
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center p-4'>
        <Card className='max-w-md w-full text-center'>
          <CheckCircle className='w-12 h-12 text-green-500 mx-auto mb-4' />
          <h2 className='text-2xl font-bold mb-2'>Check your email!</h2>
          <p className='text-secondary'>
            We've sent you a confirmation link. Please check your email to
            verify your account.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4'>
            <Film className='w-8 h-8 text-white' />
          </div>
          <h1 className='text-3xl font-bold'>Create your account</h1>
          <p className='text-secondary mt-2'>
            Start ranking your favorite movies
          </p>
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
              label='Username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='moviefan123'
              required
              autoComplete='username'
              helperText='This will be your public display name'
            />

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
              autoComplete='new-password'
              helperText='At least 6 characters'
            />

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <div className='mt-6 text-center text-sm'>
            <span className='text-secondary'>Already have an account? </span>
            <Link to='/login' className='text-primary hover:underline'>
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
