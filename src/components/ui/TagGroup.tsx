import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
export { Label, Description } from './Dropdown';

export type TagSize = 'sm' | 'md' | 'lg';
export type TagVariant = 'default' | 'surface';

interface TagGroupContextValue {
  selectionMode: 'none' | 'single' | 'multiple';
  selectedKeys: Set<string | number>;
  disabledKeys: Set<string | number>;
  isDisabled: boolean;
  size: TagSize;
  variant: TagVariant;
  onSelect: (key: string | number) => void;
  onRemove?: (keys: Set<string | number>) => void;
}

const TagGroupContext = createContext<TagGroupContextValue | null>(null);

interface TagItemContextValue {
  id?: string | number;
  isSelected: boolean;
  isDisabled: boolean;
  allowsRemoving: boolean;
}

const TagItemContext = createContext<TagItemContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*                                ERROR MESSAGE                               */
/* -------------------------------------------------------------------------- */

export const ErrorMessage: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => {
  if (!children) return null;
  return (
    <div
      role="alert"
      className={cn('text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1', className)}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               TAG GROUP ROOT                               */
/* -------------------------------------------------------------------------- */

export interface TagGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<string | number> | Set<string | number>;
  defaultSelectedKeys?: Iterable<string | number> | Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  disabledKeys?: Iterable<string | number>;
  isDisabled?: boolean;
  onRemove?: (keys: Set<string | number>) => void;
  size?: TagSize;
  variant?: TagVariant;
  children: ReactNode;
}

export const TagGroupRoot: React.FC<TagGroupProps> = ({
  selectionMode = 'none',
  selectedKeys: controlledSelected,
  defaultSelectedKeys = new Set<string | number>(),
  onSelectionChange,
  disabledKeys: propDisabledKeys = [],
  isDisabled = false,
  onRemove,
  size = 'md',
  variant = 'default',
  className,
  children,
  ...props
}) => {
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
    <TagGroupContext.Provider
      value={{
        selectionMode,
        selectedKeys,
        disabledKeys,
        isDisabled,
        size,
        variant,
        onSelect: handleSelect,
        onRemove,
      }}
    >
      <div className={cn('tag-group flex flex-col gap-1.5', className)} role="group" {...props}>
        {children}
      </div>
    </TagGroupContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                               TAG GROUP LIST                               */
/* -------------------------------------------------------------------------- */

export interface TagGroupListProps<T = any> extends React.HTMLAttributes<HTMLDivElement> {
  items?: T[];
  renderEmptyState?: () => ReactNode;
  children?: ReactNode | ((item: T) => ReactNode);
}

export const TagGroupList = <T,>({
  items,
  renderEmptyState,
  className,
  children,
  ...props
}: TagGroupListProps<T>) => {
  if (items && items.length === 0 && renderEmptyState) {
    return <div className="text-xs text-slate-400 py-1">{renderEmptyState()}</div>;
  }

  return (
    <div className={cn('tag-group__list flex flex-wrap gap-2 items-center', className)} {...props}>
      {items && typeof children === 'function'
        ? items.map((item, idx) => children(item))
        : (children as ReactNode)}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              TAG REMOVE BUTTON                             */
/* -------------------------------------------------------------------------- */

export const TagRemoveButton: React.FC<{ className?: string; children?: ReactNode }> = ({
  className,
  children,
}) => {
  const itemCtx = useContext(TagItemContext);
  const groupCtx = useContext(TagGroupContext);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemCtx?.id !== undefined && groupCtx?.onRemove) {
      groupCtx.onRemove(new Set([itemCtx.id]));
    }
  };

  return (
    <button
      type="button"
      aria-label="Remove tag"
      onClick={handleRemove}
      className={cn(
        'tag__remove-button -mr-1 ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer text-inherit opacity-70 hover:opacity-100 focus:outline-none',
        className
      )}
    >
      {children || <X className="size-3" />}
    </button>
  );
};

TagRemoveButton.displayName = 'TagRemoveButton';

/* -------------------------------------------------------------------------- */
/*                                     TAG                                    */
/* -------------------------------------------------------------------------- */

export interface TagProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  id?: string | number;
  textValue?: string;
  isDisabled?: boolean;
  children:
    | ReactNode
    | ((props: { isSelected: boolean; allowsRemoving: boolean }) => ReactNode);
}

export const TagComponent: React.FC<TagProps> = ({
  id,
  textValue,
  isDisabled: propDisabled = false,
  className,
  children,
  onClick,
  ...props
}) => {
  const groupCtx = useContext(TagGroupContext);
  const isSelected = id !== undefined && (groupCtx?.selectedKeys.has(id) ?? false);
  const isDisabled =
    groupCtx?.isDisabled ||
    propDisabled ||
    (id !== undefined && (groupCtx?.disabledKeys.has(id) ?? false));
  const allowsRemoving = !!groupCtx?.onRemove;

  const size = groupCtx?.size ?? 'md';
  const variant = groupCtx?.variant ?? 'default';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (id !== undefined && groupCtx && groupCtx.selectionMode !== 'none') {
      groupCtx.onSelect(id);
    }
    onClick?.(e);
  };

  const sizeStyles: Record<TagSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  const isInteractive = groupCtx && groupCtx.selectionMode !== 'none';

  const variantStyles =
    variant === 'surface'
      ? isSelected
        ? 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200'
        : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
      : isSelected
      ? 'border-[#D68904] bg-[#D68904] text-white shadow-none'
      : 'border-slate-300/80 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

  let hasCustomRemoveButton = false;
  if (typeof children !== 'function') {
    React.Children.forEach(children, (child) => {
      if (
        React.isValidElement(child) &&
        (child.type === TagRemoveButton || (child.type as any)?.displayName === 'TagRemoveButton')
      ) {
        hasCustomRemoveButton = true;
      }
    });
  }

  const content =
    typeof children === 'function' ? children({ isSelected, allowsRemoving }) : children;

  return (
    <TagItemContext.Provider value={{ id, isSelected, isDisabled, allowsRemoving }}>
      <div
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive && !isDisabled ? 0 : undefined}
        aria-pressed={isInteractive ? isSelected : undefined}
        aria-disabled={isDisabled}
        data-selected={isSelected ? 'true' : undefined}
        data-disabled={isDisabled ? 'true' : undefined}
        className={cn(
          'tag group inline-flex items-center rounded-full font-medium transition-all select-none',
          sizeStyles[size],
          variantStyles,
          isInteractive && 'cursor-pointer active:scale-95',
          isDisabled && 'opacity-40 pointer-events-none cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {content}
        {allowsRemoving && typeof children !== 'function' && !hasCustomRemoveButton && <TagRemoveButton />}
      </div>
    </TagItemContext.Provider>
  );
};

export const Tag = Object.assign(TagComponent, {
  RemoveButton: TagRemoveButton,
});

export const TagGroup = Object.assign(TagGroupRoot, {
  List: TagGroupList,
});
