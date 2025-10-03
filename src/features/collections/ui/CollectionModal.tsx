import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Components
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';

import type {
  Collection,
  CollectionInsert,
  CollectionUpdate,
} from '@/features/collections/models/collection.schema';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CollectionInsert | CollectionUpdate) => Promise<void>;
  collection?: Collection | null;
  mode?: 'create' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  is_ranked: boolean;
  is_public: boolean;
}

export function CollectionModal({
  isOpen,
  onClose,
  onSave,
  collection = null,
  mode = collection ? 'edit' : 'create',
}: CollectionModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    is_ranked: false,
    is_public: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: collection?.name || '',
        description: collection?.description || '',
        is_ranked: collection?.is_ranked || false,
        is_public: collection?.is_public || false,
      });
      setError(null);
    }
  }, [isOpen, collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Collection name must be at least 2 characters');
      return;
    }

    if (formData.name.trim().length > 100) {
      setError('Collection name must be less than 100 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saveData =
        mode === 'edit'
          ? ({
              name: formData.name.trim(),
              description: formData.description.trim() || null,
              is_ranked: formData.is_ranked,
              is_public: formData.is_public,
            } as CollectionUpdate)
          : ({
              name: formData.name.trim(),
              description: formData.description.trim() || null,
              is_ranked: formData.is_ranked,
              is_public: formData.is_public,
            } as CollectionInsert);

      await onSave(saveData);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `Failed to ${mode} collection`;
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center'
      role='dialog'
      aria-modal='true'
      aria-labelledby='modal-title'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={handleBackdropClick}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='relative bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-border'>
          <h2 id='modal-title' className='text-xl font-bold text-primary'>
            {mode === 'edit' ? 'Edit Collection' : 'Create Collection'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className='p-2 hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Close modal'>
            <X className='w-5 h-5 text-secondary' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-4'>
          {/* Error Display */}
          {error && (
            <div
              className='p-3 bg-red-50 border border-red-200 rounded-lg'
              role='alert'
              aria-live='polite'>
              <p className='text-red-600 text-sm'>{error}</p>
            </div>
          )}

          {/* Collection Name */}
          <div>
            <label
              htmlFor='collection-name'
              className='block text-sm font-medium text-primary mb-2'>
              Collection Name *
            </label>
            <Input
              id='collection-name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder='Enter collection name...'
              disabled={isSubmitting}
              required
              autoFocus
              maxLength={100}
              aria-describedby={error ? 'name-error' : undefined}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor='collection-description'
              className='block text-sm font-medium text-primary mb-2'>
              Description
            </label>
            <Textarea
              id='collection-description'
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder='Describe your collection...'
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Collection Options */}
          <div className='space-y-3 pt-2'>
            {/* Ranked Collection Toggle */}
            <div className='flex items-start gap-3'>
              <input
                type='checkbox'
                id='is-ranked'
                checked={formData.is_ranked}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_ranked: e.target.checked,
                  }))
                }
                disabled={isSubmitting}
                className='mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20'
              />
              <div>
                <label
                  htmlFor='is-ranked'
                  className='text-sm text-primary font-medium'>
                  Ranked Collection
                </label>
                <p className='text-xs text-secondary mt-1'>
                  Enable ranking and comparison features for movies in this
                  collection
                </p>
              </div>
            </div>

            {/* Public Collection Toggle */}
            <div className='flex items-start gap-3'>
              <input
                type='checkbox'
                id='is-public'
                checked={formData.is_public}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_public: e.target.checked,
                  }))
                }
                disabled={isSubmitting}
                className='mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/20'
              />
              <div>
                <label
                  htmlFor='is-public'
                  className='text-sm text-primary font-medium'>
                  Public Collection
                </label>
                <p className='text-xs text-secondary mt-1'>
                  Allow other users to discover and view this collection
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex gap-3 pt-6'>
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
              {isSubmitting
                ? mode === 'edit'
                  ? 'Updating...'
                  : 'Creating...'
                : mode === 'edit'
                ? 'Update Collection'
                : 'Create Collection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
