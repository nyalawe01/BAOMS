import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabProps {
  id?: string;
  key?: string;
  title?: ReactNode;
  disabled?: boolean;
  count?: number;
  children?: ReactNode;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

Tab.displayName = 'Tab';

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  selectedKey?: string;
  onChange?: (id: string) => void;
  onSelectionChange?: (key: string) => void;
  variant?: 'underlined' | 'solid' | 'bordered' | 'light';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Tabs: React.FC<TabsProps> & { Tab: typeof Tab } = ({
  tabs,
  activeTab: propActiveTab,
  selectedKey,
  onChange,
  onSelectionChange,
  variant = 'underlined',
  size = 'md',
  fullWidth = false,
  className,
  children,
}) => {
  const currentKey = selectedKey ?? propActiveTab ?? '';
  const handleSelect = (key: string) => {
    onSelectionChange?.(key);
    onChange?.(key);
  };

  // If compound children are provided (<Tab key="..." title="...">)
  const items: TabItem[] = tabs || [];
  if (!tabs && children) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<TabProps>(child)) {
        const id = (child.key as string) || child.props.id || '';
        items.push({
          id,
          label: child.props.title || child.props.children,
          count: child.props.count,
          disabled: child.props.disabled,
        });
      }
    });
  }

  // Underlined Variant: flush with bottom line, zero border radius, zero shadow
  if (variant === 'underlined') {
    return (
      <div className={cn('border-b border-slate-200/90 w-full overflow-x-auto no-scrollbar', className)}>
        <nav
          className={cn(
            '-mb-px flex items-center min-w-max',
            fullWidth ? 'w-full justify-between' : 'gap-1 sm:gap-2'
          )}
          aria-label="Tabs"
          role="tablist"
        >
          {items.map((tab) => {
            const isActive = tab.id === currentKey;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                data-slot="tab"
                data-unstyled="true"
                type="button"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => handleSelect(tab.id)}
                className={cn(
                  'group inline-flex items-center gap-2 border-b-2 font-medium transition-colors select-none cursor-pointer outline-none shadow-none rounded-none bg-transparent',
                  size === 'sm' && 'py-2 px-3 text-xs',
                  size === 'md' && 'py-3 px-3.5 sm:px-4 text-xs sm:text-sm',
                  size === 'lg' && 'py-3.5 px-5 text-sm sm:text-base',
                  isActive
                    ? 'border-[#D68904] text-[#D68904] font-semibold bg-transparent'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 bg-transparent',
                  tab.disabled && 'pointer-events-none opacity-40 cursor-not-allowed'
                )}
              >
                {Icon && <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#D68904]' : 'text-slate-400')} />}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none',
                      isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Solid Variant: segmented pill style with clean soft background, NO black shadow
  if (variant === 'solid') {
    return (
      <div
        className={cn(
          'inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 items-center gap-1 select-none',
          fullWidth && 'w-full flex',
          className
        )}
        role="tablist"
      >
        {items.map((tab) => {
          const isActive = tab.id === currentKey;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              role="tab"
              data-slot="tab"
              data-unstyled="true"
              type="button"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => handleSelect(tab.id)}
              className={cn(
                'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all cursor-pointer outline-none select-none',
                size === 'sm' && 'px-2.5 py-1 text-xs',
                size === 'md' && 'px-3.5 py-1.5 text-xs sm:text-sm',
                size === 'lg' && 'px-4.5 py-2 text-sm',
                fullWidth && 'flex-1',
                isActive
                  ? 'bg-white text-slate-900 font-semibold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent',
                tab.disabled && 'pointer-events-none opacity-40 cursor-not-allowed'
              )}
            >
              {Icon && <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-slate-900' : 'text-slate-500')} />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none',
                    isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Bordered / Light Variant
  return (
    <div className={cn('flex flex-wrap gap-1.5 p-0.5', className)} role="tablist">
      {items.map((tab) => {
        const isActive = tab.id === currentKey;
        return (
          <button
            key={tab.id}
            role="tab"
            data-slot="tab"
            data-unstyled="true"
            type="button"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => handleSelect(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg font-medium transition-colors cursor-pointer select-none',
              size === 'sm' && 'px-2.5 py-1 text-xs',
              size === 'md' && 'px-3.5 py-1.5 text-xs sm:text-sm',
              variant === 'bordered'
                ? isActive
                  ? 'border border-[#D68904] text-[#D68904] bg-amber-50/50 font-semibold'
                  : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 bg-white'
                : isActive
                ? 'text-[#D68904] font-semibold bg-amber-50/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <Badge variant={isActive ? 'info' : 'default'} className="px-1.5 py-0 text-[10px]">
                {tab.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};

Tabs.Tab = Tab;
