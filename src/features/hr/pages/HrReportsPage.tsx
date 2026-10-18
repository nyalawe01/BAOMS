import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Users,
  Building,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  PieChart,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getStaffProfiles, getLeaveRequests } from '../services/hrService';
import { StaffProfileRecord, LeaveRequestRecord } from '../types/hr';

type ReportType =
  | 'workforce_summary'
  | 'department_distribution'
  | 'contract_expiry'
  | 'leave_utilization'
  | 'statutory_compliance';

export const HrReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<StaffProfileRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportType>('workforce_summary');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sList, lList] = await Promise.all([
        getStaffProfiles(),
        getLeaveRequests(),
      ]);
      setStaffList(sList);
      setLeaveRequests(lList);
    } catch (e) {
      console.warn('Reports loading notice:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Department Aggregations
  const deptCounts = useMemo(() => {
    const map: Record<string, number> = {};
    staffList.forEach((s) => {
      const d = s.departmentName || 'General';
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [staffList]);

  // Contract Type Aggregations
  const contractCounts = useMemo(() => {
    const map: Record<string, number> = {};
    staffList.forEach((s) => {
      const c = s.contractType || 'fixed_term';
      map[c] = (map[c] || 0) + 1;
    });
    return map;
  }, [staffList]);

  // Statutory Completeness
  const completeStatutoryCount = staffList.filter(
    (s) => s.nidaNumber && s.bankAccountNumber && (s.nssfNumber || s.pssfNumber)
  ).length;

  const exportCurrentReport = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const dateStr = new Date().toISOString().split('T')[0];

    if (selectedReport === 'workforce_summary') {
      headers = ['Staff Number', 'Full Name', 'Department', 'Job Title', 'Employment Status', 'Contract Type', 'Start Date'];
      rows = staffList.map((s) => [
        s.staffNumber,
        `"${s.fullName}"`,
        `"${s.departmentName}"`,
        `"${s.jobTitle}"`,
        s.employmentStatus,
        s.contractType,
        s.startDate,
      ]);
    } else if (selectedReport === 'department_distribution') {
      headers = ['Department Name', 'Total Staff Count', 'Percentage of Workforce'];
      const total = staffList.length || 1;
      rows = Object.entries(deptCounts).map(([name, count]) => [
        `"${name}"`,
        count,
        `${((count / total) * 100).toFixed(1)}%`,
      ]);
    } else if (selectedReport === 'contract_expiry') {
      headers = ['Staff Number', 'Full Name', 'Department', 'End Date', 'Days to Expiry', 'Status'];
      rows = staffList
        .filter((s) => s.endDate)
        .map((s) => [
          s.staffNumber,
          `"${s.fullName}"`,
          `"${s.departmentName}"`,
          s.endDate || '',
          s.daysToContractExpiry ?? '',
          s.isExpiringSoon ? 'Renewal Due' : 'Active',
        ]);
    } else if (selectedReport === 'leave_utilization') {
      headers = ['Request Ref', 'Staff Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days Requested', 'Status'];
      rows = leaveRequests.map((l) => [
        l.requestNumber,
        `"${l.staffName}"`,
        `"${l.staffDepartment}"`,
        `"${l.leaveTypeName}"`,
        l.startDate,
        l.endDate,
        l.daysRequested,
        l.status,
      ]);
    } else {
      headers = ['Staff Number', 'Full Name', 'Department', 'NIDA Filed', 'Bank Filed', 'NSSF Filed', 'Completeness'];
      rows = staffList.map((s) => [
        s.staffNumber,
        `"${s.fullName}"`,
        `"${s.departmentName}"`,
        s.nidaNumber ? 'YES' : 'NO',
        s.bankAccountNumber ? 'YES' : 'NO',
        s.nssfNumber || s.pssfNumber ? 'YES' : 'NO',
        s.nidaNumber && s.bankAccountNumber ? '100%' : 'Incomplete',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BAOMS_${selectedReport}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Reports & Workforce Analytics Engine"
        subtitle="Consolidated human resource audits, departmental headcount breakdowns, contract forecast reports, and statutory compliance filings."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'HR Reports & Analytics' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={exportCurrentReport}>
              <Download className="h-4 w-4 mr-1.5" />
              Export Report (CSV)
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Total Workforce</span>
            <Users className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {staffList.length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Registered employees across depts
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Departments</span>
            <Building className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {Object.keys(deptCounts).length}
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Active operational units
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Statutory Compliance</span>
            <CheckCircle2 className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-emerald-700">
            {staffList.length > 0 ? Math.round((completeStatutoryCount / staffList.length) * 100) : 0}%
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Verified NIDA, TIN, NSSF & bank accounts
          </p>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            <span>Leave Utilization</span>
            <Clock className="h-4 w-4 text-charcoal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums leading-tight text-charcoal-900">
            {leaveRequests.filter((l) => l.status === 'approved').reduce((acc, curr) => acc + curr.daysRequested, 0)}d
          </div>
          <p className="mt-1 text-xs text-charcoal-muted truncate">
            Approved absence days taken this year
          </p>
        </div>
      </div>

      {/* Report Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { id: 'workforce_summary', label: 'Workforce Master', icon: Users, desc: 'Complete staff roster audit' },
          { id: 'department_distribution', label: 'Staff by Dept', icon: Building, desc: 'Headcount distribution' },
          { id: 'contract_expiry', label: 'Contract Expiry', icon: FileText, desc: 'Renewal & end dates' },
          { id: 'leave_utilization', label: 'Leave Analytics', icon: Clock, desc: 'Absences & balances' },
          { id: 'statutory_compliance', label: 'Statutory Audit', icon: CheckCircle2, desc: 'NIDA, NSSF & tax files' },
        ].map((item) => {
          const isSelected = selectedReport === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedReport(item.id as ReportType)}
              className={`p-3.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-charcoal-900 bg-slate-50 ring-1 ring-charcoal-900'
                  : 'border-surface-border bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-charcoal-700" />
                <span className="font-bold text-xs text-charcoal-900">{item.label}</span>
              </div>
              <p className="text-[11px] text-charcoal-muted mt-1 leading-snug">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Report Workspace */}
      <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-muted/20">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900">
              {selectedReport === 'workforce_summary' && 'Workforce Master Register Audit'}
              {selectedReport === 'department_distribution' && 'Departmental Staff Headcount Breakdown'}
              {selectedReport === 'contract_expiry' && 'Employment Contract Expiry & Renewal Forecast'}
              {selectedReport === 'leave_utilization' && 'Staff Leave Applications & Absence Analytics'}
              {selectedReport === 'statutory_compliance' && 'Statutory Compliance & Dossier Completeness'}
            </h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Live data from PostgreSQL Supabase backend. Formatted for institutional reporting.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={exportCurrentReport}>
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV Export
          </Button>
        </div>

        {/* Dynamic Table Rendering */}
        <div className="overflow-x-auto">
          {selectedReport === 'workforce_summary' && (
            <table className="w-full text-left text-sm min-w-[750px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Number</th>
                  <th className="py-2.5 px-4">Full Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Job Title</th>
                  <th className="py-2.5 px-4">Contract Type</th>
                  <th className="py-2.5 px-4">Start Date</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="py-2.5 px-4 font-mono font-bold text-charcoal-700">{s.staffNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-charcoal-900">{s.fullName}</td>
                    <td className="py-2.5 px-4 text-charcoal-700">{s.departmentName}</td>
                    <td className="py-2.5 px-4 text-charcoal-800">{s.jobTitle}</td>
                    <td className="py-2.5 px-4 capitalize text-charcoal-600">{s.contractType.replace('_', ' ')}</td>
                    <td className="py-2.5 px-4 font-mono text-charcoal-600">{s.startDate}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'department_distribution' && (
            <table className="w-full text-left text-sm min-w-[500px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Department Name</th>
                  <th className="py-2.5 px-4 text-center">Personnel Headcount</th>
                  <th className="py-2.5 px-4">Workforce Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {Object.entries(deptCounts).map(([name, count]) => {
                  const pct = Math.round((count / (staffList.length || 1)) * 100);
                  return (
                    <tr key={name} className="hover:bg-slate-50/50 text-xs">
                      <td className="py-3 px-4 font-semibold text-charcoal-900">{name}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-charcoal-900">{count} staff</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-xs overflow-hidden">
                            <div className="bg-charcoal-800 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono text-charcoal-600 font-bold">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {selectedReport === 'contract_expiry' && (
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Contract End Date</th>
                  <th className="py-2.5 px-4">Days to Expiration</th>
                  <th className="py-2.5 px-4 text-right">Tenure Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {staffList.filter((s) => s.endDate).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-charcoal-900">{s.fullName}</div>
                      <div className="font-mono text-[11px] text-charcoal-muted">{s.staffNumber}</div>
                    </td>
                    <td className="py-2.5 px-4 text-charcoal-700">{s.departmentName}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-charcoal-900">{s.endDate}</td>
                    <td className="py-2.5 px-4 font-mono text-charcoal-700">{s.daysToContractExpiry ?? 'N/A'} days</td>
                    <td className="py-2.5 px-4 text-right">
                      {s.isExpiringSoon ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Renewal Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-charcoal-700">
                          Active Term
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'leave_utilization' && (
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Leave Type</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4 text-center">Days</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {leaveRequests.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 text-xs">
                    <td className="py-2.5 px-4 font-mono font-bold text-charcoal-700">{l.requestNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-charcoal-900">{l.staffName}</td>
                    <td className="py-2.5 px-4 text-charcoal-700">{l.staffDepartment}</td>
                    <td className="py-2.5 px-4 text-charcoal-800">{l.leaveTypeName}</td>
                    <td className="py-2.5 px-4 font-mono text-charcoal-600">{l.startDate} to {l.endDate}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-charcoal-900">{l.daysRequested}d</td>
                    <td className="py-2.5 px-4 text-right capitalize font-semibold">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'statutory_compliance' && (
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4 text-center">NIDA Number</th>
                  <th className="py-2.5 px-4 text-center">Bank Account</th>
                  <th className="py-2.5 px-4 text-center">NSSF / Social Security</th>
                  <th className="py-2.5 px-4 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {staffList.map((s) => {
                  const isComplete = s.nidaNumber && s.bankAccountNumber && (s.nssfNumber || s.pssfNumber);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 text-xs">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-charcoal-900">{s.fullName}</div>
                        <div className="font-mono text-[11px] text-charcoal-muted">{s.staffNumber}</div>
                      </td>
                      <td className="py-2.5 px-4 text-charcoal-700">{s.departmentName}</td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {s.nidaNumber ? <span className="text-emerald-700 font-bold">✓ Filed</span> : <span className="text-rose-600 italic">Missing</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {s.bankAccountNumber ? <span className="text-emerald-700 font-bold">✓ Filed</span> : <span className="text-rose-600 italic">Missing</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono">
                        {s.nssfNumber || s.pssfNumber ? <span className="text-emerald-700 font-bold">✓ Filed</span> : <span className="text-rose-600 italic">Missing</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isComplete ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            100% Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800">
                            Action Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default HrReportsPage;
