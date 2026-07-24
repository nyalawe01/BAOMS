import React from 'react';

export function BadgeGroup({ addonText = '', color = 'brand', theme = 'light', align = 'leading', size = 'md', children }) {
  const colorMap = {
    brand: {
      bg: 'bg-indigo-50/75 text-indigo-700 border-indigo-200',
      badge: 'bg-indigo-600 text-white'
    },
    error: {
      bg: 'bg-rose-50/75 text-rose-700 border-rose-200',
      badge: 'bg-rose-600 text-white'
    },
    warning: {
      bg: 'bg-amber-50/75 text-amber-700 border-amber-250',
      badge: 'bg-amber-600 text-white'
    },
    success: {
      bg: 'bg-emerald-50/75 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-600 text-white'
    }
  };

  const selectedColor = colorMap[color] || colorMap.brand;
  
  const sizeClasses = {
    md: 'py-0.5 pl-1 pr-2.5 text-xs',
    lg: 'py-1 pl-1.5 pr-3 text-xs'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${selectedColor.bg} ${selectedSize} font-medium shadow-sm max-w-full truncate`}>
      {addonText && (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${selectedColor.badge}`}>
          {addonText}
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}
