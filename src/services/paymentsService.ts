import { PaymentMilestone, PaymentRecord, PaymentStatus, PaymentMethod, CurrencyCode } from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { INITIAL_PAYMENTS, INITIAL_PAYMENT_RECORDS } from './seedData';
import { ordersService } from './ordersService';
import { activitiesService } from './activitiesService';
import { currencyService } from './currencyService';

export interface PaymentFilters {
  orderId?: string;
  status?: PaymentStatus | 'All';
  method?: PaymentMethod | 'All';
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const paymentsService = {
  // Check and auto-flag overdue milestones
  privateCheckOverdue(milestones: PaymentMilestone[]): { changed: boolean; milestones: PaymentMilestone[] } {
    const today = new Date().toISOString().slice(0, 10);
    let changed = false;

    const updated = milestones.map(m => {
      const remaining = m.amount - (m.paidAmount || 0);
      if (remaining > 0 && m.dueDate && m.dueDate < today && m.status !== 'Overdue') {
        changed = true;
        return {
          ...m,
          status: 'Overdue' as PaymentStatus,
        };
      }
      return m;
    });

    return { changed, milestones: updated };
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/payments/milestones
  getMilestones(filters?: PaymentFilters): PaymentMilestone[] {
    let milestones: PaymentMilestone[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (stored) {
        milestones = JSON.parse(stored);
      } else {
        milestones = INITIAL_PAYMENTS;
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(milestones));
      }
    } catch {
      milestones = INITIAL_PAYMENTS;
    }

    const check = this.privateCheckOverdue(milestones);
    if (check.changed) {
      milestones = check.milestones;
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(milestones));
    }

    if (!filters) return milestones;

    return milestones.filter(m => {
      if (filters.orderId && m.orderId !== filters.orderId) return false;
      if (filters.status && filters.status !== 'All' && m.status !== filters.status) return false;
      if (filters.method && filters.method !== 'All' && m.method !== filters.method) return false;
      if (filters.startDate && m.dueDate < filters.startDate) return false;
      if (filters.endDate && m.dueDate > filters.endDate) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(query);
        const notesMatch = (m.notes || '').toLowerCase().includes(query);
        if (!nameMatch && !notesMatch) return false;
      }
      return true;
    });
  },

  getMilestonesByOrder(orderId: string): PaymentMilestone[] {
    return this.getMilestones({ orderId });
  },

  getMilestoneById(id: string): PaymentMilestone | null {
    const milestones = this.getMilestones();
    return milestones.find(m => m.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/payments/milestones
  createMilestone(data: Omit<PaymentMilestone, 'id' | 'paidAmount' | 'status' | 'createdAt'>): PaymentMilestone {
    const milestones = this.getMilestones();
    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = data.dueDate < today;

    const newMilestone: PaymentMilestone = {
      ...data,
      id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      paidAmount: 0,
      status: isOverdue ? 'Overdue' : 'Pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [...milestones, newMilestone];
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updated));
    return newMilestone;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/payments/milestones/:id
  updateMilestone(id: string, updates: Partial<PaymentMilestone>): PaymentMilestone {
    const milestones = this.getMilestones();
    const index = milestones.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Payment milestone not found');

    const updatedMilestone: PaymentMilestone = {
      ...milestones[index],
      ...updates,
    };

    milestones[index] = updatedMilestone;
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(milestones));
    return updatedMilestone;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/payments/milestones/:id
  deleteMilestone(id: string): boolean {
    const milestones = this.getMilestones();
    const filtered = milestones.filter(m => m.id !== id);
    if (filtered.length === milestones.length) return false;
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(filtered));
    return true;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/payments/records
  getPaymentRecords(milestoneId?: string, orderId?: string): PaymentRecord[] {
    let records: PaymentRecord[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PAYMENT_RECORDS);
      if (stored) {
        records = JSON.parse(stored);
      } else {
        records = INITIAL_PAYMENT_RECORDS;
        localStorage.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(records));
      }
    } catch {
      records = INITIAL_PAYMENT_RECORDS;
    }

    if (milestoneId) {
      records = records.filter(r => r.milestoneId === milestoneId);
    }
    if (orderId) {
      records = records.filter(r => r.orderId === orderId);
    }

    return records.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  },

  // Record an actual payment against a milestone
  recordPayment(data: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
    const milestone = this.getMilestoneById(data.milestoneId);
    if (!milestone) throw new Error('Milestone not found');

    const records = this.getPaymentRecords();
    const newRecord: PaymentRecord = {
      ...data,
      id: `pr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(updatedRecords));

    // Update milestone paidAmount and status
    const newPaidAmount = (milestone.paidAmount || 0) + data.amount;
    const today = new Date().toISOString().slice(0, 10);
    let newStatus: PaymentStatus = 'Partially Paid';

    if (newPaidAmount >= milestone.amount) {
      newStatus = 'Paid';
    } else if (milestone.dueDate < today) {
      newStatus = 'Overdue';
    }

    this.updateMilestone(milestone.id, {
      paidAmount: newPaidAmount,
      status: newStatus,
    });

    // Log activity on order & company
    const order = ordersService.getOrderById(milestone.orderId);
    if (order) {
      activitiesService.createActivity({
        companyId: order.companyId,
        dealId: order.dealId,
        type: 'note',
        title: `Payment Received: ${data.currency} ${data.amount.toLocaleString()} (${milestone.name})`,
        description: `Ref: ${data.referenceNumber} via ${data.method}. Remaining for this milestone: ${data.currency} ${Math.max(0, milestone.amount - newPaidAmount).toLocaleString()}`,
        loggedBy: data.recordedBy,
        date: data.paymentDate,
      });
    }

    return newRecord;
  },

  // Summary per order
  getOrderPaymentSummary(orderId: string): {
    totalOrderAmount: number;
    totalPaid: number;
    remainingBalance: number;
    percentPaid: number;
    milestones: PaymentMilestone[];
    records: PaymentRecord[];
  } {
    const order = ordersService.getOrderById(orderId);
    const milestones = this.getMilestonesByOrder(orderId);
    const records = this.getPaymentRecords(undefined, orderId);

    const totalOrderAmount = order ? order.total : milestones.reduce((sum, m) => sum + m.amount, 0);
    const totalPaid = milestones.reduce((sum, m) => sum + (m.paidAmount || 0), 0);
    const remainingBalance = Math.max(0, totalOrderAmount - totalPaid);
    const percentPaid = totalOrderAmount > 0 ? Math.min(100, (totalPaid / totalOrderAmount) * 100) : 0;

    return {
      totalOrderAmount,
      totalPaid,
      remainingBalance,
      percentPaid,
      milestones,
      records,
    };
  },

  // Global Financial Statistics for Dashboard & Payments view
  getGlobalPaymentStats(): {
    receivablesOutstandingUSD: number;
    payablesOutstandingUSD: number;
    overdueCount: number;
    overdueAmountUSD: number;
    collectedThisMonthUSD: number;
    receivablesByCurrency: Record<CurrencyCode, number>;
    payablesByCurrency: Record<CurrencyCode, number>;
  } {
    const orders = ordersService.getOrders();
    const milestones = this.getMilestones();
    const records = this.getPaymentRecords();

    const currentYearMonth = new Date().toISOString().slice(0, 7);

    let receivablesOutstandingUSD = 0;
    let payablesOutstandingUSD = 0;
    let overdueCount = 0;
    let overdueAmountUSD = 0;
    let collectedThisMonthUSD = 0;

    const receivablesByCurrency: Record<CurrencyCode, number> = {
      USD: 0, EUR: 0, TRY: 0, INR: 0, CNY: 0, AED: 0, GBP: 0,
    };
    const payablesByCurrency: Record<CurrencyCode, number> = {
      USD: 0, EUR: 0, TRY: 0, INR: 0, CNY: 0, AED: 0, GBP: 0,
    };

    milestones.forEach(m => {
      const order = orders.find(o => o.id === m.orderId);
      const remaining = Math.max(0, m.amount - (m.paidAmount || 0));
      const remainingUSD = currencyService.convertToUSD(remaining, m.currency);

      if (m.status === 'Overdue') {
        overdueCount += 1;
        overdueAmountUSD += remainingUSD;
      }

      if (order?.orderType === 'Purchase Order') {
        payablesOutstandingUSD += remainingUSD;
        payablesByCurrency[m.currency] = (payablesByCurrency[m.currency] || 0) + remaining;
      } else {
        receivablesOutstandingUSD += remainingUSD;
        receivablesByCurrency[m.currency] = (receivablesByCurrency[m.currency] || 0) + remaining;
      }
    });

    records.forEach(r => {
      if (r.paymentDate.startsWith(currentYearMonth)) {
        collectedThisMonthUSD += currencyService.convertToUSD(r.amount, r.currency);
      }
    });

    return {
      receivablesOutstandingUSD,
      payablesOutstandingUSD,
      overdueCount,
      overdueAmountUSD,
      collectedThisMonthUSD,
      receivablesByCurrency,
      payablesByCurrency,
    };
  },

  // Export payments to CSV
  exportToCSV(milestones: PaymentMilestone[]): void {
    const orders = ordersService.getOrders();
    const headers = [
      'Milestone Name',
      'Order Number',
      'Order Type',
      'Due Date',
      'Status',
      'Currency',
      'Amount',
      'Paid Amount',
      'Remaining Balance',
      'Payment Method',
      'Notes',
    ];

    const rows = milestones.map(m => {
      const order = orders.find(o => o.id === m.orderId);
      const remaining = Math.max(0, m.amount - (m.paidAmount || 0));
      return [
        `"${m.name.replace(/"/g, '""')}"`,
        order ? order.orderNumber : m.orderId,
        order ? order.orderType : 'Unknown',
        m.dueDate,
        m.status,
        m.currency,
        m.amount,
        m.paidAmount || 0,
        remaining,
        m.method,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TexTrade_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
