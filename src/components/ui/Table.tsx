import React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-md border border-surface-border bg-white shadow-xs">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-xs sm:text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('bg-slate-50 border-b border-surface-border', className)}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('divide-y divide-surface-border text-charcoal', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  dense?: boolean;
}

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  TableRowProps
>(({ className, dense = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      dense ? 'h-8' : 'h-10',
      'transition-colors hover:bg-slate-50/70 data-[state=selected]:bg-slate-100 border-b border-surface-border last:border-b-0',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-8 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted leading-tight select-none',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  dense?: boolean;
  isNumeric?: boolean;
}

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TableCellProps
>(({ className, dense = false, isNumeric = false, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      dense ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-xs sm:text-sm',
      'align-middle text-charcoal leading-normal',
      isNumeric && 'text-right font-mono tabular-nums',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
