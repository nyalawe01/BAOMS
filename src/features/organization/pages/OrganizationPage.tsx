import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Briefcase,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  FileText,
  Edit3,
  Layers,
  CheckCircle2,
  Download,
  Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/features/auth/useAuth';
import { showSuccess, showWarning } from '@/lib/sweetAlert';

interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  head: string;
  headEmail: string;
  headPhone: string;
  staffCount: number;
  programs: string[];
  status: 'active' | 'restructuring';
  parentCode?: string;
  children?: DepartmentNode[];
  lastUpdated: string;
}

interface StrategicProgram {
  id: string;
  name: string;
  strategicObjective: string;
  description: string;
  responsibleDept: string;
  linkedProjectsCount: number;
  status: 'active' | 'scaling' | 'review';
  targetBeneficiaries: number;
}

const INITIAL_DEPARTMENTS: DepartmentNode[] = [
  {
    id: 'dept-exec',
    code: 'EXEC',
    name: 'Executive Office',
    head: 'Elisha Nyalawe',
    headEmail: 'director@babawatoto.org',
    headPhone: '+255 754 000 111',
    staffCount: 3,
    programs: ['Strategic Governance & Partnerships', 'Executive Oversight'],
    status: 'active',
    lastUpdated: '2026-10-14',
    children: [
      {
        id: 'dept-prog',
        code: 'PROG',
        name: 'Programs & Child Protection',
        head: 'Grace Mchome',
        headEmail: 'grace.mchome@babawatoto.org',
        headPhone: '+255 755 222 333',
        staffCount: 14,
        programs: ['Child Empowerment & Arts', 'Child Protection Outreach'],
        status: 'active',
        parentCode: 'EXEC',
        lastUpdated: '2026-10-15',
      },
      {
        id: 'dept-fin',
        code: 'FIN',
        name: 'Finance & Financial Accounting',
        head: 'Hamisi Bakari',
        headEmail: 'hamisi.bakari@babawatoto.org',
        headPhone: '+255 756 333 444',
        staffCount: 5,
        programs: ['Financial Sustainability & Grants Administration'],
        status: 'active',
        parentCode: 'EXEC',
        lastUpdated: '2026-10-16',
      },
      {
        id: 'dept-hr',
        code: 'HR',
        name: 'Human Resources & Administration',
        head: 'Elinami Munuo',
        headEmail: 'elinami.munuo@babawatoto.org',
        headPhone: '+255 757 444 555',
        staffCount: 4,
        programs: ['Workforce Capacity & Volunteer Engagement'],
        status: 'active',
        parentCode: 'EXEC',
        lastUpdated: '2026-10-17',
      },
      {
        id: 'dept-proc',
        code: 'PROC',
        name: 'Procurement & Logistics',
        head: 'Salim Juma',
        headEmail: 'salim.juma@babawatoto.org',
        headPhone: '+255 758 555 666',
        staffCount: 3,
        programs: ['Supply Chain & Center Asset Management'],
        status: 'active',
        parentCode: 'EXEC',
        lastUpdated: '2026-10-15',
      },
      {
        id: 'dept-me',
        code: 'ME',
        name: 'Monitoring, Evaluation & Learning',
        head: 'Amina Rashid',
        headEmail: 'amina.rashid@babawatoto.org',
        headPhone: '+255 759 666 777',
        staffCount: 4,
        programs: ['Impact Assessment & Data Quality Verification'],
        status: 'active',
        parentCode: 'EXEC',
        lastUpdated: '2026-10-16',
      },
    ],
  },
];

