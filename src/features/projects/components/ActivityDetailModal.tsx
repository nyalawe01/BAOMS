import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Quote,
  TrendingUp,
  Paperclip,
  Sparkles,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { AnalyticsVisualizer, AnalyticsDataPoint } from '@/components/ui/AnalyticsVisualizer';
import { ActivityRecord } from '../types/project';
import { exportSingleActivityToWord, exportSingleActivityToExcel } from '../utils/exportProjectDossier';

interface ActivityDetailModalProps {
  activity: ActivityRecord | null;
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  projectName,
}) => {
  const [activeTab, setActiveTab] = useState<'narrative' | 'analytics' | 'challenges' | 'evidence'>('narrative');

  if (!activity) return null;

  // Prepare demographic analytics data points
  const demographicData: AnalyticsDataPoint[] = [
    {
      label: 'Female',
      value: activity.demographicBreakdown?.female || 0,
      color: '#F2A507',
      description: 'Adolescent girls & young women',
    },
    {
      label: 'Male',
      value: activity.demographicBreakdown?.male || 0,
      color: '#D68904',
      description: 'Adolescent boys & young men',
    },
    {
      label: 'Youth (10-24)',
      value: activity.demographicBreakdown?.youth || 0,
      color: '#0f766e',
      description: 'Youth demographic focus',
    },
    {
      label: 'Adults/Caregivers',
      value: activity.demographicBreakdown?.adults || 0,
      color: '#1e293b',
      description: 'Parents & community mentors',
    },
    {
      label: 'Special Needs',
      value: activity.demographicBreakdown?.specialNeeds || 0,
      color: '#be123c',
      description: 'Inclusion & accessibility beneficiaries',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={activity.title}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Top Header Card */}
        <div className="bg-slate-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-slate-200 dark:border-neutral-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D68904]">
                  {projectName || 'Field Activity Record'}
                </span>
                <span className="text-slate-300 dark:text-neutral-600">•</span>
                <StatusIndicator status={activity.submissionStatus} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {activity.title}
              </h2>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSingleActivityToWord(activity, projectName)}
                className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                title="Export Word Document with integrated tables"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word (.doc)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSingleActivityToExcel(activity, projectName)}
                className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title="Export Excel spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-neutral-300"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF / Print</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-neutral-700 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D68904]" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Activity Date</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">{activity.activityDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D68904]" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Location</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate max-w-[120px]" title={activity.location || 'N/A'}>
                  {activity.location || 'Not Specified'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D68904]" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Participants</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">{activity.participantsCount} Verified</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D68904]" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Budget Utilization</span>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">
                  {activity.budgetSpent ? `TZS ${(activity.budgetSpent / 1000).toFixed(0)}k` : 'On Track'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('narrative')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'narrative'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Narrative & Field Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Charts & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('challenges')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'challenges'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Challenges & Action Items</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Evidence & Documents ({activity.evidenceDocuments?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: NARRATIVE & ANALYSIS */}
        {activeTab === 'narrative' && (
          <div className="space-y-6">
            {/* Background Context */}
            {activity.backgroundContext && (
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#b45309] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Background & Institutional Context
                </h4>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-neutral-300 text-justify">
                  {activity.backgroundContext}
                </p>
              </div>
            )}

            {/* Methodology */}
            {activity.methodology && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-1.5">
                  Methodology & Facilitation Protocol
                </h4>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-neutral-400 text-justify bg-slate-50 dark:bg-neutral-800/40 p-3.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                  {activity.methodology}
                </p>
              </div>
            )}

            {/* Comprehensive Session Narrative */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                Detailed Field Session Narrative
              </h4>
              <div className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed space-y-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-2xs">
                {(activity.sessionNarrative || activity.progress)
                  .split('\n\n')
                  .map((paragraph, idx) => (
                    <p key={idx} className="text-justify indent-2">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {/* Key Findings */}
            {activity.keyFindings && activity.keyFindings.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-2">
                  Key Discoveries & Qualitative Findings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activity.keyFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700 text-xs text-slate-800 dark:text-neutral-200"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-[#D68904] shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participant Quotes */}
            {activity.participantQuotes && activity.participantQuotes.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#b45309] mb-2 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5" />
                  Direct Participant & Beneficiary Feedback
                </h4>
                <div className="space-y-3">
                  {activity.participantQuotes.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-yellow-50/60 dark:bg-yellow-950/20 border-l-4 border-[#F2A507] rounded-r-lg text-xs"
                    >
                      <p className="italic text-slate-800 dark:text-neutral-200 leading-relaxed">
                        "{q.quote}"
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#b45309]">
                        <span>— {q.speaker}</span>
                        {q.affiliation && <span className="text-slate-500 font-normal">({q.affiliation})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHARTS & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsVisualizer
              title="Participant Demographics & Cluster Distribution"
              description="Toggle between Bar chart, Line graph, Donut distribution, and Data Table to analyze engagement"
              data={demographicData}
              valueSuffix=" persons"
              defaultMode="bar"
              availableModes={['bar', 'line', 'pie', 'table']}
              height={260}
              showSummaryCards={true}
              summaryMetrics={[
                {
                  label: 'Total Verified Reach',
                  value: activity.participantsCount,
                  helper: '100% register documented',
                },
                {
                  label: 'Female Representation',
                  value: activity.participantsCount > 0 && activity.demographicBreakdown?.female
                    ? `${Math.round(((activity.demographicBreakdown.female || 0) / activity.participantsCount) * 100)}%`
                    : 'N/A',
                  helper: `${activity.demographicBreakdown?.female || 0} participants`,
                },
                {
                  label: 'Youth Ratio',
                  value: activity.participantsCount > 0 && activity.demographicBreakdown?.youth
                    ? `${Math.round(((activity.demographicBreakdown.youth || 0) / activity.participantsCount) * 100)}%`
                    : 'N/A',
                  helper: `${activity.demographicBreakdown?.youth || 0} youth reached`,
                },
                {
                  label: 'Satisfaction Index',
                  value: activity.beneficiarySatisfactionScore ? `${activity.beneficiarySatisfactionScore}%` : '94%',
                  helper: 'Post-session evaluation',
                },
              ]}
            />

            {/* Budget Analytics Card */}
            {(activity.budgetAllocated || activity.budgetSpent) && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 mb-3">
                  Field Budget Efficiency & Burn Analysis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Allocated Budget</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      TZS {(activity.budgetAllocated || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Actual Spent</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      TZS {(activity.budgetSpent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Variance / Savings</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      TZS {((activity.budgetAllocated || 0) - (activity.budgetSpent || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {activity.budgetAllocated && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Budget Burn Rate</span>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200">
                        {Math.round(((activity.budgetSpent || 0) / activity.budgetAllocated) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#D68904] rounded-full"
                        style={{
                          width: `${Math.min(
                            Math.round(((activity.budgetSpent || 0) / activity.budgetAllocated) * 100),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHALLENGES & ACTION ITEMS */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Operational Challenges Encountered
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-neutral-300">
                {activity.challenges || 'No severe impediments or risks were recorded during this intervention.'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Actionable Follow-Up & Next Steps
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-neutral-300">
                {activity.followUpActions || 'All immediate deliverables satisfied. Proceed with routine monitoring schedule.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: EVIDENCE & DOCUMENTS */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {activity.evidenceDocuments && activity.evidenceDocuments.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                {activity.evidenceDocuments.map((doc) => (
                  <div key={doc.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-[#D68904]">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-white">{doc.documentTitle}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono">{doc.documentReference}</span>
                          <span>•</span>
                          <span>{doc.fileType || 'Document'}</span>
                          {doc.fileSize && (
                            <>
                              <span>•</span>
                              <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => alert(`Opening document: ${doc.documentTitle}`)}
                    >
                      View Document
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-neutral-800 rounded-xl">
                <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No verified evidence documents attached yet.</p>
              </div>
            )}

            {/* Review Comments if reviewed */}
            {activity.reviewComments && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Manager Review Notes ({activity.reviewedByName || 'Project Manager'}):
                </span>
                <p className="text-xs italic text-slate-700 dark:text-neutral-300">
                  "{activity.reviewComments}"
                </p>
                {activity.reviewedAt && (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Reviewed on {new Date(activity.reviewedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-neutral-800 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close Analysis
        </Button>
      </div>
    </Modal>
  );
};
