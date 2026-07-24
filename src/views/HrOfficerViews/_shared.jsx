import { useState, useEffect } from 'react';

// Helper component to trigger skeleton delays
export function usePageLoader(triggerArray = []) {
  const [loading, setLoading] = useState(true);
  const triggerLen = triggerArray?.length || 0;

  useEffect(() => {
    const hasData = triggerArray && triggerArray.some(item => {
      if (Array.isArray(item)) return item.length > 0;
      return !!item;
    });
    if (hasData) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [triggerLen]);

  return loading;
}

// Generic component wireframes
export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <div className="h-2.5 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded w-8"></div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center space-y-4">
          <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
          <div className="h-3.5 bg-slate-200 rounded w-24"></div>
          <div className="h-2.5 bg-slate-200 rounded w-36"></div>
          <div className="h-2 bg-slate-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 animate-pulse">
      <div className="h-8 bg-slate-100 rounded w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-55">
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/6"></div>
          <div className="h-3 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
}