const INITIAL_PROGRAMS: StrategicProgram[] = [
  {
    id: 'prg-01',
    name: 'Child Development, Arts & Life Skills',
    strategicObjective: 'Provide holistic creative education and psycho-social empowerment to underprivileged children.',
    description: 'Operating community art centers, theater, traditional dance, and mental well-being circles for over 3,000 children annually.',
    responsibleDept: 'Programs & Child Protection',
    linkedProjectsCount: 3,
    status: 'active',
    targetBeneficiaries: 3500,
  },
  {
    id: 'prg-02',
    name: 'Community Child Protection & Safeguarding',
    strategicObjective: 'Prevent abuse, conduct street community rescue interventions, and strengthen family reintegration.',
    description: 'Direct response desks, legal advocacy, psycho-social counselling and emergency temporary foster placements.',
    responsibleDept: 'Programs & Child Protection',
    linkedProjectsCount: 2,
    status: 'scaling',
    targetBeneficiaries: 1800,
  },
  {
    id: 'prg-03',
    name: 'Youth Vocational & Economic Empowerment',
    strategicObjective: 'Equip out-of-school youth with market-driven skills, entrepreneurship mentorship, and toolkits.',
    description: 'Technical crafts, tailoring, multimedia design, and micro-grant revolving funding for youth collectives.',
    responsibleDept: 'Programs & Child Protection',
    linkedProjectsCount: 2,
    status: 'active',
    targetBeneficiaries: 850,
  },
  {
    id: 'prg-04',
    name: 'Institutional Governance & Accountability',
    strategicObjective: 'Maintain world-class donor transparency, statutory compliance, and data-driven project delivery.',
    description: 'Internal financial audit controls, automated workflow governance, and open community reporting.',
    responsibleDept: 'Executive Office & Finance',
    linkedProjectsCount: 1,
    status: 'active',
    targetBeneficiaries: 50,
  },
];

