import React, { useState, useMemo } from 'react';
import { Company, CompanyType, CompanyStatus, NavPage, User } from '../../types';
import { companiesService } from '../../services/companiesService';
import { authService } from '../../services/authService';
import { DataTable, Column } from '../common/DataTable';
import { StatusIndicator, TypeIndicator, Tag } from '../common/Tag';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Download,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface CompaniesListViewProps {
  companies: Company[];
  onRefresh: () => void;
  onNavigate: (page: NavPage, params?: { companyId?: string }) => void;
  onOpenAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  currentUser: User;
  initialCountryFilter?: string;
}

export function CompaniesListView({
  companies,
  onRefresh,
  onNavigate,
  onOpenAddCompany,
  onEditCompany,
  currentUser,
  initialCountryFilter,
}: CompaniesListViewProps) {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>(initialCountryFilter || 'All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<any>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Deletion modal state
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const canEdit = authService.canEditCompanies(currentUser.role);
  const canDelete = authService.canDeleteCompanies(currentUser.role);

  const countries = useMemo(() => {
    return companiesService.getUniqueCountries();
  }, [companies]);

  // Client-side filtering & sorting
  const filteredCompanies = useMemo(() => {
    return companiesService.getCompanies({
      search,
      type: selectedType,
      country: selectedCountry,
      status: selectedStatus,
      sortBy,
      sortOrder,
    });
  }, [companies, search, selectedType, selectedCountry, selectedStatus, sortBy, sortOrder]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(startIndex, startIndex + pageSize);
  }, [filteredCompanies, currentPage]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = () => {
    if (!companyToDelete) return;
    try {
      companiesService.deleteCompany(companyToDelete.id);
      showToast(
        `Deleted ${companyToDelete.name} and associated records`,
        'success',
        'Company Removed'
      );
      setCompanyToDelete(null);
      onRefresh();
    } catch {
      showToast('Failed to delete company', 'error');
    }
  };

  const handleExportCSV = () => {
    companiesService.exportCompaniesToCSV();
    showToast('Company list exported to CSV successfully', 'success', 'Export Complete');
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedType('All');
    setSelectedCountry('All');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  // Table columns definition for desktop
  const columns: Column<Company>[] = [
    {
      header: 'Company Name',
      sortable: true,
      sortKey: 'name',
      render: (c) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onNavigate('company-detail', { companyId: c.id })}
            className="text-left font-semibold text-slate-900 hover:text-blue-900 transition-colors"
          >
            {c.name}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              {c.city}, {c.country}
            </span>
            {c.website && (
              <>
                <span aria-hidden="true">·</span>
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  web <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      sortable: true,
      sortKey: 'type',
      render: (c) => <TypeIndicator type={c.type} />,
    },
    {
      header: 'Status',
      sortable: true,
      sortKey: 'status',
      render: (c) => <StatusIndicator status={c.status} />,
    },
    {
      header: 'Currency & Terms',
      render: (c) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-slate-800">{c.currency}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-600 line-clamp-1">{c.paymentTerms || 'Terms pending'}</span>
        </div>
      ),
    },
    {
      header: 'Commodities / Products',
      render: (c) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {c.productsOfInterest.slice(0, 2).map((p) => (
            <Tag key={p} label={p} variant="slate" />
          ))}
          {c.productsOfInterest.length > 2 && (
            <span className="text-[11px] text-slate-400 self-center font-mono">
              +{c.productsOfInterest.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Owner',
      sortable: true,
      sortKey: 'assignedOwner',
      render: (c) => <span className="text-xs text-slate-600">{c.assignedOwner}</span>,
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onNavigate('company-detail', { companyId: c.id })}
            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors"
            title="View company details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onEditCompany(c)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Edit company"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setCompanyToDelete(c)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Delete company (CEO only)"
            >
              <Trash2 className="w-4 h-4" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Companies Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Trade counterparties across yarn mills, spinning consortiums, and waste recyclers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Export full company list to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={onOpenAddCompany}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search box */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter Text
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, fiber, city..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Types</option>
              <option value="Buyer">Buyers (Mills & Spinners)</option>
              <option value="Supplier">Suppliers (Waste & Drops)</option>
              <option value="Agent">Agents & Brokers</option>
              <option value="Freight Forwarder">Freight Forwarders</option>
            </select>
          </div>

          {/* Country filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Country
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Lead">Lead</option>
                <option value="Inactive">Inactive</option>
              </select>
              {(search || selectedType !== 'All' || selectedCountry !== 'All' || selectedStatus !== 'All') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded border border-slate-200 hover:bg-slate-50"
                  title="Clear all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Count summary and active filters */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="font-mono tabular-nums">
            Showing <strong className="text-slate-800">{filteredCompanies.length}</strong> matching companies
          </div>
          {selectedCountry !== 'All' && (
            <span className="text-[11px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-medium">
              Filtered by country: {selectedCountry}
            </span>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={paginatedCompanies}
          keyExtractor={(item) => item.id}
          sortKey={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredCompanies.length}
          onPageChange={setCurrentPage}
          emptyMessage="No companies match your filters"
          emptySubtext="Try adjusting the country, type, or search query to find trading partners."
          emptyAction={
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg"
            >
              Clear Filters
            </button>
          }
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedCompanies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No companies found</h4>
            <p className="text-xs text-slate-500 mt-1">Try resetting your active filters.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          paginatedCompanies.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate('company-detail', { companyId: c.id })}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>
                      {c.city}, {c.country}
                    </span>
                  </div>
                </div>
                <StatusIndicator status={c.status} />
              </div>

              <div className="flex items-center gap-2">
                <TypeIndicator type={c.type} />
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {c.currency}
                </span>
                <span className="text-xs text-slate-500 truncate">
                  · {c.paymentTerms}
                </span>
              </div>

              {/* Products tags */}
              <div className="flex flex-wrap gap-1">
                {c.productsOfInterest.slice(0, 3).map((p) => (
                  <Tag key={p} label={p} variant="slate" />
                ))}
                {c.productsOfInterest.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{c.productsOfInterest.length - 3} more
                  </span>
                )}
              </div>

              {/* Action buttons footer */}
              <div
                className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-slate-500">Owner: {c.assignedOwner}</span>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEditCompany(c)}
                      className="text-xs font-medium text-slate-700 hover:text-blue-900 px-2 py-1 rounded bg-slate-100"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigate('company-detail', { companyId: c.id })}
                    className="text-xs font-medium text-blue-900 px-2.5 py-1 rounded bg-blue-50"
                  >
                    View &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {filteredCompanies.length > pageSize && (
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono tabular-nums">
              Page {currentPage} of {Math.ceil(filteredCompanies.length / pageSize)}
            </span>
            <button
              disabled={currentPage >= Math.ceil(filteredCompanies.length / pageSize)}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(companyToDelete)}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Company Record"
        message={`Are you sure you want to delete "${companyToDelete?.name}"? All associated contacts and logged activities will also be permanently removed. This action cannot be undone.`}
        confirmText="Delete Company"
        isDestructive={true}
      />
    </div>
  );
}
