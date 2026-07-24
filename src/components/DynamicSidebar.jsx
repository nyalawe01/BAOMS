import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, LogOut, ShieldAlert, User, Send, Shield, Activity, 
  Users, FileText, FileSpreadsheet, Layers, Briefcase, Calendar, 
  MessageSquare, Radio, Clock, ChevronLeft, ChevronRight, Plus, BookOpen, Clipboard,
  Settings, DollarSign, Bell, TrendingUp, Check, Package, MapPin, FileClock
} from 'lucide-react';

export default function DynamicSidebar({ activeTab, setActiveTab, collapsed }) {
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
      { id: 'hr_reports', label: 'Reports', icon: Clipboard },
      { id: 'hr_documents', label: 'Documents', icon: BookOpen },
      { id: 'hr_settings', label: 'Settings', icon: Shield }
    ];
  } else if (user.role === 'Project Manager') {
    menuItems = [
      { id: 'pm_dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pm_projects', label: 'Projects', icon: Briefcase },
      { id: 'pm_team', label: 'Team Members', icon: Users },
      { id: 'pm_budget', label: 'Budget & Finance', icon: DollarSign },
      { id: 'pm_resources', label: 'Resources', icon: Layers },
      { id: 'pm_documents', label: 'Documents', icon: BookOpen },
      { id: 'pm_reports', label: 'Reports', icon: FileText },
      { id: 'pm_me', label: 'Monitoring & Evaluation', icon: Activity },
      { id: 'pm_notifications', label: 'Notifications', icon: Bell },
      { id: 'pm_settings', label: 'Settings', icon: Settings },
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
      { id: 'fin_vendors', label: 'Vendors', icon: Users },
      { id: 'fin_donors', label: 'Customers / Donors', icon: Users },
      { id: 'fin_reports', label: 'Reports', icon: FileText },
      { id: 'fin_assets', label: 'Assets', icon: Package },
      { id: 'fin_loans', label: 'Loans', icon: Layers },
      { id: 'fin_taxes', label: 'Taxes', icon: Shield },
      { id: 'fin_approvals', label: 'Approvals', icon: Check },
      { id: 'fin_settings', label: 'Settings', icon: Settings },
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
      { id: 'admin_reports', label: 'Reports', icon: FileText },
      { id: 'admin_settings', label: 'Settings', icon: Settings },
      { id: 'admin_logs', label: 'Audit Logs', icon: FileClock },
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
      { id: 'me_reports', label: 'Reports', icon: FileText },
      { id: 'me_quality', label: 'Data Quality', icon: ShieldAlert },
      { id: 'me_maps', label: 'Maps', icon: MapPin },
      { id: 'me_analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'me_documents', label: 'Documents', icon: BookOpen },
      { id: 'me_settings', label: 'Settings', icon: Settings },
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

  return (
    <aside className={`bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800 transition-all duration-300 select-none shrink-0 ${collapsed ? 'w-20' : 'w-60'}`}>
      {/* Brand Header (Balanced & Centered) */}
      {collapsed ? (
        <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0">
          <div className="p-2 bg-indigo-650 rounded-lg text-white shrink-0">
            <ShieldAlert size={18} className="animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 shrink-0">
          <div className="p-2 bg-indigo-650 rounded-lg text-white shrink-0">
            <ShieldAlert size={18} className="animate-pulse" />
          </div>
          <div className="animate-fadeIn">
            <h1 className="font-extrabold text-[13px] leading-none tracking-tight text-slate-100">BAOMS Portal</h1>
            <span className="text-[9px] text-slate-400">Org Management</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto no-scrollbar ${collapsed ? 'px-2' : 'px-3'}`}>
        {/* Navigation Group Header (Optional label in expanded state) */}
        {!collapsed && (
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              {user.role === 'HR Officer' ? 'HR Console' : 'Navigation'}
            </span>
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (collapsed) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
                title={item.label}
              >
                <Icon size={16} className="shrink-0" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Action (Balanced & Centered) */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        {collapsed ? (
          <button
            onClick={logout}
            className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} className="shrink-0" />
          </button>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 py-2.5 px-4 rounded-lg text-[13px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
          >
            <LogOut size={16} className="shrink-0" />
            <span>Log Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
