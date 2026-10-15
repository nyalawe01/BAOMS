import React from 'react';
import { cn } from '@/lib/utils';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-lg border border-surface-border bg-white shadow-xs">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
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
    className={cn('bg-surface-muted/60 border-b border-surface-border', className)}
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
    className={cn('divide-y divide-surface-border', className)}
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
      dense ? 'h-9' : 'h-11',
      'transition-colors hover:bg-surface-hover/60 data-[state=selected]:bg-surface-muted border-b border-surface-border last:border-b-0',
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
      'h-9 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.05em] text-charcoal-muted leading-[1.2] select-none',
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
      dense ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-[13px]',
      'align-middle text-charcoal leading-[1.4]',
      isNumeric && 'text-right font-mono tabular-nums',
      className
    )}
    {...props}
  />
));
TableCell.displayName = 'TableCell';
