import { useMemo, useState } from 'react';
import { Company, Activity, Deal, NavPage, User, PaymentMilestone } from '../../types';
import { StatCard } from '../common/StatCard';
import { dealsService, DEAL_STAGES } from '../../services/dealsService';
import { quotesService } from '../../services/quotesService';
import { ordersService } from '../../services/ordersService';
import { paymentsService } from '../../services/paymentsService';
import { currencyService } from '../../services/currencyService';
import { authService } from '../../services/authService';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import {
  Building2,
  ShoppingBag,
  Factory,
  CalendarPlus,
  Plus,
  PhoneCall,
  ArrowRight,
  Globe2,
  Phone,
  Mail,
  Users,
  FileText,
  Kanban,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  companies: Company[];
  activities: Activity[];
  deals: Deal[];
  onNavigate: (
    page: NavPage,
    params?: { companyId?: string; countryFilter?: string; stageFilter?: string; orderId?: string }
  ) => void;
  onOpenAddCompany: () => void;
  onOpenAddDeal: () => void;
  onOpenLogActivity: () => void;
  currentUser: User;
}

export function DashboardView({
  companies,
  activities,
  deals,
  onNavigate,
  onOpenAddCompany,
  onOpenAddDeal,
  onOpenLogActivity,
  currentUser,
}: DashboardViewProps) {
  const canManageDeals = authService.canManageDeals(currentUser.role);
  const canViewPrices = authService.canViewPrices(currentUser.role);
  const canManagePayments = authService.canManagePayments(currentUser.role);

  const [paymentToRecord, setPaymentToRecord] = useState<PaymentMilestone | null>(null);

  // M1 metrics
  const companyMetrics = useMemo(() => {
    const total = companies.length;
    const buyers = companies.filter((c) => c.type === 'Buyer').length;
    const suppliers = companies.filter((c) => c.type === 'Supplier').length;
    return { total, buyers, suppliers };
  }, [companies]);

  // M2 deal metrics
  const dealMetrics = useMemo(() => {
    return dealsService.calculatePipelineMetrics(deals);
  }, [deals]);

  // M3 Quotes, Orders, and Payments metrics
  const quotes = useMemo(() => quotesService.getQuotes(), []);
  const orders = useMemo(() => ordersService.getOrders(), []);
  const paymentStats = useMemo(() => paymentsService.getGlobalPaymentStats(), []);

  const openQuotes = useMemo(() => {
    return quotes.filter(q => q.status === 'Draft' || q.status === 'Sent');
  }, [quotes]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  }, [orders]);

  const overdueMilestones = useMemo(() => {
    return paymentsService.getMilestones({ status: 'Overdue' });
  }, []);

  // Monthly Revenue / Collections simulation
  const monthlyRevenueData = useMemo(() => {
    return [
      { month: 'Jun 2026', revenue: 95000, target: 110000 },
      { month: 'Jul 2026', revenue: 135000, target: 120000 },
      { month: 'Aug 2026', revenue: 162000, target: 140000 },
      { month: 'Sep 2026', revenue: 184000, target: 150000 },
      { month: 'Oct 2026', revenue: 215000, target: 180000 },
      { month: 'Nov 2026 (MTD)', revenue: 142000, target: 190000 },
    ];
  }, []);

  // Companies by country
  const countryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach((c) => {
      const country = c.country || 'Other';
      counts[country] = (counts[country] || 0) + 1;
    });

    const list = Object.entries(counts).map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / (companies.length || 1)) * 100),
    }));

    return list.sort((a, b) => b.count - a.count);
  }, [companies]);

  // Recent activities
  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [activities]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-3.5 h-3.5 text-blue-700" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-purple-700" />;
      case 'meeting':
        return <Users className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  const getCompanyName = (companyId: string) => {
    const found = companies.find((c) => c.id === companyId);
    return found ? found.name : 'Direct Trading Desk';
  };

  const formatActivityTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stageColors: Record<string, string> = {
    'New Inquiry': 'bg-blue-500',
    'Sample Sent': 'bg-purple-500',
    'Quote Sent': 'bg-indigo-500',
    'Negotiation': 'bg-amber-500',
    'Order Confirmed': 'bg-emerald-600',
    'Lost': 'bg-rose-500',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Trading Operations & Commercial Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time pipeline, open proforma quotes, vessel logistics, and trade finance receivables.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLogActivity}
            className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </button>
          {canManageDeals && (
            <button
              type="button"
              onClick={onOpenAddDeal}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>New Deal</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAddCompany}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Row 1: Milestone 3 Financial & Commercial Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Open Quotes */}
        <StatCard
          label="Open Quotes"
          value={openQuotes.length}
          icon={<FileText className="w-4 h-4 text-blue-700" />}
          subtitle={
            canViewPrices
              ? `${quotes.length} total quotes · ${openQuotes.length} pending client sign-off`
              : 'Quotes pending acceptance'
          }
          onClick={() => onNavigate('quotes')}
        />

        {/* Active Orders */}
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          icon={<PackageCheck className="w-4 h-4 text-purple-700" />}
          subtitle={`${orders.length} total orders (SO & PO)`}
          onClick={() => onNavigate('orders')}
        />

        {/* Receivables Outstanding */}
        <StatCard
          label="Receivables"
          value={canViewPrices ? currencyService.formatUSD(paymentStats.receivablesOutstandingUSD, true) : 'Hidden'}
          icon={<ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
          changeText={canViewPrices ? 'From Buyers' : undefined}
          subtitle="Collections on sales orders"
          onClick={() => onNavigate('payments')}
        />

        {/* Payables Outstanding */}
        <StatCard
          label="Payables"
          value={canViewPrices ? currencyService.formatUSD(paymentStats.payablesOutstandingUSD, true) : 'Hidden'}
          icon={<ArrowUpRight className="w-4 h-4 text-blue-600" />}
          changeText={canViewPrices ? 'To Suppliers' : undefined}
          subtitle="Disbursements on purchase orders"
          onClick={() => onNavigate('payments')}
        />

        {/* Overdue Payments Card (Highlighted in Red if > 0) */}
        <div
          onClick={() => onNavigate('payments')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            paymentStats.overdueCount > 0
              ? 'bg-red-50/80 border-red-300 hover:border-red-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-700 mb-1">
            <span>Overdue Payments</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold font-mono text-red-700">
            {paymentStats.overdueCount} Overdue
          </div>
          <p className="text-[11px] text-red-600 font-medium mt-0.5">
            {canViewPrices
              ? `Worth ${currencyService.formatUSD(paymentStats.overdueAmountUSD)}`
              : 'Urgent collection required'}
          </p>
        </div>
      </div>

      {/* Row 2: Milestone 2 & 1 Core Pipeline & Company Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          label="Open Pipeline Value"
          value={canViewPrices ? currencyService.formatUSD(dealMetrics.pipelineValueUSD, true) : 'Hidden'}
          changeText="Base USD"
          icon={<DollarSign className="w-4 h-4" />}
          subtitle={`Across ${dealMetrics.openDealsCount} active trade contracts`}
          onClick={() => onNavigate('deals')}
        />
        <StatCard
          label="Open Deals"
          value={dealMetrics.openDealsCount}
          icon={<Kanban className="w-4 h-4" />}
          subtitle="Inquiries, quotes, and negotiations"
          onClick={() => onNavigate('deals')}
        />
        <StatCard
          label="Deals Won This Month"
          value={dealMetrics.dealsWonThisMonthCount}
          changeText="+Confirmed"
          icon={<CheckCircle2 className="w-4 h-4" />}
          subtitle={
            canViewPrices
              ? `Worth ${currencyService.formatUSD(dealMetrics.dealsWonValueUSD, true)}`
              : 'Confirmed agreements'
          }
          onClick={() => onNavigate('deals')}
        />
        <StatCard
          label="Total Companies"
          value={companyMetrics.total}
          icon={<Building2 className="w-4 h-4" />}
          subtitle={`${companyMetrics.buyers} Buyers · ${companyMetrics.suppliers} Suppliers`}
          onClick={() => onNavigate('companies')}
        />
      </div>

      {/* Row 3: Monthly Revenue Chart + Overdue Payments Urgent List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">Monthly Trade Revenue & Collections</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">2026 Trend (USD)</span>
          </div>

          {canViewPrices ? (
            <div className="mt-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                {monthlyRevenueData.map(item => {
                  const maxVal = 240000;
                  const revPct = Math.round((item.revenue / maxVal) * 100);

                  return (
                    <div key={item.month} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{item.month}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-slate-900">
                            {currencyService.formatUSD(item.revenue)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Target: {currencyService.formatUSD(item.target)})
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${revPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Collections realized against executed commercial sales invoices</span>
                <button
                  type="button"
                  onClick={() => onNavigate('payments')}
                  className="font-medium text-blue-900 hover:underline flex items-center gap-1"
                >
                  View Payments <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 my-auto">
              Monthly revenue figures are hidden for the Warehouse role.
            </div>
          )}
        </div>

        {/* Overdue Payments Urgent Action Box */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-bold text-slate-900">Overdue Settlements Attention</h2>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-red-700 font-semibold hover:underline"
            >
              See all
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 flex-1">
            {overdueMilestones.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                All client payment milestones and invoices are currently on schedule.
              </p>
            ) : (
              overdueMilestones.map(m => {
                const order = orders.find(o => o.id === m.orderId);
                const comp = order ? companies.find(c => c.id === order.companyId) : null;
                const rem = Math.max(0, m.amount - (m.paidAmount || 0));

                return (
                  <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {comp ? comp.name : 'Partner'} • Due:{' '}
                        <span className="text-red-700 font-bold font-mono">{m.dueDate}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-red-700">
                        {canViewPrices ? `${m.currency} ${rem.toLocaleString()}` : 'Overdue'}
                      </p>
                      {canManagePayments && (
                        <button
                          type="button"
                          onClick={() => setPaymentToRecord(m)}
                          className="text-[11px] text-blue-700 hover:underline font-semibold mt-0.5 block ml-auto"
                        >
                          Record Payment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Deals by Stage Chart & Companies by Country Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deals by Stage */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-900" />
              <h2 className="text-sm font-bold text-slate-900">Deals by Stage</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('deals')}
              className="text-xs font-semibold text-blue-900 hover:text-blue-950 flex items-center gap-1"
            >
              Pipeline board <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-4 space-y-3 flex-1">
            {dealMetrics.stageBreakdown.map((item) => {
              const maxVal = Math.max(...dealMetrics.stageBreakdown.map((s) => s.valueUSD), 1);
              const barWidth = Math.max(Math.round((item.valueUSD / maxVal) * 100), item.count > 0 ? 10 : 0);

              return (
                <div
                  key={item.stage}
                  className="group cursor-pointer"
                  onClick={() => onNavigate('deals')}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-900 transition-colors">
                      {item.stage}
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-bold text-slate-900">
                        {canViewPrices ? currencyService.formatUSD(item.valueUSD, true) : '—'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({item.count} {item.count === 1 ? 'deal' : 'deals'})
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stageColors[item.stage] || 'bg-blue-900'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Companies by Country Chart */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-blue-900" />
              <h2 className="text-sm font-bold text-slate-900">Companies by Country</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {countryStats.length} regions
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1">
            {countryStats.slice(0, 6).map((item) => {
              return (
                <div
                  key={item.country}
                  className="group cursor-pointer"
                  onClick={() => onNavigate('companies', { countryFilter: item.country })}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 group-hover:text-blue-900 transition-colors">
                      {item.country}
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-slate-900 font-bold">{item.count}</span>
                      <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-900 rounded-full transition-all duration-500 group-hover:bg-blue-700"
                      style={{ width: `${Math.max(item.percentage, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Activity Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Recent Trading Activity</h2>
          <button
            type="button"
            onClick={() => onNavigate('activities')}
            className="text-xs font-semibold text-blue-900 hover:text-blue-950 flex items-center gap-1"
          >
            All activities <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {recentActivities.map((act) => {
            const companyName = getCompanyName(act.companyId);
            return (
              <div
                key={act.id}
                onClick={() => onNavigate('company-detail', { companyId: act.companyId })}
                className="py-3 group cursor-pointer hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-100 mt-0.5 group-hover:bg-blue-50 transition-colors">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-900">
                        {act.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                        {formatActivityTime(act.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{companyName}</span>
                      <span aria-hidden="true">·</span>
                      <span>by {act.loggedBy}</span>
                      {act.outcome && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-700 font-medium">{act.outcome}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1 leading-normal">
                      {act.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Record Payment Modal from dashboard overdue row */}
      <RecordPaymentModal
        isOpen={Boolean(paymentToRecord)}
        onClose={() => setPaymentToRecord(null)}
        milestone={paymentToRecord}
        onPaymentRecorded={() => {
          setPaymentToRecord(null);
        }}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
