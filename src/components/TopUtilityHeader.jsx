import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, LogOut, ChevronDown, CheckCircle2, PanelLeft, User } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';

export default function TopUtilityHeader({ activeTab, setActiveTab, toggleSidebar, collapsed }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const getTitle = () => {
    switch (activeTab) {
      // HR Officer tabs
      case 'hr_home': return 'HR Command Center';
      case 'hr_staff': return 'Staff Directory';
      case 'hr_add_staff': return 'Onboard New Staff';
      case 'hr_requests': return 'Staff Requests & Directives';
      case 'hr_projects': return 'Project Resource Assignments';
      case 'hr_departments': return 'Departments & Hierarchies';
      case 'hr_payrolls': return 'Workforce Payroll Ledgers';
      case 'hr_leave': return 'Leave Management Timeline';
      case 'hr_documents': return 'Policy Vault';
      case 'hr_settings': return 'System Settings';
      
      // Standard tabs
      case 'overview': return 'Overview Dashboard';
      case 'projects': return 'Project & Task Management';
      case 'users': return 'User Access & Directory';
      case 'profile': return 'Baseline Profile';
      case 'request': return 'Request Center';
      case 'approvals': return 'Approval Inbox';
      case 'directory': return 'Organization Directory';
      default: return 'Management Portal';
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 select-none shrink-0 gap-3">
      {/* View Title & Sidebar Trigger */}
      <div className="flex items-center gap-2 sm:gap-5 min-w-0">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 shrink-0"
          title={collapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          <PanelLeft size={22} className="text-slate-600" />
        </button>

        <h2 className="text-lg font-bold text-slate-800 tracking-tight truncate">{getTitle()}</h2>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <CheckCircle2 size={12} />
          <span>System Online</span>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
        {/* Global Search */}
        <div className="hidden sm:block">
          <GlobalSearch onNavigate={setActiveTab} role={user.role} />
        </div>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-slate-500 text-base">
          <Calendar size={16} />
          <span>{currentDate}</span>
        </div>

        {/* Notifications */}
        <NotificationCenter onNavigate={setActiveTab} />

        {/* Vertical Divider */}
        <div className="hidden sm:block h-7 w-px bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors text-left"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm shrink-0">
                {user.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-base font-semibold text-slate-800 leading-none">{user.name}</p>
              <p className="text-sm text-slate-500 mt-1">{user.email}</p>
            </div>
            <ChevronDown size={16} className={`hidden sm:block text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay Backdrop to close */}
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setDropdownOpen(false)}
              ></div>

              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Access Scope</p>
                  <p className="text-base font-semibold text-slate-700 mt-1">{user.role} Authorization</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveTab('profile');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-base text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium"
                >
                  <User size={17} />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-base text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left font-semibold"
                >
                  <LogOut size={17} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
