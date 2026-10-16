import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onClear?: () => void;
  showShortcut?: boolean;
  size?: 'sm' | 'md';
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onChange,
      onClear,
      placeholder = 'Search...',
      showShortcut = true,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const internalInputRef = useRef<HTMLInputElement | null>(null);

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        const event = {
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
      internalInputRef.current?.focus();
    };

    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className="relative flex items-center w-full">
        <div className="pointer-events-none absolute left-3 flex items-center text-charcoal-light">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>

        <input
          ref={(node) => {
            internalInputRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-md border border-surface-border bg-white text-charcoal transition-colors',
            'pl-9 pr-9 placeholder:text-charcoal-light shadow-xs',
            'focus:outline-none focus:border-[#D68904] focus:ring-1 focus:ring-[#D68904]',
            size === 'sm' ? 'h-8 text-xs' : 'h-9 text-xs sm:text-sm',
            className
          )}
          {...props}
        />

        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 flex items-center text-charcoal-light hover:text-charcoal p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : showShortcut ? (
          <div className="pointer-events-none absolute right-2.5 hidden sm:flex items-center">
            <kbd className="rounded border border-surface-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-charcoal-light">
              /
            </kbd>
          </div>
        ) : null}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
