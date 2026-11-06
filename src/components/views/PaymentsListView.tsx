import React, { useState, useMemo } from 'react';
import { PaymentMilestone, PaymentRecord, PaymentStatus, PaymentMethod, User, CurrencyCode } from '../../types';
import { paymentsService, PaymentFilters } from '../../services/paymentsService';
import { ordersService } from '../../services/ordersService';
import { companiesService } from '../../services/companiesService';
import { authService } from '../../services/authService';
import { currencyService } from '../../services/currencyService';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building2,
} from 'lucide-react';

interface PaymentsListViewProps {
  currentUser: User;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToCompany?: (companyId: string) => void;
}

export default function PaymentsListView({
  currentUser,
  onNavigateToOrder,
  onNavigateToCompany,
}: PaymentsListViewProps) {
  const canViewPrices = authService.canViewPrices(currentUser.role);
  const canManagePayments = authService.canManagePayments(currentUser.role);

  // If Warehouse role, access is restricted
  if (!canViewPrices) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-gray-950">Access Restricted</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Financial ledgers and payment schedules are restricted to Commercial, Finance, and Executive roles.
        </p>
      </div>
    );
  }

  const [milestones, setMilestones] = useState<PaymentMilestone[]>(() => paymentsService.getMilestones());
  const orders = useMemo(() => ordersService.getOrders(), []);
  const companies = useMemo(() => companiesService.getCompanies(), []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'milestones' | 'history'>('milestones');

  const [recordMilestone, setRecordMilestone] = useState<PaymentMilestone | null>(null);

  const stats = useMemo(() => paymentsService.getGlobalPaymentStats(), [milestones]);
  const paymentRecords = useMemo(() => paymentsService.getPaymentRecords(), [milestones]);

  const reloadMilestones = () => {
    setMilestones(paymentsService.getMilestones());
  };

  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (methodFilter !== 'All' && m.method !== methodFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const order = orders.find(o => o.id === m.orderId);
        const comp = order ? companies.find(c => c.id === order.companyId) : null;
        const nameMatch = m.name.toLowerCase().includes(query);
        const orderMatch = order ? order.orderNumber.toLowerCase().includes(query) : false;
        const compMatch = comp ? comp.name.toLowerCase().includes(query) : false;
        if (!nameMatch && !orderMatch && !compMatch) return false;
      }
      return true;
    });
  }, [milestones, statusFilter, methodFilter, search, orders, companies]);

  const handleExportCSV = () => {
    paymentsService.exportToCSV(filteredMilestones);
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const map: Record<PaymentStatus, { bg: string; text: string }> = {
      Paid: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
      Pending: { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-700' },
      'Partially Paid': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
      Overdue: { bg: 'bg-red-50 border-red-200', text: 'text-red-800 font-bold' },
    };
    const c = map[status] || { bg: 'bg-gray-100 border-gray-300', text: 'text-gray-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${c.bg} ${c.text}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-700" />
            Global Trade Payments & Receivables
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track payment schedules, letters of credit, advances, collections, and overdue settlements
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Payments CSV
        </button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Receivables */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Receivables Outstanding</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 font-mono">
            {currencyService.formatUSD(stats.receivablesOutstandingUSD)}
          </p>
          <p className="text-[11px] text-gray-500">
            EUR: {stats.receivablesByCurrency.EUR.toLocaleString()} • USD: {stats.receivablesByCurrency.USD.toLocaleString()}
          </p>
        </div>

        {/* Payables */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Payables Outstanding</span>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-900 font-mono">
            {currencyService.formatUSD(stats.payablesOutstandingUSD)}
          </p>
          <p className="text-[11px] text-gray-500">
            Due to international waste/yarn suppliers
          </p>
        </div>

        {/* Overdue Payments Card (Highlighted in Red) */}
        <div
          className={`p-4 rounded-lg border shadow-xs space-y-1 ${
            stats.overdueCount > 0 ? 'bg-red-50/70 border-red-300' : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-red-700">
            <span>Overdue Payments</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-extrabold text-red-700 font-mono">
            {stats.overdueCount} Overdue ({currencyService.formatUSD(stats.overdueAmountUSD)})
          </p>
          <p className="text-[11px] text-red-600 font-medium">Requires immediate finance follow-up</p>
        </div>

        {/* Collected This Month */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Settled This Month</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-extrabold text-gray-900 font-mono">
            {currencyService.formatUSD(stats.collectedThisMonthUSD)}
          </p>
          <p className="text-[11px] text-gray-500">Wire receipts credited in current month</p>
        </div>
      </div>

      {/* Tabs: Milestones vs Payment Receipts */}
      <div className="border-b border-gray-200 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'milestones'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Payment Milestones Schedule ({filteredMilestones.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'history'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Transaction Receipts & Advices ({paymentRecords.length})
        </button>
      </div>

      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by milestone, order #, partner..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as PaymentStatus | 'All')}
                  className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Overdue">Overdue (Priority)</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div>
                <select
                  value={methodFilter}
                  onChange={e => setMethodFilter(e.target.value as PaymentMethod | 'All')}
                  className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="All">All Methods</option>
                  <option value="TT">T/T Wire</option>
                  <option value="LC at sight">LC at sight</option>
                  <option value="Usance LC">Usance LC</option>
                  <option value="CAD">CAD</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>
          </div>

          {/* Milestones Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Milestone</th>
                  <th className="py-3 px-4">Order & Partner</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Scheduled Amount</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMilestones.map(m => {
                  const order = orders.find(o => o.id === m.orderId);
                  const comp = order ? companies.find(c => c.id === order.companyId) : null;
                  const remaining = Math.max(0, m.amount - (m.paidAmount || 0));

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-blue-50/30 transition ${
                        m.status === 'Overdue' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{m.name}</p>
                        {m.notes && <p className="text-[11px] text-gray-500 mt-0.5">{m.notes}</p>}
                      </td>

                      <td className="py-3 px-4">
                        {order && (
                          <button
                            onClick={() => onNavigateToOrder && onNavigateToOrder(order.id)}
                            className="font-mono font-semibold text-blue-700 hover:underline block text-left"
                          >
                            {order.orderNumber} ({order.orderType === 'Sales Order' ? 'SO' : 'PO'})
                          </button>
                        )}
                        {comp && (
                          <button
                            onClick={() => onNavigateToCompany && onNavigateToCompany(comp.id)}
                            className="text-[11px] text-gray-600 hover:underline text-left"
                          >
                            {comp.name}
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className={m.status === 'Overdue' ? 'text-red-700 font-bold' : 'text-gray-700'}>
                          {m.dueDate}
                        </span>
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(m.status)}</td>

                      <td className="py-3 px-4 text-gray-600">{m.method}</td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {m.currency} {m.amount.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {remaining > 0 ? (
                          <span className={m.status === 'Overdue' ? 'text-red-700' : 'text-gray-800'}>
                            {m.currency} {remaining.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700">Settled (0)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {canManagePayments && remaining > 0 ? (
                          <button
                            onClick={() => setRecordMilestone(m)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 shadow-2xs"
                          >
                            Record Payment
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400">Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Receipts Log */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Reference No.</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount Credited</th>
                <th className="py-3 px-4">Notes / Bank</th>
                <th className="py-3 px-4 text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paymentRecords.map(rec => {
                const order = orders.find(o => o.id === rec.orderId);
                return (
                  <tr key={rec.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {rec.referenceNumber}
                    </td>

                    <td className="py-3 px-4 font-mono text-blue-700 font-medium">
                      {order ? (
                        <button
                          onClick={() => onNavigateToOrder && onNavigateToOrder(order.id)}
                          className="hover:underline"
                        >
                          {order.orderNumber}
                        </button>
                      ) : (
                        rec.orderId
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-600">{rec.paymentDate}</td>

                    <td className="py-3 px-4 text-gray-700 font-medium">{rec.method}</td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {rec.currency} {rec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{rec.notes || '—'}</td>

                    <td className="py-3 px-4 text-right text-gray-500 font-medium">{rec.recordedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!recordMilestone}
        onClose={() => setRecordMilestone(null)}
        milestone={recordMilestone}
        onPaymentRecorded={() => {
          reloadMilestones();
          setRecordMilestone(null);
        }}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
