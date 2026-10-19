import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Briefcase,
  Wallet,
  Users,
  UserCog,
  Mail,
  BarChart3,
  ShoppingCart,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  Building2,
  Target,
  CheckSquare,
  ShieldCheck,
  UserPlus,
  Award,
  FolderOpen,
  Bell,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  AlertCircle,
  Activity,
  MapPin,
  Truck,
  Package,
  Scale,
} from 'lucide-react';
import { BentoDashboardIcon } from '@/components/icons/BentoDashboardIcon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  description?: string;
  icon: any;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, roles, isAdmin, hasRole, signOut } = useAuth();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const activeRole = roles[0] || 'project_coordinator';
  const isExpanded = isOpen;

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Staff Member';
  const roleDisplay = activeRole.replace(/_/g, ' ').toUpperCase();
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'ST';

  // Role-specific navigation sections
  const getRoleSections = (): NavSection[] => {
    // 1. System Administrator
    if (isAdmin() || activeRole === 'system_admin' || hasRole('system_admin')) {
      return [
        {
          heading: t('nav.section.overview', 'System Overview'),
          items: [
            { to: '/', label: t('nav.dashboard', 'System Console'), icon: BentoDashboardIcon },
          ],
        },
        {
          heading: t('nav.section.accessSecurity', 'Access, Roles & Staff'),
          items: [
            { to: '/users', label: t('nav.userAccounts', 'Staff Accounts & Roles'), icon: UserCog },
            { to: '/hr', label: t('nav.staffDirectory', 'Staff Directory & HR Records'), icon: Users },
          ],
        },
        {
          heading: t('nav.section.orgRecords', 'Organization & Governance'),
          items: [
            { to: '/organization', label: t('nav.departments', 'Organization Structure'), icon: Building2 },
            { to: '/documents', label: t('nav.documents', 'Document Registry & Storage'), icon: FileText },
          ],
        },
      ];
    }

    // 2. Executive Director
    if (activeRole === 'executive_director' || hasRole('executive_director')) {
      return [
        {
          heading: t('nav.section.executiveCommand', 'Executive Command'),
          items: [
            { to: '/', label: 'Dashboard', description: 'Organization-wide overview', icon: BentoDashboardIcon },
            { to: '/organization', label: 'Organization', description: 'Organizational profile, departments and structure', icon: Building2 },
            { to: '/projects', label: 'Projects & Programs', description: 'All projects, status and performance', icon: Briefcase },
            { to: '/finance', label: 'Finance', description: 'Budgets, expenditure and financial reports', icon: Wallet },
            { to: '/me-impact', label: 'M&E & Impact', description: 'Targets, indicators and beneficiary outcomes', icon: Target },
            { to: '/hr', label: 'Human Resources', description: 'Staff overview and workforce reports', icon: Users },
            { to: '/procurement', label: 'Procurement', description: 'Purchases, contracts and procurement status', icon: ShoppingCart },
            { to: '/approvals', label: 'Approvals', description: "Centralized decision inbox", icon: CheckSquare },
            { to: '/documents', label: 'Documents & Correspondence', description: 'Official records, letters and signatures', icon: FileText },
            { to: '/reports', label: 'Reports & Analytics', description: 'Consolidated reports and exports', icon: BarChart3 },
            { to: '/settings', label: 'Settings', description: 'Personal preferences and authorized settings', icon: Settings },
          ],
        },
      ];
    }

    // 3. Finance Officer
    if (activeRole === 'finance_officer' || hasRole('finance_officer')) {
      return [
        {
          heading: t('nav.section.financialOperations', 'Financial Operations'),
          items: [
            { to: '/', label: t('nav.financeDashboard', 'Dashboard'), icon: BentoDashboardIcon },
            { to: '/finance/budgets', label: t('nav.budgetsAllocations', 'Budgets & Allocations'), icon: Wallet },
            { to: '/finance/income', label: t('nav.incomeReceipts', 'Income & Receipts'), icon: Receipt },
            { to: '/finance/expenditure', label: t('nav.expenditurePayments', 'Expenditure & Payments'), icon: CreditCard },
            { to: '/finance/transactions', label: t('nav.financialTransactions', 'Financial Transactions'), icon: FileSpreadsheet },
            { to: '/finance/projects', label: t('nav.projectTracking', 'Project Financial Tracking'), icon: Briefcase },
            { to: '/finance/procurement', label: t('nav.procurementPayments', 'Procurement Payments'), icon: ShoppingCart },
            { to: '/finance/approvals', label: t('nav.financialApprovals', 'Financial Approvals'), icon: CheckSquare },
            { to: '/finance/documents', label: t('nav.financialDocuments', 'Financial Documents'), icon: FileText },
            { to: '/finance/reports', label: t('nav.financialReports', 'Financial Reports'), icon: BarChart3 },
            { to: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
            { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
          ],
        },
      ];
    }

    // 4. Project Manager
    if (activeRole === 'project_manager' || hasRole('project_manager')) {
      return [
        {
          heading: t('nav.section.portfolioDelivery', 'Portfolio & Delivery'),
          items: [
            { to: '/', label: t('nav.projectDashboard', 'Dashboard'), icon: BentoDashboardIcon },
            { to: '/projects', label: t('nav.myProjects', 'My Projects'), icon: Briefcase },
            { to: '/projects/planning', label: t('nav.projectPlanning', 'Project Planning'), icon: Calendar },
            { to: '/projects/activities', label: t('nav.workPlansActivities', 'Work Plans & Activities'), icon: CheckSquare },
            { to: '/projects/team', label: t('nav.projectTeam', 'Project Team'), icon: Users },
          ],
        },
        {
          heading: t('nav.section.impactAccountability', 'Impact & Accountability'),
          items: [
            { to: '/me', label: t('nav.monitoringEvaluation', 'Monitoring & Evaluation'), icon: Target },
            { to: '/projects/beneficiaries', label: t('nav.beneficiariesParticipants', 'Beneficiaries & Participants'), icon: Users },
            { to: '/projects/risks', label: t('nav.risksIssues', 'Risks & Issues'), icon: AlertCircle },
            { to: '/projects/budgets', label: t('nav.budgetsExpenditure', 'Budgets & Expenditure'), icon: Wallet },
            { to: '/projects/reports', label: t('nav.reportsDeliverables', 'Reports & Deliverables'), icon: BarChart3 },
            { to: '/projects/documents', label: t('nav.projectDocuments', 'Project Documents'), icon: FileText },
          ],
        },
        {
          heading: t('nav.section.governance', 'Governance & Preferences'),
          items: [
            { to: '/approvals', label: t('nav.approvalsRequests', 'Approvals & Requests'), icon: CheckSquare },
            { to: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
            { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
          ],
        },
      ];
    }

    // 5. Project Coordinator
    if (activeRole === 'project_coordinator' || hasRole('project_coordinator')) {
      return [
        {
          heading: t('nav.section.fieldOperations', 'Field Operations'),
          items: [
            { to: '/', label: t('nav.coordinatorDashboard', 'Dashboard'), icon: BentoDashboardIcon },
            { to: '/projects', label: t('nav.myProjects', 'My Projects'), icon: Briefcase },
            { to: '/projects/planning', label: t('nav.activitySchedule', 'Activity Schedule'), icon: Calendar },
            { to: '/projects/tasks', label: t('nav.taskManagement', 'Task Management'), icon: CheckSquare },
            { to: '/projects/activities', label: t('nav.activityImplementation', 'Activity Implementation'), icon: Activity },
          ],
        },
        {
          heading: t('nav.section.fieldReporting', 'Field Reporting & Data'),
          items: [
            { to: '/projects/beneficiaries', label: t('nav.beneficiariesParticipants', 'Beneficiaries & Participants'), icon: Users },
            { to: '/projects/field-updates', label: t('nav.fieldUpdates', 'Field Updates'), icon: MapPin },
            { to: '/me', label: t('nav.monitoringData', 'Monitoring Data'), icon: Target },
            { to: '/projects/reports', label: t('nav.activityReports', 'Activity Reports'), icon: BarChart3 },
            { to: '/projects/documents', label: t('nav.projectDocuments', 'Project Documents'), icon: FolderOpen },
          ],
        },
        {
          heading: t('nav.section.coordinationIssues', 'Coordination & Requests'),
          items: [
            { to: '/projects/risks', label: t('nav.requestsIssues', 'Requests & Issues'), icon: AlertCircle },
            { to: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
            { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
          ],
        },
      ];
    }

    // 6. HR Administrator
    if (activeRole === 'hr_administrator' || hasRole('hr_administrator')) {
      return [
        {
          heading: t('nav.section.hrOperations', 'Workforce Administration'),
          items: [
            { to: '/', label: t('nav.dashboard', 'Dashboard'), icon: BentoDashboardIcon },
            { to: '/hr', label: t('nav.staffDirectory', 'Staff Directory'), icon: Users },
            { to: '/hr/departments', label: t('nav.departments', 'Departments & Positions'), icon: Building2 },
            { to: '/hr/onboarding', label: t('nav.recruitmentOnboarding', 'Recruitment & Onboarding'), icon: UserPlus },
            { to: '/hr/leave', label: t('nav.attendanceLeave', 'Attendance & Leave'), icon: Calendar },
            { to: '/hr/contracts', label: t('nav.contractsEmployment', 'Contracts & Employment'), icon: FileText },
            { to: '/hr/documents', label: t('nav.hrDocuments', 'HR Documents'), icon: FolderOpen },
            { to: '/hr/approvals', label: t('nav.hrApprovals', 'HR Requests & Approvals'), icon: CheckSquare },
            { to: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
            { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
          ],
        },
      ];
    }

    // 7. Procurement Officer
    if (activeRole === 'procurement_officer' || hasRole('procurement_officer')) {
      return [
        {
          heading: t('nav.section.procurementCommand', 'Procurement & Supply Chain'),
          items: [
            { to: '/', label: t('nav.procurementDashboard', 'Dashboard'), icon: BentoDashboardIcon },
            { to: '/procurement/requests', label: t('nav.purchaseRequests', 'Purchase Requests'), icon: FileText },
            { to: '/procurement/plans', label: t('nav.procurementPlans', 'Procurement Plans'), icon: Calendar },
            { to: '/procurement/quotations', label: t('nav.quotationManagement', 'Quotation Management'), icon: FileSpreadsheet },
            { to: '/procurement/vendors', label: t('nav.supplierRegister', 'Supplier Register'), icon: Building2 },
            { to: '/procurement/orders', label: t('nav.purchaseOrders', 'Purchase Orders'), icon: ShoppingCart },
            { to: '/procurement/receiving', label: t('nav.receiving', 'Goods & Services Receiving'), icon: Truck },
            { to: '/procurement/inventory', label: t('nav.inventorySupplies', 'Inventory & Supplies'), icon: Package },
            { to: '/procurement/evaluation', label: t('nav.procurementEvaluation', 'Procurement Evaluation'), icon: Scale },
            { to: '/procurement/approvals', label: t('nav.procurementApprovals', 'Procurement Approvals'), icon: ShieldCheck },
            { to: '/procurement/invoices', label: t('nav.invoicesHandover', 'Invoices & Payment Handover'), icon: Receipt },
            { to: '/procurement/documents', label: t('nav.procurementDocuments', 'Procurement Documents'), icon: FolderOpen },
            { to: '/procurement/reports', label: t('nav.procurementReports', 'Procurement Reports'), icon: BarChart3 },
            { to: '/notifications', label: t('nav.notifications', 'Notifications'), icon: Bell },
            { to: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
          ],
        },
      ];
    }

    // 8. Monitoring and Evaluation (M&E) Officer
    if (activeRole === 'me_officer' || hasRole('me_officer')) {
      return [
        {
          heading: t('nav.section.meCommand', 'M&E Results & Indicators'),
          items: [
            { to: '/', label: t('nav.meDashboard', 'M&E Performance Dashboard'), icon: BentoDashboardIcon },
            { to: '/projects', label: t('nav.projectMonitoring', 'Project Monitoring & Targets'), icon: Briefcase },
          ],
        },
        {
          heading: t('nav.section.dataQuality', 'Verification & Quality Control'),
          items: [
            { to: '/documents', label: t('nav.activityEvidence', 'Activity Evidence & Field Reports'), icon: FileText },
            { to: '/reports', label: t('nav.donorReports', 'Donor & Impact Reports'), icon: BarChart3 },
          ],
        },
        {
          heading: t('nav.section.fieldReviews', 'Field Communications'),
          items: [
            { to: '/correspondence', label: t('nav.officialLetters', 'Official Correspondence'), icon: Mail },
          ],
        },
      ];
    }

    // Default Fallback
    return [
      {
        heading: t('nav.section.main', 'General Navigation'),
        items: [
          { to: '/', label: t('nav.dashboard', 'Dashboard'), icon: BentoDashboardIcon },
          { to: '/projects', label: t('nav.projects', 'Projects & Programs'), icon: Briefcase },
          { to: '/documents', label: t('nav.documents', 'Documents & Records'), icon: FileText },
          { to: '/reports', label: t('nav.reports', 'Reports & Analytics'), icon: BarChart3 },
        ],
      },
    ];
  };

  const allSections = getRoleSections();

  const navItems = React.useMemo(() => {
    const items = allSections.flatMap((s) => s.items);
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = `${item.to}|${item.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allSections]);

  const handleSignOutConfirm = async () => {
    setShowSignOutDialog(false);
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onMobileClose || onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Collapsible / Icon-Rail Sidebar */}
      <aside
        id="sidebar"
        aria-label="Application Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 md:static md:z-auto h-full bg-white border-r border-surface-border flex flex-col shrink-0 select-none',
          'transition-[width,transform] duration-240 ease-[cubic-bezier(0.23,1,0.32,1)]',
          // Mobile state: slide in/out
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          // Desktop state: expanded (w-64) or collapsed icon-rail (w-[68px])
          isExpanded ? 'md:w-64' : 'md:w-[68px]'
        )}
      >
        {/* Top Header: Brand Identity & Toggle Button */}
        <div className="h-14 sm:h-16 border-b border-surface-border flex items-center justify-between px-3.5 bg-white shrink-0">
          {isExpanded ? (
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo.png" alt="BAOMS" className="h-7 w-7 object-contain shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900 block truncate">
                    BAOMS
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-charcoal-600 px-1.5 py-0.2 rounded border border-surface-border block truncate max-w-[120px]">
                    {activeRole.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Collapse sidebar (show icons only)"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-10 h-10 rounded-lg bg-amber-500/10 text-[#D68904] hover:bg-amber-500/20 flex items-center justify-center font-bold text-sm transition-all group"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <img src="/logo.png" alt="BAOMS" className="h-5 w-5 object-contain group-hover:scale-105 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Items (Clean Nav Links Only - No Category Titles) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sidebar-nav">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    end={true}
                    title={item.label}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-md transition-all duration-150 group select-none relative',
                        isExpanded
                          ? 'w-full px-3 py-2 gap-3 text-xs sm:text-sm font-medium'
                          : 'w-10 h-10 mx-auto justify-center p-0',
                        isActive
                          ? 'bg-amber-500/10 text-charcoal-900 font-semibold border-l-2 border-[#D68904]'
                          : 'text-charcoal-muted hover:bg-slate-50 hover:text-charcoal-900 border-l-2 border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Restrained monochrome icon (never colored tiles or borders) */}
                        <Icon
                          className={cn(
                            'w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-105',
                            isActive ? 'text-[#111827]' : 'text-[#4B5563] group-hover:text-[#111827]'
                          )}
                        />

                        {/* Label and description displayed when expanded */}
                        {isExpanded && (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span
                              className={cn(
                                'truncate text-xs',
                                isActive
                                  ? 'font-semibold text-charcoal-900'
                                  : 'font-medium text-charcoal-muted group-hover:text-charcoal-900'
                              )}
                            >
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-[10px] text-slate-400 truncate leading-tight group-hover:text-slate-500">
                                {item.description}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sidebar Footer: Interactive Profile & Settings Controls */}
        <div className="border-t border-surface-border bg-slate-50/70 p-2 shrink-0">
          {isExpanded ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-surface-border">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:opacity-85 transition-opacity"
                title="View My Profile"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-charcoal-900 leading-tight block truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#D68904] font-medium leading-tight block truncate">
                    {roleDisplay}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="System Settings"
                  aria-label="System Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignOutDialog(true)}
                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:border-slate-300 transition-all"
                title={`Profile: ${displayName} (${roleDisplay})`}
                aria-label="My Profile"
              >
                {initials}
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                title="System Settings"
                aria-label="System Settings"
              >
                <Settings className="w-[20px] h-[20px]" />
              </button>
              <button
                type="button"
                onClick={() => setShowSignOutDialog(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-[20px] h-[20px]" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showSignOutDialog}
        title="Sign Out from BAOMS"
        message="Are you sure you want to end your current session? You will be redirected to the sign-in screen."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleSignOutConfirm}
        onClose={() => setShowSignOutDialog(false)}
      />
    </>
  );
};
