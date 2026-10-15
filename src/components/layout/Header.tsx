import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Search } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenMobileNav?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenMobileNav,
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const { t } = useTranslation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const handleToggle = onToggleSidebar || onOpenSidebar || onOpenMobileNav;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Trigger search on '/' unless inside an input/textarea
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-surface-border bg-white px-4 sm:px-6">
        {/* Left: Sidebar Trigger & Organization Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="open-sidebar"
            onClick={handleToggle}
            className={`rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              isSidebarOpen
                ? 'bg-slate-800 text-white'
                : 'text-charcoal hover:bg-slate-100'
            }`}
            aria-label={isSidebarOpen ? "Close sidebar navigation" : "Open sidebar navigation"}
            title={isSidebarOpen ? "Click hamburger to close sidebar" : "Click hamburger to open sidebar"}
            aria-expanded={isSidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="BAOMS Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-sm tracking-tight text-charcoal hidden sm:inline">
              {t('app.shortName', 'BAOMS')}
            </span>
          </div>
        </div>

        {/* Center: Quick Search Trigger */}
        <div className="flex-1 max-w-xs sm:max-w-sm mx-4">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex w-full items-center justify-between rounded-md border border-surface-border bg-surface-muted/40 px-3 py-1.5 text-xs text-charcoal-light hover:bg-surface-muted hover:text-charcoal hover:border-charcoal-light/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D68904]"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span className="truncate">{t('search.placeholder', 'Quick search...')}</span>
            </div>
            <kbd className="hidden sm:inline-block rounded border border-surface-border bg-white px-1.5 py-0.5 text-[10px] font-mono text-charcoal-light">
              /
            </kbd>
          </button>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationsDropdown />
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
