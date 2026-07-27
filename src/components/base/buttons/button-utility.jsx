import React from 'react';

export function ButtonUtility({ size = 'sm', color = 'tertiary', tooltip = '', icon: Icon = null, onClick = () => {} }) {
  const sizeClasses = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.sm;

  const colorClasses = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    tertiary: 'bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800'
  };

  const selectedColor = colorClasses[color] || colorClasses.tertiary;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 relative group ${selectedSize} ${selectedColor}`}
      title={tooltip}
    >
      {Icon && <Icon size={size === 'xs' ? 12 : size === 'sm' ? 15 : 18} />}
      
      {tooltip && (
        <span className="absolute bottom-full mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded uppercase tracking-wider whitespace-nowrap shadow z-50">
          {tooltip}
        </span>
      )}
    </button>
  );
}
