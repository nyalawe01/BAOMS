import React, { createContext, useContext, ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                               CONTEXT TYPES                                */
/* -------------------------------------------------------------------------- */

export type SortDirection = 'ascending' | 'descending' | undefined;

export interface SortDescriptor {
  column?: string;
  direction?: 'ascending' | 'descending';
}

interface TableContextValue {
  variant?: 'default' | 'secondary';
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
}

const TableContext = createContext<TableContextValue>({
  variant: 'default',
});

/* -------------------------------------------------------------------------- */
/*                              SCROLL CONTAINER                              */
/* -------------------------------------------------------------------------- */

export const TableScrollContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'table-scroll-container relative w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
TableScrollContainer.displayName = 'Table.ScrollContainer';

/* -------------------------------------------------------------------------- */
/*                                TABLE CONTENT                               */
/* -------------------------------------------------------------------------- */

export interface TableContentProps extends React.TableHTMLAttributes<HTMLTableElement> {
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<string | number> | Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
}

export const TableContent = forwardRef<HTMLTableElement, TableContentProps>(
  (
    {
      sortDescriptor,
      onSortChange,
      selectionMode = 'none',
      selectedKeys: propSelectedKeys,
      onSelectionChange,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const selectedKeys = propSelectedKeys ? new Set(propSelectedKeys) : new Set<string | number>();

    return (
      <TableContext.Provider
        value={{
          sortDescriptor,
          onSortChange,
          selectionMode,
          selectedKeys,
          onSelectionChange,
        }}
      >
        <table
          ref={ref}
          className={cn(
            'w-full border-collapse caption-bottom text-xs sm:text-sm text-left align-middle',
            className
          )}
          {...props}
        >
          {children}
        </table>
      </TableContext.Provider>
    );
  }
);
TableContent.displayName = 'Table.Content';

/* -------------------------------------------------------------------------- */
/*                                TABLE HEADER                                */
/* -------------------------------------------------------------------------- */

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  columns?: any[];
  children?: ReactNode | ((column: any) => ReactNode);
}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, columns, children, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        'bg-slate-50/90 dark:bg-slate-800/90 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-xs select-none',
        className
      )}
      {...props}
    >
      <tr>
        {columns && typeof children === 'function'
          ? columns.map((col) => children(col))
          : (children as ReactNode)}
      </tr>
    </thead>
  )
);
TableHeader.displayName = 'TableHeader';

/* -------------------------------------------------------------------------- */
/*                                TABLE COLUMN                                */
/* -------------------------------------------------------------------------- */

export interface TableColumnProps extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'children'> {
  id?: string;
  isRowHeader?: boolean;
  allowsSorting?: boolean;
  defaultWidth?: string | number;
  minWidth?: number;
  children?: ReactNode | ((props: { sortDirection: SortDirection }) => ReactNode);
}

export const TableColumn = forwardRef<HTMLTableCellElement, TableColumnProps>(
  (
    {
      id,
      isRowHeader = false,
      allowsSorting = false,
      defaultWidth,
      minWidth,
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { sortDescriptor, onSortChange } = useContext(TableContext);

    const isCurrentSorted = id && sortDescriptor?.column === id;
    const sortDirection: SortDirection = isCurrentSorted ? sortDescriptor?.direction : undefined;

    const handleSort = (e: React.MouseEvent<HTMLTableCellElement>) => {
      onClick?.(e);
      if (!allowsSorting || !id || !onSortChange) return;

      const nextDirection =
        sortDirection === 'ascending' ? 'descending' : 'ascending';
      onSortChange({
        column: id,
        direction: nextDirection,
      });
    };

    const rendered =
      typeof children === 'function' ? children({ sortDirection }) : children;

    return (
      <th
        ref={ref}
        scope={isRowHeader ? 'row' : 'col'}
        data-sortable={allowsSorting ? 'true' : undefined}
        data-sort-direction={sortDirection}
        style={{ minWidth }}
        className={cn(
          'h-9 px-3.5 py-2 text-left align-middle text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase select-none transition-colors',
          allowsSorting && 'cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800',
          className
        )}
        onClick={handleSort}
        {...props}
      >
        {allowsSorting && typeof children !== 'function' ? (
          <TableSortableColumnHeader sortDirection={sortDirection}>
            {rendered}
          </TableSortableColumnHeader>
        ) : (
          rendered
        )}
      </th>
    );
  }
);
TableColumn.displayName = 'TableColumn';
export const TableHead = TableColumn; // Legacy backward alias

/* -------------------------------------------------------------------------- */
/*                         SORTABLE COLUMN HEADER                             */
/* -------------------------------------------------------------------------- */

export const TableSortableColumnHeader: React.FC<{
  sortDirection?: SortDirection;
  children: ReactNode;
}> = ({ sortDirection, children }) => {
  return (
    <div className="inline-flex items-center gap-1.5 group">
      <span>{children}</span>
      <span className="shrink-0 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
        {sortDirection === 'ascending' ? (
          <ChevronUp className="size-3.5 text-[#D68904]" />
        ) : sortDirection === 'descending' ? (
          <ChevronDown className="size-3.5 text-[#D68904]" />
        ) : (
          <ChevronsUpDown className="size-3 opacity-40 group-hover:opacity-100" />
        )}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 TABLE BODY                                 */
/* -------------------------------------------------------------------------- */

export interface TableBodyProps<T = any> extends React.HTMLAttributes<HTMLTableSectionElement> {
  items?: T[];
  renderEmptyState?: () => ReactNode;
  children?: ReactNode | ((item: T) => ReactNode);
}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ items, renderEmptyState, className, children, ...props }, ref) => {
    const isEmpty = items && items.length === 0;

    return (
      <tbody
        ref={ref}
        className={cn('divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200', className)}
        {...props}
      >
        {isEmpty && renderEmptyState ? (
          <tr>
            <td colSpan={100} className="py-12 text-center text-xs text-slate-400">
              {renderEmptyState()}
            </td>
          </tr>
        ) : items && typeof children === 'function' ? (
          items.map((item, idx) => children(item))
        ) : (
          children as ReactNode
        )}
      </tbody>
    );
  }
);
TableBody.displayName = 'TableBody';