export const OrganizationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'structure' | 'departments' | 'programs' | 'records'>('profile');
  const [structureViewMode, setStructureViewMode] = useState<'chart' | 'list'>('chart');
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Editable Organization State
  const [orgProfile, setOrgProfile] = useState({
    name: 'Babawatoto Organization',
    registrationNumber: '00NGO/R/0812 (Tanzania NGO Act No. 24 of 2002)',
    taxNumber: 'TIN: 104-892-334 | VRN: 40-028819-K',
    mission: 'To empower vulnerable children, youth and their families through holistic creative arts, life skills education, community-based protection and economic opportunity.',
    vision: 'A society where every child and young person thrives with dignity, rights protected, and potential fully realized.',
    primaryEmail: 'info@babawatoto.org',
    secondaryEmail: 'director@babawatoto.org',
    primaryPhone: '+255 22 218 0432',
    secondaryPhone: '+255 754 390 120',
    website: 'https://babawatoto.org',
    physicalAddress: 'Plot 44, Msimbazi Street, Kariakoo Cultural Hub, Dar es Salaam, Tanzania',
    postalAddress: 'P.O. Box 71822, Dar es Salaam, Tanzania',
    lastUpdated: '2026-10-17',
  });

  const canEditOrg = isAdmin() || hasRole('executive_director');

  // Flattened departments for register
  const flatDepartments: DepartmentNode[] = [
    INITIAL_DEPARTMENTS[0],
    ...(INITIAL_DEPARTMENTS[0].children || []),
  ];

  const filteredDepartments = flatDepartments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(departmentSearch.toLowerCase()) ||
      d.head.toLowerCase().includes(departmentSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditProfileOpen(false);
    showSuccess('Organization Profile Updated', 'Official organizational details have been updated and timestamped.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        subtitle="Authoritative overview of organizational governance, institutional profile, department structure and strategic programs."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Organization' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/documents')}
              className="text-[#374151]"
            >
              <FileText className="h-4 w-4 mr-1.5 text-[#374151]" />
              Official Records
            </Button>
            {canEditOrg && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditProfileOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-1.5 text-[#111827]" />
                Edit Profile
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Bar */}
      <div className="border-b border-surface-border">
        <nav className="flex space-x-6">
          {[
            { id: 'profile', label: 'Organization Profile' },
            { id: 'structure', label: 'Organizational Structure' },
            { id: 'departments', label: 'Department Register' },
            { id: 'programs', label: 'Programs & Strategic Priorities' },
            { id: 'records', label: 'Official Documents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#D68904] text-charcoal-900 font-semibold'
                  : 'border-transparent text-charcoal-muted hover:text-charcoal-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: ORGANIZATION PROFILE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Legal & Identity Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-surface-border">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <img src="/logo.png" alt="BAOMS" className="h-10 w-10 object-contain" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900">{orgProfile.name}</h2>
                    <p className="text-xs font-mono text-charcoal-muted mt-0.5">
                      {orgProfile.registrationNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success">Fully Compliant NGO</Badge>
                      <span className="text-[11px] text-charcoal-muted font-mono">{orgProfile.taxNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-charcoal-muted block">Last Certified</span>
                  <span className="text-xs font-semibold text-charcoal-800 font-mono">{orgProfile.lastUpdated}</span>
                </div>
              </div>

              {/* Mission & Vision */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
                <div className="p-4 rounded-lg bg-slate-50/70 border border-surface-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-2">
                    Our Mission
                  </h3>
                  <p className="text-xs text-charcoal-700 leading-relaxed">
                    {orgProfile.mission}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50/70 border border-surface-border">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-2">
                    Our Vision
                  </h3>
                  <p className="text-xs text-charcoal-700 leading-relaxed">
                    {orgProfile.vision}
                  </p>
                </div>
              </div>

              {/* Core Strategic Pillars */}
              <div className="mt-6 pt-5 border-t border-surface-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900 mb-3">
                  Core Operational Values
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Child Safeguarding', desc: 'Zero tolerance for child harm or exploitation' },
                    { label: 'Accountability', desc: 'Rigorous open financial & audit integrity' },
                    { label: 'Community Participation', desc: 'Grassroots co-creation & youth leadership' },
                    { label: 'Inclusivity', desc: 'No discrimination based on gender or ability' },
                  ].map((pillar, idx) => (
                    <div key={idx} className="p-3 rounded-md bg-white border border-slate-200">
                      <span className="text-xs font-semibold text-charcoal-900 block">{pillar.label}</span>
                      <span className="text-[11px] text-charcoal-muted mt-1 block leading-tight">{pillar.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Governance & Leadership Summary */}
            <div className="bg-white border border-surface-border rounded-lg p-6 shadow-xs">
              <h3 className="text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#374151]" />
                Executive Leadership & Governance Structure
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-lg border border-surface-border bg-slate-50/50">
                  <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Executive Authority</span>
                  <p className="text-xs font-bold text-charcoal-900 mt-1">Executive Director</p>
                  <p className="text-[11px] text-[#D68904] font-medium">Elisha Nyalawe</p>
                  <p className="text-[10px] text-charcoal-muted font-mono mt-1">director@babawatoto.org</p>
                </div>
                <div className="p-3.5 rounded-lg border border-surface-border bg-slate-50/50">
                  <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Program Oversight</span>
                  <p className="text-xs font-bold text-charcoal-900 mt-1">Head of Programs</p>
                  <p className="text-[11px] text-[#D68904] font-medium">Grace Mchome</p>
                  <p className="text-[10px] text-charcoal-muted font-mono mt-1">grace.mchome@babawatoto.org</p>
                </div>
                <div className="p-3.5 rounded-lg border border-surface-border bg-slate-50/50">
                  <span className="text-[10px] font-bold text-charcoal-muted uppercase tracking-wider">Financial Governance</span>
                  <p className="text-xs font-bold text-charcoal-900 mt-1">Finance Director</p>
                  <p className="text-[11px] text-[#D68904] font-medium">Hamisi Bakari</p>
                  <p className="text-[10px] text-charcoal-muted font-mono mt-1">hamisi.bakari@babawatoto.org</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Contact & Official Addresses */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-surface-border rounded-lg p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-charcoal-900 pb-2 border-b border-surface-border flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#374151]" />
                Official Communications & Contact
              </h3>

              {/* Physical Location */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#374151]" /> Main Headquarters
                </span>
                <p className="text-xs font-medium text-charcoal-900 pl-5">
                  {orgProfile.physicalAddress}
                </p>
                <p className="text-[11px] text-charcoal-muted pl-5 font-mono">
                  {orgProfile.postalAddress}
                </p>
              </div>

              {/* Official Emails (Multi-channel) */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#374151]" /> Official Email Channels
                </span>
                <div className="pl-5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-700">General Secretariat:</span>
                    <a href={`mailto:${orgProfile.primaryEmail}`} className="font-mono text-[#D68904] hover:underline">
                      {orgProfile.primaryEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-700">Executive Office:</span>
                    <a href={`mailto:${orgProfile.secondaryEmail}`} className="font-mono text-[#D68904] hover:underline">
                      {orgProfile.secondaryEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Official Phones (Multi-channel) */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#374151]" /> Telephone Lines
                </span>
                <div className="pl-5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-700">Office Landline:</span>
                    <span className="font-mono text-charcoal-900">{orgProfile.primaryPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-700">Mobile / Urgent:</span>
                    <span className="font-mono text-charcoal-900">{orgProfile.secondaryPhone}</span>
                  </div>
                </div>
              </div>

              {/* Official Web Domain */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#374151]" /> Web Portal
                </span>
                <p className="text-xs pl-5 font-mono">
                  <a
                    href={orgProfile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D68904] hover:underline flex items-center gap-1"
                  >
                    {orgProfile.website}
                    <ExternalLink className="h-3 w-3 text-[#374151]" />
                  </a>
                </p>
              </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="bg-white border border-surface-border rounded-lg p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-900">
                Institutional Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded border border-slate-200 text-center">
                  <span className="text-2xl font-bold font-mono text-charcoal-900 block">5</span>
                  <span className="text-[11px] text-charcoal-muted">Departments</span>
                </div>
                <div className="p-3 rounded border border-slate-200 text-center">
                  <span className="text-2xl font-bold font-mono text-charcoal-900 block">33</span>
                  <span className="text-[11px] text-charcoal-muted">Total Staff</span>
                </div>
                <div className="p-3 rounded border border-slate-200 text-center">
                  <span className="text-2xl font-bold font-mono text-charcoal-900 block">4</span>
                  <span className="text-[11px] text-charcoal-muted">Core Programs</span>
                </div>
                <div className="p-3 rounded border border-slate-200 text-center">
                  <span className="text-2xl font-bold font-mono text-charcoal-900 block">8</span>
                  <span className="text-[11px] text-charcoal-muted">Active Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATIONAL STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-surface-border p-4 rounded-lg">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900">Institutional Hierarchy Chart</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Reporting lines from Executive Office to operational departments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={structureViewMode === 'chart' ? 'primary' : 'outline'}
                size="xs"
                onClick={() => setStructureViewMode('chart')}
              >
                Chart View
              </Button>
              <Button
                variant={structureViewMode === 'list' ? 'primary' : 'outline'}
                size="xs"
                onClick={() => setStructureViewMode('list')}
              >
                List View
              </Button>
            </div>
          </div>

          {structureViewMode === 'chart' ? (
            <div className="bg-white border border-surface-border rounded-lg p-8 shadow-xs overflow-x-auto">
              {/* Executive Office Apex Node */}
              <div className="flex flex-col items-center">
                <div className="w-80 p-4 rounded-lg border-2 border-[#D68904] bg-amber-500/5 text-center shadow-xs">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase bg-[#D68904] text-white px-2 py-0.5 rounded">
                    Apex Governance
                  </span>
                  <h3 className="text-sm font-bold text-charcoal-900 mt-2">Executive Office</h3>
                  <p className="text-xs font-semibold text-[#D68904] mt-0.5">Elisha Nyalawe (Executive Director)</p>
                  <div className="mt-2 text-[11px] text-charcoal-muted flex justify-center gap-4 border-t border-amber-200 pt-2">
                    <span>3 Staff Members</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">Active</span>
                  </div>
                </div>

                {/* Connecting Line */}
                <div className="w-0.5 h-8 bg-slate-300"></div>
                <div className="w-5/6 h-0.5 bg-slate-300"></div>

                {/* Department Level 1 Nodes */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6">
                  {(INITIAL_DEPARTMENTS[0].children || []).map((dept) => (
                    <div
                      key={dept.id}
                      className="p-4 rounded-lg border border-surface-border bg-white hover:border-[#D68904] transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                            {dept.code}
                          </span>
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <h4 className="text-xs font-bold text-charcoal-900 leading-snug">{dept.name}</h4>
                        <p className="text-[11px] text-[#D68904] font-medium mt-1 truncate">{dept.head}</p>
                        <p className="text-[10px] text-charcoal-muted font-mono truncate">{dept.headEmail}</p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-charcoal-muted">
                        <span>Staff: <strong className="text-charcoal-900 font-mono">{dept.staffCount}</strong></span>
                        <span className="text-emerald-700 font-medium">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Structured List View */
            <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
              <div className="p-4 border-b border-surface-border bg-slate-50/60 font-semibold text-xs text-charcoal-900">
                Departmental Reporting Hierarchies
              </div>
              <div className="divide-y divide-surface-border">
                {flatDepartments.map((dept) => (
                  <div key={dept.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-slate-100 text-slate-700 shrink-0">
                        <Building2 className="h-4 w-4 text-[#374151]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-charcoal-900">{dept.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            {dept.code}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-muted mt-0.5">
                          Head: <strong className="text-charcoal-800">{dept.head}</strong> ({dept.headEmail})
                        </p>
                        {dept.programs && dept.programs.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {dept.programs.map((p, i) => (
                              <span key={i} className="text-[10px] bg-amber-50 text-[#D68904] px-1.5 py-0.2 rounded border border-amber-200">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-charcoal-muted">Staff: <strong className="text-charcoal-900 font-mono">{dept.staffCount}</strong></span>
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEPARTMENT REGISTER */}
      {activeTab === 'departments' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs space-y-0">
          {/* Filter Toolbar */}
          <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#374151]" />
              <input
                type="text"
                placeholder="Search departments or heads..."
                value={departmentSearch}
                onChange={(e) => setDepartmentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs bg-white text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 py-1.5 px-3 text-xs bg-white text-charcoal-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="restructuring">Restructuring</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Department Name & Code</th>
                  <th className="py-3 px-4">Department Head</th>
                  <th className="py-3 px-4 text-center">Staff Count</th>
                  <th className="py-3 px-4">Associated Programs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-charcoal-900">{dept.name}</div>
                      <div className="text-[11px] font-mono text-charcoal-muted mt-0.5">{dept.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-charcoal-800">{dept.head}</div>
                      <div className="text-[11px] font-mono text-charcoal-muted">{dept.headEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-charcoal-900">
                      {dept.staffCount}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {dept.programs.map((p, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted">
                      {dept.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROGRAMS & STRATEGIC PRIORITIES */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="bg-white border border-surface-border rounded-lg p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900">Strategic Programs Register</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Multi-year programmatic initiatives driving organizational impact targets
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              <Briefcase className="h-3.5 w-3.5 mr-1.5 text-[#374151]" />
              View Linked Projects
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {INITIAL_PROGRAMS.map((prog) => (
              <div
                key={prog.id}
                className="bg-white border border-surface-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:border-[#D68904] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D68904] bg-amber-500/10 px-2 py-0.5 rounded">
                      {prog.responsibleDept}
                    </span>
                    <Badge variant={prog.status === 'active' ? 'success' : 'info'}>
                      {prog.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-charcoal-900 leading-snug">{prog.name}</h3>
                  <p className="text-xs font-medium text-slate-600 mt-2 italic">
                    "{prog.strategicObjective}"
                  </p>
                  <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-charcoal-muted">Target Beneficiaries: </span>
                    <strong className="text-charcoal-900 font-mono">{prog.targetBeneficiaries.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-charcoal-muted">Projects: </span>
                    <strong className="text-[#D68904] font-mono">{prog.linkedProjectsCount} Active</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: OFFICIAL ORGANIZATIONAL RECORDS */}
      {activeTab === 'records' && (
        <div className="bg-white border border-surface-border rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 border-b border-surface-border bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-charcoal-900">Approved Institutional Records</h2>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Foundational legal certificates, board resolutions, and registration documents
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/documents')}>
              <FileText className="h-3.5 w-3.5 mr-1.5 text-[#374151]" />
              Document Registry
            </Button>
          </div>

          <div className="divide-y divide-surface-border">
            {[
              {
                title: 'Certificate of NGO Registration (Tanzania NGO Board)',
                ref: 'CERT-NGO-2002-0812',
                category: 'Governance & Legal',
                date: '2024-01-15',
                status: 'Verified Valid',
              },
              {
                title: 'Babawatoto Approved Organizational Constitution & By-Laws',
                ref: 'DOC-CONST-2023-V2',
                category: 'Constitution & Charters',
                date: '2023-11-20',
                status: 'Executive Certified',
              },
              {
                title: 'TRA Tax Exemption & TIN Certificate',
                ref: 'TAX-TIN-104-892-334',
                category: 'Tax & Compliance',
                date: '2025-06-30',
                status: 'Valid',
              },
              {
                title: 'Annual NGO Compliance Return Acknowledgement',
                ref: 'RET-NGO-2025-Q4',
                category: 'Statutory Reports',
                date: '2026-02-10',
                status: 'Filed & Cleared',
              },
            ].map((rec, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-100 text-[#374151]">
                    <FileText className="h-4 w-4 text-[#374151]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-charcoal-900">{rec.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-charcoal-muted font-mono">
                      <span>{rec.ref}</span>
                      <span>•</span>
                      <span>{rec.category}</span>
                      <span>•</span>
                      <span>Filed: {rec.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="success">{rec.status}</Badge>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => navigate('/documents')}
                    className="text-[#374151]"
                  >
                    View Record <ChevronRight className="h-3 w-3 ml-1 text-[#374151]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT ORGANIZATION PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg border border-surface-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#374151]" />
                Edit Official Organization Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Organization Legal Name</label>
                <input
                  type="text"
                  value={orgProfile.name}
                  onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Registration Certificate Number</label>
                  <input
                    type="text"
                    value={orgProfile.registrationNumber}
                    onChange={(e) => setOrgProfile({ ...orgProfile, registrationNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Tax / TIN Identification</label>
                  <input
                    type="text"
                    value={orgProfile.taxNumber}
                    onChange={(e) => setOrgProfile({ ...orgProfile, taxNumber: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Mission Statement</label>
                <textarea
                  rows={2}
                  value={orgProfile.mission}
                  onChange={(e) => setOrgProfile({ ...orgProfile, mission: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Vision Statement</label>
                <textarea
                  rows={2}
                  value={orgProfile.vision}
                  onChange={(e) => setOrgProfile({ ...orgProfile, vision: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Primary Email (Official)</label>
                  <input
                    type="email"
                    value={orgProfile.primaryEmail}
                    onChange={(e) => setOrgProfile({ ...orgProfile, primaryEmail: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Secondary Email (Executive)</label>
                  <input
                    type="email"
                    value={orgProfile.secondaryEmail}
                    onChange={(e) => setOrgProfile({ ...orgProfile, secondaryEmail: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Main Phone Line</label>
                  <input
                    type="text"
                    value={orgProfile.primaryPhone}
                    onChange={(e) => setOrgProfile({ ...orgProfile, primaryPhone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Secondary Phone Line</label>
                  <input
                    type="text"
                    value={orgProfile.secondaryPhone}
                    onChange={(e) => setOrgProfile({ ...orgProfile, secondaryPhone: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Physical Office Address</label>
                <input
                  type="text"
                  value={orgProfile.physicalAddress}
                  onChange={(e) => setOrgProfile({ ...orgProfile, physicalAddress: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded text-xs bg-white text-charcoal-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-surface-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditProfileOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
