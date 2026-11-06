import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, User, NavPage } from '../../types';
import { productsService } from '../../services/productsService';
import { authService } from '../../services/authService';
import { currencyService } from '../../services/currencyService';
import { DataTable, Column } from '../common/DataTable';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  Layers,
  Globe,
  Tag,
  DollarSign,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

interface ProductsListViewProps {
  products: Product[];
  onRefresh: () => void;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onNavigateToNewDealWithProduct?: (productId: string) => void;
  currentUser: User;
}

export function ProductsListView({
  products,
  onRefresh,
  onOpenAddProduct,
  onEditProduct,
  onNavigateToNewDealWithProduct,
  currentUser,
}: ProductsListViewProps) {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<any>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const canEdit = authService.canEditProducts(currentUser.role);
  const canDelete = authService.canDeleteProducts(currentUser.role);

  const origins = useMemo(() => {
    return productsService.getUniqueOrigins();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return productsService.getProducts({
      search,
      category: selectedCategory,
      originCountry: selectedOrigin,
      status: selectedStatus,
      sortBy,
      sortOrder,
    });
  }, [products, search, selectedCategory, selectedOrigin, selectedStatus, sortBy, sortOrder]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleDeleteConfirm = () => {
    if (!productToDelete) return;
    try {
      productsService.deleteProduct(productToDelete.id);
      showToast(`Product "${productToDelete.name}" removed from catalog.`, 'success', 'Deleted');
      setProductToDelete(null);
      onRefresh();
    } catch {
      showToast('Error deleting product', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedOrigin('All');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  const getCategoryBadge = (category: ProductCategory) => {
    const configs: Record<ProductCategory, string> = {
      'Waste Cloth': 'bg-amber-50 text-amber-900 border-amber-200',
      Yarn: 'bg-blue-50 text-blue-900 border-blue-200',
      Fiber: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      Other: 'bg-slate-100 text-slate-800 border-slate-300',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${configs[category]} whitespace-nowrap`}
      >
        {category}
      </span>
    );
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product & Specifications',
      sortable: true,
      sortKey: 'name',
      render: (p) => (
        <div className="flex flex-col max-w-sm">
          <span className="font-semibold text-slate-900">{p.name}</span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span>{p.materialComposition}</span>
            <span aria-hidden="true">·</span>
            <span>{p.grade}</span>
            {p.color && (
              <>
                <span aria-hidden="true">·</span>
                <span>{p.color}</span>
              </>
            )}
          </div>
          {/* Conditional specs inline preview */}
          {p.category === 'Yarn' && p.yarnCount && (
            <div className="text-[11px] text-blue-800 font-mono mt-0.5">
              Count: {p.yarnCount} {p.spinningType ? `(${p.spinningType})` : ''}
            </div>
          )}
          {p.category === 'Waste Cloth' && p.cleanlinessLevel && (
            <div className="text-[11px] text-amber-800 mt-0.5 truncate">
              {p.cleanlinessLevel}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      sortable: true,
      sortKey: 'category',
      render: (p) => getCategoryBadge(p.category),
    },
    {
      header: 'Origin & HS Code',
      sortable: true,
      sortKey: 'originCountry',
      render: (p) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{p.originCountry}</div>
          <div className="font-mono text-[11px] text-slate-500">HS: {p.hsCode || 'N/A'}</div>
        </div>
      ),
    },
    {
      header: 'Default Price',
      sortable: true,
      sortKey: 'defaultPricePerUnit',
      render: (p) => (
        <div className="text-xs">
          <div className="font-mono font-bold text-slate-900">
            {currencyService.formatAmount(p.defaultPricePerUnit, p.currency)}
            <span className="text-slate-500 font-normal"> / {p.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Bale: {p.typicalBaleWeight} kg
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (p) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
            p.status === 'Active'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {p.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onNavigateToNewDealWithProduct && (
            <button
              type="button"
              onClick={() => onNavigateToNewDealWithProduct(p.id)}
              className="px-2 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              title="Initiate trade deal with this product"
            >
              + Deal
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEditProduct(p)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Edit product"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setProductToDelete(p)}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Delete product (CEO only)"
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Product & Commodity Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Standardized specs, HS tariff codes, and indicative pricing for fiber, yarn, and waste lots.
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search Products
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search fiber, count, HS code..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Categories</option>
              <option value="Waste Cloth">Waste Cloth</option>
              <option value="Yarn">Yarn</option>
              <option value="Fiber">Fiber</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Origin Country
            </label>
            <select
              value={selectedOrigin}
              onChange={(e) => {
                setSelectedOrigin(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="All">All Origins</option>
              {origins.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
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
                <option value="Inactive">Inactive</option>
              </select>
              {(search || selectedCategory !== 'All' || selectedOrigin !== 'All' || selectedStatus !== 'All') && (
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

        <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 font-mono tabular-nums">
          Showing <strong>{filteredProducts.length}</strong> catalog items
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={paginatedProducts}
          keyExtractor={(p) => p.id}
          sortKey={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredProducts.length}
          onPageChange={setCurrentPage}
          emptyMessage="No products match your filters"
          emptySubtext="Try adjusting the category, origin, or search query."
          emptyAction={
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Reset Filters
            </button>
          }
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No products found</h4>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters.</p>
          </div>
        ) : (
          paginatedProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {p.materialComposition} · {p.grade}
                  </div>
                </div>
                {getCategoryBadge(p.category)}
              </div>

              {p.category === 'Yarn' && p.yarnCount && (
                <div className="text-xs text-blue-900 font-mono bg-blue-50 p-2 rounded border border-blue-100">
                  Count: {p.yarnCount} {p.spinningType ? `· ${p.spinningType}` : ''}
                </div>
              )}

              {p.category === 'Waste Cloth' && p.cleanlinessLevel && (
                <div className="text-xs text-amber-900 bg-amber-50 p-2 rounded border border-amber-100">
                  {p.cleanlinessLevel}
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-mono">
                  {p.originCountry} · HS: {p.hsCode}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {currencyService.formatAmount(p.defaultPricePerUnit, p.currency)} / {p.unit}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">Bale: {p.typicalBaleWeight}kg</span>
                <div className="flex items-center gap-2">
                  {onNavigateToNewDealWithProduct && (
                    <button
                      type="button"
                      onClick={() => onNavigateToNewDealWithProduct(p.id)}
                      className="text-xs font-semibold text-blue-900 px-2 py-1 rounded bg-blue-50"
                    >
                      + Deal
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      className="text-xs font-medium text-slate-700 px-2 py-1 rounded bg-slate-100"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Catalog Product"
        message={`Are you sure you want to remove "${productToDelete?.name}" from the product catalog? Existing deals referencing this product will retain historical data.`}
        confirmText="Delete Product"
        isDestructive={true}
      />
    </div>
  );
}
