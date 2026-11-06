import React, { useState, useMemo } from 'react';
import {
  Deal,
  DealStage,
  DealType,
  Company,
  Contact,
  Product,
  User,
  NavPage,
} from '../../types';
import { dealsService, DEAL_STAGES } from '../../services/dealsService';
import { authService } from '../../services/authService';
import { currencyService } from '../../services/currencyService';
import { DataTable, Column } from '../common/DataTable';
import { MoveStageLostModal } from '../deals/MoveStageLostModal';
import { MoveStageConfirmModal } from '../deals/MoveStageConfirmModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Kanban,
  Table as TableIcon,
  Plus,
  Download,
  Filter,
  DollarSign,
  Building2,
  Calendar,
  User as UserIcon,
  RotateCcw,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  GripVertical,
} from 'lucide-react';

interface DealsPipelineViewProps {
  deals: Deal[];
  companies: Company[];
  products: Product[];
  onRefresh: () => void;
  onNavigate: (page: NavPage, params?: { dealId?: string; companyId?: string }) => void;
  onOpenAddDeal: () => void;
  onEditDeal: (deal: Deal) => void;
  currentUser: User;
}

export function DealsPipelineView({
  deals,
  companies,
  products,
  onRefresh,
  onNavigate,
  onOpenAddDeal,
  onEditDeal,
  currentUser,
}: DealsPipelineViewProps) {
  const { showToast } = useToast();

  // View mode: 'kanban' vs 'table' (on mobile default to table/cards)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedOwner, setSelectedOwner] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  // Modals for stage transitions
  const [dealForLostModal, setDealForLostModal] = useState<Deal | null>(null);
  const [dealForConfirmModal, setDealForConfirmModal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const canManage = authService.canManageDeals(currentUser.role);
  const canDelete = authService.canDeleteDeals(currentUser.role);

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach((c) => map.set(c.id, c));
    return map;
  }, [companies]);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Unique owners
  const owners = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => set.add(d.owner));
    return Array.from(set).sort();
  }, [deals]);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return dealsService.getDeals(
      {
        search,
        stage: selectedStage,
        dealType: selectedType,
        companyId: selectedCompany,
        owner: selectedOwner,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
      currentUser.role
    );
  }, [
    deals,
    search,
    selectedStage,
    selectedType,
    selectedCompany,
    selectedOwner,
    dateFrom,
    dateTo,
    currentUser.role,
  ]);

  // Stage transition handler with confirmation checks
  const handleStageChangeRequest = (deal: Deal, newStage: DealStage) => {
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

    // Direct transition
    dealsService.updateDealStage(deal.id, newStage, currentUser.name);
    showToast(`Deal moved to ${newStage}`, 'success');
    onRefresh();
  };

  const handleConfirmLost = (reason: string) => {
    if (!dealForLostModal) return;
    dealsService.updateDealStage(dealForLostModal.id, 'Lost', currentUser.name, undefined, reason);
    showToast(`Deal marked as Lost: ${reason}`, 'info', 'Deal Closed');
    setDealForLostModal(null);
    onRefresh();
  };

  const handleConfirmOrder = () => {
    if (!dealForConfirmModal) return;
    dealsService.updateDealStage(dealForConfirmModal.id, 'Order Confirmed', currentUser.name, 'Contract confirmed');
    showToast('Deal confirmed and booked!', 'success', 'Order Confirmed');
    setDealForConfirmModal(null);
    onRefresh();
  };

  const handleDeleteConfirm = () => {
    if (!dealToDelete) return;
    try {
      dealsService.deleteDeal(dealToDelete.id);
      showToast(`Deal "${dealToDelete.title}" deleted.`, 'success', 'Deleted');
      setDealToDelete(null);
      onRefresh();
    } catch {
      showToast('Error deleting deal', 'error');
    }
  };

  const handleExportCSV = () => {
    dealsService.exportDealsToCSV(filteredDeals);
    showToast('Exported deals pipeline to CSV', 'success', 'Export Complete');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStage('All');
    setSelectedType('All');
    setSelectedCompany('All');
    setSelectedOwner('All');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    if (!canManage) return;
    e.dataTransfer.setData('text/plain', dealId);
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (!dealId) return;

    const deal = filteredDeals.find((d) => d.id === dealId);
    if (deal) {
      handleStageChangeRequest(deal, targetStage);
    }
    setDraggedDealId(null);
  };

  // Column definitions for Table view
  const columns: Column<Deal>[] = [
    {
      header: 'Deal Title',
      sortable: true,
      sortKey: 'title',
      render: (d) => {
        const comp = companyMap.get(d.companyId);
        return (
          <div>
            <button
              type="button"
              onClick={() => onNavigate('deal-detail', { dealId: d.id })}
              className="text-left font-semibold text-slate-900 hover:text-blue-900 transition-colors"
            >
              {d.title}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                  d.dealType === 'Sale'
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}
              >
                {d.dealType}
              </span>
              <span>{comp ? comp.name : 'Unknown Company'}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Stage',
      sortable: true,
      sortKey: 'stage',
      render: (d) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
            d.stage === 'Order Confirmed'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : d.stage === 'Lost'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : d.stage === 'Negotiation'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {d.stage}
        </span>
      ),
    },
    {
      header: 'Contract Value',
      sortable: true,
      sortKey: 'totalValue',
      render: (d) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-slate-900">
            {currencyService.formatAmount(d.totalValue, d.currency)}
          </div>
          {d.currency !== 'USD' && (
            <div className="font-mono text-[11px] text-slate-400">
              ≈ {currencyService.formatUSD(currencyService.convertToUSD(d.totalValue, d.currency), true)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Volume & Specs',
      render: (d) => (
        <div className="text-xs">
          <span className="font-mono font-medium text-slate-800">
            {d.quantity} {d.unit}
          </span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="text-slate-500">
            {currencyService.formatAmount(d.pricePerUnit, d.currency)}/{d.unit}
          </span>
        </div>
      ),
    },
    {
      header: 'Terms & Port',
      render: (d) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800">
            {d.incoterm} · {d.destinationPort}
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-xs">{d.paymentTerms}</div>
        </div>
      ),
    },
    {
      header: 'Close Date',
      sortable: true,
      sortKey: 'expectedCloseDate',
      render: (d) => (
        <div className="text-xs font-mono tabular-nums text-slate-700">
          {d.expectedCloseDate}
          <div className="text-[11px] text-slate-400 font-sans">{d.probability}% prob</div>
        </div>
      ),
    },
    {
      header: 'Owner',
      render: (d) => <span className="text-xs text-slate-600">{d.owner}</span>,
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onNavigate('deal-detail', { dealId: d.id })}
            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
            title="View deal detail & audit timeline"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => onEditDeal(d)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
              title="Edit deal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDealToDelete(d)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
              title="Delete deal (CEO only)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Deals & Sales Pipeline
            </h1>
            {currentUser.role === 'Procurement' && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                Purchase Deals Only
              </span>
            )}
            {(currentUser.role === 'Accounts' || currentUser.role === 'Warehouse') && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                Read-Only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Stage-by-stage contract progress from initial inquiry to banking LC & vessel dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (desktop only) */}
          <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Export filtered pipeline to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={onOpenAddDeal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deal</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search Deal / Port
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, port, notes, terms..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Deal Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="All">All Types</option>
              <option value="Sale">Sale (Export)</option>
              <option value="Purchase">Purchase (Import)</option>
            </select>
          </div>

          {/* Stage filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Stage
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="All">All Stages</option>
              {DEAL_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Owner filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Owner
            </label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="All">All Staff</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Company filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Company
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              >
                <option value="All">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {(search || selectedStage !== 'All' || selectedType !== 'All' || selectedCompany !== 'All' || selectedOwner !== 'All') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded border border-slate-200"
                  title="Clear filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 font-mono tabular-nums">
          <span>
            Showing <strong>{filteredDeals.length}</strong> active deals
          </span>
          <span>
            Total Value:{' '}
            <strong className="text-slate-900 font-bold">
              {currencyService.formatUSD(
                filteredDeals.reduce(
                  (sum, d) => sum + currencyService.convertToUSD(d.totalValue, d.currency),
                  0
                )
              )}{' '}
              (USD est.)
            </strong>
          </span>
        </div>
      </div>

      {/* KANBAN BOARD VIEW (Desktop & Tablets) */}
      {viewMode === 'kanban' && (
        <div className="hidden md:grid md:grid-cols-6 gap-3 min-h-[550px] overflow-x-auto pb-4">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage);
            const stageValueUSD = stageDeals.reduce(
              (sum, d) => sum + currencyService.convertToUSD(d.totalValue, d.currency),
              0
            );

            const stageBorderColors: Record<DealStage, string> = {
              'New Inquiry': 'border-t-blue-500',
              'Sample Sent': 'border-t-purple-500',
              'Quote Sent': 'border-t-indigo-500',
              'Negotiation': 'border-t-amber-500',
              'Order Confirmed': 'border-t-emerald-600',
              'Lost': 'border-t-rose-500',
            };

            return (
              <div
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className={`bg-slate-100/70 border border-slate-200 border-t-4 ${stageBorderColors[stage]} rounded-xl p-2.5 flex flex-col min-w-[210px] transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate">{stage}</h3>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {currencyService.formatUSD(stageValueUSD, true)}
                    </div>
                  </div>
                  <span className="text-xs px-1.5 py-0.2 rounded-full font-mono font-bold bg-white text-slate-700 border border-slate-200">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-22rem)]">
                  {stageDeals.length === 0 ? (
                    <div className="h-28 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                      <span className="text-[11px] text-slate-400">Drag deals here</span>
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const comp = companyMap.get(deal.companyId);
                      return (
                        <div
                          key={deal.id}
                          draggable={canManage}
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => onNavigate('deal-detail', { dealId: deal.id })}
                          className={`bg-white rounded-lg border border-slate-200/90 p-3 shadow-2xs space-y-2 cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all ${
                            draggedDealId === deal.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                                deal.dealType === 'Sale'
                                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              }`}
                            >
                              {deal.dealType}
                            </span>
                            <span className="text-[11px] font-mono tabular-nums text-slate-400 font-medium">
                              {deal.probability}%
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                            {deal.title}
                          </h4>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{comp ? comp.name : 'Unknown Mill'}</span>
                          </div>

                          <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 font-mono">
                            <span className="text-xs font-bold text-slate-900">
                              {currencyService.formatAmount(deal.totalValue, deal.currency)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {deal.quantity} {deal.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span>{deal.incoterm} · {deal.expectedCloseDate.slice(5)}</span>
                            <span className="text-slate-600 font-medium truncate max-w-[80px]">
                              {deal.owner.split(' ')[0]}
                            </span>
                          </div>

                          {/* Quick stage move switcher on card */}
                          {canManage && (
                            <div
                              className="pt-1.5 border-t border-slate-100 flex items-center justify-between"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-slate-400">Stage:</span>
                              <select
                                value={deal.stage}
                                onChange={(e) =>
                                  handleStageChangeRequest(deal, e.target.value as DealStage)
                                }
                                className="text-[10px] py-0.5 px-1 bg-slate-50 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-900"
                              >
                                {DEAL_STAGES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW (Desktop if toggled, or always on Mobile) */}
      {(viewMode === 'table' || true) && (
        <div className={viewMode === 'table' ? 'block' : 'md:hidden'}>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={filteredDeals}
              keyExtractor={(d) => d.id}
              emptyMessage="No deals found"
              emptySubtext="Try adjusting your pipeline filters."
              emptyAction={
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  Clear Filters
                </button>
              }
            />
          </div>

          {/* Mobile Card View with Stage Dropdown */}
          <div className="md:hidden space-y-3">
            {filteredDeals.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <Kanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">No deals in pipeline</h4>
                <p className="text-xs text-slate-500 mt-1">Try resetting your active filters.</p>
              </div>
            ) : (
              filteredDeals.map((deal) => {
                const comp = companyMap.get(deal.companyId);
                return (
                  <div
                    key={deal.id}
                    onClick={() => onNavigate('deal-detail', { dealId: deal.id })}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                              deal.dealType === 'Sale'
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            }`}
                          >
                            {deal.dealType}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {comp ? comp.name : 'Unknown Partner'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{deal.title}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-slate-900 block">
                          {currencyService.formatAmount(deal.totalValue, deal.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {deal.quantity} {deal.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{deal.incoterm} · {deal.destinationPort}</span>
                      <span className="font-mono">Close: {deal.expectedCloseDate}</span>
                    </div>

                    {/* Stage selector on mobile */}
                    <div
                      className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-slate-500 font-medium">Stage:</span>
                      <select
                        value={deal.stage}
                        disabled={!canManage}
                        onChange={(e) =>
                          handleStageChangeRequest(deal, e.target.value as DealStage)
                        }
                        className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-900 disabled:opacity-50"
                      >
                        {DEAL_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      <MoveStageLostModal
        isOpen={Boolean(dealForLostModal)}
        onClose={() => setDealForLostModal(null)}
        deal={dealForLostModal}
        onConfirm={handleConfirmLost}
      />

      {/* Order Confirmed Confirmation Modal */}
      <MoveStageConfirmModal
        isOpen={Boolean(dealForConfirmModal)}
        onClose={() => setDealForConfirmModal(null)}
        deal={dealForConfirmModal}
        company={dealForConfirmModal ? companyMap.get(dealForConfirmModal.companyId) : null}
        onConfirm={handleConfirmOrder}
      />

      {/* Delete Deal Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(dealToDelete)}
        onClose={() => setDealToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Deal Record"
        message={`Are you sure you want to permanently delete "${dealToDelete?.title}"? All associated stage histories will be deleted.`}
        confirmText="Delete Deal"
        isDestructive={true}
      />
    </div>
  );
}
