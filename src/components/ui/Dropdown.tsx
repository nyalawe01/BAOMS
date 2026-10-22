import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Check } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                               CONTEXT TYPES                                */
/* -------------------------------------------------------------------------- */

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  closeMenu: () => void;
  triggerType: 'press' | 'longPress';
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

interface MenuContextValue {
  selectionMode: 'none' | 'single' | 'multiple';
  selectedKeys: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  disabledKeys: Set<string>;
  onAction?: (key: string) => void;
  closeMenu: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

interface ItemContextValue {
  id?: string;
  isSelected: boolean;
  isDisabled: boolean;
  variant: 'default' | 'danger';
}

const ItemContext = createContext<ItemContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*                              HELPER COMPONENTS                             */
/* -------------------------------------------------------------------------- */

export const Label: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <span className={cn('text-xs font-semibold text-inherit select-none leading-tight', className)}>
    {children}
  </span>
);

export const Description: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <span className={cn('text-[11px] text-slate-500 dark:text-slate-400 select-none leading-tight block mt-0.5', className)}>
    {children}
  </span>
);

export const Kbd: React.FC<{
  className?: string;
  slot?: string;
  variant?: 'light' | 'bordered';
  children: ReactNode;
}> = ({ className, children }) => (
  <kbd
    className={cn(
      'ms-auto inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 select-none',
      className
    )}
  >
    {children}
  </kbd>
);

export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div
    role="separator"
    className={cn('my-1 border-t border-slate-100 dark:border-slate-800', className)}
  />
);

export const Header: React.FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none',
      className
    )}
  >
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                               DROPDOWN ROOT                                */
/* -------------------------------------------------------------------------- */

export interface DropdownProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: 'press' | 'longPress';
  className?: string;
  children: ReactNode;
}

export const DropdownRoot: React.FC<DropdownProps> = ({
  isOpen: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger = 'press',
  className,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof nextOpen === 'function' ? nextOpen(isOpen) : nextOpen;
      if (!isControlled) {
        setUncontrolledOpen(resolved);
      }
      onOpenChange?.(resolved);
    },
    [isControlled, isOpen, onOpenChange]
  );

  const closeMenu = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen: handleOpenChange,
        triggerRef,
        closeMenu,
        triggerType: trigger,
      }}
    >
      <div className={cn('dropdown relative inline-block text-left', className)}>{children}</div>
    </DropdownContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                              DROPDOWN TRIGGER                              */
/* -------------------------------------------------------------------------- */

export interface DropdownTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({
  className,
  children,
  ...props
}) => {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown.Trigger must be used inside Dropdown');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    if (ctx.triggerType === 'longPress') {
      timerRef.current = setTimeout(() => {
        ctx.setIsOpen((prev) => !prev);
      }, 500);
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (ctx.triggerType === 'press') {
      e.stopPropagation();
      ctx.setIsOpen((prev) => !prev);
    }
  };

  return (
    <div
      ref={ctx.triggerRef}
      className={cn('dropdown__trigger inline-flex items-center cursor-pointer select-none', className)}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-haspopup="menu"
      aria-expanded={ctx.isOpen}
      {...props}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              DROPDOWN POPOVER                              */
/* -------------------------------------------------------------------------- */

export type PopoverPlacement =
  | 'bottom'
  | 'bottom start'
  | 'bottom end'
  | 'top'
  | 'top start'
  | 'top end'
  | 'left'
  | 'right';

export interface DropdownPopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  placement?: PopoverPlacement;
  children: ReactNode;
}

export const DropdownPopover: React.FC<DropdownPopoverProps> = ({
  placement = 'bottom end',
  className,
  children,
  ...props
}) => {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown.Popover must be used inside Dropdown');

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ctx.isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        ctx.triggerRef.current &&
        !ctx.triggerRef.current.contains(target)
      ) {
        ctx.closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ctx.isOpen) {
        ctx.closeMenu();
      }
    };

    if (ctx.isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ctx]);

  if (!ctx.isOpen) return null;

  const placementStyles: Record<PopoverPlacement, string> = {
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    'bottom start': 'top-full left-0 mt-1.5',
    'bottom end': 'top-full right-0 mt-1.5',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    'top start': 'bottom-full left-0 mb-1.5',
    'top end': 'bottom-full right-0 mb-1.5',
    left: 'right-full top-0 mr-1.5',
    right: 'left-full top-0 ml-1.5',
  };

  return (
    <div
      ref={popoverRef}
      className={cn(
        'dropdown__popover absolute z-50 min-w-[220px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl shadow-slate-900/10 focus:outline-none animate-fadeIn',
        placementStyles[placement],
        className
      )}
      role="presentation"
      {...props}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                DROPDOWN MENU                               */
/* -------------------------------------------------------------------------- */

export interface DropdownMenuComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  selectionMode?: 'none' | 'single' | 'multiple';
  selectedKeys?: Iterable<string> | Set<string>;
  defaultSelectedKeys?: Iterable<string> | Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  disabledKeys?: Iterable<string> | string[];
  onAction?: (key: string) => void;
  children: ReactNode;
}

