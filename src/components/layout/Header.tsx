import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { Search, ChevronRight, Menu, PanelLeft } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';
import { GlobalSearchModal } from './GlobalSearchModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserProfileMenu } from './UserProfileMenu';

interface HeaderProps {
  onOpenSidebar?: () => void;
  onOpenMobileNav?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Overview',
  'organization': 'Organization',
  'projects': 'Projects & Programs',
  'finance': 'Finance',
  'procurement': 'Procurement',
  'me-impact': 'M&E & Impact',
  'me': 'Monitoring & Evaluation',
  'hr': 'Human Resources',
  'approvals': 'Approvals',
  'documents': 'Documents & Correspondence',
  'correspondence': 'Official Correspondence',
  'reports': 'Reports & Analytics',
  'users': 'Staff & Accounts',
  'settings': 'Settings',
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
        {/* Left: Sidebar toggle control & Breadcrumbs */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200/90 md:hidden transition-colors shrink-0 shadow-2xs"
            aria-label="Open navigation menu"
            title="Open Navigation Menu"
          >
            <Menu className="h-4 w-4 text-slate-800 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">Menu</span>
          </button>

          {/* Desktop collapse toggle */}
          {handleToggle && (
            <button
              type="button"
              onClick={handleToggle}
              className="hidden md:flex p-1.5 rounded-md text-[#374151] hover:text-[#111827] hover:bg-slate-100 transition-colors"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-label="Toggle sidebar width"
            >
              <PanelLeft className="h-4 w-4 text-[#374151]" />
            </button>
          )}

          <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 text-xs text-slate-500 min-w-0">
            <Link to="/" className="hover:text-slate-900 transition-colors font-medium hidden sm:inline">
              Dashboard
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 hidden sm:inline" />
            <span className="font-semibold text-slate-900 truncate max-w-[110px] sm:max-w-[180px] md:max-w-none">
              {currentSectionLabel}
            </span>
            {subSection && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-slate-600 truncate max-w-[80px] sm:max-w-[140px] md:max-w-none">{subSection}</span>
              </>
            )}
          </nav>
        </div>

        {/* Center / Right: Quick Search + LanguageSwitch + Notifications + UserProfile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-2 sm:px-3 sm:py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D68904]"
            aria-label="Search"
            title="Search (Press / to focus)"
          >
            <Search className="h-3.5 w-3.5 text-[#374151]" />
            <span className="hidden md:inline truncate">{t('search.placeholder', 'Quick search...')}</span>
            <kbd className="hidden lg:inline-block rounded border border-slate-200 bg-white px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
              /
            </kbd>
          </button>

          {/* Bilingual Switcher */}
          <LanguageSwitcher />

          {/* Notifications dropdown */}
          <NotificationsDropdown />

          {/* User Profile Menu */}
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
