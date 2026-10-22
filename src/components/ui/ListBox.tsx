import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
export { Label, Description, Header, Separator, Kbd } from './Dropdown';

/* -------------------------------------------------------------------------- */
/*                               CONTEXT TYPES                                */
/* -------------------------------------------------------------------------- */

interface ListBoxContextValue {
  selectionMode: 'none' | 'single' | 'multiple';
  selectedKeys: Set<string | number>;
  disabledKeys: Set<string | number>;
  onSelect: (key: string | number) => void;
  onAction?: (key: string | number) => void;
}

const ListBoxContext = createContext<ListBoxContextValue | null>(null);

interface ListBoxItemContextValue {
  id?: string | number;
  isSelected: boolean;
  isDisabled: boolean;
  variant: 'default' | 'danger';
}

const ListBoxItemContext = createContext<ListBoxItemContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*                              SURFACE WRAPPER                               */
/* -------------------------------------------------------------------------- */

export const Surface: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-1.5 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                LISTBOX ROOT                                */
/* -------------------------------------------------------------------------- */

export interface ListBoxProps<T = any> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAction'> {
  'aria-label'?: string;
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<string | number> | Set<string | number>;
  defaultSelectedKeys?: Iterable<string | number> | Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  disabledKeys?: Iterable<string | number>;
  onAction?: (key: string | number) => void;
  items?: T[];
  children?: ReactNode | ((item: T) => ReactNode);
}

export const ListBoxRoot = <T,>({
  'aria-label': ariaLabel,
  selectionMode = 'single',
  selectedKeys: controlledSelected,
  defaultSelectedKeys = new Set<string | number>(),
  onSelectionChange,
  disabledKeys: propDisabledKeys = [],
  onAction,
  items,
  className,
  children,
  ...props
}: ListBoxProps<T>) => {
  const [uncontrolledSelected, setUncontrolledSelected] = useState<Set<string | number>>(
    new Set(defaultSelectedKeys)
  );

  const selectedKeys = controlledSelected
    ? new Set(controlledSelected)
    : uncontrolledSelected;

  const disabledKeys = new Set(propDisabledKeys);

  const handleSelect = useCallback(
    (key: string | number) => {
      let nextKeys: Set<string | number>;
      if (selectionMode === 'single') {
        nextKeys = new Set([key]);
      } else if (selectionMode === 'multiple') {
        nextKeys = new Set(selectedKeys);
        if (nextKeys.has(key)) {
          nextKeys.delete(key);
        } else {
          nextKeys.add(key);
        }
      } else {
        return;
      }

      if (!controlledSelected) {
        setUncontrolledSelected(nextKeys);
      }
      onSelectionChange?.(nextKeys);
    },
    [controlledSelected, onSelectionChange, selectedKeys, selectionMode]
  );

  return (
    <ListBoxContext.Provider
      value={{
        selectionMode,
        selectedKeys,
        disabledKeys,
        onSelect: handleSelect,
        onAction,
      }}
    >
      <div
        role="listbox"
        aria-label={ariaLabel}
        className={cn('list-box flex flex-col gap-0.5 p-1 select-none focus:outline-none', className)}
        {...props}
      >
        {items && typeof children === 'function'
          ? items.map((item, idx) => children(item))
          : (children as ReactNode)}
      </div>
    </ListBoxContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                                LISTBOX ITEM                                */
/* -------------------------------------------------------------------------- */

export interface ListBoxItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  id?: string | number;
  textValue?: string;
  isDisabled?: boolean;
  variant?: 'default' | 'danger';
  children: ReactNode | ((props: { isSelected: boolean }) => ReactNode);
}

export const ListBoxItem: React.FC<ListBoxItemProps> = ({
  id,
  textValue,
  isDisabled: propDisabled = false,
  variant = 'default',
  className,
  children,
  onClick,
  ...props
}) => {
  const listCtx = useContext(ListBoxContext);
  const isSelected = id !== undefined && (listCtx?.selectedKeys.has(id) ?? false);
  const isDisabled = propDisabled || (id !== undefined && (listCtx?.disabledKeys.has(id) ?? false));

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (id !== undefined && listCtx) {
      listCtx.onSelect(id);
      listCtx.onAction?.(id);
    }
    onClick?.(e);
  };

  const itemContent = typeof children === 'function' ? children({ isSelected }) : children;

  return (
    <ListBoxItemContext.Provider value={{ id, isSelected, isDisabled, variant }}>
      <div
        role="option"
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        data-selected={isSelected ? 'true' : undefined}
        data-disabled={isDisabled ? 'true' : undefined}
        className={cn(
          'list-box-item group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors',
          variant === 'danger'
            ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100'
            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 active:bg-slate-200/70',
          isSelected && variant !== 'danger' && 'bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-300 font-semibold',
          isDisabled && 'opacity-40 pointer-events-none cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {itemContent}
      </div>
    </ListBoxItemContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                           LISTBOX ITEM INDICATOR                           */
/* -------------------------------------------------------------------------- */

export interface ListBoxItemIndicatorProps {
  type?: 'checkmark' | 'dot';
  className?: string;
  children?: (props: { isSelected: boolean }) => ReactNode;
}

export const ListBoxItemIndicator: React.FC<ListBoxItemIndicatorProps> = ({
  type = 'checkmark',
  className,
  children,
}) => {
  const itemCtx = useContext(ListBoxItemContext);
  const isSelected = itemCtx?.isSelected ?? false;

  if (children) {
    return <>{children({ isSelected })}</>;
  }

  if (!isSelected) return null;

  return (
    <span
      className={cn(
        'list-box-item__indicator ms-auto shrink-0 flex items-center justify-center text-[#D68904] dark:text-[#eaaf4a]',
        className
      )}
      aria-hidden="true"
    >
      {type === 'dot' ? (
        <span className="size-2 rounded-full bg-current" />
      ) : (
        <Check className="size-4 stroke-[2.5]" />
      )}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/*                              LISTBOX SECTION                               */
/* -------------------------------------------------------------------------- */

export const ListBoxSection: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('list-box-section flex flex-col gap-0.5 py-1', className)} role="group" {...props}>
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               COMPOUND EXPORT                              */
/* -------------------------------------------------------------------------- */

export const ListBox = Object.assign(ListBoxRoot, {
  Item: ListBoxItem,
  ItemIndicator: ListBoxItemIndicator,
  Section: ListBoxSection,
});
