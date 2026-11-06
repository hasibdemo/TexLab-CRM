import { useState, useMemo } from 'react';
import {
  Deal,
  DealStage,
  Company,
  Contact,
  Product,
  Activity,
  NavPage,
  User,
} from '../../types';
import { dealsService, DEAL_STAGES } from '../../services/dealsService';
import { activitiesService } from '../../services/activitiesService';
import { authService } from '../../services/authService';
import { currencyService } from '../../services/currencyService';
import { MoveStageLostModal } from '../deals/MoveStageLostModal';
import { MoveStageConfirmModal } from '../deals/MoveStageConfirmModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Plus,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Package,
  Layers,
  MapPin,
  CreditCard,
  UserCheck,
  Phone,
  Mail,
  Users,
  FileText,
  ShieldCheck,
  PackageCheck,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { quotesService } from '../../services/quotesService';
import { ordersService } from '../../services/ordersService';
import QuotePrintPreviewModal from '../quotes/QuotePrintPreviewModal';

interface DealDetailViewProps {
  dealId: string;
  onNavigate: (page: NavPage, params?: { companyId?: string; dealId?: string; orderId?: string }) => void;
  onEditDeal: (deal: Deal) => void;
  onOpenLogActivity: (companyId: string, contactId?: string, dealId?: string) => void;
  currentUser: User;
  companies: Company[];
  contacts: Contact[];
  products: Product[];
  onRefresh: () => void;
}

