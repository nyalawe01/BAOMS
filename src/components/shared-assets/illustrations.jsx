import React from 'react';

export function Illustration({ type = 'documents', size = 'sm' }) {
  const sizeMap = {
    xs: 'w-10 h-10',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36'
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  const renderIllustration = () => {
    switch (type) {
      case 'documents':
        return (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-300 w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'empty':
      default:
        return (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-300 w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  return (
    <div className={`mx-auto flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 ${selectedSize}`}>
      {renderIllustration()}
    </div>
  );
}
