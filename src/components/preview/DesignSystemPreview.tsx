import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Trash2,
  Filter,
  FolderOpen,
  Plus,
  DollarSign,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { FilterControls } from '@/components/ui/FilterControls';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Alert } from '@/components/ui/Alert';
import { SkeletonText, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { useToast } from '@/lib/ToastContext';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  Dropdown,
  ListBox,
  Surface,
  TagGroup,
  Tag,
  Switch,
  SwitchGroup,
  Chip,
  Label as HeroLabel,
  Description as HeroDescription,
  Kbd,
  Separator as HeroSeparator,
  Header as HeroHeader,
} from '@/components/ui';

export const DesignSystemPreview: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('typography');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Form states for demonstration
  const [inputText, setInputText] = useState('Babawatoto Community Project');
  const [inputError, setInputError] = useState('');
  const [textareaVal, setTextareaVal] = useState('Quarterly project progress report covering Temeke and Kinondoni outreach activities.');
  const [selectedRole, setSelectedRole] = useState('project_manager');
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [radioSelected, setRadioSelected] = useState('official');

  // HeroUI suite states
  const [heroDropdownKey, setHeroDropdownKey] = useState<Set<string>>(new Set(['merge']));
  const [heroListBoxSingle, setHeroListBoxSingle] = useState<Set<string | number>>(new Set(['1']));
  const [heroListBoxMulti, setHeroListBoxMulti] = useState<Set<string | number>>(new Set(['1', '2']));
  const [heroTags, setHeroTags] = useState<{ id: string; name: string }[]>([
    { id: 'news', name: 'Child Safeguarding' },
    { id: 'ecd', name: 'Early Childhood Dev' },
    { id: 'nutrition', name: 'Community Nutrition' },
    { id: 'bagamoyo', name: 'Bagamoyo Hub' },
  ]);
  const [heroSelectedTags, setHeroSelectedTags] = useState<Set<string | number>>(new Set(['news', 'ecd']));
  const [heroSwitch1, setHeroSwitch1] = useState(true);
  const [heroSwitch2, setHeroSwitch2] = useState(false);
  const [heroTableSort, setHeroTableSort] = useState<{ column?: string; direction?: 'ascending' | 'descending' }>({
    column: 'name',
    direction: 'ascending',
  });
  const [heroSelectedRows, setHeroSelectedRows] = useState<Set<string | number>>(new Set(['1']));

  const previewTabs = [
    { id: 'typography', label: '1. Typography & Tokens' },
    { id: 'kpicards', label: '2. AdminCN KPI Cards' },
    { id: 'buttons', label: '3. Buttons & Badges' },
    { id: 'forms', label: '4. Form Inputs' },
    { id: 'tables', label: '5. Tables & Pagination' },
    { id: 'feedback', label: '6. Alerts, Modals & Toasts' },
    { id: 'states', label: '7. Loading & Empty States' },
    { id: 'heroui', label: '8. HeroUI v3 Suite' },
  ];

  const filterOptions = [
    { id: 'all', label: 'All Records', count: 24 },
    { id: 'active', label: 'Active', count: 18 },
    { id: 'pending', label: 'Pending Review', count: 4 },
    { id: 'archived', label: 'Archived', count: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('preview.title', 'BAOMS UI/UX Design System Showcase')}
        subtitle={t('preview.subtitle', 'Centralized design tokens, accessible components, and bilingual layout verification.')}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: 'Design System' },
        ]}
        badge={
          <Badge variant="success" withDot>
            Phase 2 Verified
          </Badge>
        }
      />

      {/* Tabs Navigation */}
      <Tabs tabs={previewTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Typography & Tokens */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale & Hierarchy</CardTitle>
              <CardDescription>
                Clean, readable typography hierarchy set in Google Sans Flex with dark charcoal text.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-charcoal-light uppercase">
                  Heading 1 (2xl / bold)
                </span>
                <h1 className="text-2xl font-bold text-charcoal">
                  Babawatoto Organization Management System
                </h1>
                <p className="text-xs text-charcoal-muted">
                  Kiswahili: Mfumo wa Usimamizi wa Shirika la Babawatoto
                </p>
              </div>

              <div className="space-y-1 border-t border-surface-border pt-4">
                <span className="text-[10px] font-mono text-charcoal-light uppercase">
                  Heading 2 (xl / semibold)
                </span>
                <h2 className="text-xl font-semibold text-charcoal">
                  Financial Approvals and Procurement Requisitions
                </h2>
                <p className="text-xs text-charcoal-muted">
                  Kiswahili: Idhini ya Kifedha na Maombi ya Ununuzi
                </p>
              </div>

              <div className="space-y-1 border-t border-surface-border pt-4">
                <span className="text-[10px] font-mono text-charcoal-light uppercase">
                  Heading 3 (base / semibold)
                </span>
                <h3 className="text-base font-semibold text-charcoal">
                  Staff Personnel Records & Leave Management
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Kiswahili: Kumbukumbu za Watumishi na Usimamizi wa Likizo
                </p>
              </div>

              <div className="space-y-1 border-t border-surface-border pt-4">
                <span className="text-[10px] font-mono text-charcoal-light uppercase">
                  Body Text (sm / normal) & Secondary Muted
                </span>
                <p className="text-sm text-charcoal leading-relaxed max-w-2xl">
                  Babawatoto Organization operates community projects, child empowerment initiatives, and youth development programs across Tanzania. The internal management system guarantees strict auditability, role-based authorization, and bilingual administrative operation.
                </p>
                <p className="text-xs text-charcoal-muted mt-1 max-w-2xl">
                  Shirika la Babawatoto linaendesha miradi ya kijamii, uwezeshaji wa watoto, na programu za vijana kote nchini Tanzania. Mfumo huu wa usimamizi wa ndani unahakikisha uwajibikaji, udhibiti wa ufikiaji unaozingatia majukumu, na utendaji wa kiutawala kwa lugha mbili.
                </p>
              </div>

              <div className="space-y-1 border-t border-surface-border pt-4">
                <span className="text-[10px] font-mono text-charcoal-light uppercase">
                  Mono & Business Identifiers
                </span>
                <p className="font-mono text-xs text-charcoal-900 font-semibold">
                  REF-2026-TZ-DAR-0042 • UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Color Tokens */}
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Color Tokens & Brand System</CardTitle>
              <CardDescription>
                Restrained brand ochre/gold accents paired with calm slate neutrals and high-contrast surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="space-y-1.5">
                  <div className="h-14 rounded-md bg-[#D68904] border border-amber-600/20 flex items-center justify-center text-white font-mono text-xs font-bold">
                    #D68904
                  </div>
                  <div className="text-xs font-semibold text-charcoal-900">Brand Primary</div>
                  <div className="text-[11px] text-charcoal-muted">Ochre Gold</div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-14 rounded-md bg-[#F2A507] border border-amber-500/20 flex items-center justify-center text-charcoal-950 font-mono text-xs font-bold">
                    #F2A507
                  </div>
                  <div className="text-xs font-semibold text-charcoal-900">Amber Gold</div>
                  <div className="text-[11px] text-charcoal-muted">Accent / Hover</div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-14 rounded-md bg-[#1f2937] border border-slate-700 flex items-center justify-center text-white font-mono text-xs font-bold">
                    #1f2937
                  </div>
                  <div className="text-xs font-semibold text-charcoal-900">Charcoal Dark</div>
                  <div className="text-[11px] text-charcoal-muted">Primary Text</div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-14 rounded-md bg-[#f9fafb] border border-slate-200 flex items-center justify-center text-charcoal-700 font-mono text-xs font-bold">
                    #f9fafb
                  </div>
                  <div className="text-xs font-semibold text-charcoal-900">Neutral Light</div>
                  <div className="text-[11px] text-charcoal-muted">Canvas Surface</div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-14 rounded-md bg-emerald-600 border border-emerald-700 flex items-center justify-center text-white font-mono text-xs font-bold">
                    #059669
                  </div>
                  <div className="text-xs font-semibold text-charcoal-900">Semantic Success</div>
                  <div className="text-[11px] text-charcoal-muted">Approved / Cleared</div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-14 rounded-md bg-rose-600 border border-rose-700 flex items-center justify-center text-white font-mono text-xs font-bold">
                    #e11d48
                  </div>
                  <div className="text-xs font-semibold text-charcoal-900">Semantic Danger</div>
                  <div className="text-[11px] text-charcoal-muted">Destructive / Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: AdminCN KPI Cards */}
      {activeTab === 'kpicards' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AdminCN Reusable KPI Cards</CardTitle>
              <CardDescription>
                Compact metric summaries with 16–20px padding, 8–10px border radius, 1px subtle neutral border, monospace tabular figures, and optional trend/status badges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Budget Utilization"
                  value="TZS 450.2M"
                  helperText="68.4% of annual commitment"
                  badge={{ label: '+12.4%', variant: 'success' }}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <KPICard
                  title="Active Donor Projects"
                  value="14"
                  helperText="All workplans on schedule"
                  badge={{ label: 'Active', variant: 'neutral' }}
                  icon={<Briefcase className="h-4 w-4" />}
                />
                <KPICard
                  title="Beneficiaries Reached"
                  value="28,450"
                  helperText="Verified field participants"
                  badge={{ label: '+5.2%', variant: 'success' }}
                  icon={<Users className="h-4 w-4" />}
                />
                <KPICard
                  title="Pending Requisitions"
                  value="7"
                  helperText="Requires executive clearance"
                  badge={{ label: 'Action Required', variant: 'warning' }}
                  icon={<Clock className="h-4 w-4" />}
                />
              </div>

              <div className="border-t border-surface-border pt-4">
                <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2">Design Targets & Rules</h4>
                <ul className="text-xs text-charcoal-600 space-y-1 list-disc pl-4">
                  <li><strong>Container:</strong> Clean white background, 1px subtle border (slate-200), rounded-lg (8–10px), no oversized shadows.</li>
                  <li><strong>Header:</strong> Uppercase 11px muted label, aligned with optional small iconography.</li>
                  <li><strong>Value:</strong> 24–28px semibold tabular figure, aligned left with optional status/percentage pill badge.</li>
                  <li><strong>Supporting Text:</strong> Muted 12px contextual metadata without decorative gradient overlays.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Buttons & Badges */}
      {activeTab === 'buttons' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Button Hierarchy & States</CardTitle>
              <CardDescription>
                Reusable enterprise button variants, sizes, and accessible states.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                  Variants
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">
                    <Save className="h-4 w-4 mr-1.5" />
                    <span>Primary Action</span>
                  </Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="outline">Outline Action</Button>
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="danger">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    <span>Danger Action</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2 border-t border-surface-border pt-4">
                <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                  Sizes & Icon-Only Buttons
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small (30px)</Button>
                  <Button size="md">Primary (38px)</Button>
                  <Button size="lg">Large (44px)</Button>
                  <Button size="sm" isIconOnly variant="secondary" aria-label="Filter">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button size="md" isIconOnly variant="primary" aria-label="Add item">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 border-t border-surface-border pt-4">
                <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                  Interactive States (Loading & Disabled)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button isLoading variant="primary">
                    Saving Changes...
                  </Button>
                  <Button disabled variant="primary">
                    Disabled Primary
                  </Button>
                  <Button disabled variant="secondary">
                    Disabled Secondary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Status Badges</CardTitle>
              <CardDescription>
                Restrained status indicators paired with accessible indicator dots and labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" withDot>
                  Approved / Imeidhinishwa
                </Badge>
                <Badge variant="warning" withDot>
                  Pending Review / Inasubiri Ukaguzi
                </Badge>
                <Badge variant="danger" withDot>
                  Rejected / Imekataliwa
                </Badge>
                <Badge variant="info" withDot>
                  Active / Inatumika
                </Badge>
                <Badge variant="default">
                  Draft / Rasimu
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: Form Inputs */}
      {activeTab === 'forms' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Input Primitives</CardTitle>
              <CardDescription>
                Labels, error validation styling, helper text, and keyboard focus outlines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 max-w-xl">
              <Input
                label="Organization Project Name"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value.length < 5) {
                    setInputError('Project name must be at least 5 characters');
                  } else {
                    setInputError('');
                  }
                }}
                error={inputError}
                helperText="Official title registered with donors and municipal councils."
              />

              <Select
                label="Designated Project Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                options={[
                  { value: 'executive_director', label: 'Executive Director' },
                  { value: 'finance_officer', label: 'Finance Officer' },
                  { value: 'project_manager', label: 'Project Manager' },
                  { value: 'project_coordinator', label: 'Project Coordinator' },
                  { value: 'hr_administrator', label: 'HR Administrator' },
                ]}
                helperText="Determines permission boundary under PostgreSQL Row-Level Security."
              />

              <Textarea
                label="Executive Summary & Activity Scope"
                value={textareaVal}
                onChange={(e) => setTextareaVal(e.target.value)}
                rows={3}
                helperText="Provide a concise description of administrative requirements."
              />

              <div className="border-t border-surface-border pt-4 space-y-4">
                <Checkbox
                  label="Authorize internal budget tracking"
                  description="When enabled, expenditure vouchers are matched automatically with approved budget line codes."
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                />

                <RadioGroup
                  name="recordClassification"
                  label="Document Classification Level"
                  value={radioSelected}
                  onChange={setRadioSelected}
                  options={[
                    {
                      value: 'official',
                      label: 'Official Internal',
                      description: 'Accessible by authorized BAO personnel.',
                    },
                    {
                      value: 'confidential',
                      label: 'Confidential / Restrictive',
                      description: 'Restricted to Executive Director and designated department leads.',
                    },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: Tables & Pagination */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle>Administrative Records Table</CardTitle>
                  <CardDescription>
                    Record-heavy table layout with filter controls and pagination.
                  </CardDescription>
                </div>
                <FilterControls
                  options={filterOptions}
                  activeFilter={activeFilter}
                  onSelectFilter={setActiveFilter}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Record Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date Logged</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-charcoal-900">
                      DOC-2026-001
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      Child Safeguarding Policy & Staff Code of Conduct
                    </TableCell>
                    <TableCell className="text-xs text-charcoal-muted">HR & Safeguarding</TableCell>
                    <TableCell className="text-xs text-charcoal-light">12 Jan 2026</TableCell>
                    <TableCell>
                      <Badge variant="success" withDot>
                        Approved
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-charcoal-900">
                      FIN-2026-084
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      Quarterly Audit Preparation & Bank Reconciliations
                    </TableCell>
                    <TableCell className="text-xs text-charcoal-muted">Finance</TableCell>
                    <TableCell className="text-xs text-charcoal-light">08 Oct 2026</TableCell>
                    <TableCell>
                      <Badge variant="warning" withDot>
                        Pending Review
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs font-semibold text-charcoal-900">
                      PRJ-2026-019
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      Kigamboni Early Childhood Development Community Workshop
                    </TableCell>
                    <TableCell className="text-xs text-charcoal-muted">Projects</TableCell>
                    <TableCell className="text-xs text-charcoal-light">02 Oct 2026</TableCell>
                    <TableCell>
                      <Badge variant="info" withDot>
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                totalPages={4}
                totalItems={38}
                pageSize={10}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: Alerts, Modals & Toasts */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Alerts</CardTitle>
              <CardDescription>
                Contextual notification banners with accessible iconography.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert variant="info" title="Organizational Policy Notice">
                All financial requisitions exceeding TZS 1,000,000 require multi-step approval by both the Finance Officer and Executive Director.
              </Alert>

              <Alert variant="success" title="Verification Passed">
                The selected document checksum matches the cryptographic signature recorded in Supabase PostgreSQL audit logs.
              </Alert>

              <Alert variant="warning" title="Deadline Approaching">
                Quarterly project activity progress reports for Phase 1 must be submitted before Friday, 17:00 EAT.
              </Alert>

              <Alert variant="error" title="Permission Denied">
                Your role does not possess the required RBAC privilege to authorize payment disbursements.
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dialogs & Feedback Toasts</CardTitle>
              <CardDescription>
                Interactive overlays with keyboard focus management and screen-reader support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Open Sample Modal Dialog
                </Button>
                <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                  Trigger Confirmation Dialog
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    showToast({
                      title: 'Changes Saved',
                      message: 'Organization preferences were updated successfully.',
                      variant: 'success',
                    })
                  }
                >
                  Trigger Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    showToast({
                      title: 'Network Synchronization',
                      message: 'Reconnected to Supabase real-time updates channel.',
                      variant: 'info',
                    })
                  }
                >
                  Trigger Info Toast
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modal Demo */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Administrative Document Version Review"
            description="Review metadata and approval checklist before marking record as verified."
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    showToast({
                      title: 'Verification Complete',
                      message: 'Document was verified and marked ready for distribution.',
                      variant: 'success',
                    });
                  }}
                >
                  Verify Document
                </Button>
              </>
            }
          >
            <div className="space-y-3 text-xs text-charcoal">
              <p>
                Document: <strong>UNICEF-Partner-Addendum-2026.pdf</strong> (1.4 MB)
              </p>
              <p className="text-charcoal-muted">
                Storage: Private Supabase Storage Bucket (signed URL download only).
              </p>
              <div className="rounded border border-surface-border p-3 bg-surface-muted/50 space-y-1">
                <span className="font-semibold block">Compliance Checklist:</span>
                <p>✓ Authorized organizational signatory confirmed</p>
                <p>✓ Project milestone budget codes verified</p>
              </div>
            </div>
          </Modal>

          {/* Confirmation Dialog Demo */}
          <ConfirmationDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={() => {
              setIsConfirmOpen(false);
              showToast({
                title: 'Record Removed',
                message: 'Sample item was deleted in local preview state.',
                variant: 'warning',
              });
            }}
            title="Delete Requisition Record"
            message="Are you sure you wish to permanently delete this requisition record? This action will create an immutable audit record."
            confirmText="Delete Requisition"
            variant="danger"
          />
        </div>
      )}

      {/* TAB 6: Loading & Empty States */}
      {activeTab === 'states' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading Skeletons</CardTitle>
              <CardDescription>
                Subtle, calm pulsing placeholders for asynchronous content fetching.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="space-y-2 border-t border-surface-border pt-4">
                <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider block">
                  Text Line Skeletons
                </span>
                <SkeletonText lines={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empty State Component</CardTitle>
              <CardDescription>
                Restrained, non-crowded placeholder when tables or queries return zero records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FolderOpen}
                title="No Pending Document Reviews Found"
                description="All submitted organizational documents and partner MoUs have been reviewed and approved by the Executive Director."
                action={{
                  label: 'Upload New Document',
                  onClick: () =>
                    showToast({
                      title: 'Upload Request',
                      message: 'Document uploads are scheduled in Phase 4 (Document Management).',
                      variant: 'info',
                    }),
                  icon: Plus,
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 8: HEROUI V3 COMPONENT SUITE */}
      {activeTab === 'heroui' && (
        <div className="space-y-6">
          {/* Section 1: ButtonGroup */}
          <Card>
            <CardHeader>
              <CardTitle>1. HeroUI ButtonGroup</CardTitle>
              <CardDescription>
                Group related buttons together with consistent styling, automatic connected border radii, orientation, and separator dividers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Horizontal Groups with Separators & Dropdowns
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  <ButtonGroup variant="primary">
                    <Button>Authorize Project</Button>
                    <Dropdown>
                      <Dropdown.Trigger>
                        <Button isIconOnly aria-label="More actions">
                          <ButtonGroupSeparator />
                          <ChevronDown className="size-4" />
                        </Button>
                      </Dropdown.Trigger>
                      <Dropdown.Popover>
                        <Dropdown.Menu onAction={(k) => showToast({ title: 'Action Selected', message: k, variant: 'success' })}>
                          <Dropdown.Item id="authorize-now">
                            <HeroLabel>Authorize & Disburse</HeroLabel>
                            <HeroDescription>Immediately unlocks field funds</HeroDescription>
                          </Dropdown.Item>
                          <Dropdown.Item id="conditional">
                            <HeroLabel>Conditional Approval</HeroLabel>
                            <HeroDescription>Requires revised expenditure plan</HeroDescription>
                          </Dropdown.Item>
                          <HeroSeparator />
                          <Dropdown.Item id="reject" variant="danger">
                            <HeroLabel>Return for Revision</HeroLabel>
                            <HeroDescription>Returns charter to Project Manager</HeroDescription>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </ButtonGroup>

                  <ButtonGroup variant="secondary">
                    <Button>Export Dossier</Button>
                    <Button>
                      <ButtonGroupSeparator />
                      PDF Format
                    </Button>
                    <Button>
                      <ButtonGroupSeparator />
                      Excel Audit
                    </Button>
                  </ButtonGroup>

                  <ButtonGroup variant="tertiary">
                    <Button>Active</Button>
                    <Button>
                      <ButtonGroupSeparator />
                      Completed
                    </Button>
                    <Button>
                      <ButtonGroupSeparator />
                      All Projects
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Vertical Orientation & Danger Variants
                </span>
                <div className="flex flex-wrap items-start gap-6">
                  <ButtonGroup orientation="vertical" variant="secondary" className="w-48">
                    <Button className="justify-start">Personnel Directory</Button>
                    <Button className="justify-start">
                      <ButtonGroupSeparator />
                      Leave Entitlements
                    </Button>
                    <Button className="justify-start">
                      <ButtonGroupSeparator />
                      Contract Renewals
                    </Button>
                  </ButtonGroup>

                  <ButtonGroup variant="danger">
                    <Button>Deactivate Account</Button>
                    <Button isIconOnly aria-label="Deactivation options">
                      <ButtonGroupSeparator />
                      <ChevronDown className="size-4" />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Dropdown */}
          <Card>
            <CardHeader>
              <CardTitle>2. HeroUI Dropdown</CardTitle>
              <CardDescription>
                Accessible action menus with sections, labels, descriptions, keyboard shortcut badges, selection indicators, and submenus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Actions Dropdown */}
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button variant="secondary">
                      <span>Actions Menu</span>
                      <ChevronDown className="size-4 ml-1.5" />
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Popover>
                    <Dropdown.Menu onAction={(k) => showToast({ title: 'Selected', message: k, variant: 'info' })}>
                      <Dropdown.Section>
                        <HeroHeader>Project Actions</HeroHeader>
                        <Dropdown.Item id="new-activity">
                          <HeroLabel>Add Field Activity</HeroLabel>
                          <HeroDescription>Define ToR and budget line</HeroDescription>
                          <Kbd slot="keyboard">⌘N</Kbd>
                        </Dropdown.Item>
                        <Dropdown.Item id="export-data">
                          <HeroLabel>Export Indicators</HeroLabel>
                          <HeroDescription>Download M&E metrics</HeroDescription>
                          <Kbd slot="keyboard">⌘E</Kbd>
                        </Dropdown.Item>
                      </Dropdown.Section>
                      <HeroSeparator />
                      <Dropdown.Section>
                        <HeroHeader>Governance Gate</HeroHeader>
                        <Dropdown.Item id="lock-budget" variant="danger">
                          <HeroLabel>Lock Financial Budget</HeroLabel>
                          <HeroDescription>Freezes requisitions</HeroDescription>
                        </Dropdown.Item>
                      </Dropdown.Section>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>

                {/* Multiple Selection Dropdown */}
                <Dropdown>
                  <Dropdown.Trigger>
                    <Button variant="outline">
                      <span>Preferred Categories</span>
                      <ChevronDown className="size-4 ml-1.5" />
                    </Button>
                  </Dropdown.Trigger>
                  <Dropdown.Popover>
                    <Dropdown.Menu
                      selectionMode="multiple"
                      selectedKeys={heroDropdownKey}
                      onSelectionChange={(keys) => setHeroDropdownKey(keys as any)}
                    >
                      <Dropdown.Section>
                        <HeroHeader>Focus Sectors</HeroHeader>
                        <Dropdown.Item id="safeguarding">
                          <HeroLabel>Child Protection</HeroLabel>
                          <Dropdown.ItemIndicator />
                        </Dropdown.Item>
                        <Dropdown.Item id="nutrition">
                          <HeroLabel>Nutrition & Health</HeroLabel>
                          <Dropdown.ItemIndicator />
                        </Dropdown.Item>
                        <Dropdown.Item id="education">
                          <HeroLabel>Inclusive Education</HeroLabel>
                          <Dropdown.ItemIndicator />
                        </Dropdown.Item>
                      </Dropdown.Section>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: ListBox */}
          <Card>
            <CardHeader>
              <CardTitle>3. HeroUI ListBox</CardTitle>
              <CardDescription>
                Structured selection lists inside modern surfaces with single and multiple selection modes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Single Selection (Staff Reviewers)
                  </span>
                  <Surface className="w-full sm:w-72">
                    <ListBox
                      aria-label="Staff Reviewers"
                      selectionMode="single"
                      selectedKeys={heroListBoxSingle}
                      onSelectionChange={setHeroListBoxSingle}
                    >
                      <ListBox.Section>
                        <HeroHeader>Executive Reviewers</HeroHeader>
                        <ListBox.Item id="1" textValue="Zuberi Kondo">
                          <div className="size-7 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                            ZK
                          </div>
                          <div className="flex flex-col min-w-0">
                            <HeroLabel>Zuberi Kondo</HeroLabel>
                            <HeroDescription>Executive Director</HeroDescription>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="2" textValue="Finance Lead">
                          <div className="size-7 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-xs shrink-0">
                            FL
                          </div>
                          <div className="flex flex-col min-w-0">
                            <HeroLabel>Finance Officer</HeroLabel>
                            <HeroDescription>finance@babawatoto.or.tz</HeroDescription>
                          </div>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox.Section>
                    </ListBox>
                  </Surface>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Multiple Selection (Project Modules)
                  </span>
                  <Surface className="w-full sm:w-72">
                    <ListBox
                      aria-label="Project Modules"
                      selectionMode="multiple"
                      selectedKeys={heroListBoxMulti}
                      onSelectionChange={setHeroListBoxMulti}
                    >
                      <ListBox.Section>
                        <HeroHeader>Enabled Operations</HeroHeader>
                        <ListBox.Item id="1" textValue="Requisitions">
                          <HeroLabel>Spend Requisitions</HeroLabel>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="2" textValue="Procurement">
                          <HeroLabel>Purchase Orders</HeroLabel>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="3" textValue="Beneficiaries">
                          <HeroLabel>Field Attendance Register</HeroLabel>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox.Section>
                    </ListBox>
                  </Surface>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: TagGroup */}
          <Card>
            <CardHeader>
              <CardTitle>4. HeroUI TagGroup</CardTitle>
              <CardDescription>
                Focusable tag pills supporting selection, avatars, icons, and interactive remove buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Interactive Removable Tags
                </span>
                <TagGroup
                  aria-label="Project Tags"
                  onRemove={(keys) => {
                    const toDelete = Array.from(keys);
                    setHeroTags((prev) => prev.filter((t) => !toDelete.includes(t.id)));
                  }}
                >
                  <TagGroup.List items={heroTags}>
                    {(tag) => (
                      <Tag key={tag.id} id={tag.id} textValue={tag.name}>
                        {tag.name}
                        <Tag.RemoveButton />
                      </Tag>
                    )}
                  </TagGroup.List>
                </TagGroup>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Tag Selection (Surface Variant)
                </span>
                <TagGroup
                  selectionMode="multiple"
                  variant="surface"
                  selectedKeys={heroSelectedTags}
                  onSelectionChange={setHeroSelectedTags}
                >
                  <HeroLabel>Choose Operational Sectors</HeroLabel>
                  <TagGroup.List>
                    <Tag id="news">Child Protection</Tag>
                    <Tag id="ecd">Early Learning</Tag>
                    <Tag id="wash">WASH & Hygiene</Tag>
                    <Tag id="livelihood">Family Economic Empowerment</Tag>
                  </TagGroup.List>
                </TagGroup>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Switch & Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>5. HeroUI Switch & SwitchGroup</CardTitle>
              <CardDescription>
                Smooth boolean toggle switches with sizes, icons, labels, and descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-8">
                <Switch size="sm" isSelected={heroSwitch1} onChange={setHeroSwitch1}>
                  <HeroLabel>Small Switch</HeroLabel>
                </Switch>

                <Switch size="md" isSelected={heroSwitch1} onChange={setHeroSwitch1}>
                  <HeroLabel>Medium (Default)</HeroLabel>
                </Switch>

                <Switch size="lg" isSelected={heroSwitch1} onChange={setHeroSwitch1}>
                  <HeroLabel>Large Switch</HeroLabel>
                </Switch>
              </div>

              <div className="border-t border-slate-100 pt-4 max-w-md">
                <SwitchGroup>
                  <Switch isSelected={heroSwitch1} onChange={setHeroSwitch1}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <div className="flex flex-col">
                        <HeroLabel>Activity Notifications</HeroLabel>
                        <HeroDescription>Alert Executive Director upon field submission</HeroDescription>
                      </div>
                    </Switch.Content>
                  </Switch>

                  <Switch isSelected={heroSwitch2} onChange={setHeroSwitch2}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <div className="flex flex-col">
                        <HeroLabel>Automatic Retirement Gate</HeroLabel>
                        <HeroDescription>Require receipts before issuing next tranche</HeroDescription>
                      </div>
                    </Switch.Content>
                  </Switch>
                </SwitchGroup>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Chip */}
          <Card>
            <CardHeader>
              <CardTitle>6. HeroUI Chip & Informational Badges</CardTitle>
              <CardDescription>
                Full color and variant matrix: primary, secondary, soft, and tertiary across all semantic statuses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Soft Variant (Recommended for Modern SaaS)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip variant="soft" color="accent">Ochre Accent</Chip>
                  <Chip variant="soft" color="success">Approved Tranche</Chip>
                  <Chip variant="soft" color="warning">Pending Sign-off</Chip>
                  <Chip variant="soft" color="danger">Over Budget</Chip>
                  <Chip variant="soft" color="default">Standard Draft</Chip>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Secondary Variant (Subtle Border)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip variant="secondary" color="accent">Grant Agreement</Chip>
                  <Chip variant="secondary" color="success">Verified Target</Chip>
                  <Chip variant="secondary" color="warning">Audit Flag</Chip>
                  <Chip variant="secondary" color="danger">Declined ToR</Chip>
                  <Chip variant="secondary" color="default">Internal Note</Chip>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Primary Variant (Filled Solid)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Chip variant="primary" color="accent">Active Portfolio</Chip>
                  <Chip variant="primary" color="success">Disbursed</Chip>
                  <Chip variant="primary" color="warning">Under Review</Chip>
                  <Chip variant="primary" color="danger">Closed</Chip>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Table */}
          <Card>
            <CardHeader>
              <CardTitle>7. HeroUI Table with Sorting, Selection & Pagination</CardTitle>
              <CardDescription>
                Compound Table component with horizontal scroll container, column sorting indicators, and pagination footer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    sortDescriptor={heroTableSort}
                    onSortChange={(d) => setHeroTableSort(d as any)}
                    selectedKeys={heroSelectedRows}
                    selectionMode="single"
                    onSelectionChange={setHeroSelectedRows}
                  >
                    <Table.Header>
                      <Table.Column id="code" isRowHeader>
                        Project Code
                      </Table.Column>
                      <Table.Column id="name" allowsSorting>
                        Project Title
                      </Table.Column>
                      <Table.Column id="funder">
                        Donor Funder
                      </Table.Column>
                      <Table.Column id="status">
                        Status
                      </Table.Column>
                      <Table.Column id="budget" allowsSorting className="text-right">
                        Allocated Budget
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      <Table.Row id="1">
                        <Table.Cell className="font-mono font-bold text-slate-900">PRJ-2026-001</Table.Cell>
                        <Table.Cell className="font-medium text-slate-900">Kigamboni Child Care & Education Support</Table.Cell>
                        <Table.Cell className="text-slate-600">Foundation Partner</Table.Cell>
                        <Table.Cell>
                          <Chip variant="soft" color="success">ACTIVE</Chip>
                        </Table.Cell>
                        <Table.Cell isNumeric className="font-bold text-slate-900">TZS 150,000,000</Table.Cell>
                      </Table.Row>
                      <Table.Row id="2">
                        <Table.Cell className="font-mono font-bold text-slate-900">PRJ-2026-002</Table.Cell>
                        <Table.Cell className="font-medium text-slate-900">Bagamoyo Youth Life Skills Initiative</Table.Cell>
                        <Table.Cell className="text-slate-600">Global Youth Grant</Table.Cell>
                        <Table.Cell>
                          <Chip variant="soft" color="success">ACTIVE</Chip>
                        </Table.Cell>
                        <Table.Cell isNumeric className="font-bold text-slate-900">TZS 85,000,000</Table.Cell>
                      </Table.Row>
                      <Table.Row id="3">
                        <Table.Cell className="font-mono font-bold text-slate-900">PRJ-2026-003</Table.Cell>
                        <Table.Cell className="font-medium text-slate-900">Inclusive Education Teachers Capacity Building</Table.Cell>
                        <Table.Cell className="text-slate-600">Institutional</Table.Cell>
                        <Table.Cell>
                          <Chip variant="soft" color="warning">PLANNING</Chip>
                        </Table.Cell>
                        <Table.Cell isNumeric className="font-bold text-slate-900">TZS 45,000,000</Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                <Table.Footer>
                  <Pagination
                    currentPage={1}
                    totalPages={3}
                    totalItems={3}
                    pageSize={3}
                    onPageChange={() => {}}
                  />
                </Table.Footer>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
