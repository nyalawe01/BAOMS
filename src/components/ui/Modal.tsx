import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering wrapper */}
      <div
        className={cn(
          'min-h-[calc(100%-32px)] m-2 sm:m-4 sm:mx-auto flex items-center justify-center p-1 sm:p-4 sm:w-full transition-all duration-200',
          sizeStyles[size]
        )}
      >
        {/* Modal Surface Card */}
        <div
          ref={modalRef}
          className={cn(
            'w-full flex flex-col bg-white border border-gray-200 shadow-xl rounded-xl pointer-events-auto relative z-10 overflow-hidden max-h-[92vh]',
            className
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex justify-between items-center py-3 px-4 sm:py-3.5 sm:px-5 border-b border-gray-200">
              <div className="pr-3 min-w-0 flex-1">
                {title && (
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="size-8 shrink-0 inline-flex justify-center items-center gap-x-2 rounded-full border border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 transition-colors"
              >
                <span className="sr-only">Close</span>
                <X className="shrink-0 size-4" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-3.5 sm:p-5 overflow-y-auto max-h-[72vh] sm:max-h-[75vh]">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex flex-wrap justify-end items-center gap-2 py-2.5 px-4 sm:py-3 sm:px-5 border-t border-gray-200 bg-gray-50/60 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
