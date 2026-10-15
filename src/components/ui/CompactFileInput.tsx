import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

export interface CompactFileInputProps {
  id?: string;
  name?: string;
  label?: string;
  accept?: string;
  selectedFile?: File | null;
  onFileSelect?: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  className?: string;
  required?: boolean;
}

export const CompactFileInput: React.FC<CompactFileInputProps> = ({
  id = 'file-input',
  name = 'file-input',
  label,
  accept,
  selectedFile,
  onFileSelect,
  disabled = false,
  error,
  helperText,
  className,
  required = false,
}) => {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileSelect?.(file);
    if (file) {
      showToast({
        title: 'File Attached',
        message: `${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
        variant: 'info',
      });
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFileSelect?.(null);
    showToast({
      title: 'Attachment Cleared',
      message: 'Attached file has been removed.',
      variant: 'info',
    });
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {!label && (
          <label htmlFor={id} className="sr-only">
            Choose file
          </label>
        )}
        <input
          ref={inputRef}
          type="file"
          name={name}
          id={id}
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            'block w-full border shadow-2xs rounded-lg text-sm text-gray-500 focus:z-10 focus:border-[#F2A507] focus:ring-[#F2A507] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
            'file:bg-gray-100 file:border-0 file:me-4 file:py-2.5 file:px-4 file:text-gray-800 file:font-semibold file:cursor-pointer hover:file:bg-gray-200 transition-colors',
            error ? 'border-rose-300 bg-rose-50/20' : 'border-gray-200 bg-white'
          )}
        />

        {selectedFile && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-1 text-gray-400 hover:text-rose-600 rounded-md hover:bg-gray-100 transition-colors"
            title="Clear selected file"
            aria-label="Clear file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
};
