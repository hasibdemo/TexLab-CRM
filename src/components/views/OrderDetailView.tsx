import React, { useState } from 'react';
import {
  Order,
  OrderStatus,
  PaymentMilestone,
  PaymentRecord,
  User,
  Quote,
  Activity,
} from '../../types';
import { ordersService } from '../../services/ordersService';
import { paymentsService } from '../../services/paymentsService';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { quotesService } from '../../services/quotesService';
import { dealsService } from '../../services/dealsService';
import { activitiesService } from '../../services/activitiesService';
import { authService } from '../../services/authService';
import OrderStatusModal from '../orders/OrderStatusModal';
import OrderFormModal from '../orders/OrderFormModal';
import RecordPaymentModal from '../payments/RecordPaymentModal';
import PaymentMilestoneModal from '../payments/PaymentMilestoneModal';
import QuotePrintPreviewModal from '../quotes/QuotePrintPreviewModal';
import { ActivityFormModal } from '../activities/ActivityFormModal';
import {
  ArrowLeft,
  PackageCheck,
  Calendar,
  Building2,
  Ship,
  Clock,
  DollarSign,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  Edit2,
  FileText,
  UserCheck,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface OrderDetailViewProps {
  orderId: string;
  currentUser: User;
  onBack: () => void;
  onNavigateToCompany?: (companyId: string) => void;
  onNavigateToDeal?: (dealId: string) => void;
}

export default function OrderDetailView({
  orderId,
  currentUser,
  onBack,
  onNavigateToCompany,
  onNavigateToDeal,
}: OrderDetailViewProps) {
  const [order, setOrder] = useState<Order | null>(() => ordersService.getOrderById(orderId));
  const [activeTab, setActiveTab] = useState<'items' | 'status' | 'payments' | 'attachments' | 'activities'>('items');

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recordPaymentMilestone, setRecordPaymentMilestone] = useState<PaymentMilestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<PaymentMilestone | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  // New mock attachment state
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [isAddAttachmentOpen, setIsAddAttachmentOpen] = useState(false);

  const canViewPrices = authService.canViewPrices(currentUser.role);
  const canManagePayments = authService.canManagePayments(currentUser.role);
  const canUpdateStatus = authService.canUpdateOrderStatus(currentUser.role);
  const canManageOrder = authService.canManageOrders(currentUser.role);

  if (!order) {
    return (
      <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Order not found</h3>
        <button
          onClick={onBack}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
      </div>
    );
  }

  const company = companiesService.getCompanyById(order.companyId);
  const contact = order.contactId ? contactsService.getContactById(order.contactId) : null;
  const linkedDeal = order.dealId ? dealsService.getDealById(order.dealId) : null;
  const linkedQuote = order.quoteId ? quotesService.getQuoteById(order.quoteId) : null;
  const paymentSummary = paymentsService.getOrderPaymentSummary(order.id);
  const activities = activitiesService.getActivities(order.companyId);

  const reloadOrder = () => {
    const refreshed = ordersService.getOrderById(orderId);
    setOrder(refreshed);
  };

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus, note?: string, cancelReason?: string) => {
    ordersService.updateOrderStatus(orderId, newStatus, currentUser.name, note, cancelReason);
    reloadOrder();
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;
    const size = `${(Math.random() * 2 + 0.5).toFixed(1)} MB`;
    ordersService.addAttachment(order.id, {
      name: newAttachmentName.endsWith('.pdf') ? newAttachmentName : `${newAttachmentName}.pdf`,
      size,
      uploadedBy: currentUser.name,
    });
    setNewAttachmentName('');
    setIsAddAttachmentOpen(false);
    reloadOrder();
  };

  const handleRemoveAttachment = (attId: string) => {
    ordersService.removeAttachment(order.id, attId);
    reloadOrder();
  };

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, { bg: string; text: string }> = {
      Confirmed: { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: '' },
      'In Production/Preparation': { bg: 'bg-purple-100 text-purple-800 border-purple-200', text: '' },
      'Ready to Ship': { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', text: '' },
      Shipped: { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: '' },
      Delivered: { bg: 'bg-teal-100 text-teal-800 border-teal-200', text: '' },
      Completed: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: '' },
      Cancelled: { bg: 'bg-red-100 text-red-800 border-red-200', text: '' },
    };
    const c = map[status] || { bg: 'bg-gray-100 text-gray-800 border-gray-200', text: '' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${c.bg}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            title="Back to Orders List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              {getStatusBadge(order.status)}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  order.orderType === 'Sales Order' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                }`}
              >
                {order.orderType}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Order Registered on {order.orderDate} • Owner: <span className="font-medium text-gray-700">{order.owner}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canUpdateStatus && (
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition"
            >
              <PackageCheck className="w-4 h-4" />
              Update Status
            </button>
          )}

          {canManageOrder && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Key Order Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Counterparty
          </span>
          <button
            onClick={() => onNavigateToCompany && onNavigateToCompany(order.companyId)}
            className="text-sm font-bold text-blue-900 hover:underline mt-1 text-left block truncate"
          >
            {company?.name || order.companyId}
          </button>
          <p className="text-xs text-gray-500">{company?.country} • {company?.city}</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Shipment Schedule
          </span>
          <p className="text-sm font-bold text-gray-900 mt-1 font-mono">{order.expectedShipmentDate}</p>
          <p className="text-xs text-gray-500">Port: {order.destinationPort}</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Trade & Delivery Terms
          </span>
          <p className="text-sm font-bold text-gray-900 mt-1">
            {order.incoterm} {order.destinationPort}
          </p>
          <p className="text-xs text-gray-500 truncate">{order.paymentTerms}</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Financial Total
          </span>
          {canViewPrices ? (
            <>
              <p className="text-sm font-bold text-blue-900 mt-1 font-mono">
                {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                Paid: {paymentSummary.percentPaid.toFixed(0)}% ({order.currency} {paymentSummary.totalPaid.toLocaleString()})
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1 font-medium">Hidden for Warehouse</p>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'items'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Line Items & Terms ({order.lineItems.length})
        </button>

        <button
          onClick={() => setActiveTab('status')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'status'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Status History ({order.statusHistory.length})
        </button>

        {canViewPrices && (
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 transition border-b-2 ${
              activeTab === 'payments'
                ? 'border-blue-700 text-blue-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Payments & Milestones ({paymentSummary.milestones.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('attachments')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'attachments'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Attachments ({order.attachments ? order.attachments.length : 0})
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'activities'
              ? 'border-blue-700 text-blue-800'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Notes & Activities
        </button>
      </div>

      {/* Tab 1: Line Items & Commercials */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-10 text-center">#</th>
                  <th className="py-2.5 px-4">Item Name & Description</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4 text-center">Unit</th>
                  {canViewPrices && (
                    <>
                      <th className="py-2.5 px-4 text-right">Unit Price ({order.currency})</th>
                      <th className="py-2.5 px-4 text-right">Line Total ({order.currency})</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.lineItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-4 text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{item.productName}</p>
                      {item.description && (
                        <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono uppercase text-gray-600">
                      {item.unit}
                    </td>
                    {canViewPrices && (
                      <>
                        <td className="py-3 px-4 text-right font-mono">
                          {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            {canViewPrices && (
              <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">
                      {order.currency} {order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono">- {order.currency} {order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {order.freightCharges > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Freight & Handling:</span>
                      <span className="font-mono">+ {order.currency} {order.freightCharges.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-300 flex justify-between font-bold text-sm text-blue-950">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base">
                      {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Operational Notes & Linked docs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Operational Notes & Instructions
              </h3>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                {order.notes || 'No special handling instructions specified.'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Cross-Linked Records
              </h3>
              <div className="space-y-2 text-xs">
                {linkedQuote ? (
                  <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                    <div>
                      <span className="font-semibold text-gray-800">Linked Quotation: {linkedQuote.quoteNumber}</span>
                      <p className="text-[11px] text-gray-500">{linkedQuote.type} • Status: {linkedQuote.status}</p>
                    </div>
                    <button
                      onClick={() => setPreviewQuote(linkedQuote)}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      View Quote
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No quotation linked to this order.</p>
                )}

                {linkedDeal ? (
                  <div className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200">
                    <div>
                      <span className="font-semibold text-gray-800">Linked Deal: {linkedDeal.title}</span>
                      <p className="text-[11px] text-gray-500">Stage: {linkedDeal.stage}</p>
                    </div>
                    <button
                      onClick={() => onNavigateToDeal && onNavigateToDeal(linkedDeal.id)}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                    >
                      View Deal
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No deal linked to this order.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Status Timeline */}
      {activeTab === 'status' && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Status Progression Timeline
            </h3>
            {canUpdateStatus && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="text-xs text-blue-700 font-semibold hover:underline"
              >
                + Update Status Now
              </button>
            )}
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {order.statusHistory.map((item, idx) => (
              <div key={idx} className="relative group">
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white ${
                    item.status === 'Cancelled'
                      ? 'border-red-500'
                      : item.status === 'Completed' || item.status === 'Delivered'
                      ? 'border-emerald-500'
                      : 'border-blue-600'
                  }`}
                />
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-gray-900">{item.status}</span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{item.note}</p>
                  {item.cancelReason && (
                    <p className="text-xs text-red-700 font-medium mt-1">
                      Reason: {item.cancelReason}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 pt-1">Logged by: {item.changedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Payments & Milestones (Masked if Warehouse) */}
      {activeTab === 'payments' && canViewPrices && (
        <div className="space-y-4">
          {/* Payment Progress Summary Header */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment Milestones & Settlement Status
                </h3>
                <p className="text-xs text-gray-500">
                  Total Order Value: <span className="font-mono font-bold text-gray-900">{order.currency} {paymentSummary.totalOrderAmount.toLocaleString()}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canManagePayments && (
                  <button
                    onClick={() => {
                      setMilestoneToEdit(null);
                      setIsMilestoneModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Milestone
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">
                  Collected / Paid: {order.currency} {paymentSummary.totalPaid.toLocaleString()} ({paymentSummary.percentPaid.toFixed(1)}%)
                </span>
                <span className="text-gray-600">
                  Remaining Balance: {order.currency} {paymentSummary.remainingBalance.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${paymentSummary.percentPaid}%` }}
                />
              </div>
            </div>
          </div>

          {/* Milestones list */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Milestone</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Expected Method</th>
                  <th className="py-2.5 px-4 text-right">Scheduled Amount</th>
                  <th className="py-2.5 px-4 text-right">Paid Amount</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentSummary.milestones.map(m => {
                  const rem = Math.max(0, m.amount - (m.paidAmount || 0));
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {m.name}
                        {m.notes && <p className="text-[11px] text-gray-400 font-normal">{m.notes}</p>}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">{m.dueDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            m.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'Overdue'
                              ? 'bg-red-100 text-red-800 font-bold'
                              : m.status === 'Partially Paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{m.method}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {m.currency} {m.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {m.currency} {(m.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManagePayments && rem > 0 && (
                            <button
                              onClick={() => setRecordPaymentMilestone(m)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300"
                            >
                              Record Payment
                            </button>
                          )}
                          {canManagePayments && (
                            <button
                              onClick={() => {
                                setMilestoneToEdit(m);
                                setIsMilestoneModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-blue-700 p-1"
                              title="Edit milestone"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
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

          {/* Recorded Payment Transactions */}
          {paymentSummary.records.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Payment Receipts & SWIFT Advices ({paymentSummary.records.length})
              </h3>
              <div className="divide-y divide-gray-200">
                {paymentSummary.records.map(rec => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">
                        {rec.currency} {rec.amount.toLocaleString()} via {rec.method}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Ref: {rec.referenceNumber} • Date: {rec.paymentDate}
                      </p>
                      {rec.notes && <p className="text-[11px] text-gray-600 mt-0.5">{rec.notes}</p>}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Logged by {rec.recordedBy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Attachments */}
      {activeTab === 'attachments' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Attached Documents & Shipping Manifests
              </h3>
              <p className="text-xs text-gray-500">
                Bill of Lading, SGS inspection certificates, customs declarations, and signed proformas
              </p>
            </div>

            <button
              onClick={() => setIsAddAttachmentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Attachment
            </button>
          </div>

          {/* Add attachment small form */}
          {isAddAttachmentOpen && (
            <form onSubmit={handleAddAttachment} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex gap-2 items-center">
              <input
                type="text"
                placeholder="File name e.g. SGS_Inspection_Lot4.pdf"
                value={newAttachmentName}
                onChange={e => setNewAttachmentName(e.target.value)}
                className="text-xs rounded border border-gray-300 p-2 grow bg-white"
                required
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-700 text-white rounded text-xs font-semibold hover:bg-blue-800"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setIsAddAttachmentOpen(false)}
                className="px-2.5 py-2 border border-gray-300 text-gray-600 rounded text-xs"
              >
                Cancel
              </button>
            </form>
          )}

          {(!order.attachments || order.attachments.length === 0) ? (
            <p className="text-xs text-gray-400 py-4 text-center">No documents attached yet.</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {order.attachments.map(att => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-semibold text-blue-900 hover:underline cursor-pointer">
                        {att.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {att.size} • Uploaded by {att.uploadedBy} on {new Date(att.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`Simulating download of ${att.name}`)}
                      className="p-1 text-gray-500 hover:text-blue-700"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Activities */}
      {activeTab === 'activities' && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Communication & Activity Log
            </h3>
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Activity
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No activities logged yet.</p>
            ) : (
              activities.map((act: Activity) => (
                <div key={act.id} className="py-3 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{act.title}</span>
                    <span className="text-gray-400 font-mono text-[11px]">{act.date}</span>
                  </div>
                  <p className="text-gray-600">{act.description}</p>
                  <p className="text-[10px] text-gray-400">Logged by: {act.loggedBy}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <OrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        order={order}
        onUpdateStatus={handleStatusUpdate}
        currentUserName={currentUser.name}
      />

      <OrderFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {
          setIsEditModalOpen(false);
          reloadOrder();
        }}
        orderToEdit={order}
        currentUserName={currentUser.name}
        canViewPrices={canViewPrices}
      />

      <RecordPaymentModal
        isOpen={!!recordPaymentMilestone}
        onClose={() => setRecordPaymentMilestone(null)}
        milestone={recordPaymentMilestone}
        onPaymentRecorded={() => {
          reloadOrder();
          setRecordPaymentMilestone(null);
        }}
        currentUserName={currentUser.name}
      />

      <PaymentMilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setMilestoneToEdit(null);
        }}
        orderId={order.id}
        orderTotal={order.total}
        currency={order.currency}
        milestoneToEdit={milestoneToEdit}
        onSaved={() => {
          reloadOrder();
          setIsMilestoneModalOpen(false);
          setMilestoneToEdit(null);
        }}
      />

      <QuotePrintPreviewModal
        isOpen={!!previewQuote}
        onClose={() => setPreviewQuote(null)}
        quote={previewQuote}
      />

      <ActivityFormModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={() => {
          setIsActivityModalOpen(false);
          reloadOrder();
        }}
        defaultCompanyId={order.companyId}
        defaultDealId={order.dealId}
      />
    </div>
  );
}
