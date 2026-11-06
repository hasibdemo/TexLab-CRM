import { Order, OrderStatus, OrderType, OrderAttachment } from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { INITIAL_ORDERS } from './seedData';
import { settingsService } from './settingsService';
import { quotesService } from './quotesService';
import { dealsService } from './dealsService';
import { productsService } from './productsService';
import { activitiesService } from './activitiesService';

export interface OrderFilters {
  status?: OrderStatus | 'All';
  type?: OrderType | 'All';
  companyId?: string;
  dealId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const ordersService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/orders
  getOrders(filters?: OrderFilters): Order[] {
    let orders: Order[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (stored) {
        orders = JSON.parse(stored);
      } else {
        orders = INITIAL_ORDERS;
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
    } catch {
      orders = INITIAL_ORDERS;
    }

    if (!filters) return orders;

    return orders.filter(o => {
      if (filters.status && filters.status !== 'All' && o.status !== filters.status) return false;
      if (filters.type && filters.type !== 'All' && o.orderType !== filters.type) return false;
      if (filters.companyId && o.companyId !== filters.companyId) return false;
      if (filters.dealId && o.dealId !== filters.dealId) return false;
      if (filters.startDate && o.orderDate < filters.startDate) return false;
      if (filters.endDate && o.orderDate > filters.endDate) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const numMatch = o.orderNumber.toLowerCase().includes(query);
        const ownerMatch = o.owner.toLowerCase().includes(query);
        const portMatch = (o.destinationPort || '').toLowerCase().includes(query);
        const itemMatch = o.lineItems.some(i =>
          i.productName.toLowerCase().includes(query) || i.description.toLowerCase().includes(query)
        );
        if (!numMatch && !ownerMatch && !portMatch && !itemMatch) return false;
      }
      return true;
    });
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/orders/:id
  getOrderById(id: string): Order | null {
    const orders = this.getOrders();
    return orders.find(o => o.id === id) || null;
  },

  // Generate next order number e.g. SO-2026-0001 or PO-2026-0001
  generateNextOrderNumber(type: OrderType): string {
    const settings = settingsService.getSettings();
    const prefix = type === 'Sales Order'
      ? (settings.salesOrderPrefix || 'SO-')
      : (settings.purchaseOrderPrefix || 'PO-');
    const year = new Date().getFullYear();
    const orders = this.getOrders();

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}${year}-(\\d{4})`);
    orders.forEach(o => {
      const match = o.orderNumber.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const next = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${year}-${next}`;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/orders
  createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'statusHistory' | 'attachments' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getOrders();
    const orderNumber = this.generateNextOrderNumber(data.orderType);
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...data,
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderNumber,
      status: data.status || 'Confirmed',
      statusHistory: [
        {
          status: data.status || 'Confirmed',
          timestamp: now,
          changedBy: data.owner,
          note: 'Order created and registered in the system.',
        },
      ],
      attachments: [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newOrder, ...orders];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));

    // If linked to quote, mark quote converted
    if (newOrder.quoteId) {
      quotesService.updateQuote(newOrder.quoteId, {
        status: 'Accepted',
        convertedToOrderId: newOrder.id,
      });
    }

    activitiesService.createActivity({
      companyId: newOrder.companyId,
      dealId: newOrder.dealId,
      type: 'note',
      title: `Order Created: ${newOrder.orderNumber}`,
      description: `${newOrder.orderType} logged for total ${newOrder.currency} ${newOrder.total.toLocaleString()} (${newOrder.incoterm} ${newOrder.destinationPort}).`,
      loggedBy: newOrder.owner,
      date: newOrder.orderDate,
    });

    return newOrder;
  },

  // Create order from an accepted quote
  createOrderFromQuote(quoteId: string, currentUserName: string): Order {
    const quote = quotesService.getQuoteById(quoteId);
    if (!quote) throw new Error('Quote not found');

    const today = new Date().toISOString().slice(0, 10);
    const expectedShipmentDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const order = this.createOrder({
      orderType: 'Sales Order',
      dealId: quote.dealId,
      quoteId: quote.id,
      companyId: quote.companyId,
      contactId: quote.contactId,
      lineItems: quote.lineItems.map(item => ({
        id: `oli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      currency: quote.currency,
      subtotal: quote.subtotal,
      discount: quote.discount,
      freightCharges: quote.freightCharges,
      total: quote.total,
      incoterm: quote.incoterm,
      paymentTerms: quote.paymentTerms,
      orderDate: today,
      expectedShipmentDate,
      destinationPort: quote.portOfDestination,
      owner: currentUserName,
      status: 'Confirmed',
      notes: `Generated from Quote ${quote.quoteNumber}. ${quote.notesAndTerms}`,
    });

    return order;
  },

  // Create order from Deal in Order Confirmed stage
  createOrderFromDeal(dealId: string, currentUserName: string): Order {
    const deal = dealsService.getDealById(dealId);
    if (!deal) throw new Error('Deal not found');

    const product = deal.productId ? productsService.getProductById(deal.productId) : null;
    const today = new Date().toISOString().slice(0, 10);
    const lineTotal = deal.quantity * deal.pricePerUnit;
    const orderType: OrderType = deal.dealType === 'Purchase' ? 'Purchase Order' : 'Sales Order';

    return this.createOrder({
      orderType,
      dealId: deal.id,
      companyId: deal.companyId,
      contactId: deal.contactId,
      lineItems: [
        {
          id: `oli_${Date.now()}`,
          productId: deal.productId,
          productName: product ? product.name : deal.title,
          description: product ? `${product.materialComposition} - ${product.grade}` : deal.notes,
          quantity: deal.quantity,
          unit: deal.unit,
          unitPrice: deal.pricePerUnit,
          lineTotal,
        },
      ],
      currency: deal.currency,
      subtotal: lineTotal,
      discount: 0,
      freightCharges: 0,
      total: lineTotal,
      incoterm: deal.incoterm,
      paymentTerms: deal.paymentTerms,
      orderDate: today,
      expectedShipmentDate: deal.expectedCloseDate || today,
      destinationPort: deal.destinationPort || 'Standard Port',
      owner: currentUserName,
      status: 'Confirmed',
      notes: `Converted from confirmed deal "${deal.title}".`,
    });
  },

  // Update order status with note or cancel reason
  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    note?: string,
    cancelReason?: string
  ): Order {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const order = orders[index];
    const now = new Date().toISOString();

    const historyItem = {
      status: newStatus,
      timestamp: now,
      changedBy,
      note: note || (newStatus === 'Cancelled' ? `Order cancelled: ${cancelReason}` : `Status advanced to ${newStatus}`),
      cancelReason: newStatus === 'Cancelled' ? cancelReason : undefined,
    };

    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      cancelReason: newStatus === 'Cancelled' ? cancelReason : order.cancelReason,
      statusHistory: [...order.statusHistory, historyItem],
      updatedAt: now,
    };

    orders[index] = updatedOrder;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    activitiesService.createActivity({
      companyId: order.companyId,
      dealId: order.dealId,
      type: 'note',
      title: `Order ${order.orderNumber} Status -> ${newStatus}`,
      description: note || (newStatus === 'Cancelled' ? `Reason: ${cancelReason}` : `Moved to ${newStatus}`),
      loggedBy: changedBy,
      date: now.slice(0, 10),
    });

    return updatedOrder;
  },

  // Add mock attachment
  addAttachment(orderId: string, fileData: { name: string; size: string; uploadedBy: string }): Order {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const newAttachment: OrderAttachment = {
      id: `att_${Date.now()}`,
      name: fileData.name,
      size: fileData.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: fileData.uploadedBy,
    };

    const updatedOrder: Order = {
      ...orders[index],
      attachments: [...(orders[index].attachments || []), newAttachment],
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return updatedOrder;
  },

  // Remove attachment
  removeAttachment(orderId: string, attachmentId: string): Order {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const updatedOrder: Order = {
      ...orders[index],
      attachments: (orders[index].attachments || []).filter(a => a.id !== attachmentId),
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return updatedOrder;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/orders/:id
  updateOrder(id: string, updates: Partial<Order>): Order {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');

    const updatedOrder: Order = {
      ...orders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    orders[index] = updatedOrder;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    return updatedOrder;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/orders/:id
  deleteOrder(id: string): boolean {
    const orders = this.getOrders();
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length === orders.length) return false;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
    return true;
  },

  // Export Orders to CSV
  exportToCSV(orders: Order[]): void {
    const headers = [
      'Order Number',
      'Order Type',
      'Order Date',
      'Expected Shipment',
      'Status',
      'Company ID',
      'Currency',
      'Subtotal',
      'Freight',
      'Discount',
      'Total',
      'Incoterm',
      'Destination Port',
      'Owner',
    ];

    const rows = orders.map(o => [
      o.orderNumber,
      o.orderType,
      o.orderDate,
      o.expectedShipmentDate,
      o.status,
      o.companyId,
      o.currency,
      o.subtotal,
      o.freightCharges,
      o.discount,
      o.total,
      o.incoterm,
      `"${(o.destinationPort || '').replace(/"/g, '""')}"`,
      o.owner,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TexTrade_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
