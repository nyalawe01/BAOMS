import React, { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, CheckSquare, Users, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

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
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 pb-20 md:pb-6 min-w-0 bg-[#f9fafb]">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Persistent Thumb Navigation on Phones) */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-[#D68904] font-bold bg-amber-500/10'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Console</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-[#D68904] font-bold bg-amber-500/10'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <Briefcase className="w-4 h-4" />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/approvals"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-[#D68904] font-bold bg-amber-500/10'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <CheckSquare className="w-4 h-4" />
            <span>Approvals</span>
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-[#D68904] font-bold bg-amber-500/10'
                  : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <Users className="w-4 h-4" />
            <span>Staff</span>
          </NavLink>

          <button
            type="button"
            onClick={handleToggleMobile}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            aria-label="Open full navigation drawer"
          >
            <div className="w-6 h-4 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <Menu className="w-3.5 h-3.5" />
            </div>
            <span>All Menus</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
