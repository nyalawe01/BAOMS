import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Plus, Send, FileText, Briefcase, FileSpreadsheet, 
  Calendar, Clipboard, BookOpen, Shield, Trash2, ChevronRight, 
  Search, Check, X, ChevronDown, Bell, Upload, Download, Eye, 
  AlertCircle, MapPin, Mail, Phone, ShieldAlert, FileClock, DollarSign, 
  ExternalLink, Layers, Clock, Settings, Package, Activity, Info, TrendingUp
} from 'lucide-react';
import Swal from 'sweetalert2';

// ============================================================================
// 1. M&E DASHBOARD VIEW
// ============================================================================

// Maps an achievement percentage (0-100+) to a semantic heatmap tile color scale.
const getHeatmapTileClass = (rawPct) => {
  if (rawPct >= 100) return 'bg-emerald-600 text-white border-emerald-700';
  if (rawPct >= 70) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (rawPct >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-rose-100 text-rose-700 border-rose-200';
};

export function MEDashboardView() {
  const { projects, indicators } = useProject();

  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  const totalBeneficiaries = projects.reduce((acc, curr) => acc + (curr.beneficiaryCount || 150), 0);

  const indicatorsRegistered = indicators.length;
  const indicatorsAchieved = indicators.filter(i => (i.achieved || 0) >= (i.target || 0) && (i.target || 0) > 0).length;
  const achievementRate = indicatorsRegistered > 0 ? Math.round((indicatorsAchieved / indicatorsRegistered) * 100) : 0;

  const kpis = [
    { label: 'Active Projects', value: activeProjectsCount },
    { label: 'Indicators Registered', value: indicatorsRegistered },
    { label: 'Indicators Achieved', value: indicatorsAchieved },
    { label: 'Achievement Rate', value: `${achievementRate}%` },
    { label: 'Beneficiaries Reached', value: totalBeneficiaries.toLocaleString() },
    { label: 'Data Collection Forms', value: 86 },
    { label: 'Reports Due', value: 5 },
    { label: 'Communities Covered', value: 43 }
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-200">
        <h2 className="text-lg font-normal flex items-center gap-2">
          <Activity className="text-slate-400" />
          <span>Monitoring & Evaluation Performance Panel</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1 font-normal">Measure project indicators, analyze outreach surveys, and audit demographic dataset validity.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all">
            <span className="text-[11px] font-normal text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            <span className="text-xl font-normal text-slate-808 mt-4 block">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Indicator Achievement Heatmap */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <h3 className="font-normal text-slate-850 text-sm">Indicator Achievement Heatmap</h3>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 uppercase tracking-wider font-normal">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-200"></span>
              Under 40%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-200"></span>
              40-70%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-200"></span>
              70-100%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
              100%+
            </span>
          </div>
        </div>
        {indicators.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 italic">
            No indicators registered yet. Add indicators to see the achievement heatmap.
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {indicators.map((ind) => {
              const targetVal = ind.target || 0;
              const achievedVal = ind.achieved || 0;
              const rawPct = targetVal > 0 ? (achievedVal / targetVal) * 100 : 0;
              const displayPct = Math.round(rawPct);
              const unitSuffix = ind.unit ? ` ${ind.unit}` : '';

              return (
                <div
                  key={ind.id}
                  title={`${ind.name}\nTarget: ${targetVal}${unitSuffix}\nAchieved: ${achievedVal}${unitSuffix}\nAchievement: ${displayPct}%`}
                  className={`aspect-square rounded-md border px-1.5 py-1.5 flex flex-col items-center justify-center text-center gap-0.5 transition-transform hover:scale-105 ${getHeatmapTileClass(rawPct)}`}
                >
                  <span className="text-[11px] font-normal leading-tight line-clamp-2 break-words">{ind.name}</span>
                  <span className="text-[11px] font-normal">{displayPct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-850 text-sm border-b border-slate-100 pb-2">Project Performance Tracker</h3>
          <div className="space-y-4">
            {projects.map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-700 font-normal">
                  <span>{p.name}</span>
                  <span>{p.progress || 0}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full" style={{ width: `${p.progress || 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-normal text-slate-850 text-sm border-b border-slate-100 pb-2">Upcoming Performance Reports</h3>
          <div className="divide-y divide-slate-100 text-xs font-normal">
            <div className="py-2.5 flex justify-between items-center">
              <span>Quarterly Outreach Report</span>
              <span className="text-slate-500">Due in 4 Days</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span>Donor Grant Report</span>
              <span className="text-slate-500">Due Tomorrow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. PROJECTS MODULE
// ============================================================================
export function MEProjectsView() {
  const { projects } = useProject();

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Projects Activity Monitoring</h2>
        <p className="text-xs text-slate-400 font-normal">Monitor and evaluate ongoing project progress and outputs.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Project</th>
              <th className="p-3">Start Date</th>
              <th className="p-3">End Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Target Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {projects.map((proj, idx) => (
              <tr key={proj.id || idx}>
                <td className="p-3 font-normal text-slate-808">{proj.name}</td>
                <td className="p-3 font-mono text-[11px] text-slate-400">{proj.startDate}</td>
                <td className="p-3 font-mono text-[11px] text-slate-400">{proj.endDate}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                    {proj.status}
                  </span>
                </td>
                <td className="p-3 font-normal text-slate-800">{proj.progress || 0}% Achieved</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 3. INDICATORS MODULE
// ============================================================================
export function MEIndicatorsView() {
  const { indicators, addIndicator, updateIndicator, deleteIndicator, projects } = useProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [projectId, setProjectId] = useState('');
  const [achievedDrafts, setAchievedDrafts] = useState({});

  const handleAddIndicator = (e) => {
    e.preventDefault();
    if (!name || !target) return;

    addIndicator({ name, description, target, achieved: 0, unit, projectId });

    setName('');
    setDescription('');
    setTarget('');
    setUnit('');
    setProjectId('');
    Swal.fire('Indicator Registered', 'Successfully added indicator to the performance matrix.', 'success');
  };

  const handleAchievedChange = (id, value) => {
    setAchievedDrafts(prev => ({ ...prev, [id]: value }));
  };

  const handleAchievedCommit = (ind) => {
    if (achievedDrafts[ind.id] === undefined) return;
    const parsed = parseFloat(achievedDrafts[ind.id]) || 0;
    setAchievedDrafts(prev => {
      const next = { ...prev };
      delete next[ind.id];
      return next;
    });
    if (parsed !== (ind.achieved || 0)) {
      updateIndicator(ind.id, { achieved: parsed });
    }
  };

  const handleDelete = (ind) => {
    Swal.fire({
      title: 'Remove Indicator?',
      text: `This will permanently remove "${ind.name}" from the performance matrix.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove'
    }).then(res => {
      if (res.isConfirmed) {
        deleteIndicator(ind.id);
      }
    });
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Performance Indicators Matrix</h2>
        <p className="text-xs text-slate-400 font-normal">Define targets and track achieved values across program outputs and outcomes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Indicator Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Add New Indicator</span>
          <form onSubmit={handleAddIndicator} className="space-y-3 font-normal">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Indicator Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Children receiving educational aid" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Definition / notes..." rows="2" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Target</label>
                <input type="number" required min="0" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 1500" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Unit</label>
                <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. children" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Project (Optional)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="">Unassigned</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Add Indicator</button>
          </form>
        </div>

        {/* Indicators List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Indicator Name</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Achieved</th>
                  <th className="p-3">Achievement %</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {indicators.map((ind) => {
                  const targetVal = ind.target || 0;
                  const achievedVal = ind.achieved || 0;
                  const pct = targetVal > 0 ? Math.round((achievedVal / targetVal) * 100) : 0;
                  const draftValue = achievedDrafts[ind.id] !== undefined ? achievedDrafts[ind.id] : achievedVal;

                  return (
                    <tr key={ind.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-normal text-slate-808">
                        <span className="block">{ind.name}</span>
                        {ind.description && <span className="block text-[11px] text-slate-400 mt-0.5 font-normal">{ind.description}</span>}
                      </td>
                      <td className="p-3 text-slate-600">{getProjectName(ind.projectId)}</td>
                      <td className="p-3 text-slate-500 font-normal">{ind.unit || '-'}</td>
                      <td className="p-3 text-slate-600 font-mono">{targetVal}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={draftValue}
                          onChange={(e) => handleAchievedChange(ind.id, e.target.value)}
                          onBlur={() => handleAchievedCommit(ind)}
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-xs font-normal"
                        />
                      </td>
                      <td className="p-3 font-normal text-slate-700">{pct}%</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDelete(ind)} className="text-slate-400 hover:text-red-600 transition-colors" title="Remove indicator">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {indicators.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 italic">No indicators registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. TARGETS MODULE
// ============================================================================
export function METargetsView() {
  const { indicators, projects } = useProject();

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Indicator Target Achievement</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Compare registered targets against achieved values across program indicators.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Target Performance Indicator</th>
              <th className="p-3">Project</th>
              <th className="p-3">Target</th>
              <th className="p-3">Achieved</th>
              <th className="p-3">Variance</th>
              <th className="p-3">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 font-normal text-slate-700">
            {indicators.map((ind) => {
              const targetVal = ind.target || 0;
              const achievedVal = ind.achieved || 0;
              const variance = achievedVal - targetVal;
              const pct = targetVal > 0 ? Math.round((achievedVal / targetVal) * 100) : 0;

              return (
                <tr key={ind.id}>
                  <td className="p-3 font-normal text-slate-808">{ind.name}</td>
                  <td className="p-3 text-slate-600">{getProjectName(ind.projectId)}</td>
                  <td className="p-3 font-mono">{targetVal}</td>
                  <td className="p-3 font-mono">{achievedVal}</td>
                  <td className="p-3 font-mono">{variance >= 0 ? `+${variance}` : variance}</td>
                  <td className="p-3 font-mono">{pct}%</td>
                </tr>
              );
            })}
            {indicators.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-12 text-slate-400 italic">No indicators registered yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 5. BENEFICIARIES MODULE
// ============================================================================
export function MEBeneficiariesView() {
  const { beneficiaries, projects, addBeneficiary, deleteBeneficiary } = useProject();

  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Child');
  const [projectId, setProjectId] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const handleEnroll = (e) => {
    e.preventDefault();
    if (!name || !age || !location || !consentGiven) return;

    addBeneficiary({
      name, gender, age, location, category, projectId,
      consentGiven: true,
      consentDate: new Date().toISOString().substring(0, 10)
    });

    setName('');
    setAge('');
    setLocation('');
    setProjectId('');
    setConsentGiven(false);
    Swal.fire('Beneficiary Enrolled', 'Successfully registered beneficiary in Firestore database.', 'success');
  };

  const handleDelete = (ben) => {
    Swal.fire({
      title: 'Remove Beneficiary?',
      text: `This will permanently remove "${ben.name}" from the registry.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove'
    }).then(res => {
      if (res.isConfirmed) {
        deleteBeneficiary(ben.id);
      }
    });
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Enrolled Beneficiaries Registry</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Track registered children, youth, and women participating in programmatic outputs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrollment Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Enroll New Beneficiary</span>
          <form onSubmit={handleEnroll} className="space-y-3 font-normal">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Karanja Mwangi" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 uppercase mb-1">Age</label>
                <input type="number" required min="0" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 15" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Location / Region</label>
              <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dar es Salaam" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="Child">Child</option>
                <option value="Youth">Youth</option>
                <option value="Woman">Woman</option>
                <option value="Elderly">Elderly</option>
                <option value="Person with Disability">Person with Disability</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Project (Optional)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="">Unassigned</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <label className="flex items-start gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-500 w-3.5 h-3.5 shrink-0"
                />
                <span className="text-[11px] leading-snug">I confirm this individual (or their guardian) has been informed about how their data will be used and has consented to enrollment.</span>
              </label>
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Enroll Beneficiary</button>
          </form>
        </div>

        {/* Registry List */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Name</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Consent</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {beneficiaries.map((ben, idx) => (
                  <tr key={ben.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-normal text-slate-808">{ben.name}</td>
                    <td className="p-3 font-mono">{ben.age}</td>
                    <td className="p-3 text-slate-600">{ben.gender}</td>
                    <td className="p-3 text-slate-600">{ben.location}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                        {ben.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{getProjectName(ben.projectId)}</td>
                    <td className="p-3">
                      {ben.consentGiven ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-emerald-50 text-emerald-700 border-emerald-200" title={ben.consentDate ? `Consent captured ${ben.consentDate}` : 'Consent captured'}>
                          <Check size={10} />
                          Consent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-rose-50 text-rose-700 border-rose-200" title="No consent on record">
                          <AlertCircle size={10} />
                          None
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(ben)} className="text-slate-400 hover:text-red-600 transition-colors" title="Remove beneficiary">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {beneficiaries.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400 italic">No beneficiaries enrolled yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. DATA COLLECTION MODULE
// ============================================================================
export function MECollectionView() {
  const { fieldVisits, projects, addFieldVisit } = useProject();

  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState('');
  const [gpsSimulated, setGpsSimulated] = useState({ latitude: -6.7924, longitude: 39.2083 });

  const handleRandomizeGPS = () => {
    setGpsSimulated({
      latitude: -6.7924 + (Math.random() - 0.5) * 0.05,
      longitude: 39.2083 + (Math.random() - 0.5) * 0.05
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes) return;
    addFieldVisit({
      notes,
      projectId,
      gpsLocation: gpsSimulated,
      visitDate: new Date().toISOString().substring(0, 10)
    });
    setNotes('');
    setProjectId('');
    Swal.fire('Logged!', 'Field data collection entry saved.', 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Electronic Data Collections Log</h2>
        <p className="text-xs text-slate-400 font-normal">Review logs for digital baseline, school assessments, and community intakes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 lg:col-span-1">
          <h3 className="font-normal text-slate-808 text-sm">Log Field Data</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-normal text-slate-400 uppercase mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-normal text-slate-400 uppercase mb-1">Notes / Description</label>
              <textarea
                required
                placeholder="Describe the data collected (survey form, submissions, district)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="3"
              />
            </div>

            <div className="bg-slate-50 rounded border border-slate-150 p-3 text-xs space-y-2">
              <span className="font-normal text-slate-700 block flex items-center gap-1">
                <MapPin size={14} className="text-slate-500" />
                <span>Simulated GPS Coordinates</span>
              </span>
              <div className="font-mono text-[11px] text-slate-600">
                Lat: {gpsSimulated.latitude.toFixed(6)} <br />
                Lon: {gpsSimulated.longitude.toFixed(6)}
              </div>
              <button
                type="button"
                onClick={handleRandomizeGPS}
                className="text-[11px] bg-slate-200 text-slate-700 py-0.5 px-2 rounded hover:bg-slate-350"
              >
                Change Geolocation
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal"
            >
              Submit Collection
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden lg:col-span-2">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
                <th className="p-3">Collection Date</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Officer</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {fieldVisits.map((log) => (
                <tr key={log.id}>
                  <td className="p-3 font-mono text-[11px] text-slate-400">{log.visitDate}</td>
                  <td className="p-3 font-normal text-slate-808">{log.notes}</td>
                  <td className="p-3 text-slate-600">{log.officerName}</td>
                  <td className="p-3 font-mono text-slate-700">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. SURVEY BUILDER MODULE
// ============================================================================
export function MESurveysView() {
  const { surveys, addSurvey, updateSurvey, deleteSurvey, projects } = useProject();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);

  const handleCreateSurvey = (e) => {
    e.preventDefault();
    if (!title) return;

    addSurvey({ title, questions: [], projectId: projectId || null });

    setTitle('');
    setProjectId('');
    Swal.fire('Survey Created', 'New survey form registered in the database.', 'success');
  };

  const handleAddQuestion = (survey) => {
    Swal.fire({
      title: 'Add Survey Question',
      input: 'text',
      inputPlaceholder: 'Enter question label...',
      showCancelButton: true,
      confirmButtonText: 'Add'
    }).then(res => {
      if (res.isConfirmed && res.value) {
        const newQuestion = { id: Date.now().toString(), text: res.value, type: 'Text' };
        updateSurvey(survey.id, { questions: [...(survey.questions || []), newQuestion] });
      }
    });
  };

  const handleDeleteSurvey = (survey) => {
    Swal.fire({
      title: 'Delete Survey?',
      text: `This will permanently remove "${survey.title}" and its questions.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete'
    }).then(res => {
      if (res.isConfirmed) {
        deleteSurvey(survey.id);
        if (selectedSurveyId === survey.id) setSelectedSurveyId(null);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Electronic Survey Form Builder</h2>
        <p className="text-xs text-slate-400 font-normal">Design questionnaires for data-collection assessments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Survey Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 h-fit">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal">Create New Survey</span>
          <form onSubmit={handleCreateSurvey} className="space-y-3 font-normal">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Survey Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Household Nutrition Assessment" className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 uppercase mb-1">Linked Project (Optional)</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="">No Project Linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded font-normal hover:bg-slate-800">Create Survey</button>
          </form>
        </div>

        {/* Surveys List */}
        <div className="lg:col-span-2 space-y-4">
          {surveys.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center text-slate-400 italic">
              No surveys registered yet. Create one to begin adding questions.
            </div>
          )}
          {surveys.map((survey) => {
            const linkedProject = projects.find(p => p.id === survey.projectId);
            const isSelected = selectedSurveyId === survey.id;
            return (
              <div key={survey.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-normal text-slate-808 text-sm">{survey.title}</h4>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {linkedProject ? `Project: ${linkedProject.name}` : 'No project linked'} • {(survey.questions || []).length} Question(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAddQuestion(survey)} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal">
                      + Add Question
                    </button>
                    <button onClick={() => handleDeleteSurvey(survey)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 border border-slate-200">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={() => setSelectedSurveyId(isSelected ? null : survey.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 border border-slate-200">
                      <ChevronDown size={13} className={isSelected ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                  </div>
                </div>
                {isSelected && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {(survey.questions || []).length === 0 && (
                      <p className="text-slate-400 italic">No questions added yet.</p>
                    )}
                    {(survey.questions || []).map((q, idx) => (
                      <div key={q.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                        <span className="font-normal text-slate-700">{q.text}</span>
                        <span className="text-[11px] text-slate-400 font-mono">[{q.type}]</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. FIELD VISITS
// ============================================================================
export function MEVisitsView() {
  const { fieldVisits, projects, addFieldVisit } = useProject();

  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().substring(0, 10));
  const [gpsSimulated, setGpsSimulated] = useState({ latitude: -6.7924, longitude: 39.2083 });

  const handleRandomizeGPS = () => {
    setGpsSimulated({
      latitude: -6.7924 + (Math.random() - 0.5) * 0.05,
      longitude: 39.2083 + (Math.random() - 0.5) * 0.05
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes) return;
    addFieldVisit({
      notes,
      projectId,
      visitDate,
      gpsLocation: gpsSimulated
    });
    setNotes('');
    setProjectId('');
    setVisitDate(new Date().toISOString().substring(0, 10));
    Swal.fire('Recorded!', 'Field visit successfully logged.', 'success');
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Outreach Field Visits Log</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Record coordinates, survey results, and program recommendations.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="font-normal text-slate-808 text-sm">Record Visit</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-normal text-slate-400 uppercase mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-normal text-slate-400 uppercase mb-1">Visit Date</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-normal text-slate-400 uppercase mb-1">Activities / Notes</label>
              <textarea
                required
                placeholder="Describe the visit activities and observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                rows="3"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 rounded border border-slate-150 p-3 text-xs space-y-2">
              <span className="font-normal text-slate-700 block flex items-center gap-1">
                <MapPin size={14} className="text-slate-500" />
                <span>Simulated GPS Coordinates</span>
              </span>
              <div className="font-mono text-[11px] text-slate-600">
                Lat: {gpsSimulated.latitude.toFixed(6)} <br />
                Lon: {gpsSimulated.longitude.toFixed(6)}
              </div>
              <button
                type="button"
                onClick={handleRandomizeGPS}
                className="text-[11px] bg-slate-200 text-slate-700 py-0.5 px-2 rounded hover:bg-slate-350"
              >
                Change Geolocation
              </button>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal"
            >
              Record Visit
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-normal">
        {fieldVisits.map((vis) => (
          <div key={vis.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <h4 className="font-normal text-slate-808 text-sm">{getProjectName(vis.projectId)} Visit</h4>
            <p className="text-xs text-slate-550 font-normal">{vis.notes}</p>
            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 mt-2">
              <span>Date: {vis.visitDate}</span>
              <span className="uppercase text-[11px] font-normal">{vis.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 9. REPORTS
// ============================================================================

// Helper to escape a CSV cell value
const escapeCsvCell = (val) => {
  const str = String(val ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Helper to build a CSV string from header + row arrays
const buildCsv = (headers, rows) => {
  return [headers, ...rows].map(row => row.map(escapeCsvCell).join(',')).join('\n');
};

// Helper to download CSV content as a real file
const downloadCsvFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function MEReportsView() {
  const { indicators, beneficiaries, fieldVisits, projects } = useProject();

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  const handleDownload = (rep) => {
    const dateStr = new Date().toISOString().substring(0, 10);
    let csvContent = '';

    if (rep === 'Annual Impact') {
      const indicatorRows = indicators.map(ind => {
        const target = ind.target || 0;
        const achieved = ind.achieved || 0;
        const pct = target > 0 ? Math.round((achieved / target) * 100) : 0;
        return [ind.name, getProjectName(ind.projectId), ind.unit || '', target, achieved, `${pct}%`];
      });

      const categoryCounts = beneficiaries.reduce((acc, b) => {
        const cat = b.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      const beneficiaryRows = Object.entries(categoryCounts).map(([cat, count]) => [cat, count]);

      csvContent = buildCsv(
        ['Indicator', 'Project', 'Unit', 'Target', 'Achieved', 'Achievement %'],
        indicatorRows
      ) + '\n\nBeneficiary Category,Count\n' + beneficiaryRows.map(r => r.map(escapeCsvCell).join(',')).join('\n');
    } else if (rep === 'Quarterly Indicator Progress') {
      csvContent = buildCsv(
        ['Indicator', 'Project', 'Target', 'Achieved', 'Variance', 'Progress %'],
        indicators.map(ind => {
          const target = ind.target || 0;
          const achieved = ind.achieved || 0;
          const variance = achieved - target;
          const pct = target > 0 ? Math.round((achieved / target) * 100) : 0;
          return [ind.name, getProjectName(ind.projectId), target, achieved, variance, `${pct}%`];
        })
      );
    } else {
      csvContent = buildCsv(
        ['Visit Date', 'Project', 'Officer', 'Notes', 'Status', 'Latitude', 'Longitude'],
        fieldVisits.map(v => [
          v.visitDate || '',
          getProjectName(v.projectId),
          v.officerName || '',
          v.notes || '',
          v.status || '',
          v.gpsLocation?.latitude ?? '',
          v.gpsLocation?.longitude ?? ''
        ])
      );
    }

    const slug = rep.toLowerCase().replace(/\s+/g, '-');
    downloadCsvFile(`me-report-${slug}-${dateStr}.csv`, csvContent);
    Swal.fire('Outreach Report compiled', `Downloading "${rep}" matrix CSV.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">M&E Reports Generation</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Generate annual outcomes, output lists, and survey statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-normal">
        {['Annual Impact', 'Quarterly Indicator Progress', 'Field Evaluation Narrative'].map((rep, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-350 transition-all space-y-4">
            <div>
              <h4 className="font-normal text-slate-808 text-sm">{rep} Report</h4>
              <p className="text-[11px] text-slate-400 mt-1">Consolidated document containing parsed targets.</p>
            </div>
            <button onClick={() => handleDownload(rep)} className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal">Download CSV</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 10. DATA QUALITY
// ============================================================================
export function MEQualityView() {
  const { fieldVisits, updateFieldVisit } = useProject();

  const reviewItems = fieldVisits.filter(v => v.status === 'Pending Review' || v.status === 'Flagged');

  const handleVerify = (id) => {
    updateFieldVisit(id, { status: 'Verified' });
    Swal.fire('Verified!', 'Field visit record marked as verified.', 'success');
  };

  const handleFlag = (id) => {
    updateFieldVisit(id, { status: 'Flagged' });
    Swal.fire('Flagged!', 'Field visit record flagged for review.', 'warning');
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Data Quality Auditing Console</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Flag missing details, duplicated records, and survey validation errors.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4 font-normal">
        {reviewItems.length === 0 && (
          <p className="text-slate-400 text-xs text-center py-6">No field visits currently pending quality review.</p>
        )}
        {reviewItems.map((log) => (
          <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center gap-4">
            <div>
              <span className="block font-normal text-slate-707">{log.officerName}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{log.notes}</span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">GPS: {log.gpsLocation?.latitude?.toFixed(4)}, {log.gpsLocation?.longitude?.toFixed(4)} • {log.visitDate}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] px-2 py-0.5 border rounded uppercase bg-slate-100 text-slate-600 border-slate-200">{log.status}</span>
              <button onClick={() => handleVerify(log.id)} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-normal">Mark Verified</button>
              <button onClick={() => handleFlag(log.id)} className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-normal">Flag for Review</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 11. GIS MAP VIEW
// ============================================================================
export function MEMapsView() {
  const { fieldVisits, projects } = useProject();

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unassigned';

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Geo-Location GIS Mapping</h2>
        <p className="text-xs text-slate-400 font-normal font-normal font-normal">View GPS coordinates of schools, water facilities, and outreach hubs.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Location Node</th>
              <th className="p-3">Status</th>
              <th className="p-3">GPS Coordinates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {fieldVisits.map((node) => (
              <tr key={node.id}>
                <td className="p-3 font-normal text-slate-808">{getProjectName(node.projectId)}</td>
                <td className="p-3 text-slate-500 font-normal">{node.status}</td>
                <td className="p-3 font-mono text-[11px] text-slate-550">{node.gpsLocation?.latitude?.toFixed(4)}, {node.gpsLocation?.longitude?.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 12. ANALYTICS
// ============================================================================
export function MEAnalyticsView() {
  const { indicators } = useProject();

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Program Output Performance Trends</h2>
        <p className="text-xs text-slate-400 font-normal">Visual analytics tracking indicator curves and targets met.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        {indicators.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400 italic">
            No indicators registered yet. Add indicators to see performance analytics.
          </div>
        ) : (
          indicators.map((ind) => {
            const targetVal = ind.target || 0;
            const achievedVal = ind.achieved || 0;
            const pct = targetVal > 0 ? Math.round((achievedVal / targetVal) * 100) : 0;

            return (
              <div key={ind.id} className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-700 font-normal">
                  <span>{ind.name}</span>
                  <span>{achievedVal} / {targetVal} {ind.unit} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-500 h-full" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 13. DOCUMENTS
// ============================================================================
export function MEDocumentsView() {
  const documents = [
    { name: 'Babawatoto_Baseline_Assessment_2026.pdf', size: '3.1 MB', category: 'Baseline' },
    { name: 'Program_Impact_Endline_Report.pdf', size: '2.8 MB', category: 'Endline' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Evaluation Research & Narrative Documents</h2>
        <p className="text-xs text-slate-400 font-normal">Access baseline assessments, program evaluation reviews, and case study files.</p>
      </div>

      <div className="space-y-2 font-normal">
        {documents.map((doc, idx) => (
          <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-slate-705 hover:border-slate-350 transition-all">
            <div>
              <span className="block font-normal">{doc.name}</span>
              <span className="text-[11px] text-slate-405 block mt-0.5 font-normal">Size: {doc.size} • Category: {doc.category}</span>
            </div>
            <button
              disabled
              title="No file attached"
              aria-disabled="true"
              className="p-1 rounded text-slate-300 border border-slate-200 cursor-not-allowed"
            >
              <Download size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 14. SETTINGS
// ============================================================================
export function MESettingsView() {
  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">M&E Configuration Rules</h2>
        <p className="text-xs text-slate-400 font-normal">Tweak data-quality validations, reporting quarters, and program baseline formulas.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 font-normal">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal font-normal">Data Validation Standard Settings</span>
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Required Household Survey Fields</span>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-normal">GPS coordinates, Family head name, intake ID</div>
          </div>
        </div>
      </div>
    </div>
  );
}
