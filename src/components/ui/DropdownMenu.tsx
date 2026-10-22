import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
export * from './Dropdown';

export interface DropdownMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  isDestructive?: boolean;
  dividerAbove?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  className?: string;
  menuWidth?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className,
  menuWidth = 'w-56',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn('relative inline-block text-left', className)}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="inline-flex cursor-pointer select-none">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm transition-all focus:outline-none animate-fadeIn',
            menuWidth,
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {item.dividerAbove && (
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" role="separator" />
                )}
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick?.();
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    'group flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left select-none cursor-pointer',
                    item.isDestructive
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:bg-rose-100'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 active:bg-slate-200/70',
                    item.disabled && 'pointer-events-none opacity-40 cursor-not-allowed'
                  )}
                  role="menuitem"
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        item.isDestructive
                          ? 'text-rose-500'
                          : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                      )}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
