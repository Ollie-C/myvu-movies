import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Save, LogOut } from 'lucide-react';

// Components
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

// Contexts
import { useAuth } from '@/shared/context/AuthContext';

// !
import { userService } from '@/features/user/api/user.service';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => userService.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  // Set username when profile data loads
  useEffect(() => {
    if (userProfile?.username) {
      setUsername(userProfile.username);
    }
  }, [userProfile?.username]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user logged in');
      return userService.updateProfile(user.id, { username });
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
    onError: (error) => {
      console.error('Update profile error:', error);
    },
  });

  const handleSave = () => {
    if (username.trim()) {
      updateProfileMutation.mutate();
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-8 animate-fade-in'>
        <div className='flex items-center gap-4'>
          <Link to='/'>
            <button className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
              <ArrowLeft className='w-5 h-5' />
            </button>
          </Link>
          <h1 className='text-3xl font-bold text-primary'>Settings</h1>
        </div>
        <Card className='p-6'>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
            <div className='h-10 bg-gray-200 rounded mb-4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/3'></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link to='/'>
          <button className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
            <ArrowLeft className='w-5 h-5' />
          </button>
        </Link>
        <h1 className='text-3xl font-bold text-primary'>Settings</h1>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Account Settings */}
        <div className='lg:col-span-2'>
          <Card className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <User className='w-5 h-5 text-primary' />
              </div>
              <h2 className='text-xl font-semibold'>Account Settings</h2>
            </div>

            <div className='space-y-6'>
              {/* Email (read-only) */}
              <div>
                <label className='block text-sm font-medium text-secondary mb-2'>
                  Email
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className='bg-gray-50'
                />
                <p className='text-xs text-tertiary mt-1'>
                  Email cannot be changed
                </p>
              </div>

              {/* Username */}
              <div>
                <label className='block text-sm font-medium text-secondary mb-2'>
                  Username
                </label>
                <div className='flex gap-3'>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!isEditing}
                    placeholder='Enter username'
                  />
                  {isEditing ? (
                    <div className='flex gap-2'>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        size='sm'
                        className='bg-primary hover:bg-primary/90'>
                        <Save className='w-4 h-4 mr-2' />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          setUsername(userProfile?.username || '');
                        }}
                        size='sm'
                        variant='ghost'>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      size='sm'
                      variant='ghost'>
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Member Since */}
              <div>
                <label className='block text-sm font-medium text-secondary mb-2'>
                  Member Since
                </label>
                <Input
                  value={
                    userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString()
                      : 'Unknown'
                  }
                  disabled
                  className='bg-gray-50'
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className='lg:col-span-1'>
          <Card className='p-6'>
            <h3 className='text-lg font-semibold mb-4'>Actions</h3>

            <div className='space-y-3'>
              <Button
                onClick={handleSignOut}
                variant='ghost'
                className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'>
                <LogOut className='w-4 h-4 mr-3' />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
