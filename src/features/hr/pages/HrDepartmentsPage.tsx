import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Layers,
  Eye,
  Shield,
  Download,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getStaffProfiles } from '../services/hrService';
import { StaffProfileRecord } from '../types/hr';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SkeletonTable } from '@/components/ui/Skeleton';

interface DepartmentItem {
  id: string;
  code: string;
  nameEn: string;
  nameSw: string;
  headName: string;
  headTitle: string;
  description: string;
  staffCount: number;
  isActive: boolean;
  lastUpdated: string;
}

interface PositionItem {
  id: string;
  code: string;
  title: string;
  departmentCode: string;
  departmentName: string;
  assignedStaffCount: number;
  reportsTo: string;
  status: 'active' | 'vacant' | 'frozen';
}

const STANDARD_POSITIONS: PositionItem[] = [
  { id: 'pos-1', code: 'POS-EXEC-01', title: 'Executive Director', departmentCode: 'EXEC', departmentName: 'Executive Office', assignedStaffCount: 1, reportsTo: 'Board of Directors', status: 'active' },
  { id: 'pos-2', code: 'POS-PRJ-01', title: 'Head of Programs / Project Manager', departmentCode: 'PRJ', departmentName: 'Programs & Delivery', assignedStaffCount: 1, reportsTo: 'Executive Director', status: 'active' },
  { id: 'pos-3', code: 'POS-PRJ-02', title: 'Senior Project Coordinator', departmentCode: 'PRJ', departmentName: 'Programs & Delivery', assignedStaffCount: 4, reportsTo: 'Project Manager', status: 'active' },
  { id: 'pos-4', code: 'POS-PRJ-03', title: 'Field Community Officer', departmentCode: 'PRJ', departmentName: 'Programs & Delivery', assignedStaffCount: 8, reportsTo: 'Project Coordinator', status: 'active' },
  { id: 'pos-5', code: 'POS-FIN-01', title: 'Finance Officer', departmentCode: 'FIN', departmentName: 'Finance & Operations', assignedStaffCount: 1, reportsTo: 'Executive Director', status: 'active' },
  { id: 'pos-6', code: 'POS-FIN-02', title: 'Assistant Accountant & Cashier', departmentCode: 'FIN', departmentName: 'Finance & Operations', assignedStaffCount: 2, reportsTo: 'Finance Officer', status: 'active' },
  { id: 'pos-7', code: 'POS-HR-01', title: 'HR Administrator', departmentCode: 'HR', departmentName: 'Human Resources', assignedStaffCount: 1, reportsTo: 'Executive Director', status: 'active' },
  { id: 'pos-8', code: 'POS-HR-02', title: 'HR & Administrative Assistant', departmentCode: 'HR', departmentName: 'Human Resources', assignedStaffCount: 2, reportsTo: 'HR Administrator', status: 'active' },
  { id: 'pos-9', code: 'POS-PROC-01', title: 'Procurement and Supply Officer', departmentCode: 'PROC', departmentName: 'Procurement & Logistics', assignedStaffCount: 1, reportsTo: 'Finance & Executive', status: 'active' },
  { id: 'pos-10', code: 'POS-ME-01', title: 'Monitoring and Evaluation Officer', departmentCode: 'ME', departmentName: 'Monitoring & Evaluation', assignedStaffCount: 1, reportsTo: 'Executive Director', status: 'active' },
  { id: 'pos-11', code: 'POS-ADMIN-01', title: 'System Administrator', departmentCode: 'ADMIN', departmentName: 'Information Systems', assignedStaffCount: 1, reportsTo: 'Executive Director', status: 'active' },
];