/* -------------------------------------------------------------------------- */
/*                                 TABLE ROW                                  */
/* -------------------------------------------------------------------------- */

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  id?: string | number;
  dense?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ id, dense = false, className, children, ...props }, ref) => {
    const { selectedKeys } = useContext(TableContext);
    const isSelected = id !== undefined && (selectedKeys?.has(id) ?? false);

    return (
      <tr
        ref={ref}
        data-selected={isSelected ? 'true' : undefined}
        className={cn(
          dense ? 'h-8' : 'h-10.5',
          'transition-colors duration-100 hover:bg-slate-50/80 dark:hover:bg-slate-800/60',
          isSelected && 'bg-amber-50/60 dark:bg-amber-950/20 font-medium',
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
);
TableRow.displayName = 'TableRow';

/* -------------------------------------------------------------------------- */
/*                                 TABLE CELL                                 */
/* -------------------------------------------------------------------------- */

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  dense?: boolean;
  isNumeric?: boolean;
  textValue?: string;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ dense = false, isNumeric = false, textValue, className, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        dense ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm',
        'align-middle leading-normal',
        isNumeric && 'text-right font-mono tabular-nums',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);
TableCell.displayName = 'TableCell';

/* -------------------------------------------------------------------------- */
/*                                TABLE FOOTER                                */
/* -------------------------------------------------------------------------- */

export const TableFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('table-footer border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl', className)}
    {...props}
  >
    {children}
  </div>
));
TableFooter.displayName = 'Table.Footer';

/* -------------------------------------------------------------------------- */
/*                               LOAD MORE / SENTINEL                         */
/* -------------------------------------------------------------------------- */

export const TableLoadMore: React.FC<{
  isLoading?: boolean;
  scrollOffset?: number;
  onLoadMore?: () => void;
  children?: ReactNode;
}> = ({ isLoading, onLoadMore, children }) => {
  return (
    <tr>
      <td colSpan={100} className="py-4 text-center">
        {children}
      </td>
    </tr>
  );
};

export const TableLoadMoreContent: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-center p-2 text-slate-500">{children}</div>
);

/* -------------------------------------------------------------------------- */
/*                                 TABLE ROOT                                 */
/* -------------------------------------------------------------------------- */

export interface TableRootProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary';
  children: ReactNode;
}

export const TableRoot = forwardRef<HTMLDivElement, TableRootProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    // If children includes Table.ScrollContainer, render wrapper
    const hasScrollContainer = React.Children.toArray(children).some(
      (c) => React.isValidElement(c) && (c.type === TableScrollContainer || c.type === TableFooter)
    );

    if (hasScrollContainer) {
      return (
        <div
          ref={ref}
          className={cn('table-component-wrapper w-full flex flex-col gap-2', className)}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Classic usage: <Table><TableHeader>...</TableHeader><TableBody>...</TableBody></Table>
    return (
      <TableScrollContainer ref={ref} className={className} {...props}>
        <TableContent>{children}</TableContent>
      </TableScrollContainer>
    );
  }
);
TableRoot.displayName = 'Table';

/* -------------------------------------------------------------------------- */
/*                              COMPOUND EXPORT                               */
/* -------------------------------------------------------------------------- */

export const Table = Object.assign(TableRoot, {
  ScrollContainer: TableScrollContainer,
  Content: TableContent,
  Header: TableHeader,
  Column: TableColumn,
  SortableColumnHeader: TableSortableColumnHeader,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  Footer: TableFooter,
  LoadMore: TableLoadMore,
  LoadMoreContent: TableLoadMoreContent,
});
