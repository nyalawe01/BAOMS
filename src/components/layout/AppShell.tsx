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

  const [isMobileOpen, setIsMobileOpen] = useState(false);

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

        {/* Content Workspace: 24px padding on desktop, clean max-w-7xl, no jump */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 min-w-0 bg-[#f9fafb]">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
