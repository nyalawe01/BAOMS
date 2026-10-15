import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  // Read initial preference from localStorage so user choice sticks across sessions and navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('baoms_sidebar_open');
      if (saved !== null) return saved === 'true';
    }
    // Default open on desktop screens, closed on smaller devices
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return true;
    }
    return false;
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('baoms_sidebar_open', String(next));
      }
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('baoms_sidebar_open', 'false');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-bg text-charcoal">
      {/* Top Header Navigation - Fixed height, spans full width, stable hamburger anchor */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        onOpenSidebar={handleToggleSidebar}
        onOpenMobileNav={handleToggleSidebar}
      />

      {/* Main Workspace: Left Sticky In-flow Docked Sidebar + Right Scrollable Main Content */}
      <div className="flex flex-1 overflow-hidden min-w-0">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          onToggleCollapse={handleToggleSidebar}
          isMobileOpen={isSidebarOpen}
          onMobileClose={handleCloseSidebar}
        />

        {/* Content Workspace - Smoothly adjusts evenly when sidebar expands or collapses */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-slate-50/70 min-w-0 transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