export const HrDepartmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>(STANDARD_POSITIONS);
  const [allStaff, setAllStaff] = useState<StaffProfileRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'hierarchy'>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ 'EXEC': true, 'PRJ': true, 'FIN': true, 'HR': true });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const staffRecords = await getStaffProfiles();
      setAllStaff(staffRecords);

      if (isSupabaseConfigured) {
        const { data: deptRows } = await supabase
          .from('departments')
          .select('*')
          .order('code');

        if (deptRows && deptRows.length > 0) {
          const merged = deptRows.map((r: any) => {
            const count = staffRecords.filter(
              (s) => s.departmentCode?.toUpperCase() === r.code?.toUpperCase() || s.departmentId === r.id
            ).length;
            const head = staffRecords.find(
              (s) =>
                (s.departmentCode?.toUpperCase() === r.code?.toUpperCase() || s.departmentId === r.id) &&
                (s.jobTitle?.toLowerCase().includes('director') ||
                  s.jobTitle?.toLowerCase().includes('head') ||
                  s.jobTitle?.toLowerCase().includes('manager') ||
                  s.jobTitle?.toLowerCase().includes('officer'))
            );

            return {
              id: r.id,
              code: r.code,
              nameEn: r.name_en,
              nameSw: r.name_sw,
              headName: head?.fullName || 'Designated Lead',
              headTitle: head?.jobTitle || `${r.code} Lead`,
              description: `${r.name_en} operational workforce and administrative unit.`,
              staffCount: count,
              isActive: r.is_active ?? true,
              lastUpdated: r.updated_at ? r.updated_at.split('T')[0] : '2026-10-15',
            };
          });
          setDepartments(merged);
        }
      }
    } catch (e) {
      console.warn('Departments telemetry notice:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (d) =>
        d.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.headName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  const filteredPositions = useMemo(() => {
    return positions.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [positions, searchQuery]);

  const toggleNode = (code: string) => {
    setExpandedNodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const departmentStaff = useMemo(() => {
    if (!selectedDepartment) return [];
    return allStaff.filter(
      (s) =>
        s.departmentCode?.toUpperCase() === selectedDepartment.code.toUpperCase() ||
        s.departmentId === selectedDepartment.id
    );
  }, [selectedDepartment, allStaff]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & Organizational Positions"
        subtitle="Workforce architecture, departmental hierarchies, position registers, and supervisory reporting lines."
        breadcrumbs={[
          { label: 'HR Dashboard', href: '/' },
          { label: 'Staff Directory', href: '/hr' },
          { label: 'Departments & Positions' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/staff/new')}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Staff Assignment
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/hr')}>
              <Users className="h-4 w-4 mr-1.5" />
              Staff Directory
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-surface-border gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'departments'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Building2 className="h-4 w-4 text-charcoal-700" />
          <span>Department Register ({departments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'positions'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Briefcase className="h-4 w-4 text-charcoal-700" />
          <span>Job Positions ({positions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'hierarchy'
              ? 'border-charcoal-900 text-charcoal-900 font-bold'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Layers className="h-4 w-4 text-charcoal-700" />
          <span>Organizational Structure</span>
        </button>
      </div>

      {/* Filter / Search Toolbar */}
      <div className="bg-white border border-surface-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="h-4 w-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments, codes, positions..."
            className="pl-9 pr-3 py-1.5 text-xs rounded border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-charcoal-500 w-full"
          />
        </div>
        <div className="text-xs text-charcoal-muted">
          Showing {activeTab === 'departments' ? filteredDepartments.length : filteredPositions.length} active records
        </div>
      </div>

      {/* TAB 1: Department Register */}
      {activeTab === 'departments' && (
        isLoading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : (
          <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                  <tr>
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Department Name</th>
                    <th className="py-2.5 px-4">Department Head</th>
                    <th className="py-2.5 px-4 text-center">Staff Count</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Last Updated</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-charcoal-800">
                        {dept.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-900">{dept.nameEn}</div>
                        <div className="text-xs text-charcoal-muted">{dept.nameSw}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs text-charcoal-800">{dept.headName}</div>
                        <div className="text-[11px] text-charcoal-muted">{dept.headTitle}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-xs text-charcoal-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-charcoal-800">
                          {dept.staffCount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-emerald-700">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-charcoal-500">
                        {dept.lastUpdated}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDepartment(dept);
                            setIsDetailOpen(true);
                          }}
                          className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-charcoal-800 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* TAB 2: Positions Register */}
      {activeTab === 'positions' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-4">Position Code</th>
                  <th className="py-2.5 px-4">Job Title</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Reporting Line</th>
                  <th className="py-2.5 px-4 text-center">Incumbents</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-charcoal-700">
                      {pos.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-charcoal-900 text-xs">
                      {pos.title}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-700">
                      {pos.departmentName}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-600">
                      {pos.reportsTo}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-xs text-charcoal-900">
                      {pos.assignedStaffCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-emerald-700">
                        {pos.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Organizational Hierarchy Tree */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white border border-surface-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-charcoal-900">Institutional Governance & Workforce Tree</h3>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Executive command structure, department reporting relationships, and operational reporting lines.
            </p>
          </div>

          <div className="space-y-4">
            {/* Executive Root */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-charcoal-700" />
                  <div>
                    <span className="text-xs font-mono font-bold text-charcoal-500 uppercase">Board of Governance & Leadership</span>
                    <h4 className="text-sm font-bold text-charcoal-900">Executive Office (EXEC)</h4>
                  </div>
                </div>
                <Badge variant="info">3 Key Personnel</Badge>
              </div>

              {/* Subordinate Departments Tree */}
              <div className="mt-4 pl-6 border-l-2 border-slate-300 space-y-3">
                {departments
                  .filter((d) => d.code !== 'EXEC')
                  .map((dept) => {
                    const isExpanded = !!expandedNodes[dept.code];
                    const staffInDept = allStaff.filter(
                      (s) => s.departmentCode?.toUpperCase() === dept.code.toUpperCase() || s.departmentId === dept.id
                    );

                    return (
                      <div key={dept.code} className="bg-white border border-surface-border rounded-lg p-3">
                        <div
                          className="flex items-center justify-between cursor-pointer select-none"
                          onClick={() => toggleNode(dept.code)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-charcoal-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-charcoal-600" />
                            )}
                            <div>
                              <span className="font-semibold text-xs text-charcoal-900">{dept.nameEn} ({dept.code})</span>
                              <span className="text-[11px] text-charcoal-muted ml-2">— Lead: {dept.headName}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-charcoal-600 font-semibold">{staffInDept.length} staff</span>
                        </div>

                        {/* Collapsible Staff Roster */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-surface-border pl-6 space-y-1.5">
                            {staffInDept.length === 0 ? (
                              <p className="text-[11px] text-charcoal-muted italic">No staff currently assigned.</p>
                            ) : (
                              staffInDept.map((s) => (
                                <div key={s.id} className="flex items-center justify-between text-xs py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-charcoal-500">{s.staffNumber}</span>
                                    <span className="font-medium text-charcoal-800">{s.fullName}</span>
                                    <span className="text-charcoal-muted text-[11px]">({s.jobTitle})</span>
                                  </div>
                                  <span className="text-[11px] font-mono text-charcoal-500">{s.contractType}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDepartment(null);
        }}
        title={selectedDepartment ? `${selectedDepartment.nameEn} (${selectedDepartment.code})` : 'Department Details'}
        description="Comprehensive departmental profile, reporting lines, and assigned workforce."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedDepartment && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
              <div className="font-semibold text-charcoal-900">Department Purpose:</div>
              <p className="text-charcoal-700">{selectedDepartment.description}</p>
              <div className="pt-2 flex items-center justify-between text-charcoal-600">
                <span>Designated Head: <strong>{selectedDepartment.headName}</strong></span>
                <span>Role: <strong>{selectedDepartment.headTitle}</strong></span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-600 mb-2">
                Assigned Personnel ({departmentStaff.length})
              </h4>
              <div className="max-h-60 overflow-y-auto divide-y divide-surface-border border border-surface-border rounded-lg">
                {departmentStaff.length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-muted">
                    No personnel assigned to this department yet.
                  </div>
                ) : (
                  departmentStaff.map((s) => (
                    <div key={s.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-semibold text-charcoal-900">{s.fullName}</div>
                        <div className="text-[11px] text-charcoal-muted">{s.jobTitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] text-charcoal-600">{s.staffNumber}</div>
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">Active</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HrDepartmentsPage;
