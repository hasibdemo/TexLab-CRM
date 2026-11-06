import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderType, User } from '../../types';
import { ordersService } from '../../services/ordersService';
import { companiesService } from '../../services/companiesService';
import { authService } from '../../services/authService';
import OrderFormModal from '../orders/OrderFormModal';
import OrderStatusModal from '../orders/OrderStatusModal';
import {
  PackageCheck,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Truck,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface OrdersListViewProps {
  currentUser: User;
  onSelectOrder: (orderId: string) => void;
  onNavigateToCompany?: (companyId: string) => void;
}

export default function OrdersListView({
  currentUser,
  onSelectOrder,
  onNavigateToCompany,
}: OrdersListViewProps) {
  const [orders, setOrders] = useState<Order[]>(() => ordersService.getOrders());
  const companies = useMemo(() => companiesService.getCompanies(), []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'All'>('All');
  const [companyFilter, setCompanyFilter] = useState<string>('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canManage = authService.canManageOrders(currentUser.role);
  const canDelete = authService.canDeleteOrders(currentUser.role);
  const canUpdateStatus = authService.canUpdateOrderStatus(currentUser.role);
  const canViewPrices = authService.canViewPrices(currentUser.role);

  const reloadOrders = () => {
    setOrders(ordersService.getOrders());
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Role filtering: Procurement only manages purchase orders, but can see others read-only or filter
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (typeFilter !== 'All' && o.orderType !== typeFilter) return false;
      if (companyFilter !== 'All' && o.companyId !== companyFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const comp = companies.find(c => c.id === o.companyId);
        const numMatch = o.orderNumber.toLowerCase().includes(query);
        const compMatch = comp ? comp.name.toLowerCase().includes(query) : false;
        const ownerMatch = o.owner.toLowerCase().includes(query);
        const portMatch = (o.destinationPort || '').toLowerCase().includes(query);
        const itemMatch = o.lineItems.some(i => i.productName.toLowerCase().includes(query));
        if (!numMatch && !compMatch && !ownerMatch && !portMatch && !itemMatch) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, typeFilter, companyFilter, companies]);

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus, note?: string, cancelReason?: string) => {
    ordersService.updateOrderStatus(orderId, newStatus, currentUser.name, note, cancelReason);
    reloadOrders();
  };

  const handleDelete = (id: string) => {
    ordersService.deleteOrder(id);
    setDeleteConfirmId(null);
    reloadOrders();
  };

  const handleExportCSV = () => {
    ordersService.exportToCSV(filteredOrders);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { bg: string; text: string }> = {
      Confirmed: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
      'In Production/Preparation': { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
      'Ready to Ship': { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' },
      Shipped: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
      Delivered: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800' },
      Completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
      Cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-800' },
    };
    const c = map[status] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-800' };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${c.bg} ${c.text}`}>
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
            <PackageCheck className="w-5 h-5 text-blue-700" />
            Orders (Sales & Purchase)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage shipments, production batches, delivery schedules, and fulfillment status
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
                setOrderToEdit(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by order #, partner, destination..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as OrderType | 'All')}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Types (Sales & Purchase)</option>
              <option value="Sales Order">Sales Orders (SO)</option>
              <option value="Purchase Order">Purchase Orders (PO)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as OrderStatus | 'All')}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Production/Preparation">In Production/Prep</option>
              <option value="Ready to Ship">Ready to Ship</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

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
        </div>
      </div>

      {/* Main Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900">No orders found</h3>
          <p className="text-xs text-gray-500 mt-1">
            {search || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'Try adjusting your search criteria.'
              : 'Register your first confirmed sales order or purchase order to begin tracking.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Partner Company</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Shipment Date</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredOrders.map(o => {
                  const comp = companies.find(c => c.id === o.companyId);
                  return (
                    <tr key={o.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-900">
                        <button
                          onClick={() => onSelectOrder(o.id)}
                          className="hover:underline font-bold text-left block"
                        >
                          {o.orderNumber}
                        </button>
                        <span className="text-[11px] text-gray-400 font-sans font-normal">{o.orderDate}</span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigateToCompany && onNavigateToCompany(o.companyId)}
                          className="font-medium text-gray-900 hover:text-blue-700 text-left hover:underline"
                        >
                          {comp ? comp.name : o.companyId}
                        </button>
                        <div className="text-[11px] text-gray-500">
                          {comp ? `${comp.city}, ${comp.country}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-xs ${
                            o.orderType === 'Sales Order' ? 'text-blue-700' : 'text-purple-700'
                          }`}
                        >
                          {o.orderType}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono">Owner: {o.owner}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(o.status)}
                          {canUpdateStatus && (
                            <button
                              onClick={() => setStatusModalOrder(o)}
                              className="text-[10px] text-blue-600 hover:underline font-medium"
                              title="Advance or change status"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-gray-700">
                        {o.expectedShipmentDate}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800">{o.destinationPort}</span>
                        <span className="text-[10px] text-gray-500 block font-mono">Incoterm: {o.incoterm}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {canViewPrices ? (
                          <>
                            {o.currency} {o.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </>
                        ) : (
                          <span className="text-gray-400 font-normal">Hidden</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectOrder(o.id)}
                            className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-gray-100 rounded"
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <button
                              onClick={() => {
                                setOrderToEdit(o);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => setDeleteConfirmId(o.id)}
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
            {filteredOrders.map(o => {
              const comp = companies.find(c => c.id === o.companyId);
              return (
                <div key={o.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-bold text-blue-900 text-sm block">{o.orderNumber}</span>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5">{comp?.name || o.companyId}</p>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Type & Port</span>
                      <span className="font-semibold">{o.orderType}</span>
                      <div className="text-[10px] text-gray-500 truncate">{o.destinationPort}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 block text-[10px]">Total Amount</span>
                      <span className="font-mono font-bold text-gray-900">
                        {canViewPrices ? `${o.currency} ${o.total.toLocaleString()}` : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                    <span className="text-gray-500 font-mono text-[11px]">ETD: {o.expectedShipmentDate}</span>

                    <div className="flex items-center gap-2">
                      {canUpdateStatus && (
                        <button
                          onClick={() => setStatusModalOrder(o)}
                          className="px-2 py-1 text-xs text-blue-700 bg-blue-50 rounded font-semibold"
                        >
                          Status
                        </button>
                      )}
                      <button
                        onClick={() => onSelectOrder(o.id)}
                        className="px-2.5 py-1 text-xs text-white bg-blue-700 rounded font-semibold"
                      >
                        Details
                      </button>
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
              <h3 className="font-bold text-sm">Delete Order Record?</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to permanently delete this order? All linked shipment logs will be removed.
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

      {/* Order Form Modal */}
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setOrderToEdit(null);
        }}
        onSave={() => {
          reloadOrders();
          setIsFormOpen(false);
          setOrderToEdit(null);
        }}
        orderToEdit={orderToEdit}
        currentUserName={currentUser.name}
        canViewPrices={canViewPrices}
      />

      {/* Order Status Modal */}
      <OrderStatusModal
        isOpen={!!statusModalOrder}
        onClose={() => setStatusModalOrder(null)}
        order={statusModalOrder}
        onUpdateStatus={handleStatusUpdate}
        currentUserName={currentUser.name}
      />
    </div>
  );
}
