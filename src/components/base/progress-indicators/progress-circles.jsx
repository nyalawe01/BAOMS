import React from 'react';

export function ProgressBarHalfCircle({ size = 'sm', label = '', min = 0, max = 100, value = 0 }) {
  const sizeMap = {
    xxs: 'w-16 h-12 text-[9px]',
    xs: 'w-24 h-16 text-[10px]',
    sm: 'w-32.5 h-20 text-xs',
    md: 'w-40 h-24 text-sm',
    lg: 'w-48 h-32 text-base'
  };

  const selectedSize = sizeMap[size] || sizeMap.sm;

  // Percentage calculations
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // SVG gauge computations
  const radius = 40;
  const circ = Math.PI * radius; // 180 degrees circumference = 125.66
  const strokeDashoffset = circ - (percentage / 100) * circ;

  return (
    <div className={`flex flex-col items-center justify-center text-center font-semibold ${selectedSize}`}>
      <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
        <svg className="w-full h-full absolute top-0" viewBox="0 0 100 60">
          {/* Base Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active Progress */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            className="text-indigo-650"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>
        <div className="z-10 pb-1.5 flex flex-col items-center">
          <span className="text-sm font-extrabold text-slate-800 leading-none">{value}%</span>
          {label && <span className="text-[9px] font-bold text-slate-450 uppercase mt-0.5">{label}</span>}
        </div>
      </div>
    </div>
  );
}
