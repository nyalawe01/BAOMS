import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CorrespondenceRecord,
  MeetingRecord,
  MeetingActionRecord,
} from '../types/correspondence';
import {
  getCorrespondence,
  getMeetings,
  getMeetingActions,
} from '../services/correspondenceService';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Pagination } from '@/components/ui/Pagination';
import { CreateCorrespondenceModal } from '../components/CreateCorrespondenceModal';
import { CorrespondenceDetailModal } from '../components/CorrespondenceDetailModal';
import { CreateMeetingModal } from '../components/CreateMeetingModal';
import { MeetingDetailModal } from '../components/MeetingDetailModal';
import {
  Mail,
  Calendar,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const CorrespondencePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, roles, hasPermission, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'meetings'>('incoming');
  const [correspondenceList, setCorrespondenceList] = useState<CorrespondenceRecord[]>([]);
  const [meetingsList, setMeetingsList] = useState<MeetingRecord[]>([]);
  const [actionsList, setActionsList] = useState<MeetingActionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isCreateCorOpen, setIsCreateCorOpen] = useState(false);
  const [selectedCorForDetail, setSelectedCorForDetail] = useState<CorrespondenceRecord | null>(null);
  const [isDetailCorOpen, setIsDetailCorOpen] = useState(false);

  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [selectedMeetingForDetail, setSelectedMeetingForDetail] = useState<MeetingRecord | null>(null);
  const [isDetailMeetingOpen, setIsDetailMeetingOpen] = useState(false);

  const canManageCorrespondence =
    hasPermission('correspondence.manage') ||
    roles.includes('system_admin') ||
    roles.includes('executive_director') ||
    isAdmin();

  const loadData = useCallback(async () => {
    try {
      const currentUserCtx = user ? { id: user.id, roles } : undefined;
      const [allCor, allMtg, allAct] = await Promise.all([
        getCorrespondence(undefined, currentUserCtx),
        getMeetings(undefined, currentUserCtx),
        getMeetingActions(),
      ]);
      setCorrespondenceList(allCor);
      setMeetingsList(allMtg);
      setActionsList(allAct);
    } catch (err) {
      console.error(err);
    }
  }, [user, roles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived counts
  const incomingItems = correspondenceList.filter((c) => c.direction === 'incoming');
  const outgoingItems = correspondenceList.filter((c) => c.direction === 'outgoing');
  const overdueActionsCount = actionsList.filter((a) => a.isOverdue).length;
  const activeActionsCount = actionsList.filter((a) => a.status !== 'completed').length;

  // Filtered lists for the active view
  const currentTabItems = (activeTab === 'incoming' ? incomingItems : outgoingItems).filter((c) => {
    const matchesSearch =
      c.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.recipient.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('correspondence.title', 'Correspondence & Meetings')}
        subtitle={t(
          'correspondence.subtitle',
          'Manage official incoming and outgoing communications, board & management meetings, and decision action items.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.correspondence', 'Correspondence & Meetings') },
        ]}
        actions={
          canManageCorrespondence ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateMeetingOpen(true)}
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                {t('meetings.newMeeting', 'Record Meeting')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateCorOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                {t('correspondence.registerNew', 'Register Correspondence')}
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="min-w-0">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('correspondence.incomingTotal', 'Incoming Letters')}
              </span>
              <div className="text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">{incomingItems.length}</div>
              <span className="text-xs text-charcoal-muted truncate block">
                {incomingItems.filter((c) => c.category === 'government').length} government & statutory
              </span>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg bg-forest-50 text-forest-700 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('correspondence.outgoingTotal', 'Outgoing Letters')}
              </span>
              <div className="text-[32px] font-bold text-charcoal-900 leading-[1.2] font-mono tabular-nums truncate">{outgoingItems.length}</div>
              <span className="text-xs text-charcoal-muted truncate block">
                {outgoingItems.filter((c) => c.status === 'dispatched').length} formally dispatched
              </span>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('meetings.activeActions', 'Active Action Tasks')}
              </span>
              <div className="text-[32px] font-bold text-amber-700 leading-[1.2] font-mono tabular-nums truncate">{activeActionsCount}</div>
              <span className="text-xs text-charcoal-muted truncate block">
                across {meetingsList.length} formal meetings
              </span>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="p-4 flex items-center justify-between gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider truncate block">
                {t('meetings.overdueActions', 'Overdue Follow-ups')}
              </span>
              <div className={`text-[32px] font-bold leading-[1.2] font-mono tabular-nums truncate ${overdueActionsCount > 0 ? 'text-rose-700' : 'text-charcoal-900'}`}>
                {overdueActionsCount}
              </div>
              <span className="text-xs text-charcoal-muted truncate block">
                {overdueActionsCount > 0 ? 'require immediate escalation' : 'all actions on track'}
              </span>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-surface-border gap-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'incoming'
              ? 'border-[#D68904] text-[#D68904]'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          {t('correspondence.tabIncoming', 'Incoming Register')} ({incomingItems.length})
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'outgoing'
              ? 'border-[#D68904] text-[#D68904]'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          {t('correspondence.tabOutgoing', 'Outgoing Register')} ({outgoingItems.length})
        </button>

        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'meetings'
              ? 'border-[#D68904] text-[#D68904]'
              : 'border-transparent text-charcoal-muted hover:text-charcoal-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          {t('correspondence.tabMeetings', 'Meetings & Follow-up Actions')} ({meetingsList.length})
        </button>
      </div>

      {/* TAB 1 & 2: CORRESPONDENCE TABLE (Incoming / Outgoing) */}
      {(activeTab === 'incoming' || activeTab === 'outgoing') && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
              <input
                type="text"
                placeholder={t('correspondence.searchPlaceholder', 'Search by reference, sender, subject...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card focus:outline-hidden focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card text-charcoal-700"
              >
                <option value="all">All Categories</option>
                <option value="government">Government</option>
                <option value="donor">Donor</option>
                <option value="legal">Legal</option>
                <option value="partner">Partner</option>
                <option value="community">Community</option>
                <option value="general">General</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-surface-border bg-surface-card text-charcoal-700"
              >
                <option value="all">All Statuses</option>
                <option value="received">Received</option>
                <option value="approved">Approved</option>
                <option value="dispatched">Dispatched</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Table Container with proper horizontal scrolling */}
          <div className="rounded-lg border border-surface-border bg-surface-card overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm min-w-[860px]">
                <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4 w-[140px] whitespace-nowrap">{t('correspondence.refCol', 'Reference Ref')}</th>
                    <th className="py-3 px-4 w-[180px] whitespace-nowrap">
                      {activeTab === 'incoming' ? t('correspondence.sender', 'Sender') : t('correspondence.recipient', 'Recipient')}
                    </th>
                    <th className="py-3 px-4 min-w-[220px]">{t('correspondence.subject', 'Subject')}</th>
                    <th className="py-3 px-4 w-[120px] whitespace-nowrap">{t('correspondence.category', 'Category')}</th>
                    <th className="py-3 px-4 w-[110px] whitespace-nowrap">{t('correspondence.date', 'Date')}</th>
                    <th className="py-3 px-4 w-[150px] whitespace-nowrap text-left">{t('correspondence.status', 'Status')}</th>
                    <th className="py-3 px-4 w-[90px] text-right whitespace-nowrap">{t('common.actions', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {currentTabItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-charcoal-muted">
                        <Mail className="h-8 w-8 mx-auto text-charcoal-300 mb-2" />
                        {t('correspondence.noRecordsFound', 'No correspondence records matching criteria.')}
                      </td>
                    </tr>
                  ) : (
                    currentTabItems
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedCorForDetail(item);
                          setIsDetailCorOpen(true);
                        }}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-forest-800 text-xs whitespace-nowrap">
                          {item.referenceNumber}
                        </td>
                        <td className="py-3 px-4 font-semibold text-charcoal-900 max-w-xs truncate">
                          {activeTab === 'incoming' ? item.sender : item.recipient}
                        </td>
                        <td className="py-3 px-4 text-charcoal-800 max-w-sm truncate font-medium">
                          {item.subject}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-charcoal-600 capitalize">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-charcoal-600 whitespace-nowrap">{item.correspondenceDate}</td>
                        <td className="py-3 px-4 whitespace-nowrap w-[150px] text-left">
                          <StatusIndicator status={item.status} label={item.status.toUpperCase()} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCorForDetail(item);
                              setIsDetailCorOpen(true);
                            }}
                          >
                            {t('common.view', 'View')}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {currentTabItems.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(currentTabItems.length / pageSize)}
              totalItems={currentTabItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* TAB 3: MEETINGS & ACTION ITEMS */}
      {activeTab === 'meetings' && (
        <div className="space-y-6">
          {/* Meetings Register Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-forest-700" />
                {t('meetings.registerHeading', 'Formal Governance & Management Meetings')}
              </h3>
              <span className="text-xs text-charcoal-muted">
                {meetingsList.length} formal sessions recorded
              </span>
            </div>

            <div className="rounded-lg border border-surface-border bg-surface-card overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                    <tr>
                      <th className="py-3 px-4 w-[140px] whitespace-nowrap">Meeting Ref</th>
                      <th className="py-3 px-4 min-w-[240px]">Meeting Title</th>
                      <th className="py-3 px-4 w-[120px] whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 min-w-[180px]">Venue / Location</th>
                      <th className="py-3 px-4 w-[160px] whitespace-nowrap">Outcomes</th>
                      <th className="py-3 px-4 w-[150px] whitespace-nowrap text-left">Status</th>
                      <th className="py-3 px-4 w-[80px] text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {meetingsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-charcoal-muted">
                          No meetings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      meetingsList.map((mtg) => (
                        <tr
                          key={mtg.id}
                          onClick={() => {
                            setSelectedMeetingForDetail(mtg);
                            setIsDetailMeetingOpen(true);
                          }}
                          className="hover:bg-surface-muted/30 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-forest-800 text-xs whitespace-nowrap">
                            {mtg.meetingNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-charcoal-900">
                            {mtg.title}
                          </td>
                          <td className="py-3 px-4 text-xs text-charcoal-600 whitespace-nowrap">
                            {new Date(mtg.meetingDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-xs text-charcoal-700 truncate max-w-[200px]">
                            {mtg.location}
                          </td>
                          <td className="py-3 px-4 text-xs text-charcoal-600 whitespace-nowrap">
                            <span className="font-semibold text-charcoal-800">{mtg.decisionsCount}</span> decisions • <span className="font-semibold text-charcoal-800">{mtg.actionsCount}</span> actions
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap w-[150px] text-left">
                            <StatusIndicator status={mtg.status} label={mtg.status.toUpperCase()} />
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMeetingForDetail(mtg);
                                setIsDetailMeetingOpen(true);
                              }}
                            >
                              {t('common.view', 'View')}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Follow-up Action Tasks Register */}
          <div className="space-y-3 pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                {t('meetings.actionTasksHeading', 'Decision Follow-up Actions Matrix')}
              </h3>
              <span className="text-xs text-charcoal-muted">
                {actionsList.filter((a) => a.status === 'completed').length} of {actionsList.length} completed
              </span>
            </div>

            <div className="rounded-lg border border-surface-border bg-surface-card overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm min-w-[780px]">
                  <thead className="bg-surface-muted/60 text-xs font-semibold text-charcoal-600 border-b border-surface-border">
                    <tr>
                      <th className="py-3 px-4 w-[130px] whitespace-nowrap">Action Ref</th>
                      <th className="py-3 px-4 min-w-[260px]">Task Description</th>
                      <th className="py-3 px-4 w-[180px] whitespace-nowrap">Focal Person</th>
                      <th className="py-3 px-4 w-[120px] whitespace-nowrap">Deadline</th>
                      <th className="py-3 px-4 w-[160px] text-left whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {actionsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-charcoal-muted">
                          No pending action items assigned.
                        </td>
                      </tr>
                    ) : (
                      actionsList.map((act) => (
                        <tr key={act.id} className="hover:bg-surface-muted/20 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-charcoal-700 text-xs whitespace-nowrap">
                            {act.actionNumber}
                          </td>
                          <td className="py-3 px-4 font-semibold text-charcoal-900">
                            {act.taskDescription}
                          </td>
                          <td className="py-3 px-4 text-charcoal-800 text-xs whitespace-nowrap">
                            {act.assignedToName}
                          </td>
                          <td className="py-3 px-4 text-xs whitespace-nowrap">
                            <span className={act.isOverdue ? 'text-rose-700 font-bold' : 'text-charcoal-700'}>
                              {act.dueDate}
                            </span>
                          </td>
                          <td className="py-3 px-4 w-[160px] whitespace-nowrap text-left">
                            <StatusIndicator
                              status={act.isOverdue ? 'overdue' : act.status}
                              label={act.isOverdue ? 'OVERDUE' : act.status.toUpperCase()}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCorrespondenceModal
        isOpen={isCreateCorOpen}
        onClose={() => setIsCreateCorOpen(false)}
        defaultDirection={activeTab === 'outgoing' ? 'outgoing' : 'incoming'}
        onCreated={(newItem) => {
          setCorrespondenceList([newItem, ...correspondenceList]);
        }}
      />

      <CorrespondenceDetailModal
        isOpen={isDetailCorOpen}
        onClose={() => setIsDetailCorOpen(false)}
        item={selectedCorForDetail}
        onUpdated={(updated) => {
          setCorrespondenceList(
            correspondenceList.map((c) => (c.id === updated.id ? updated : c))
          );
        }}
      />

      <CreateMeetingModal
        isOpen={isCreateMeetingOpen}
        onClose={() => setIsCreateMeetingOpen(false)}
        onCreated={(newMeeting) => {
          setMeetingsList([newMeeting, ...meetingsList]);
        }}
      />

      <MeetingDetailModal
        isOpen={isDetailMeetingOpen}
        onClose={() => setIsDetailMeetingOpen(false)}
        meeting={selectedMeetingForDetail}
      />
    </div>
  );
};
