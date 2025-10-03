import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: DialogProps) {
  // Close on Esc key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}>
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} relative`}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='flex items-center justify-between border-b px-4 py-3'>
          {title && <h2 className='font-semibold text-gray-900'>{title}</h2>}
          <button
            onClick={onClose}
            className='p-1 rounded hover:bg-gray-100 focus:outline-none'
            aria-label='Close'>
            <X className='w-5 h-5 text-gray-600' />
          </button>
        </div>

        {/* Content */}
        <div className='p-4'>{children}</div>
      </div>
    </div>,
    document.body
  );
}
