import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
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
} from 'lucide-react';
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
  icon: any;
  badge?: string;
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
            { to: '/', label: t('nav.dashboard', 'System Console'), icon: LayoutDashboard },
          ],
        },
        {
          heading: t('nav.section.accessSecurity', 'Access & Security'),
          items: [
            { to: '/users', label: t('nav.userAccounts', 'Users & Accounts'), icon: UserCog, badge: 'Admin' },
          ],
        },
        {
          heading: t('nav.section.orgRecords', 'Organization & Records'),
          items: [
            { to: '/hr', label: t('nav.departments', 'Organization Structure'), icon: Users },
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
            { to: '/', label: t('nav.executiveDashboard', 'Executive Dashboard'), icon: LayoutDashboard },
            { to: '/projects', label: t('nav.projectPortfolio', 'Project Portfolio'), icon: Briefcase },
            { to: '/correspondence', label: t('nav.officialLetters', 'Official Correspondence'), icon: Mail },
          ],
        },
        {
          heading: t('nav.section.approvalsDecisions', 'Approvals & Oversight'),
          items: [
            { to: '/finance', label: t('nav.financialApprovals', 'Financial Approvals'), icon: Wallet, badge: 'Finance' },
            { to: '/documents', label: t('nav.documentsSign', 'Documents & Signatures'), icon: FileText },
            { to: '/procurement', label: t('nav.procurement', 'Procurement & Logistics'), icon: ShoppingCart },
          ],
        },
        {
          heading: t('nav.section.strategicOversight', 'Institutional Performance'),
          items: [
            { to: '/reports', label: t('nav.reports', 'Organization-wide Reports'), icon: BarChart3 },
            { to: '/hr', label: t('nav.staffDirectory', 'Staff Directory'), icon: Users },
          ],
        },
      ];
    }

    // 3. Finance Officer
    if (activeRole === 'finance_officer' || hasRole('finance_officer')) {
      return [
        {
          heading: t('nav.section.financialCommand', 'Financial Command'),
          items: [
            { to: '/', label: t('nav.financeDashboard', 'Finance Dashboard'), icon: LayoutDashboard },
            { to: '/finance', label: t('nav.budgetsLedger', 'Budgets & Financial Ledger'), icon: Wallet },
          ],
        },
        {
          heading: t('nav.section.operations', 'Operations & Procurement'),
          items: [
            { to: '/procurement', label: t('nav.procurement', 'Procurement & Supplies'), icon: ShoppingCart },
            { to: '/documents', label: t('nav.supportingDocs', 'Supporting Financial Docs'), icon: FileText },
          ],
        },
        {
          heading: t('nav.section.compliance', 'Compliance & Audits'),
          items: [
            { to: '/reports', label: t('nav.financialReports', 'Financial Reports & Audits'), icon: BarChart3 },
            { to: '/correspondence', label: t('nav.financialLetters', 'Financial Correspondence'), icon: Mail },
          ],
        },
      ];
    }

    // 4. Project Manager
    if (activeRole === 'project_manager' || hasRole('project_manager')) {
      return [
        {
          heading: t('nav.section.projectManagement', 'Project Management'),
          items: [
            { to: '/', label: t('nav.projectDashboard', 'Project Dashboard'), icon: LayoutDashboard },
            { to: '/projects', label: t('nav.myProjects', 'Projects & Programs'), icon: Briefcase },
          ],
        },
        {
          heading: t('nav.section.trackingDelivery', 'Delivery & Documentation'),
          items: [
            { to: '/documents', label: t('nav.projectDocs', 'Project Documents & Evidence'), icon: FileText },
            { to: '/reports', label: t('nav.progressReports', 'Progress Reports & Analytics'), icon: BarChart3 },
            { to: '/correspondence', label: t('nav.officialLetters', 'Official Correspondence'), icon: Mail },
          ],
        },
        {
          heading: t('nav.section.resources', 'Resources & Procurement'),
          items: [
            { to: '/finance', label: t('nav.projectBudgets', 'Budget & Expenditure'), icon: Wallet },
            { to: '/procurement', label: t('nav.procurement', 'Procurement & Supplies'), icon: ShoppingCart },
          ],
        },
      ];
    }

    // 5. Project Coordinator
    if (activeRole === 'project_coordinator' || hasRole('project_coordinator')) {
      return [
        {
          heading: t('nav.section.fieldCoordination', 'Field Operations Desk'),
          items: [
            { to: '/', label: t('nav.coordinatorDashboard', 'Coordinator Dashboard'), icon: LayoutDashboard },
            { to: '/projects', label: t('nav.assignedProjects', 'Assigned Field Projects'), icon: Briefcase },
          ],
        },
        {
          heading: t('nav.section.documentation', 'Tasks & Documentation'),
          items: [
            { to: '/documents', label: t('nav.evidenceUploads', 'Evidence & Photo Uploads'), icon: FileText },
          ],
        },
        {
          heading: t('nav.section.teamDirectory', 'Team & Communications'),
          items: [
            { to: '/hr', label: t('nav.teamDirectory', 'Team Contacts Directory'), icon: Users },
            { to: '/correspondence', label: t('nav.letters', 'Official Correspondence'), icon: Mail },
          ],
        },
      ];
    }

    // 6. HR Administrator
    if (activeRole === 'hr_administrator' || hasRole('hr_administrator')) {
      return [
        {
          heading: t('nav.section.hrCommand', 'HR & Personnel Command'),
          items: [
            { to: '/', label: t('nav.hrDashboard', 'HR Dashboard'), icon: LayoutDashboard },
            { to: '/hr', label: t('nav.staffRoster', 'Staff Directory & Contracts'), icon: Users, badge: 'HR' },
          ],
        },
        {
          heading: t('nav.section.complianceDocs', 'Personnel Compliance'),
          items: [
            { to: '/documents', label: t('nav.staffDocuments', 'Staff Documents & Policies'), icon: FileText },
            { to: '/reports', label: t('nav.hrReports', 'Personnel Reports & Audits'), icon: BarChart3 },
          ],
        },
        {
          heading: t('nav.section.administration', 'Governance & Communications'),
          items: [
            { to: '/correspondence', label: t('nav.letters', 'Official Correspondence'), icon: Mail },
          ],
        },
      ];
    }

    // 7. Procurement Officer
    if (activeRole === 'procurement_officer' || hasRole('procurement_officer')) {
      return [
        {
          heading: t('nav.section.procurementCommand', 'Procurement Command'),
          items: [
            { to: '/', label: t('nav.procurementDashboard', 'Procurement Dashboard'), icon: LayoutDashboard },
            { to: '/procurement', label: t('nav.ordersVendors', 'Purchase Orders & Inventory'), icon: ShoppingCart, badge: 'Supplies' },
          ],
        },
        {
          heading: t('nav.section.financeDocs', 'Financial & Records'),
          items: [
            { to: '/finance', label: t('nav.requisitions', 'Financial Requisitions'), icon: Wallet },
            { to: '/documents', label: t('nav.procurementDocs', 'Invoices & Vendor Quotes'), icon: FileText },
            { to: '/reports', label: t('nav.reports', 'Procurement Analytics'), icon: BarChart3 },
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
            { to: '/', label: t('nav.meDashboard', 'M&E Performance Dashboard'), icon: LayoutDashboard },
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
          { to: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
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
      if (seen.has(item.to)) return false;
      seen.add(item.to);
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
                    end={item.to === '/'}
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
                        {/* Restrained icon size & brand color when active */}
                        <Icon
                          className={cn(
                            'w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-105',
                            isActive ? 'text-[#D68904]' : 'text-slate-400 group-hover:text-charcoal-700'
                          )}
                        />

                        {/* Label displayed when expanded */}
                        {isExpanded && (
                          <span
                            className={cn(
                              'truncate flex-1 text-xs',
                              isActive
                                ? 'font-semibold text-charcoal-900'
                                : 'font-medium text-charcoal-muted group-hover:text-charcoal-900'
                            )}
                          >
                            {item.label}
                          </span>
                        )}

                        {/* Badge displayed as pill when expanded, or notification pip when collapsed */}
                        {isExpanded && item.badge ? (
                          <span
                            className={cn(
                              'ml-auto rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase',
                              isActive
                                ? 'bg-[#D68904]/10 text-[#D68904] border border-[#D68904]/20'
                                : 'bg-slate-100 text-slate-600 border border-surface-border'
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : !isExpanded && item.badge ? (
                          <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"
                            title={item.badge}
                          />
                        ) : null}
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-bold text-xs">
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
