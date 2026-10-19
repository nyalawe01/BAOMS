import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();

  // Read initial preference from localStorage so user choice sticks across sessions and navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('baoms_sidebar_open');
      if (saved !== null) return saved === 'true';
    }
    // Default open on desktop screens (>=1024px), icon-rail collapsed on tablets/mobiles
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return true;
    }
    return false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-close mobile navigation drawer whenever route location changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // If user resizes to tablet/desktop breakpoint, automatically dismiss mobile drawer
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('baoms_sidebar_open', String(next));
      }
      return next;
    });
  };

  const handleToggleMobile = () => {
    setIsMobileOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f9fafb] text-[#1f2937] font-sans antialiased">
      {/* Sidebar: Fixed/docked on left running full height */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Workspace Column: Header at top, scrollable workspace below */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenMobileNav={handleToggleMobile}
        />

        {/* Content Workspace: 14px on mobile phones, 20px on tablets, 24px on laptops/desktops */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 min-w-0 bg-[#f9fafb]">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
