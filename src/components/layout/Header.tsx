import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Search, ChevronRight, PanelLeft } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserProfileMenu } from './UserProfileMenu';
import { GlobalSearchModal } from './GlobalSearchModal';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenMobileNav?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Overview',
  'projects': 'Projects & Programs',
  'finance': 'Finance & Ledgers',
  'procurement': 'Procurement & Supplies',
  'me': 'Monitoring & Evaluation',
  'hr': 'Human Resources',
  'documents': 'Documents & Records',
  'correspondence': 'Official Correspondence',
  'reports': 'Reports & Analytics',
  'users': 'Staff & Accounts',
  'settings': 'System Settings',
  'profile': 'My Profile',
  'design-system': 'Design System',
  'register': 'Self-Registration',
};

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenMobileNav,
  onToggleSidebar,
  isSidebarOpen = true,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleToggle = onToggleSidebar || onOpenSidebar;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentSection = pathSegments[0] || '';
  const currentSectionLabel = ROUTE_LABELS[currentSection] || (currentSection ? currentSection.charAt(0).toUpperCase() + currentSection.slice(1) : 'Overview');
  const subSection = pathSegments[1] ? (ROUTE_LABELS[pathSegments[1]] || pathSegments[1]) : '';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-3 sm:px-6 shrink-0 transition-colors">
        {/* Left: Sidebar Toggle & AdminCN Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile drawer toggle */}
          <button
            type="button"
            onClick={onOpenMobileNav || handleToggle}
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D68904]"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={handleToggle}
            className="hidden lg:inline-flex p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D68904]"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          {/* Breadcrumb Context (AdminCN style) */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-900 transition-colors font-medium">
              Dashboard
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">
              {currentSectionLabel}
            </span>
            {subSection && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-slate-600 truncate">{subSection}</span>
              </>
            )}
          </nav>
        </div>

        {/* Center / Right: Quick Search + Notifications + UserProfile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/60 px-2.5 sm:px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D68904]"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline truncate">{t('search.placeholder', 'Quick search...')}</span>
            <kbd className="hidden lg:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
              /
            </kbd>
          </button>

          {/* Notifications dropdown */}
          <NotificationsDropdown />

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* User profile dropdown (AdminCN style) */}
          <UserProfileMenu />
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
