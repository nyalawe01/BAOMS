import React, { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/* -------------------------------------------------------------------------- */
/*                          HEROUI COMPOUND SUBCOMPONENTS                     */
/* -------------------------------------------------------------------------- */

export const PaginationSummary: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('text-xs text-slate-500 dark:text-slate-400 select-none', className)}>
    {children}
  </div>
);

export const PaginationContent: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('flex items-center gap-1.5', className)}>
    {children}
  </div>
);

export const PaginationItem: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('inline-flex items-center', className)}>
    {children}
  </div>
);

export const PaginationPreviousIcon: React.FC<{ className?: string }> = ({ className }) => (
  <ChevronLeft className={cn('size-4 shrink-0', className)} />
);

export const PaginationNextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <ChevronRight className={cn('size-4 shrink-0', className)} />
);

export interface PaginationActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDisabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
}

export const PaginationPrevious: React.FC<PaginationActionProps> = ({
  isDisabled,
  disabled,
  onPress,
  onClick,
  className,
  children,
  ...props
}) => {
  const isActuallyDisabled = isDisabled || disabled;
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isActuallyDisabled}
      onClick={(e) => {
        onPress?.();
        onClick?.(e);
      }}
      className={cn('gap-1 px-2.5 text-xs font-medium', className)}
      {...props}
    >
      {children}
    </Button>
  );
};

export const PaginationNext: React.FC<PaginationActionProps> = ({
  isDisabled,
  disabled,
  onPress,
  onClick,
  className,
  children,
  ...props
}) => {
  const isActuallyDisabled = isDisabled || disabled;
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={isActuallyDisabled}
      onClick={(e) => {
        onPress?.();
        onClick?.(e);
      }}
      className={cn('gap-1 px-2.5 text-xs font-medium', className)}
      {...props}
    >
      {children}
    </Button>
  );
};

export interface PaginationLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  onPress?: () => void;
  children: ReactNode;
}

export const PaginationLink: React.FC<PaginationLinkProps> = ({
  isActive = false,
  onPress,
  onClick,
  className,
  children,
  ...props
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        onPress?.();
        onClick?.(e);
      }}
      className={cn(
        'size-8 rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904] cursor-pointer select-none',
        isActive
          ? 'bg-[#D68904] text-white font-semibold shadow-xs'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                               PAGINATION ROOT                              */
/* -------------------------------------------------------------------------- */

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

export const PaginationRoot: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  size = 'sm',
  className,
  children,
  ...props
}) => {
  // If children is provided, render compound layout
  if (children) {
    return (
      <div
        className={cn(
          'pagination flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs',
          className
        )}
        role="navigation"
        aria-label="Pagination"
        {...props}
      >
        {children}
      </div>
    );
  }

  // Classic controlled pagination mode
  if (currentPage !== undefined && totalPages !== undefined && onPageChange) {
    const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : undefined;
    const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div
        className={cn(
          'pagination flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 select-none',
          className
        )}
        role="navigation"
        aria-label="Pagination"
        {...props}
      >
        <PaginationSummary>
          {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
            <span>
              Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> results
            </span>
          ) : (
            <span>
              Page <span className="font-semibold text-slate-900 dark:text-slate-100">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totalPages}</span>
            </span>
          )}
        </PaginationSummary>

        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              isDisabled={currentPage <= 1}
              onPress={() => onPageChange(currentPage - 1)}
            >
              <PaginationPreviousIcon />
              <span>Prev</span>
            </PaginationPrevious>
          </PaginationItem>

          {pages.map((p) => {
            if (totalPages > 7) {
              if (p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
                if (p === 2 || p === totalPages - 1) {
                  return (
                    <span key={p} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              }
            }

            return (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === currentPage}
                  onPress={() => onPageChange(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem>
            <PaginationNext
              isDisabled={currentPage >= totalPages}
              onPress={() => onPageChange(currentPage + 1)}
            >
              <span>Next</span>
              <PaginationNextIcon />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </div>
    );
  }

  return null;
};

export const Pagination = Object.assign(PaginationRoot, {
  Summary: PaginationSummary,
  Content: PaginationContent,
  Item: PaginationItem,
  Previous: PaginationPrevious,
  Next: PaginationNext,
  Link: PaginationLink,
  PreviousIcon: PaginationPreviousIcon,
  NextIcon: PaginationNextIcon,
});
