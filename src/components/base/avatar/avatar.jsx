import React from 'react';

export function Avatar({ size = 'md', alt = '', className = '', src = '', placeholder = null }) {
  const sizeClasses = {
    xxs: 'w-5 h-5 text-[8px]',
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-slate-100 border border-slate-200 object-cover ${selectedSize} ${className}`}
      title={alt}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : null}
      
      {!src && placeholder ? placeholder : null}
      
      {!src && !placeholder ? (
        <span className="font-semibold text-slate-500 uppercase select-none">
          {alt ? alt.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
        </span>
      ) : null}
    </div>
  );
}

export function AvatarProfilePhoto({ verified = false, size = 'md', alt = '', src = '', onUpload = null }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="relative inline-block">
      <div className={`rounded-full overflow-hidden bg-slate-100 border-2 border-indigo-150 object-cover ${selectedSize}`}>
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-bold uppercase text-lg">
            {alt ? alt.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
          </div>
        )}
      </div>

      {verified && (
        <span className="absolute bottom-0 right-0 block w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold" title="Verified Staff">
          ✓
        </span>
      )}

      {onUpload && (
        <label className="absolute bottom-0 right-0 bg-slate-900/80 hover:bg-slate-900 text-white p-1 rounded-full cursor-pointer shadow border border-slate-700">
          <input type="file" className="hidden" onChange={onUpload} accept="image/*" />
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </label>
      )}
    </div>
  );
}
