import React, { useState, useMemo } from 'react';
import { Quote, QuoteStatus, User } from '../../types';
import { quotesService } from '../../services/quotesService';
import { companiesService } from '../../services/companiesService';
import { authService } from '../../services/authService';
import QuoteFormModal from '../quotes/QuoteFormModal';
import QuotePrintPreviewModal from '../quotes/QuotePrintPreviewModal';
import {
  Search,
  Plus,
  Download,
  Filter,
  FileText,
  Printer,
  Copy,
  ArrowRight,
  MoreVertical,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface QuotesListViewProps {
  currentUser: User;
  onNavigateToOrder?: (orderId: string) => void;
  onNavigateToCompany?: (companyId: string) => void;
  onConvertToOrderRequest?: (quote: Quote) => void;
}

export default function QuotesListView({
  currentUser,
  onNavigateToOrder,
  onNavigateToCompany,
  onConvertToOrderRequest,
}: QuotesListViewProps) {
  const [quotes, setQuotes] = useState<Quote[]>(() => quotesService.getQuotes());
  const companies = useMemo(() => companiesService.getCompanies(), []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'All'>('All');
  const [companyFilter, setCompanyFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canManage = authService.canManageQuotes(currentUser.role);
  const canDelete = authService.canDeleteQuotes(currentUser.role);
  const canViewPrices = authService.canViewPrices(currentUser.role);

  const reloadQuotes = () => {
    setQuotes(quotesService.getQuotes());
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      if (statusFilter !== 'All' && q.status !== statusFilter) return false;
      if (companyFilter !== 'All' && q.companyId !== companyFilter) return false;
      if (startDate && q.date < startDate) return false;
      if (endDate && q.date > endDate) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const comp = companies.find(c => c.id === q.companyId);
        const matchNumber = q.quoteNumber.toLowerCase().includes(query);
        const matchComp = comp ? comp.name.toLowerCase().includes(query) : false;
        const matchItems = q.lineItems.some(i => i.productName.toLowerCase().includes(query));
        if (!matchNumber && !matchComp && !matchItems) return false;
      }
      return true;
    });
  }, [quotes, search, statusFilter, companyFilter, startDate, endDate, companies]);

  const handleDuplicateVersion = (quote: Quote) => {
    try {
      const duplicated = quotesService.duplicateAsNewVersion(quote.id, currentUser.name);
      reloadQuotes();
      setPreviewQuote(duplicated);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate quote version');
    }
  };

  const handleDelete = (id: string) => {
    quotesService.deleteQuote(id);
    setDeleteConfirmId(null);
    reloadQuotes();
  };

  const handleExportCSV = () => {
    quotesService.exportToCSV(filteredQuotes);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const colors: Record<QuoteStatus, string> = {
      Draft: 'bg-gray-100 text-gray-700 border-gray-300',
      Sent: 'bg-blue-50 text-blue-800 border-blue-200',
      Accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Rejected: 'bg-red-50 text-red-800 border-red-200',
      Expired: 'bg-amber-50 text-amber-800 border-amber-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            Quotations & Proforma Invoices
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage international sales quotes, proformas, document versions, and client acceptances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {canManage && (
            <button
              onClick={() => {
                setQuoteToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              New Quotation / Proforma
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by quote #, company, item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as QuoteStatus | 'All')}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Company filter */}
          <div>
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear button if active filters */}
          <div className="flex items-center gap-2">
            {(search || statusFilter !== 'All' || companyFilter !== 'All' || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setCompanyFilter('All');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-blue-700 hover:underline font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Quotes List */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900">No quotations found</h3>
          <p className="text-xs text-gray-500 mt-1">
            {search || statusFilter !== 'All'
              ? 'Try modifying your filter criteria or search keyword.'
              : 'Create your first commercial quote or proforma invoice to get started.'}
          </p>
          {canManage && (
            <button
              onClick={() => {
                setQuoteToEdit(null);
                setIsFormOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Quote
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Quote Number</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredQuotes.map(q => {
                  const comp = companies.find(c => c.id === q.companyId);
                  return (
                    <tr key={q.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                        <div className="flex items-center gap-1.5">
                          <span>{q.quoteNumber}</span>
                          {q.version > 1 && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-sans">
                              v{q.version}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 font-sans font-normal">{q.date}</div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigateToCompany && onNavigateToCompany(q.companyId)}
                          className="font-medium text-gray-900 hover:text-blue-700 text-left hover:underline"
                        >
                          {comp ? comp.name : q.companyId}
                        </button>
                        <div className="text-[11px] text-gray-500">
                          {comp ? `${comp.city}, ${comp.country}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-gray-700 font-medium">{q.type}</span>
                        <div className="text-[10px] text-gray-400">
                          {q.incoterm} {q.portOfDestination}
                        </div>
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(q.status)}</td>

                      <td className="py-3 px-4 font-mono text-gray-600">
                        {q.validityDate}
                        {q.status === 'Expired' && (
                          <div className="text-[10px] text-red-600 font-sans font-medium">Lapsed</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {canViewPrices ? (
                          <>
                            {q.currency} {q.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </>
                        ) : (
                          <span className="text-gray-400 font-normal">Hidden</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewQuote(q)}
                            className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-gray-100 rounded"
                            title="Print / PDF Preview"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              <button
                                onClick={() => handleDuplicateVersion(q)}
                                className="p-1.5 text-gray-600 hover:text-purple-700 hover:bg-gray-100 rounded"
                                title="Duplicate as new version"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setQuoteToEdit(q);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-gray-100 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {q.status === 'Accepted' && !q.convertedToOrderId && onConvertToOrderRequest && (
                                <button
                                  onClick={() => onConvertToOrderRequest(q)}
                                  className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 flex items-center gap-1"
                                  title="Convert to Order"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  Order
                                </button>
                              )}
                            </>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(q.id)}
                              className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-gray-100 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredQuotes.map(q => {
              const comp = companies.find(c => c.id === q.companyId);
              return (
                <div key={q.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-900 text-sm">{q.quoteNumber}</span>
                        {q.version > 1 && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                            v{q.version}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">{comp?.name || q.companyId}</p>
                    </div>
                    {getStatusBadge(q.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Type & Terms</span>
                      <span className="font-medium">{q.type}</span> • {q.incoterm}
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px]">Total</span>
                      <span className="font-mono font-bold text-gray-900">
                        {canViewPrices ? `${q.currency} ${q.total.toLocaleString()}` : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-500 font-mono text-[11px]">Valid: {q.validityDate}</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewQuote(q)}
                        className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 rounded font-medium"
                      >
                        Preview / Print
                      </button>
                      {canManage && (
                        <button
                          onClick={() => {
                            setQuoteToEdit(q);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-gray-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm">Delete Quotation?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to permanently delete this quotation record? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Form Modal */}
      <QuoteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setQuoteToEdit(null);
        }}
        onSave={() => {
          reloadQuotes();
          setIsFormOpen(false);
          setQuoteToEdit(null);
        }}
        quoteToEdit={quoteToEdit}
        currentUserName={currentUser.name}
      />

      {/* Quote Print Preview Modal */}
      <QuotePrintPreviewModal
        isOpen={!!previewQuote}
        onClose={() => setPreviewQuote(null)}
        quote={previewQuote}
        onDuplicateVersion={handleDuplicateVersion}
        onConvertToOrder={onConvertToOrderRequest}
      />
    </div>
  );
}
