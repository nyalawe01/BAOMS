import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  className,
}) => {
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-surface-border bg-white text-xs text-charcoal-muted',
        className
      )}
    >
      {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
        <div>
          Showing <span className="font-semibold text-charcoal">{startItem}</span> to{' '}
          <span className="font-semibold text-charcoal">{endItem}</span> of{' '}
          <span className="font-semibold text-charcoal">{totalItems}</span> records
        </div>
      ) : (
        <div>
          Page <span className="font-semibold text-charcoal">{currentPage}</span> of{' '}
          <span className="font-semibold text-charcoal">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((p) => {
          // Show up to 5 page numbers around active page
          if (totalPages > 7) {
            if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
              if (p === 2 || p === totalPages - 1) {
                return (
                  <span key={p} className="px-1 text-charcoal-light">
                    ...
                  </span>
                );
              }
              return null;
            }
          }

          const isCurrent = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'h-8 w-8 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904]',
                isCurrent
                  ? 'bg-[#D68904] text-white font-semibold'
                  : 'text-charcoal hover:bg-surface-muted border border-surface-border'
              )}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
