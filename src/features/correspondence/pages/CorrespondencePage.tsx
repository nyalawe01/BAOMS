import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CorrespondenceRecord,
} from '../types/correspondence';
import {
  getCorrespondence,
} from '../services/correspondenceService';
import { useAuth } from '@/features/auth/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Pagination } from '@/components/ui/Pagination';
import { CreateCorrespondenceModal } from '../components/CreateCorrespondenceModal';
import { CorrespondenceDetailModal } from '../components/CorrespondenceDetailModal';
import {
  Mail,
  Plus,
  Search,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const CorrespondencePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, roles, hasPermission, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [correspondenceList, setCorrespondenceList] = useState<CorrespondenceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isCreateCorOpen, setIsCreateCorOpen] = useState(false);
  const [selectedCorForDetail, setSelectedCorForDetail] = useState<CorrespondenceRecord | null>(null);
  const [isDetailCorOpen, setIsDetailCorOpen] = useState(false);

  const canManageCorrespondence =
    hasPermission('correspondence.manage') ||
    roles.includes('system_admin') ||
    roles.includes('executive_director') ||
    isAdmin();

  const loadData = useCallback(async () => {
    try {
      const currentUserCtx = user ? { id: user.id, roles } : undefined;
      const allCor = await getCorrespondence(undefined, currentUserCtx);
      setCorrespondenceList(allCor);
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
  const dispatchedCount = outgoingItems.filter((c) => c.status === 'dispatched').length;
  const statutoryCount = correspondenceList.filter((c) => c.category === 'government').length;

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
        title={t('correspondence.title', 'Official Correspondence Register')}
        subtitle={t(
          'correspondence.subtitle',
          'Manage official incoming and outgoing communications, letters, and dispatches.'
        )}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), href: '/' },
          { label: t('nav.correspondence', 'Official Correspondence') },
        ]}
        actions={
          canManageCorrespondence ? (
            <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            {t('correspondence.incomingTotal', 'Incoming Letters')}
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5">
            {incomingItems.length}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5">
            Registered institutional mail
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            {t('correspondence.outgoingTotal', 'Outgoing Letters')}
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5">
            {outgoingItems.length}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5">
            Prepared dispatches
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            Dispatched Letters
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5">
            {dispatchedCount}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5">
            Formally dispatched
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-lg p-3 sm:p-3.5">
          <div className="text-xs font-medium text-charcoal-500 uppercase tracking-wider">
            Statutory & Government
          </div>
          <div className="text-xl font-bold text-charcoal-900 font-mono tabular-nums mt-0.5">
            {statutoryCount}
          </div>
          <div className="text-xs text-charcoal-muted mt-0.5">
            Official compliance letters
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => {
            setActiveTab('incoming');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'incoming'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          {t('correspondence.tabIncoming', 'Incoming Register')} ({incomingItems.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('outgoing');
            setCurrentPage(1);
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'outgoing'
              ? 'bg-white dark:bg-slate-900 text-charcoal-900 dark:text-white shadow-xs'
              : 'text-charcoal-muted hover:text-charcoal-900'
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          {t('correspondence.tabOutgoing', 'Outgoing Register')} ({outgoingItems.length})
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
    </div>
  );
};
