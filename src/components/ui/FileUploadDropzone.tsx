import React, { useRef, useState } from 'react';
import { Trash2, FolderUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

export interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
}

export interface FileUploadDropzoneProps {
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onFileSelect?: (file: File | null) => void;
  selectedFile?: File | null;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  allowFolder?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() || '') : '';
}

function getFileBadgeColor(ext: string): { bg: string; text: string; label: string } {
  switch (ext) {
    case 'pdf':
      return { bg: 'bg-rose-50 border-rose-200 text-rose-700', text: 'text-rose-700', label: 'PDF' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', text: 'text-emerald-700', label: ext.toUpperCase() };
    case 'doc':
    case 'docx':
      return { bg: 'bg-amber-50 border-amber-200 text-[#D68904]', text: 'text-[#D68904]', label: 'DOC' };
    case 'zip':
    case 'rar':
    case '7z':
      return { bg: 'bg-amber-50 border-amber-200 text-amber-700', text: 'text-amber-700', label: 'ZIP' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return { bg: 'bg-purple-50 border-purple-200 text-purple-700', text: 'text-purple-700', label: 'IMG' };
    default:
      return { bg: 'bg-gray-100 border-gray-200 text-gray-700', text: 'text-gray-700', label: ext ? ext.toUpperCase().slice(0, 4) : 'FILE' };
  }
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  files: controlledFiles,
  onFilesChange,
  onFileSelect,
  selectedFile,
  accept,
  maxSizeMB = 25,
  multiple = false,
  allowFolder = true,
  hint,
  error: propError,
  className,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Normalize files list whether controlled single, controlled multi, or internal
  const activeFiles: File[] = controlledFiles
    ? controlledFiles
    : selectedFile
    ? [selectedFile]
    : internalFiles;

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setValidationError(null);
    const valid: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const fileArray = Array.from(newFiles);

    for (const file of fileArray) {
      if (!file) continue;
      if (file.size > maxSizeBytes) {
        const errMsg = `File "${file.name}" exceeds the maximum size of ${maxSizeMB}MB.`;
        setValidationError(errMsg);
        showToast({
          title: 'File Too Large',
          message: errMsg,
          variant: 'warning',
        });
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;

    if (multiple) {
      const updated = [...activeFiles, ...valid];
      setInternalFiles(updated);
      onFilesChange?.(updated);
      showToast({
        title: 'Files Added',
        message: `${valid.length} file(s) attached successfully.`,
        variant: 'success',
      });
    } else {
      const single = valid[0];
      if (!single) return;
      setInternalFiles([single]);
      onFilesChange?.([single]);
      onFileSelect?.(single);
      showToast({
        title: 'File Selected',
        message: `${single.name} (${formatFileSize(single.size)})`,
        variant: 'success',
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    const removedFile = activeFiles[index];
    const updated = activeFiles.filter((_, i) => i !== index);
    setInternalFiles(updated);
    onFilesChange?.(updated);
    if (!multiple) {
      onFileSelect?.(null);
    }
    showToast({
      title: 'Attachment Removed',
      message: removedFile?.name ? `Removed ${removedFile.name}` : 'File removed',
      variant: 'info',
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const effectiveError = propError || validationError;

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Hidden standard file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Hidden folder input */}
      {allowFolder && (
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      )}

      {/* Dropzone Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'cursor-pointer p-8 sm:p-10 flex flex-col items-center justify-center bg-white border border-dashed rounded-xl transition-all duration-200 text-center select-none',
          isDragging
            ? 'border-[#F2A507] bg-amber-50/50 scale-[0.99]'
            : effectiveError
            ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
            : 'border-gray-300 hover:border-[#F2A507] hover:bg-gray-50/50'
        )}
      >
        <div className="text-center">
          {/* Cloud upload circle */}
          <span className="inline-flex justify-center items-center size-14 sm:size-16 bg-gray-100 text-gray-800 rounded-full shadow-2xs">
            <svg
              className="shrink-0 size-6 text-gray-800"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </span>

          <div className="mt-4 flex flex-wrap justify-center items-center text-sm/6 text-gray-600 gap-x-1">
            <span className="font-medium text-gray-800">Drop your files here or</span>
            <span className="font-semibold text-[#D68904] hover:text-[#F2A507] decoration-2 hover:underline">
              browse
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-400">
            {hint || `Pick a file or folder up to ${maxSizeMB}MB.`}
          </p>

          {allowFolder && (
            <div className="mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FolderUp className="h-3.5 w-3.5" />
                <span>Upload whole folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation Error */}
      {effectiveError && (
        <p className="text-xs font-semibold text-rose-600 mt-1">{effectiveError}</p>
      )}

      {/* File Previews List */}
      {activeFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          {activeFiles.map((file, idx) => {
            const ext = getFileExtension(file.name);
            const badge = getFileBadgeColor(ext);

            return (
              <div
                key={`${file.name}-${idx}`}
                className="p-3 bg-white border border-gray-200 rounded-xl shadow-2xs transition-all"
              >
                <div className="mb-1 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-x-3 min-w-0">
                    <span
                      className={cn(
                        'size-10 flex justify-center items-center border rounded-lg text-xs font-bold shrink-0',
                        badge.bg
                      )}
                    >
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-gray-400 hover:text-rose-600 focus:outline-hidden p-1 rounded-md hover:bg-rose-50 transition-colors"
                      title="Remove file"
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 className="shrink-0 size-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-x-3 whitespace-nowrap mt-2">
                  <div
                    className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="flex flex-col justify-center rounded-full overflow-hidden bg-[#F2A507] text-xs text-white text-center whitespace-nowrap transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="w-8 text-end">
                    <span className="text-xs font-medium text-gray-700">100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
