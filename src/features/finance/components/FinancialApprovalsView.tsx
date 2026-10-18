import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CheckSquare, Clock, Filter, AlertCircle, Eye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FinancialRequestRecord } from '../types/finance';

interface FinancialApprovalsViewProps {
  requests: FinancialRequestRecord[];
  onSelectRequest: (request: FinancialRequestRecord) => void;
  onOpenReviewModal: (request: FinancialRequestRecord) => void;
}

export const FinancialApprovalsView: React.FC<FinancialApprovalsViewProps> = ({
  requests,
  onSelectRequest,
  onOpenReviewModal,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filter requests that genuinely require approval / review
  const pendingRequests = useMemo(() => {
    return requests.filter(
      (r) => r.status === 'submitted' || r.status === 'under_review'
    );
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.purpose.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  }, [pendingRequests, searchQuery, priorityFilter]);

  const totalPendingAmount = useMemo(
    () => filteredRequests.reduce((sum, r) => sum + r.totalAmount, 0),
    [filteredRequests]
  );
  const urgentCount = filteredRequests.filter((r) => r.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending Financial Approvals
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {filteredRequests.length}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Claims awaiting verification & clearance</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Claimed Amount in Queue
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            TZS {(totalPendingAmount / 1000000).toFixed(1)}M
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Across all departments and field projects</div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Urgent Attention Required
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-rose-700">
            {urgentCount}
          </div>
          <div className="text-2xs text-slate-500 mt-0.5">Time-critical activity disbursements</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#374151] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by requisition number, requester, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-[#374151]" />
            <span>Priority:</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D68904]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Requisition & Scope</th>
                <th className="py-3 px-4">Requester & Type</th>
                <th className="py-3 px-4 text-right">Requested Total</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">Current Status</th>
                <th className="py-3 px-4 text-right">Date Submitted</th>
                <th className="py-3 px-4 text-right">Decision Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No financial requests are currently awaiting approval.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono">{req.requestNumber}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 mt-0.5">{req.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                        {req.purpose}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{req.requesterName}</div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {req.requestType.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {req.currency} {req.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                          req.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : req.priority === 'low'
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 capitalize">
                        <Clock className="h-3 w-3 text-amber-600" />
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono whitespace-nowrap">
                      {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectRequest(req)}
                          className="h-7 text-xs px-2"
                        >
                          <Eye className="h-3 w-3 mr-1 text-[#374151]" /> Details
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onOpenReviewModal(req)}
                          className="h-7 text-xs px-2.5"
                        >
                          <CheckSquare className="h-3 w-3 mr-1 text-white" /> Review
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
