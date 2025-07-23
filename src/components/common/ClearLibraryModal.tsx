import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';

interface ClearLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClearLibraryModal({ isOpen, onClose }: ClearLibraryModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  const clearLibraryMutation = useMutation({
    mutationFn: async () => {
      const { data, error, count } = await supabase
        .from('user_movies')
        .delete()
        .eq('user_id', user!.id)
        .select('id');

      if (error) throw error;
      return count || data?.length || 0;
    },
    onSuccess: (count) => {
      setDeletedCount(count);
      setIsComplete(true);
      setIsClearing(false);

      // Invalidate all relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['user-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watched-movies'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
    },
    onError: (error) => {
      console.error('Failed to clear library:', error);
      setIsClearing(false);
    },
  });

  const handleClearLibrary = async () => {
    setIsClearing(true);
    await clearLibraryMutation.mutateAsync();
  };

  const handleClose = () => {
    setIsClearing(false);
    setIsComplete(false);
    setDeletedCount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <Card className='w-full max-w-md'>
        <div className='p-6'>
          {!isComplete ? (
            <>
              {/* Warning Header */}
              <div className='text-center mb-6'>
                <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <AlertTriangle className='w-8 h-8 text-red-600' />
                </div>
                <h2 className='text-xl font-bold text-primary mb-2'>
                  Clear Your Library
                </h2>
                <p className='text-secondary'>
                  This will permanently remove all movies from your library
                </p>
              </div>

              {/* Warning Details */}
              <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                <h3 className='font-medium text-red-800 mb-2'>
                  What will be deleted:
                </h3>
                <ul className='text-sm text-red-700 space-y-1'>
                  <li>• All watched movies</li>
                  <li>• All watchlist movies</li>
                  <li>• All your ratings</li>
                  <li>• All your notes</li>
                </ul>
                <div className='mt-3 p-2 bg-red-100 rounded text-sm text-red-800'>
                  <strong>Note:</strong> Movies will remain in the database for
                  other users, but your personal data will be permanently
                  deleted.
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-3'>
                <Button
                  variant='ghost'
                  onClick={handleClose}
                  className='flex-1'
                  disabled={isClearing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleClearLibrary}
                  disabled={isClearing}
                  className='flex-1 bg-red-600 hover:bg-red-700 text-white'>
                  {isClearing ? (
                    <>
                      <div className='w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2' />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className='w-4 h-4 mr-2' />
                      Clear Library
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className='text-center'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <CheckCircle className='w-8 h-8 text-green-600' />
                </div>
                <h2 className='text-xl font-bold text-primary mb-2'>
                  Library Cleared Successfully
                </h2>
                <p className='text-secondary mb-4'>
                  {deletedCount} movies have been removed from your library
                </p>

                <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
                  <p className='text-sm text-green-800'>
                    Your library is now empty. You can start fresh by:
                  </p>
                  <ul className='text-sm text-green-700 mt-2 space-y-1'>
                    <li>• Adding movies to your watchlist</li>
                    <li>• Marking movies as watched</li>
                    <li>• Importing from Letterboxd</li>
                  </ul>
                </div>

                <Button
                  onClick={handleClose}
                  className='bg-primary hover:bg-primary/90'>
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
