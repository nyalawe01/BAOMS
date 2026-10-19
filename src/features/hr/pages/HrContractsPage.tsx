import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Building,
  User,
  Shield,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { getStaffProfiles, updateStaffProfile } from '../services/hrService';
import { StaffProfileRecord, ContractType } from '../types/hr';
import { StaffDetailModal } from '../components/StaffDetailModal';

export const HrContractsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'permanent' | 'fixed_term'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [selectedStaff, setSelectedStaff] = useState<StaffProfileRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [newContractType, setNewContractType] = useState<ContractType>('fixed_term');
  const [renewalNotes, setRenewalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getStaffProfiles();
      setStaffList(records);
    } catch (e) {
      console.warn('Contracts loading notice:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expiry analytics
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  const in60Days = new Date(now.getTime() + 60 * 86400000);
  const in90Days = new Date(now.getTime() + 90 * 86400000);

  const expiring30 = staffList.filter((s) => {
    if (!s.endDate) return false;
    const d = new Date(s.endDate);
    return d >= now && d <= in30Days;
  });

  const expiring60 = staffList.filter((s) => {
    if (!s.endDate) return false;
    const d = new Date(s.endDate);
    return d >= now && d <= in60Days;
  });

  const expiredContracts = staffList.filter((s) => {
    if (!s.endDate) return false;
    const d = new Date(s.endDate);
    return d < now && s.contractType !== 'permanent';
  });

  const permanentCount = staffList.filter((s) => s.contractType === 'permanent').length;
  const fixedTermCount = staffList.filter((s) => s.contractType === 'fixed_term').length;

  const filteredContracts = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.staffNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.departmentName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDeptFilter === 'all' ||
        s.departmentCode.toLowerCase() === selectedDeptFilter.toLowerCase() ||
        s.departmentId === selectedDeptFilter;

      let matchesTab = true;
      if (activeTab === 'expiring') {
        matchesTab = s.isExpiringSoon || (s.endDate ? new Date(s.endDate) <= in60Days : false);
      } else if (activeTab === 'permanent') {
        matchesTab = s.contractType === 'permanent';
      } else if (activeTab === 'fixed_term') {
        matchesTab = s.contractType === 'fixed_term';
      }

      return matchesSearch && matchesDept && matchesTab;
    });
  }, [staffList, searchQuery, selectedDeptFilter, activeTab, in60Days]);

  const handleOpenRenew = (staff: StaffProfileRecord) => {
    setSelectedStaff(staff);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    setNewEndDate(futureDate.toISOString().split('T')[0]);
    setNewContractType(staff.contractType || 'fixed_term');
    setRenewalNotes(`Contract renewal prepared for ${staff.fullName} effective upon expiry.`);
    setIsRenewModalOpen(true);
  };

  const handleExecuteRenewal = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await updateStaffProfile(selectedStaff.id, {
        contractType: newContractType,
        endDate: newEndDate,
        notes: renewalNotes,
      });

      Swal.fire({
        title: 'Contract Extended!',
        text: `Employment contract for ${selectedStaff.fullName} renewed until ${newEndDate}.`,
        icon: 'success',
        confirmButtonColor: '#D68904',
      });
      setIsRenewModalOpen(false);
      loadData();
    } catch (e: any) {
      Swal.fire({
        title: 'Renewal Failed',
        text: e.message || 'Could not update contract dates.',
        icon: 'error',
        confirmButtonColor: '#D68904',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Staff Number', 'Full Name', 'Department', 'Job Title', 'Contract Type', 'Start Date', 'End Date', 'Days to Expiry', 'Status'];
    const rows = filteredContracts.map((s) => [
      s.staffNumber,
      `"${s.fullName}"`,
      `"${s.departmentName}"`,
      `"${s.jobTitle}"`,
      s.contractType,
      s.startDate,
      s.endDate || 'N/A',
      s.daysToContractExpiry ?? 'Permanent',
      s.employmentStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BAOMS_Contract_Register_${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts & Employment Governance"
        subtitle="Employment tenure tracking, fixed-term renewals, contract expiry schedules, and statutory probation monitoring."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'Contracts & Employment' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1.5" />
              Export Register
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr/staff/new')}>
              <Plus className="h-4 w-4 mr-1.5" />
              Issue New Contract
            </Button>
          </div>
        }
      />

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Expiring in 60 Days</span>
            <AlertCircle className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${expiring60.length > 0 ? 'text-amber-600' : 'text-charcoal-900'}`}>
            {expiring60.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Fixed-term agreements nearing expiration
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Critical (30 Days)</span>
            <AlertTriangle className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className={`mt-2 text-2xl font-bold font-mono tabular-nums leading-tight ${expiring30.length > 0 ? 'text-rose-600' : 'text-charcoal-900'}`}>
            {expiring30.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Immediate renewal or transition required
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Fixed-Term Staff</span>
            <FileText className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {fixedTermCount}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Project-funded or grant-based contracts
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Permanent Tenures</span>
            <CheckCircle2 className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {permanentCount}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Confirmed open-ended institutional appointments
          </p>
        </div>
      </div>

      {/* Contract Expiry Warning Banner (if any expiring in 30 days) */}
      {expiring30.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Action Required: {expiring30.length} Employment Contract(s) Expiring Within 30 Days
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Staff members: {expiring30.map((s) => s.fullName).join(', ')}. Review performance appraisals and prepare renewal extensions.
              </p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setActiveTab('expiring')}>
            View Urgent Contracts
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'all'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <FileText className="h-4 w-4 text-charcoal-700" />
          <span>All Contracts ({staffList.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expiring')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'expiring'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <AlertCircle className="h-4 w-4 text-charcoal-700" />
          <span>Renewal Watchlist ({expiring60.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fixed_term')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'fixed_term'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Clock className="h-4 w-4 text-charcoal-700" />
          <span>Fixed-Term ({fixedTermCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permanent')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'permanent'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Shield className="h-4 w-4 text-charcoal-700" />
          <span>Permanent ({permanentCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-surface-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff, ID, department..."
            className="pl-9 pr-3 py-1.5 text-xs rounded border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-charcoal-500 w-full"
          />
        </div>

        <select
          value={selectedDeptFilter}
          onChange={(e) => setSelectedDeptFilter(e.target.value)}
          className="py-1.5 px-3 text-xs rounded border border-surface-border bg-white text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-charcoal-500"
        >
          <option value="all">All Departments</option>
          <option value="EXEC">Executive Office</option>
          <option value="PRJ">Programs & Delivery</option>
          <option value="FIN">Finance & Operations</option>
          <option value="HR">Human Resources</option>
          <option value="PROC">Procurement & Logistics</option>
          <option value="ME">Monitoring & Evaluation</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
              <tr>
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Department & Role</th>
                <th className="py-2.5 px-4">Contract Type</th>
                <th className="py-2.5 px-4">Start Date</th>
                <th className="py-2.5 px-4">End Date</th>
                <th className="py-2.5 px-4">Expiry Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-3.5 w-28 bg-slate-200 rounded mb-1" />
                      <div className="h-2.5 w-16 bg-slate-100 rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3.5 w-24 bg-slate-200 rounded mb-1" />
                      <div className="h-2.5 w-20 bg-slate-100 rounded" />
                    </td>
                    <td className="py-3 px-4"><div className="h-3.5 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 w-20 bg-slate-200 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 rounded-full" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-6 w-20 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-charcoal-muted text-xs">
                    No contract records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((staff) => {
                  const isExpiring = staff.isExpiringSoon || (staff.endDate && new Date(staff.endDate) <= in60Days);
                  const isCritical = staff.endDate && new Date(staff.endDate) <= in30Days;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{staff.fullName}</div>
                        <div className="text-[11px] font-mono text-charcoal-muted">{staff.staffNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-charcoal-800">{staff.jobTitle}</div>
                        <div className="text-[11px] text-charcoal-muted">{staff.departmentName}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium capitalize text-charcoal-700">
                        {staff.contractType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                        {staff.startDate}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-charcoal-900">
                        {staff.endDate || 'Permanent'}
                      </td>
                      <td className="py-3 px-4">
                        {staff.contractType === 'permanent' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-emerald-700">
                            Permanent
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-rose-700">
                            Expires in &le;30d
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-amber-700">
                            Renewal Due (&le;60d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-charcoal-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(staff);
                              setIsDetailOpen(true);
                            }}
                            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200"
                            title="View Staff Details"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRenew(staff)}
                            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-charcoal-900 hover:bg-black text-white"
                            title="Renew or Extend Contract"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renew / Extend Contract Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title={selectedStaff ? `Renew Employment Contract — ${selectedStaff.fullName}` : 'Contract Extension'}
        description="Formal contract renewal, tenure adjustment, and effective end date extension."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setIsRenewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleExecuteRenewal} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Authorize Contract Extension'}
            </Button>
          </div>
        }
      >
        {selectedStaff && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div>Employee: <strong>{selectedStaff.fullName}</strong> ({selectedStaff.staffNumber})</div>
              <div>Department: <strong>{selectedStaff.departmentName}</strong></div>
              <div>Current Term: <strong>{selectedStaff.startDate}</strong> to <strong>{selectedStaff.endDate || 'None'}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Contract Tenure Type</label>
              <select
                value={newContractType}
                onChange={(e) => setNewContractType(e.target.value as ContractType)}
                className="w-full text-xs rounded border border-surface-border p-2 bg-white"
              >
                <option value="fixed_term">Fixed-Term Agreement (1 Year)</option>
                <option value="permanent">Permanent Appointment (Open-ended)</option>
                <option value="consultant">Specialist Consultant Contract</option>
                <option value="intern">Internship / Volunteer Agreement</option>
              </select>
            </div>

            {newContractType !== 'permanent' && (
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">New Effective End Date</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full text-xs rounded border border-surface-border p-2 bg-white"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">Renewal Administrative Notes</label>
              <textarea
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
                rows={3}
                className="w-full text-xs rounded border border-surface-border p-2 bg-white"
                placeholder="Include reference to performance appraisal, board resolution, or donor grant allocation..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Staff Dossier Detail Modal */}
      <StaffDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        onStaffUpdated={loadData}
      />
    </div>
  );
};

export default HrContractsPage;
