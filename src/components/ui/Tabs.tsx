import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={cn('border-b border-surface-border', className)}>
      <nav className="-mb-px flex space-x-6" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'group inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904] select-none',
                isActive
                  ? 'border-[#D68904] text-[#D68904] font-semibold'
                  : 'border-transparent text-charcoal-muted hover:border-surface-border hover:text-charcoal',
                tab.disabled && 'pointer-events-none opacity-40'
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <Badge
                  variant={isActive ? 'info' : 'default'}
                  className="px-1.5 py-0 text-[10px]"
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
