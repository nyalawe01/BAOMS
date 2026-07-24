import React, { createContext, useContext, useRef, useState } from 'react';
import { Paperclip, X, FileText } from 'lucide-react';

const FileUploadContext = createContext(null);

export function FileUploadRoot({ value, onChange, isDisabled = false, children }) {
  const [dragActive, setDragActive] = useState(false);

  const contextValue = {
    value,
    onChange,
    isDisabled,
    dragActive,
    setDragActive
  };

  return (
    <FileUploadContext.Provider value={contextValue}>
      <div className="relative w-full">
        {children}
      </div>
    </FileUploadContext.Provider>
  );
}

export function FileUploadDropZone({ label = "Click to attach document", accept = "*", isDisabled: localDisabled = false }) {
  const { value, onChange, isDisabled: rootDisabled, dragActive, setDragActive } = useContext(FileUploadContext);
  const inputRef = useRef(null);
  
  const disabled = rootDisabled || localDisabled;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange?.({
        fileName: file.name,
        fileType: file.type,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        dataUrl: reader.result // Base64 encoding
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-3 text-center transition-all ${
        dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-350 bg-slate-50/40'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
      />
      
      {value ? (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded p-1.5 text-xs text-left" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 truncate">
            <FileText size={16} className="text-slate-400 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-slate-800 truncate leading-tight">{value.fileName}</p>
              <p className="text-[9px] text-slate-400">{value.fileSize}</p>
            </div>
          </div>
          {!disabled && (
            <button 
              type="button"
              onClick={() => onChange?.(null)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-1 py-1">
          <Paperclip size={16} className="text-slate-400" />
          <span className="text-[11px] font-bold text-slate-500">{label}</span>
          <span className="text-[9px] text-slate-400">PDF, PNG, JPG up to 10MB</span>
        </div>
      )}
    </div>
  );
}

// Compound component export structure
export const FileUpload = {
  Root: FileUploadRoot,
  DropZone: FileUploadDropZone
};
