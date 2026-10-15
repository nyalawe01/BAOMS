import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save,
  Trash2,
  Filter,
  FolderOpen,
  Plus,
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
import { useToast } from '@/lib/ToastContext';

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

  const previewTabs = [
    { id: 'typography', label: '1. Typography & Tokens' },
    { id: 'buttons', label: '2. Buttons & Badges' },
    { id: 'forms', label: '3. Form Inputs' },
    { id: 'tables', label: '4. Tables & Pagination' },
    { id: 'feedback', label: '5. Alerts, Modals & Toasts' },
    { id: 'states', label: '6. Loading & Empty States' },
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
                Clean, readable typography hierarchy set in Inter/System Sans with dark charcoal text.
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
                <p className="font-mono text-xs text-forest-800">
                  REF-2026-TZ-DAR-0042 • UUID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: Buttons & Badges */}
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
                    <TableCell className="font-mono text-xs font-semibold text-forest-800">
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
                    <TableCell className="font-mono text-xs font-semibold text-forest-800">
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
                    <TableCell className="font-mono text-xs font-semibold text-forest-800">
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
    </div>
  );
};
