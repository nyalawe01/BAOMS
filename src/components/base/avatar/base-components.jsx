import React from 'react';

export function AvatarAddButton({ size = 'md', onClick = () => {} }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full border border-dashed border-slate-350 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none ${selectedSize}`}
      title="Add member access"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}
