import React from 'react';

export function Button({ 
  size = 'md', 
  color = 'primary', 
  className = '', 
  iconLeading: IconLeading = null, 
  iconTrailing: IconTrailing = null, 
  onClick = () => {},
  type = 'button',
  disabled = false,
  children 
}) {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[10px] font-semibold rounded-md',
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-4 py-2 text-xs font-semibold rounded-lg',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-lg'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const colorClasses = {
    primary: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-sm active:scale-[0.98]',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm active:scale-[0.98]',
    tertiary: 'bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-850',
    brand: 'bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-700 shadow-sm active:scale-[0.98]'
  };

  const selectedColor = colorClasses[color] || colorClasses.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 font-sans transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${selectedSize} ${selectedColor} ${className}`}
    >
      {IconLeading && typeof IconLeading === 'function' && <IconLeading size={14} />}
      {IconLeading && typeof IconLeading !== 'function' && IconLeading}
      
      <span>{children}</span>
      
      {IconTrailing && typeof IconTrailing === 'function' && <IconTrailing size={14} />}
      {IconTrailing && typeof IconTrailing !== 'function' && IconTrailing}
    </button>
  );
}
