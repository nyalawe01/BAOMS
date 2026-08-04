import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, LogOut, ChevronDown, CheckCircle2, PanelLeft } from 'lucide-react';
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
      case 'hr_reports': return 'Staff Report Submissions';
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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 select-none shrink-0">
      {/* View Title & Sidebar Trigger */}
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          title={collapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          <PanelLeft size={20} className="text-slate-600" />
        </button>

        <h2 className="text-base font-bold text-slate-800 tracking-tight">{getTitle()}</h2>
        
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={10} />
          <span>System Online</span>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        {/* Global Search */}
        <GlobalSearch onNavigate={setActiveTab} role={user.role} />

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-slate-500 text-xs">
          <Calendar size={14} />
          <span>{currentDate}</span>
        </div>

        {/* Notifications */}
        <NotificationCenter onNavigate={setActiveTab} />

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors text-left"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user.email}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay Backdrop to close */}
              <div
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setDropdownOpen(false)}
              ></div>

              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Access Scope</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{user.role} Authorization</p>
                </div>
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left font-semibold"
                >
                  <LogOut size={16} />
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
