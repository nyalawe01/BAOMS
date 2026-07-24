import React from 'react';

export function InputBase({ size = 'md', placeholder = '', icon: Icon = null, value = '', onChange = () => {}, className = '' }) {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md',
    md: 'px-3 py-2 text-xs rounded-lg',
    lg: 'px-4 py-2.5 text-sm rounded-lg'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative w-full text-left font-sans ${className}`}>
      {Icon && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
          <Icon size={14} />
        </span>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-slate-50 border border-slate-200 text-slate-805 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all ${
          Icon ? 'pl-8' : ''
        } ${selectedSize}`}
      />
    </div>
  );
}
