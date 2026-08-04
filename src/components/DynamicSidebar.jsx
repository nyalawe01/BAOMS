import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, LogOut, ShieldAlert, User, Send, Shield, Activity,
  Users, FileText, FileSpreadsheet, Layers, Briefcase, Calendar,
  MessageSquare, Radio, Clock, ChevronLeft, ChevronRight, Plus, BookOpen, Clipboard,
  Settings, DollarSign, Bell, TrendingUp, Check, Package, MapPin, FileClock,
  Inbox, Contact
} from 'lucide-react';

export default function DynamicSidebar({ activeTab, setActiveTab, collapsed, mobileOpen, onNavigate }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Build menu items based on role
  let menuItems = [];

  if (user.role === 'HR Officer') {
    menuItems = [
      { id: 'hr_home', label: 'Home', icon: LayoutDashboard },
      { id: 'hr_staff', label: 'Staff', icon: Users },
      { id: 'hr_add_staff', label: 'Add Staff', icon: Plus },
      { id: 'hr_requests', label: 'Requests', icon: Send },
      { id: 'hr_projects', label: 'Projects', icon: FileText },
      { id: 'hr_departments', label: 'Departments', icon: Briefcase },
      { id: 'hr_payrolls', label: 'Payrolls', icon: FileSpreadsheet },
      { id: 'hr_leave', label: 'Leave Management', icon: Calendar },
      { id: 'hr_documents', label: 'Documents', icon: BookOpen },
      { id: 'hr_settings', label: 'Settings', icon: Shield },
      { id: 'approvals', label: 'Approval Inbox', icon: Inbox },
      { id: 'directory', label: 'Directory', icon: Contact },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else if (user.role === 'Project Manager') {
    menuItems = [
      { id: 'pm_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pm_projects', label: 'Projects', icon: Briefcase },
      { id: 'pm_team', label: 'Team Members', icon: Users },
      { id: 'pm_budget', label: 'Budget & Finance', icon: DollarSign },
      { id: 'pm_resources', label: 'Resources', icon: Layers },
      { id: 'pm_documents', label: 'Documents', icon: BookOpen },
      { id: 'pm_me', label: 'Monitoring & Evaluation', icon: Activity },
      { id: 'pm_notifications', label: 'Notifications', icon: Bell },
      { id: 'pm_settings', label: 'Settings', icon: Settings },
      { id: 'approvals', label: 'Approval Inbox', icon: Inbox },
      { id: 'directory', label: 'Directory', icon: Contact },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else if (user.role === 'Finance Officer') {
    menuItems = [
      { id: 'fin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'fin_transactions', label: 'Transactions', icon: FileSpreadsheet },
      { id: 'fin_income', label: 'Income', icon: TrendingUp },
      { id: 'fin_expenses', label: 'Expenses', icon: FileText },
      { id: 'fin_accounts', label: 'Accounts', icon: Layers },
      { id: 'fin_projects', label: 'Projects', icon: Briefcase },
      { id: 'fin_budgets', label: 'Budgets', icon: Clipboard },
      { id: 'fin_payroll', label: 'Payroll', icon: Users },
      { id: 'fin_invoices', label: 'Invoices', icon: FileText },
      { id: 'fin_approvals', label: 'Approvals', icon: Check },
      { id: 'fin_settings', label: 'Settings', icon: Settings },
      { id: 'approvals', label: 'Approval Inbox', icon: Inbox },
      { id: 'directory', label: 'Directory', icon: Contact },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else if (user.role === 'System Administrator' || user.role === 'Administrator') {
    menuItems = [
      { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'admin_organization', label: 'Organization', icon: Activity },
      { id: 'admin_projects', label: 'Projects', icon: Briefcase },
      { id: 'admin_finance', label: 'Finance', icon: FileSpreadsheet },
      { id: 'admin_hr', label: 'Human Resources', icon: Users },
      { id: 'admin_beneficiaries', label: 'Beneficiaries', icon: User },
      { id: 'admin_me', label: 'Monitoring & Evaluation', icon: Clipboard },
      { id: 'admin_events', label: 'Events', icon: Calendar },
      { id: 'admin_inventory', label: 'Inventory', icon: Package },
      { id: 'admin_comms', label: 'Communications', icon: MessageSquare },
      { id: 'admin_documents', label: 'Documents', icon: BookOpen },
      { id: 'admin_settings', label: 'Settings', icon: Settings },
      { id: 'admin_logs', label: 'Audit Logs', icon: FileClock },
      { id: 'approvals', label: 'Approval Inbox', icon: Inbox },
      { id: 'directory', label: 'Directory', icon: Contact },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else if (user.role === 'M&E Officer' || user.role === 'Monitoring & Evaluation Officer') {
    menuItems = [
      { id: 'me_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'me_projects', label: 'Projects', icon: Briefcase },
      { id: 'me_indicators', label: 'Indicators', icon: Activity },
      { id: 'me_targets', label: 'Targets', icon: Clipboard },
      { id: 'me_beneficiaries', label: 'Beneficiaries', icon: Users },
      { id: 'me_collection', label: 'Data Collection', icon: Layers },
      { id: 'me_surveys', label: 'Surveys', icon: Clipboard },
      { id: 'me_visits', label: 'Field Visits', icon: MapPin },
      { id: 'me_quality', label: 'Data Quality', icon: ShieldAlert },
      { id: 'me_maps', label: 'Maps', icon: MapPin },
      { id: 'me_analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'me_documents', label: 'Documents', icon: BookOpen },
      { id: 'me_settings', label: 'Settings', icon: Settings },
      { id: 'approvals', label: 'Approval Inbox', icon: Inbox },
      { id: 'directory', label: 'Directory', icon: Contact },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  } else {
    menuItems = [
      {
        id: 'profile',
        label: 'Baseline Profile',
        icon: User,
        roles: ['*']
      },
      {
        id: 'request',
        label: 'Request Center',
        icon: Send,
        roles: ['*']
      },
      {
        id: 'overview',
        label: 'System Overview',
        icon: LayoutDashboard,
        roles: ['System Administrator', 'Executive Director', 'Project Manager', 'Finance Officer', 'Procurement & Logistics Officer', 'Department Head', 'Program Officer', 'Communications Officer', 'Field Officer', 'Volunteer', 'Intern']
      },
      {
        id: 'approvals',
        label: 'Approval Inbox',
        icon: Inbox,
        roles: ['*']
      },
      {
        id: 'directory',
        label: 'Directory',
        icon: Contact,
        roles: ['*']
      },
      {
        id: 'admin_panel',
        label: 'Admin Console',
        icon: Shield,
        roles: ['System Administrator']
      },
      {
        id: 'director_panel',
        label: 'ED Dashboard',
        icon: Activity,
        roles: ['Executive Director']
      },
      {
        id: 'pm_panel',
        label: 'Project Workspaces',
        icon: FileText,
        roles: ['Project Manager']
      },
      {
        id: 'finance_panel',
        label: 'Financial Ledgers',
        icon: FileSpreadsheet,
        roles: ['Finance Officer']
      },
      {
        id: 'procurement_panel',
        label: 'Asset & Orders',
        icon: Layers,
        roles: ['Procurement & Logistics Officer']
      },
      {
        id: 'dept_head_panel',
        label: 'Department Hub',
        icon: Briefcase,
        roles: ['Department Head']
      },
      {
        id: 'program_panel',
        label: 'Program Reporting',
        icon: Calendar,
        roles: ['Program Officer']
      },
      {
        id: 'comms_panel',
        label: 'Communications',
        icon: MessageSquare,
        roles: ['Communications Officer']
      },
      {
        id: 'field_panel',
        label: 'Field Surveys',
        icon: Radio,
        roles: ['Field Officer']
      },
      {
        id: 'volunteer_panel',
        label: 'Simplified Logger',
        icon: Clock,
        roles: ['Volunteer', 'Intern']
      }
    ].filter(item => item.roles.includes('*') || item.roles.includes(user.role));
  }

  const handleNavigate = (id) => {
    setActiveTab(id);
    // Below lg the sidebar is an overlay drawer - close it once a
    // destination is picked so it doesn't cover the page it just opened.
    onNavigate?.();
  };

  // Collapsed-rail mode only applies at lg+ (a touch drawer should never be
  // icon-only); `lg:` prefixed classes below drive that, not JS branching,
  // so the same markup renders correctly at every breakpoint.
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-80
        lg:static lg:z-0 ${collapsed ? 'lg:w-24' : 'lg:w-80'}
        bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800
        transform transition-transform duration-300 lg:transform-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        select-none shrink-0
      `}
    >
      {/* Brand Header (Balanced & Centered) */}
      <div className={`h-16 flex items-center gap-3 border-b border-slate-800 shrink-0 px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
        <div className="p-2 bg-indigo-650 rounded-lg text-white shrink-0">
          <ShieldAlert size={18} className="animate-pulse" />
        </div>
        <div className={collapsed ? 'lg:hidden' : ''}>
          <h1 className="font-extrabold text-base leading-none tracking-tight text-slate-100">BAOMS Portal</h1>
          <span className="text-sm text-slate-400">Org Management</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto no-scrollbar px-3 ${collapsed ? 'lg:px-2' : ''}`}>
        {/* Navigation Group Header (hidden in the collapsed desktop rail) */}
        <div className={`px-3 mb-3 ${collapsed ? 'lg:hidden' : ''}`}>
          <span className="text-sm font-bold text-slate-500 uppercase tracking-widest block">
            {user.role === 'HR Officer' ? 'HR Console' : 'Navigation'}
          </span>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3.5 py-3 px-4 rounded-lg text-base font-medium transition-all duration-150 text-left ${
                collapsed ? 'lg:w-12 lg:h-12 lg:mx-auto lg:justify-center lg:px-0 lg:py-0' : ''
              } ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon size={19} className="shrink-0" />
              <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Action (Balanced & Centered) */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={logout}
          title="Log Out"
          className={`w-full flex items-center gap-3.5 py-3 px-4 rounded-lg text-base font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left ${
            collapsed ? 'lg:w-12 lg:h-12 lg:mx-auto lg:justify-center lg:px-0 lg:py-0' : ''
          }`}
        >
          <LogOut size={19} className="shrink-0" />
          <span className={collapsed ? 'lg:hidden' : ''}>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