export const DropdownMenuComponent: React.FC<DropdownMenuComponentProps> = ({
  selectionMode = 'none',
  selectedKeys: controlledSelected,
  defaultSelectedKeys = new Set<string>(),
  onSelectionChange,
  disabledKeys: propDisabledKeys = [],
  onAction,
  className,
  children,
  ...props
}) => {
  const ctx = useContext(DropdownContext);
  const [uncontrolledSelected, setUncontrolledSelected] = useState<Set<string>>(
    new Set(defaultSelectedKeys)
  );

  const selectedKeys = controlledSelected
    ? new Set(controlledSelected)
    : uncontrolledSelected;

  const disabledKeys = new Set(propDisabledKeys);

  const handleSelection = useCallback(
    (key: string) => {
      let nextKeys: Set<string>;
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
    <MenuContext.Provider
      value={{
        selectionMode,
        selectedKeys,
        onSelectionChange: handleSelection as any,
        disabledKeys,
        onAction,
        closeMenu: ctx?.closeMenu || (() => {}),
      }}
    >
      <div
        role="menu"
        className={cn('dropdown__menu flex flex-col gap-0.5 focus:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    </MenuContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                                DROPDOWN ITEM                               */
/* -------------------------------------------------------------------------- */

export interface DropdownItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  id?: string;
  textValue?: string;
  variant?: 'default' | 'danger';
  isDisabled?: boolean;
  children: ReactNode | ((props: { isSelected: boolean }) => ReactNode);
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  id,
  textValue,
  variant = 'default',
  isDisabled: propDisabled = false,
  className,
  children,
  onClick,
  ...props
}) => {
  const menuCtx = useContext(MenuContext);
  const isSelected = !!id && (menuCtx?.selectedKeys.has(id) ?? false);
  const isDisabled = propDisabled || (!!id && (menuCtx?.disabledKeys.has(id) ?? false));

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (id && menuCtx) {
      if (menuCtx.selectionMode !== 'none') {
        (menuCtx.onSelectionChange as any)?.(id);
      }
      menuCtx.onAction?.(id);
    }
    onClick?.(e);
    if (!menuCtx || menuCtx.selectionMode === 'none') {
      menuCtx?.closeMenu();
    }
  };

  const itemContent = typeof children === 'function' ? children({ isSelected }) : children;

  return (
    <ItemContext.Provider value={{ id, isSelected, isDisabled, variant }}>
      <div
        role="menuitem"
        aria-disabled={isDisabled}
        data-disabled={isDisabled ? 'true' : undefined}
        data-selected={isSelected ? 'true' : undefined}
        className={cn(
          'menu-item group flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors select-none text-left',
          variant === 'danger'
            ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100'
            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 active:bg-slate-200/70',
          isSelected && variant !== 'danger' && 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold',
          isDisabled && 'opacity-40 pointer-events-none cursor-not-allowed',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {itemContent}
      </div>
    </ItemContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/*                           DROPDOWN ITEM INDICATOR                          */
/* -------------------------------------------------------------------------- */

export interface DropdownItemIndicatorProps {
  type?: 'checkmark' | 'dot';
  className?: string;
  children?: (props: { isSelected: boolean }) => ReactNode;
}

export const DropdownItemIndicator: React.FC<DropdownItemIndicatorProps> = ({
  type = 'checkmark',
  className,
  children,
}) => {
  const itemCtx = useContext(ItemContext);
  const isSelected = itemCtx?.isSelected ?? false;

  if (children) {
    return <>{children({ isSelected })}</>;
  }

  if (!isSelected) return null;

  return (
    <span
      className={cn(
        'ms-auto shrink-0 flex items-center justify-center text-[#D68904] dark:text-[#eaaf4a]',
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
/*                              DROPDOWN SECTION                              */
/* -------------------------------------------------------------------------- */

export interface DropdownSectionProps extends DropdownMenuComponentProps {
  children: ReactNode;
}

export const DropdownSection: React.FC<DropdownSectionProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('menu-section flex flex-col gap-0.5 py-1', className)} role="group" {...props}>
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                            DROPDOWN SUBMENU                                */
/* -------------------------------------------------------------------------- */

export const DropdownSubmenuIndicator: React.FC<{ className?: string; children?: ReactNode }> = ({
  className,
  children,
}) => {
  return children ? (
    <span className={cn('ms-auto', className)}>{children}</span>
  ) : (
    <ChevronRight className={cn('ms-auto size-3.5 text-slate-400 group-hover:text-slate-600', className)} />
  );
};

export const DropdownSubmenuTrigger: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const [isSubOpen, setIsSubOpen] = useState(false);

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsSubOpen(true)}
      onMouseLeave={() => setIsSubOpen(false)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === DropdownPopover) {
          return isSubOpen ? (
            <div className="absolute left-full top-0 ml-1 z-50">
              {React.cloneElement(child as any, { placement: 'right' })}
            </div>
          ) : null;
        }
        return child;
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               COMPOUND EXPORT                              */
/* -------------------------------------------------------------------------- */

export const Dropdown = Object.assign(DropdownRoot, {
  Trigger: DropdownTrigger,
  Popover: DropdownPopover,
  Menu: DropdownMenuComponent,
  Item: DropdownItem,
  ItemIndicator: DropdownItemIndicator,
  Section: DropdownSection,
  SubmenuTrigger: DropdownSubmenuTrigger,
  SubmenuIndicator: DropdownSubmenuIndicator,
});
