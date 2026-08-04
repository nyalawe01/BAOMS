import React, { useId } from 'react';

export function InputBase({
  size = 'md',
  label = '',
  id = '',
  placeholder = '',
  icon: Icon = null,
  value = '',
  onChange = () => {},
  className = ''
}) {
  const generatedId = useId();
  const inputId = label ? (id || generatedId) : id;

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm rounded-md',
    md: 'px-3 py-2 text-sm rounded-lg',
    lg: 'px-4 py-2.5 text-base rounded-lg'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`w-full text-left font-sans ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Icon size={14} />
          </span>
        )}
        <input
          id={inputId || undefined}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full bg-slate-50 border border-slate-200 text-slate-805 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all ${
            Icon ? 'pl-8' : ''
          } ${selectedSize}`}
        />
      </div>
    </div>
  );
}
