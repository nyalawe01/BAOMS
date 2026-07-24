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
export function MEDashboardView() {
  const { projects } = useProject();

  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  const totalBeneficiaries = projects.reduce((acc, curr) => acc + (curr.beneficiaryCount || 150), 0);

  const kpis = [
    { label: 'Active Projects', value: activeProjectsCount },
    { label: 'Indicators Registered', value: 145 },
    { label: 'Indicators Achieved', value: 108 },
    { label: 'Achievement Rate', value: '74%' },
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
            <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">{kpi.label}</span>
            <span className="text-xl font-normal text-slate-808 mt-4 block">{kpi.value}</span>
          </div>
        ))}
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
                <td className="p-3 font-mono text-[10px] text-slate-400">{proj.startDate}</td>
                <td className="p-3 font-mono text-[10px] text-slate-400">{proj.endDate}</td>
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
  const indicators = [
    { name: 'Children receiving educational aid', baseline: 300, target: 1500, current: 1100, type: 'Output' },
    { name: 'Youth acquiring vocational certificates', baseline: 50, target: 400, current: 280, type: 'Outcome' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Performance Indicators Matrix</h2>
        <p className="text-xs text-slate-400 font-normal">Define baselines and target indexes across program outputs and outcomes.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Indicator Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Baseline</th>
              <th className="p-3">Target</th>
              <th className="p-3">Current</th>
              <th className="p-3">Achievement %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {indicators.map((ind, idx) => {
              const pct = Math.round((ind.current / ind.target) * 100);
              return (
                <tr key={idx}>
                  <td className="p-3 font-normal text-slate-808">{ind.name}</td>
                  <td className="p-3 text-slate-500 font-normal">{ind.type}</td>
                  <td className="p-3 text-slate-600 font-mono">{ind.baseline}</td>
                  <td className="p-3 text-slate-600 font-mono">{ind.target}</td>
                  <td className="p-3 text-slate-800 font-mono">{ind.current}</td>
                  <td className="p-3 font-normal text-slate-700">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 4. TARGETS MODULE
// ============================================================================
export function METargetsView() {
  const targets = [
    { name: 'Training workshops organized', annual: 24, q1: 6, q2: 6, q3: 6, q4: 6 },
    { name: 'Water filtration systems installed', annual: 12, q1: 3, q2: 3, q3: 3, q4: 3 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Annual & Quarterly Target Allocations</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Define and monitor targets broken down into operational quarters.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Target Performance Indicator</th>
              <th className="p-3">Annual Target</th>
              <th className="p-3">Q1</th>
              <th className="p-3">Q2</th>
              <th className="p-3">Q3</th>
              <th className="p-3">Q4</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 font-normal text-slate-700">
            {targets.map((tgt, idx) => (
              <tr key={idx}>
                <td className="p-3 font-normal text-slate-808">{tgt.name}</td>
                <td className="p-3 font-mono">{tgt.annual}</td>
                <td className="p-3 font-mono">{tgt.q1}</td>
                <td className="p-3 font-mono">{tgt.q2}</td>
                <td className="p-3 font-mono">{tgt.q3}</td>
                <td className="p-3 font-mono">{tgt.q4}</td>
              </tr>
            ))}
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
  const beneficiariesList = [
    { name: 'Karanja Mwangi', age: 15, gender: 'Male', region: 'Nairobi', status: 'Active' },
    { name: 'Fatma Juma', age: 16, gender: 'Female', region: 'Kisumu', status: 'Completed' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Enrolled Beneficiaries Registry</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Track registered children, youth, and women participating in programmatic outputs.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Name</th>
              <th className="p-3">Age</th>
              <th className="p-3">Gender</th>
              <th className="p-3">Region</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {beneficiariesList.map((ben, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="p-3 font-normal text-slate-808">{ben.name}</td>
                <td className="p-3 font-mono">{ben.age}</td>
                <td className="p-3 text-slate-600">{ben.gender}</td>
                <td className="p-3 text-slate-600">{ben.region}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[8px] font-normal border uppercase bg-slate-50 text-slate-600 border-slate-200">
                    {ben.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 6. DATA COLLECTION MODULE
// ============================================================================
export function MECollectionView() {
  const collectionLogs = [
    { date: '2026-07-15', form: 'School Assessment Survey', district: 'Kisumu Central', submissions: 14 },
    { date: '2026-07-14', form: 'Household Nutrition Form', district: 'Garissa Hub', submissions: 28 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Electronic Data Collections Log</h2>
        <p className="text-xs text-slate-400 font-normal">Review logs for digital baseline, school assessments, and community intakes.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-normal text-slate-400 uppercase tracking-wider">
              <th className="p-3">Collection Date</th>
              <th className="p-3">Survey Form</th>
              <th className="p-3">Target Area District</th>
              <th className="p-3">Total Submissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {collectionLogs.map((log, idx) => (
              <tr key={idx}>
                <td className="p-3 font-mono text-[10px] text-slate-400">{log.date}</td>
                <td className="p-3 font-normal text-slate-808">{log.form}</td>
                <td className="p-3 text-slate-600">{log.district}</td>
                <td className="p-3 font-mono text-slate-700">{log.submissions} Synced</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// 7. SURVEY BUILDER MODULE
// ============================================================================
export function MESurveysView() {
  const [questions, setQuestions] = useState([
    { text: 'What is the beneficiary household size?', type: 'Number' },
    { text: 'Upload photo of school facility', type: 'Image' }
  ]);

  const handleAddQuestion = () => {
    Swal.fire({
      title: 'Add Survey Question',
      input: 'text',
      inputPlaceholder: 'Enter question label...',
      showCancelButton: true,
      confirmButtonText: 'Add'
    }).then(res => {
      if (res.isConfirmed && res.value) {
        setQuestions([...questions, { text: res.value, type: 'Text' }]);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-sm font-normal text-slate-808">Electronic Survey Form Builder</h2>
          <p className="text-xs text-slate-400 font-normal">Design questionnaires for data-collection assessments.</p>
        </div>
        <button onClick={handleAddQuestion} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-normal">
          + Add Question
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3 font-normal">
        {questions.map((q, idx) => (
          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
            <span className="font-normal text-slate-700">{q.text}</span>
            <span className="text-[10px] text-slate-400 font-mono">[{q.type}]</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 8. FIELD VISITS
// ============================================================================
export function MEVisitsView() {
  const visits = [
    { date: '2026-07-05', village: 'Kisauni Outpost', activities: 'Audit health assessment registers', status: 'Completed' },
    { date: '2026-07-20', village: 'Viwandani Area', activities: 'Conduct youth tech class evaluation', status: 'Scheduled' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Outreach Field Visits Log</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Record coordinates, survey results, and program recommendations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-normal">
        {visits.map((vis, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <h4 className="font-normal text-slate-808 text-sm">{vis.village} Visit</h4>
            <p className="text-xs text-slate-550 font-normal">{vis.activities}</p>
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 mt-2">
              <span>Date: {vis.date}</span>
              <span className="uppercase text-[9px] font-normal">{vis.status}</span>
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
export function MEReportsView() {
  const handleDownload = (rep) => {
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
              <p className="text-[10px] text-slate-400 mt-1">Consolidated document containing parsed targets.</p>
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
  const validationLogs = [
    { type: 'Duplicate ID Record', desc: 'Beneficiary Mwangi Juma double entry flagged in ERP project.', status: 'Review Required' },
    { type: 'Missing Data Field', desc: 'GPS coordinates missing on Viwandani field visit report.', status: 'Fixed' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Data Quality Auditing Console</h2>
        <p className="text-xs text-slate-400 font-normal font-normal">Flag missing details, duplicated records, and survey validation errors.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4 font-normal">
        {validationLogs.map((log, idx) => (
          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
            <div>
              <span className="block font-normal text-slate-707">{log.type}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{log.desc}</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 border rounded uppercase bg-slate-100 text-slate-600 border-slate-200">{log.status}</span>
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
  const coordinatesList = [
    { name: 'Kibera Primary School Hub', coords: '-1.3125, 36.7881', type: 'School' },
    { name: 'Mombasa Outreach Post', coords: '-4.0435, 39.6682', type: 'Office' }
  ];

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
              <th className="p-3">Type</th>
              <th className="p-3">GPS Coordinates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150">
            {coordinatesList.map((node, idx) => (
              <tr key={idx}>
                <td className="p-3 font-normal text-slate-808">{node.name}</td>
                <td className="p-3 text-slate-500 font-normal">{node.type}</td>
                <td className="p-3 font-mono text-[10px] text-slate-550">{node.coords}</td>
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
  return (
    <div className="space-y-6 animate-fadeIn font-normal text-xs text-slate-700 select-none">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-normal text-slate-808">Program Output Performance Trends</h2>
        <p className="text-xs text-slate-400 font-normal">Visual analytics tracking indicator curves and targets met.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-center py-12 text-slate-400 italic">
        [Program Target Achievement Line Charts - Neutral Palette Representation]
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
              <span className="text-[10px] text-slate-405 block mt-0.5 font-normal">Size: {doc.size} • Category: {doc.category}</span>
            </div>
            <button onClick={() => Swal.fire('Downloaded!', 'Evaluation report document downloading...', 'success')} className="p-1 hover:bg-slate-100 rounded text-slate-600 border border-slate-200">
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
        <span className="text-[10px] text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5 font-normal font-normal">Data Validation Standard Settings</span>
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
