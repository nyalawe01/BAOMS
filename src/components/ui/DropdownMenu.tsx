import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
      <div onClick={() => setIsOpen((prev) => !prev)} className="inline-flex cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1.5 rounded-md border border-surface-border bg-white py-1 shadow-dropdown transition-all focus:outline-none',
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
                  <div className="my-1 border-t border-surface-border" role="separator" />
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
                    'group flex w-full items-center px-3.5 py-2 text-xs font-medium transition-colors text-left',
                    item.isDestructive
                      ? 'text-status-danger-text hover:bg-status-danger-bg'
                      : 'text-charcoal hover:bg-surface-muted',
                    item.disabled && 'pointer-events-none opacity-40'
                  )}
                  role="menuitem"
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'mr-2.5 h-4 w-4 shrink-0 transition-colors',
                        item.isDestructive
                          ? 'text-status-danger-text'
                          : 'text-charcoal-light group-hover:text-charcoal'
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
