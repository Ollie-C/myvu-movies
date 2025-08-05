// NOT AUDITED

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import type {
  Collection,
  CreateCollectionData,
} from '@/services/supabase/collection.service';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCollectionData) => Promise<void>;
  collection?: Collection | null;
  title?: string;
}

export function CollectionModal({
  isOpen,
  onClose,
  onSave,
  collection = null,
  title = 'Create Collection',
}: CollectionModalProps) {
  const [formData, setFormData] = useState<CreateCollectionData>({
    name: collection?.name || '',
    description: collection?.description || '',
    is_ranked: collection?.is_ranked || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        is_ranked: false,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save collection'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Modal */}
      <div className='relative bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-border'>
          <h2 className='text-xl font-bold text-primary'>{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className='p-2 hover:bg-surface-hover rounded-lg transition-colors'>
            <X className='w-5 h-5 text-secondary' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          )}

          {/* Collection Name */}
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-primary mb-2'>
              Collection Name *
            </label>
            <Input
              id='name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder='Enter collection name...'
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-primary mb-2'>
              Description
            </label>
            <Textarea
              id='description'
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder='Describe your collection...'
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Ranked Collection Toggle */}
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              id='is_ranked'
              checked={formData.is_ranked}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_ranked: e.target.checked,
                }))
              }
              disabled={isSubmitting}
              className='w-4 h-4 rounded border-border text-primary focus:ring-primary/20'
            />
            <label htmlFor='is_ranked' className='text-sm text-primary'>
              This is a ranked collection
            </label>
          </div>
          <p className='text-xs text-secondary ml-7'>
            Ranked collections maintain order for movie rankings
          </p>

          {/* Actions */}
          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='secondary'
              onClick={handleClose}
              disabled={isSubmitting}
              className='flex-1'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !formData.name.trim()}
              className='flex-1'>
              {isSubmitting ? 'Saving...' : collection ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
