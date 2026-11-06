import { Deal, DealStage, DealType, UserRole } from '../types';
import { INITIAL_DEALS } from './seedData';
import { STORAGE_KEYS } from './storageKeys';
import { currencyService } from './currencyService';

function initStorage(): void {
  const initializedM2 = localStorage.getItem(STORAGE_KEYS.INITIALIZED_M2);
  if (!initializedM2 || !localStorage.getItem(STORAGE_KEYS.DEALS)) {
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(INITIAL_DEALS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED_M2, 'true');
  }
}

export interface DealFilterOptions {
  search?: string;
  stage?: string;
  dealType?: string;
  companyId?: string;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'expectedCloseDate' | 'totalValue' | 'title' | 'createdAt' | 'probability';
  sortOrder?: 'asc' | 'desc';
}

export const DEAL_STAGES: DealStage[] = [
  'New Inquiry',
  'Sample Sent',
  'Quote Sent',
  'Negotiation',
  'Order Confirmed',
  'Lost',
];

export const dealsService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/deals?stage=...&owner=...
  getDeals(filters?: DealFilterOptions, userRole?: UserRole): Deal[] {
    initStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DEALS);
      let list: Deal[] = stored ? JSON.parse(stored) : [...INITIAL_DEALS];

      // Role permission filtering:
      // Procurement sees Purchase deals only
      if (userRole === 'Procurement') {
        list = list.filter(d => d.dealType === 'Purchase');
      }

      if (!filters) return list;

      const searchLower = (filters.search || '').trim().toLowerCase();
      if (searchLower) {
        list = list.filter(d =>
          d.title.toLowerCase().includes(searchLower) ||
          d.destinationPort.toLowerCase().includes(searchLower) ||
          d.owner.toLowerCase().includes(searchLower) ||
          d.incoterm.toLowerCase().includes(searchLower) ||
          (d.notes && d.notes.toLowerCase().includes(searchLower))
        );
      }

      if (filters.stage && filters.stage !== 'All') {
        list = list.filter(d => d.stage === filters.stage);
      }

      if (filters.dealType && filters.dealType !== 'All') {
        list = list.filter(d => d.dealType === filters.dealType);
      }

      if (filters.companyId && filters.companyId !== 'All') {
        list = list.filter(d => d.companyId === filters.companyId);
      }

      if (filters.owner && filters.owner !== 'All') {
        list = list.filter(d => d.owner === filters.owner);
      }

      if (filters.dateFrom) {
        list = list.filter(d => d.expectedCloseDate >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        list = list.filter(d => d.expectedCloseDate <= filters.dateTo!);
      }

      const sortBy = filters.sortBy || 'expectedCloseDate';
      const order = filters.sortOrder === 'desc' ? -1 : 1;

      list.sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'totalValue') {
          // Compare normalized to USD for correct sorting across currencies
          valA = currencyService.convertToUSD(a.totalValue, a.currency);
          valB = currencyService.convertToUSD(b.totalValue, b.currency);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });

      return list;
    } catch {
      return [...INITIAL_DEALS];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/deals/:id
  getDealById(id: string): Deal | null {
    const list = this.getDeals();
    return list.find(d => d.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/deals
  createDeal(
    data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory'>,
    userName: string
  ): Deal {
    const list = this.getDeals();
    const now = new Date().toISOString();
    const totalValue = data.quantity * data.pricePerUnit;

    const newDeal: Deal = {
      ...data,
      totalValue,
      id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stageHistory: [
        {
          stage: data.stage,
          timestamp: now,
          changedBy: userName,
          note: 'Deal created in pipeline',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newDeal, ...list];
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
    return newDeal;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/deals/:id
  updateDeal(id: string, updates: Partial<Deal>, userName: string): Deal {
    const list = this.getDeals();
    const index = list.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Deal not found');

    const current = list[index];
    const now = new Date().toISOString();

    const newQuantity = updates.quantity !== undefined ? updates.quantity : current.quantity;
    const newPrice = updates.pricePerUnit !== undefined ? updates.pricePerUnit : current.pricePerUnit;
    const totalValue = newQuantity * newPrice;

    const history = [...current.stageHistory];
    if (updates.stage && updates.stage !== current.stage) {
      history.push({
        stage: updates.stage,
        timestamp: now,
        changedBy: userName,
        note: updates.lostReason ? `Reason: ${updates.lostReason}` : 'Stage updated',
      });
    }

    const updatedDeal: Deal = {
      ...current,
      ...updates,
      totalValue,
      id,
      stageHistory: history,
      updatedAt: now,
    };

    list[index] = updatedDeal;
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(list));
    return updatedDeal;
  },

  // Transition stage directly (with note & optional lostReason)
  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/deals/:id/stage
  updateDealStage(
    id: string,
    newStage: DealStage,
    userName: string,
    note?: string,
    lostReason?: string
  ): Deal {
    const list = this.getDeals();
    const index = list.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Deal not found');

    const current = list[index];
    const now = new Date().toISOString();

    const updatedProbability =
      newStage === 'Order Confirmed'
        ? 100
        : newStage === 'Lost'
        ? 0
        : current.probability;

    const history = [
      ...current.stageHistory,
      {
        stage: newStage,
        timestamp: now,
        changedBy: userName,
        note: lostReason ? `Reason: ${lostReason}` : note || `Moved to ${newStage}`,
      },
    ];

    const updatedDeal: Deal = {
      ...current,
      stage: newStage,
      probability: updatedProbability,
      lostReason: newStage === 'Lost' ? lostReason : undefined,
      stageHistory: history,
      updatedAt: now,
    };

    list[index] = updatedDeal;
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(list));
    return updatedDeal;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/deals/:id
  deleteDeal(id: string): boolean {
    const list = this.getDeals();
    const filtered = list.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(filtered));
    return true;
  },

  // Export deals to CSV
  exportDealsToCSV(deals: Deal[]): void {
    const headers = [
      'Deal Title',
      'Deal Type',
      'Stage',
      'Total Value',
      'Currency',
      'Value (USD Est.)',
      'Quantity',
      'Unit',
      'Price Per Unit',
      'Incoterm',
      'Destination Port',
      'Expected Close',
      'Probability %',
      'Owner',
      'Payment Terms',
      'Lost Reason',
      'Created Date'
    ];

    const escapeCSV = (str: string | number | undefined | null) => {
      if (str === undefined || str === null) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = deals.map(d => [
      escapeCSV(d.title),
      escapeCSV(d.dealType),
      escapeCSV(d.stage),
      escapeCSV(d.totalValue),
      escapeCSV(d.currency),
      escapeCSV(Math.round(currencyService.convertToUSD(d.totalValue, d.currency))),
      escapeCSV(d.quantity),
      escapeCSV(d.unit),
      escapeCSV(d.pricePerUnit),
      escapeCSV(d.incoterm),
      escapeCSV(d.destinationPort),
      escapeCSV(d.expectedCloseDate),
      escapeCSV(`${d.probability}%`),
      escapeCSV(d.owner),
      escapeCSV(d.paymentTerms),
      escapeCSV(d.lostReason || ''),
      escapeCSV(d.createdAt),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `textrade_deals_pipeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Calculate Pipeline Metrics for Dashboard
  calculatePipelineMetrics(deals: Deal[]) {
    // Open deals are not 'Order Confirmed' and not 'Lost'
    const openDeals = deals.filter(d => d.stage !== 'Order Confirmed' && d.stage !== 'Lost');
    const openDealsCount = openDeals.length;

    // Pipeline value in base currency (USD)
    const pipelineValueUSD = openDeals.reduce((sum, d) => {
      return sum + currencyService.convertToUSD(d.totalValue, d.currency);
    }, 0);

    // Deals won this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dealsWonThisMonth = deals.filter(d => {
      if (d.stage !== 'Order Confirmed') return false;
      const lastConfirmedHistory = [...d.stageHistory].reverse().find(h => h.stage === 'Order Confirmed');
      const dateToCheck = lastConfirmedHistory ? new Date(lastConfirmedHistory.timestamp) : new Date(d.updatedAt);
      return dateToCheck.getMonth() === currentMonth && dateToCheck.getFullYear() === currentYear;
    });

    const dealsWonThisMonthCount = dealsWonThisMonth.length;
    const dealsWonValueUSD = dealsWonThisMonth.reduce((sum, d) => {
      return sum + currencyService.convertToUSD(d.totalValue, d.currency);
    }, 0);

    // Stage breakdown: count and total USD value
    const stageBreakdown = DEAL_STAGES.map(stage => {
      const inStage = deals.filter(d => d.stage === stage);
      const valueUSD = inStage.reduce((sum, d) => sum + currencyService.convertToUSD(d.totalValue, d.currency), 0);
      return {
        stage,
        count: inStage.length,
        valueUSD,
      };
    });

    return {
      openDealsCount,
      pipelineValueUSD,
      dealsWonThisMonthCount,
      dealsWonValueUSD,
      stageBreakdown,
    };
  },
};