export function DealDetailView({
  dealId,
  onNavigate,
  onEditDeal,
  onOpenLogActivity,
  currentUser,
  companies,
  contacts,
  products,
  onRefresh,
}: DealDetailViewProps) {
  const { showToast } = useToast();

  const [dealForLostModal, setDealForLostModal] = useState<Deal | null>(null);
  const [dealForConfirmModal, setDealForConfirmModal] = useState<Deal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  // M3: Prompt to create order now when moving to Order Confirmed
  const [promptCreateOrder, setPromptCreateOrder] = useState<Deal | null>(null);
  const [previewQuote, setPreviewQuote] = useState<any | null>(null);

  const canManage = authService.canManageDeals(currentUser.role);
  const canDelete = authService.canDeleteDeals(currentUser.role);
  const canLog = authService.canLogActivity(currentUser.role);
  const canManageQuotes = authService.canManageQuotes(currentUser.role);
  const canManageOrders = authService.canManageOrders(currentUser.role);


  const deal = useMemo(() => {
    return dealsService.getDealById(dealId);
  }, [dealId]);

  const company = useMemo(() => {
    return deal ? companies.find((c) => c.id === deal.companyId) : null;
  }, [deal, companies]);

  const contact = useMemo(() => {
    return deal && deal.contactId ? contacts.find((c) => c.id === deal.contactId) : null;
  }, [deal, contacts]);

  const product = useMemo(() => {
    return deal && deal.productId ? products.find((p) => p.id === deal.productId) : null;
  }, [deal, products]);

  // Linked activities for this deal
  const dealActivities = useMemo(() => {
    return activitiesService.getActivities(undefined, dealId);
  }, [dealId]);

  // M3: Linked Quotes and Linked Orders for this deal
  const linkedQuotes = useMemo(() => {
    return quotesService.getQuotes({ dealId });
  }, [dealId]);

  const linkedOrders = useMemo(() => {
    return ordersService.getOrders({ dealId });
  }, [dealId]);

  const handleCreateQuote = () => {
    if (!deal) return;
    const quote = quotesService.createQuoteFromDeal(deal.id, currentUser.name);
    showToast(`Quotation ${quote.quoteNumber} created from deal!`, 'success');
    setPreviewQuote(quote);
    onRefresh();
  };

  if (!deal) {

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <h3 className="text-base font-bold text-slate-900">Deal Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This deal record may have been removed or deleted.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('deals')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-950"
        >
          Return to Pipeline
        </button>
      </div>
    );
  }

  const handleStageChange = (newStage: DealStage) => {
    if (!canManage) {
      showToast('Your role has read-only access to deals.', 'warning');
      return;
    }
    if (deal.stage === newStage) return;

    if (newStage === 'Lost') {
      setDealForLostModal(deal);
      return;
    }
    if (newStage === 'Order Confirmed') {
      setDealForConfirmModal(deal);
      return;
    }

    dealsService.updateDealStage(deal.id, newStage, currentUser.name);
    showToast(`Deal moved to ${newStage}`, 'success');
    onRefresh();
  };

  const handleConfirmLost = (reason: string) => {
    dealsService.updateDealStage(deal.id, 'Lost', currentUser.name, undefined, reason);
    showToast(`Deal marked as Lost: ${reason}`, 'info', 'Deal Closed');
    setDealForLostModal(null);
    onRefresh();
  };

  const handleConfirmOrder = () => {
    dealsService.updateDealStage(deal.id, 'Order Confirmed', currentUser.name, 'Contract confirmed');
    showToast('Deal confirmed and booked!', 'success', 'Order Confirmed');
    setDealForConfirmModal(null);
    setPromptCreateOrder(deal);
    onRefresh();
  };


  const handleDeleteDeal = () => {
    dealsService.deleteDeal(deal.id);
    showToast(`Deal "${deal.title}" deleted.`, 'success', 'Deleted');
    onRefresh();
    onNavigate('deals');
  };

  const handleDeleteActivity = () => {
    if (!activityToDelete) return;
    activitiesService.deleteActivity(activityToDelete.id);
    showToast('Activity record removed.', 'success');
    setActivityToDelete(null);
    onRefresh();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-blue-700" />;
      case 'email':
        return <Mail className="w-4 h-4 text-purple-700" />;
      case 'meeting':
        return <Users className="w-4 h-4 text-emerald-700" />;
      default:
        return <FileText className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top back bar & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('deals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deals Pipeline</span>
        </button>

        <div className="flex items-center gap-2">
          {canManageQuotes && (
            <button
              type="button"
              onClick={handleCreateQuote}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Create Quote</span>
            </button>
          )}
          {canLog && (
            <button
              type="button"
              onClick={() => onOpenLogActivity(deal.companyId, deal.contactId, deal.id)}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Activity on Deal</span>
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => onEditDeal(deal)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Deal</span>
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
              title="Delete deal (CEO only)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Deal Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  deal.dealType === 'Sale'
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                {deal.dealType === 'Sale' ? 'Export Sale' : 'Import Purchase'}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                  deal.stage === 'Order Confirmed'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : deal.stage === 'Lost'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : deal.stage === 'Negotiation'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                Stage: {deal.stage}
              </span>
              <span className="text-xs font-mono text-slate-500">
                Probability: <strong>{deal.probability}%</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {deal.title}
            </h1>

            {/* Counterparty Link */}
            {company && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Partner:</span>
                <button
                  type="button"
                  onClick={() => onNavigate('company-detail', { companyId: company.id })}
                  className="font-semibold text-blue-900 hover:underline flex items-center gap-1"
                >
                  <span>{company.name} ({company.city}, {company.country})</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Deal Value summary card */}
          <div className="sm:text-right bg-slate-50 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200/90 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Contract Total Value
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {currencyService.formatAmount(deal.totalValue, deal.currency)}
            </div>
            {deal.currency !== 'USD' && (
              <div className="text-xs font-mono text-slate-500">
                ≈ {currencyService.formatUSD(currencyService.convertToUSD(deal.totalValue, deal.currency))} (USD base)
              </div>
            )}
          </div>
        </div>

        {/* Stage Stepper Bar */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Pipeline Progression
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5">
            {DEAL_STAGES.map((st, idx) => {
              const isCurrent = deal.stage === st;
              const isPassed =
                DEAL_STAGES.indexOf(deal.stage) > idx && deal.stage !== 'Lost';

              return (
                <button
                  key={st}
                  type="button"
                  disabled={!canManage}
                  onClick={() => handleStageChange(st)}
                  className={`py-2 px-1.5 rounded-lg text-xs font-semibold text-center border transition-all ${
                    isCurrent
                      ? st === 'Lost'
                        ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                        : st === 'Order Confirmed'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-blue-900 text-white border-blue-950 shadow-xs'
                      : isPassed
                      ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  } disabled:cursor-not-allowed`}
                >
                  <span className="block truncate">{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Commercial Specs & Notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Commercial Specs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Commercial & Shipment Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Quantity & Unit</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {deal.quantity} {deal.unit}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Price Per Unit</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {currencyService.formatAmount(deal.pricePerUnit, deal.currency)} / {deal.unit}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Incoterm</span>
                <span className="text-sm font-semibold text-slate-900">
                  {deal.incoterm}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Destination Port / Yard</span>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {deal.destinationPort}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Payment Terms</span>
                <span className="text-sm font-medium text-slate-900">
                  {deal.paymentTerms}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block mb-0.5">Expected Target Close</span>
                <span className="text-sm font-mono text-slate-900">
                  {deal.expectedCloseDate}
                </span>
              </div>
            </div>

            {/* Product Card if linked */}
            {product && (
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-900" />
                    Catalog Commodity: {product.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">HS: {product.hsCode}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {product.materialComposition} · Grade: {product.grade} · Origin: {product.originCountry}
                </p>
                {product.category === 'Yarn' && product.yarnCount && (
                  <p className="text-[11px] text-blue-800 font-mono">
                    Yarn count: {product.yarnCount} ({product.spinningType})
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Internal Trading Notes
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {deal.notes || 'No trade notes recorded.'}
              </p>
            </div>

            {/* Lost Reason if Lost */}
            {deal.stage === 'Lost' && deal.lostReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Reason for Lost Deal:
                </span>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {deal.lostReason}
                </p>
              </div>
            )}
          </div>

          {/* Linked Quotations Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                Linked Quotations & Proformas ({linkedQuotes.length})
              </h3>
              {canManageQuotes && (
                <button
                  type="button"
                  onClick={handleCreateQuote}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Quote</span>
                </button>
              )}
            </div>

            {linkedQuotes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No quotations generated for this deal yet. Click "Create Quote" above.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {linkedQuotes.map(q => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-900">{q.quoteNumber}</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                          {q.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {q.type} • Valid until: {q.validityDate}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {q.currency} {q.total.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewQuote(q)}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Orders Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-700" />
                Linked Confirmed Orders ({linkedOrders.length})
              </h3>
            </div>

            {linkedOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No orders registered for this deal yet. Moving to "Order Confirmed" will prompt creation.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {linkedOrders.map(o => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onNavigate('order-detail', { orderId: o.id })}
                          className="font-mono font-bold text-blue-900 hover:underline"
                        >
                          {o.orderNumber}
                        </button>
                        <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {o.orderType} • ETD: {o.expectedShipmentDate}
                      </p>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {o.currency} {o.total.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('order-detail', { orderId: o.id })}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Activities */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Linked Deal Activity ({dealActivities.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Calls, lab sample feedback, and WhatsApp negotiation records.
                </p>
              </div>
              {canLog && (
                <button
                  type="button"
                  onClick={() => onOpenLogActivity(deal.companyId, deal.contactId, deal.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log Call</span>
                </button>
              )}
            </div>

            {dealActivities.length === 0 ? (
              <div className="p-6 border border-dashed border-slate-200 rounded-lg text-center">
                <Clock className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500">No activity logged specifically for this deal yet.</p>
                {canLog && (
                  <button
                    type="button"
                    onClick={() => onOpenLogActivity(deal.companyId, deal.contactId, deal.id)}
                    className="mt-2 text-xs font-semibold text-blue-900 hover:underline"
                  >
                    + Log First Activity on this Deal
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {dealActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActivityIcon(act.type)}
                        <span className="text-xs font-bold text-slate-900">{act.title}</span>
                        {act.outcome && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {act.outcome}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(act.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{act.description}</p>
                    <div className="text-[10px] text-slate-400 pl-6">by {act.loggedBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stage History Timeline & Account Stakeholders */}
        <div className="space-y-5">
          {/* Stage History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-900" />
              Stage-History Timeline
            </h3>

            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {deal.stageHistory.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-[1.3rem] top-1 w-2.5 h-2.5 rounded-full bg-blue-900 ring-4 ring-white" />
                  <div className="text-xs font-bold text-slate-900">{item.stage}</div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    {new Date(item.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">by {item.changedBy}</div>
                  {item.note && (
                    <div className="text-[11px] text-slate-500 italic mt-0.5">
                      &ldquo;{item.note}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Account Stakeholder Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Account Stakeholders
            </h3>

            <div>
              <span className="text-[11px] text-slate-500 block">Deal Owner (Internal Staff)</span>
              <span className="text-xs font-semibold text-slate-900">{deal.owner}</span>
            </div>

            {contact && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 block">Primary Mill Contact</span>
                <div className="text-xs font-semibold text-slate-900">{contact.name}</div>
                <div className="text-[11px] text-slate-500">{contact.position}</div>
                <div className="text-[11px] text-blue-700 mt-0.5">{contact.phone}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lost Reason Modal */}
      <MoveStageLostModal
        isOpen={Boolean(dealForLostModal)}
        onClose={() => setDealForLostModal(null)}
        deal={dealForLostModal}
        onConfirm={handleConfirmLost}
      />

      {/* Order Confirmed Modal */}
      <MoveStageConfirmModal
        isOpen={Boolean(dealForConfirmModal)}
        onClose={() => setDealForConfirmModal(null)}
        deal={dealForConfirmModal}
        company={company}
        onConfirm={handleConfirmOrder}
      />

      {/* Delete Deal Confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteDeal}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deal.title}"?`}
        confirmText="Delete Deal"
        isDestructive={true}
      />

      {/* Prompt Create Order Dialog */}
      {promptCreateOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-sm">Deal Confirmed! Create Order Now?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deal <strong>"{promptCreateOrder.title}"</strong> has been successfully booked. Would you like to register an official {promptCreateOrder.dealType === 'Purchase' ? 'Purchase Order' : 'Sales Order'} now with auto-filled terms?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPromptCreateOrder(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-700 font-medium hover:bg-slate-50"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => {
                  const ord = ordersService.createOrderFromDeal(promptCreateOrder.id, currentUser.name);
                  setPromptCreateOrder(null);
                  showToast(`Order ${ord.orderNumber} created!`, 'success');
                  onNavigate('order-detail', { orderId: ord.id });
                }}
                className="px-3.5 py-1.5 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-950 flex items-center gap-1.5"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Create Order Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      <QuotePrintPreviewModal
        isOpen={Boolean(previewQuote)}
        onClose={() => setPreviewQuote(null)}
        quote={previewQuote}
      />
    </div>
  );
}

