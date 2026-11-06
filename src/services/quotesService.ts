import { Quote, QuoteStatus } from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { INITIAL_QUOTES } from './seedData';
import { settingsService } from './settingsService';
import { dealsService } from './dealsService';
import { productsService } from './productsService';
import { activitiesService } from './activitiesService';

export interface QuoteFilters {
  status?: QuoteStatus | 'All';
  companyId?: string;
  dealId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const quotesService = {
  // Check and auto-mark expired quotes
  privateCheckExpiration(quotes: Quote[]): { changed: boolean; quotes: Quote[] } {
    const today = new Date().toISOString().slice(0, 10);
    let changed = false;

    const updated = quotes.map(q => {
      if ((q.status === 'Draft' || q.status === 'Sent') && q.validityDate && q.validityDate < today) {
        changed = true;
        return {
          ...q,
          status: 'Expired' as QuoteStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return q;
    });

    return { changed, quotes: updated };
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/quotes
  getQuotes(filters?: QuoteFilters): Quote[] {
    let quotes: Quote[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUOTES);
      if (stored) {
        quotes = JSON.parse(stored);
      } else {
        quotes = INITIAL_QUOTES;
        localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
      }
    } catch {
      quotes = INITIAL_QUOTES;
    }

    // Auto-mark expired
    const check = this.privateCheckExpiration(quotes);
    if (check.changed) {
      quotes = check.quotes;
      localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    }

    if (!filters) return quotes;

    return quotes.filter(q => {
      if (filters.status && filters.status !== 'All' && q.status !== filters.status) return false;
      if (filters.companyId && q.companyId !== filters.companyId) return false;
      if (filters.dealId && q.dealId !== filters.dealId) return false;
      if (filters.startDate && q.date < filters.startDate) return false;
      if (filters.endDate && q.date > filters.endDate) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const numMatch = q.quoteNumber.toLowerCase().includes(query);
        const itemMatch = q.lineItems.some(i =>
          i.productName.toLowerCase().includes(query) || i.description.toLowerCase().includes(query)
        );
        const termMatch = q.notesAndTerms.toLowerCase().includes(query);
        if (!numMatch && !itemMatch && !termMatch) return false;
      }
      return true;
    });
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/quotes/:id
  getQuoteById(id: string): Quote | null {
    const quotes = this.getQuotes();
    return quotes.find(q => q.id === id) || null;
  },

  // Generate next quote sequence
  generateNextQuoteNumber(): string {
    const settings = settingsService.getSettings();
    const prefix = settings.quotePrefix || 'QT-';
    const year = new Date().getFullYear();
    const quotes = this.getQuotes();

    // Look for numbers matching QT-YYYY-XXXX
    let maxNum = 0;
    const regex = new RegExp(`^${prefix}${year}-(\\d{4})`);
    quotes.forEach(q => {
      const match = q.quoteNumber.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const next = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${year}-${next}`;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/quotes
  createQuote(data: Omit<Quote, 'id' | 'quoteNumber' | 'version' | 'createdAt' | 'updatedAt'>): Quote {
    const quotes = this.getQuotes();
    const quoteNumber = this.generateNextQuoteNumber();
    const now = new Date().toISOString();

    const newQuote: Quote = {
      ...data,
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      quoteNumber,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newQuote, ...quotes];
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(updated));

    // Log activity
    activitiesService.createActivity({
      companyId: newQuote.companyId,
      dealId: newQuote.dealId,
      type: 'note',
      title: `Quote Created: ${newQuote.quoteNumber}`,
      description: `${newQuote.type} issued for total ${newQuote.currency} ${newQuote.total.toLocaleString()} to customer.`,
      loggedBy: newQuote.createdBy,
      date: newQuote.date,
    });

    return newQuote;
  },

  // Duplicate quote as new version (v2, v3, etc.)
  duplicateAsNewVersion(quoteId: string, currentUserName: string): Quote {
    const original = this.getQuoteById(quoteId);
    if (!original) throw new Error('Original quote not found');

    const quotes = this.getQuotes();
    const baseNumber = original.quoteNumber.split('-v')[0];
    const nextVersion = (original.version || 1) + 1;
    const versionedNumber = `${baseNumber}-v${nextVersion}`;

    const now = new Date().toISOString();
    const settings = settingsService.getSettings();
    const validityDate = new Date(Date.now() + (settings.defaultQuoteValidityDays || 15) * 86400000)
      .toISOString()
      .slice(0, 10);

    const newQuote: Quote = {
      ...original,
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      quoteNumber: versionedNumber,
      version: nextVersion,
      parentQuoteId: original.id,
      date: now.slice(0, 10),
      validityDate,
      status: 'Draft',
      convertedToOrderId: undefined,
      createdBy: currentUserName,
      notesAndTerms: `${original.notesAndTerms ? original.notesAndTerms + '\n\n' : ''}[Revision ${nextVersion} created from ${original.quoteNumber}]`,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newQuote, ...quotes];
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(updated));

    activitiesService.createActivity({
      companyId: newQuote.companyId,
      dealId: newQuote.dealId,
      type: 'note',
      title: `Quote Revised: ${newQuote.quoteNumber}`,
      description: `New version created based on ${original.quoteNumber}.`,
      loggedBy: currentUserName,
      date: newQuote.date,
    });

    return newQuote;
  },

  // Create pre-filled quote from Deal
  createQuoteFromDeal(dealId: string, currentUserName: string): Quote {
    const deal = dealsService.getDealById(dealId);
    if (!deal) throw new Error('Deal not found');

    const product = deal.productId ? productsService.getProductById(deal.productId) : null;
    const settings = settingsService.getSettings();
    const today = new Date().toISOString().slice(0, 10);
    const validityDate = new Date(Date.now() + (settings.defaultQuoteValidityDays || 15) * 86400000)
      .toISOString()
      .slice(0, 10);

    const lineTotal = deal.quantity * deal.pricePerUnit;

    return this.createQuote({
      dealId: deal.id,
      companyId: deal.companyId,
      contactId: deal.contactId,
      type: 'Quotation',
      date: today,
      validityDate,
      currency: deal.currency,
      lineItems: [
        {
          id: `qli_${Date.now()}`,
          productId: deal.productId,
          productName: product ? product.name : deal.title,
          description: product
            ? `${product.materialComposition} - ${product.grade} (${product.color})`
            : deal.notes || 'As per inquiry specification',
          quantity: deal.quantity,
          unit: deal.unit,
          unitPrice: deal.pricePerUnit,
          lineTotal,
        },
      ],
      subtotal: lineTotal,
      discount: 0,
      freightCharges: 0,
      total: lineTotal,
      incoterm: deal.incoterm,
      portOfLoading: 'Jebel Ali / Origin Port',
      portOfDestination: deal.destinationPort || 'Buyer Nominated Port',
      paymentTerms: deal.paymentTerms || settings.defaultPaymentTerms,
      deliveryTime: '20-25 days after order confirmation',
      bankDetails: `${settings.bankName} | IBAN: ${settings.iban} | SWIFT: ${settings.swiftBic}`,
      notesAndTerms: settings.standardQuoteTerms,
      status: 'Draft',
      createdBy: currentUserName,
    });
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/quotes/:id
  updateQuote(id: string, updates: Partial<Quote>): Quote {
    const quotes = this.getQuotes();
    const index = quotes.findIndex(q => q.id === id);
    if (index === -1) throw new Error('Quote not found');

    const updatedQuote: Quote = {
      ...quotes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    quotes[index] = updatedQuote;
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
    return updatedQuote;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/quotes/:id
  deleteQuote(id: string): boolean {
    const quotes = this.getQuotes();
    const filtered = quotes.filter(q => q.id !== id);
    if (filtered.length === quotes.length) return false;
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(filtered));
    return true;
  },

  // Export Quotes to CSV
  exportToCSV(quotes: Quote[]): void {
    const headers = [
      'Quote Number',
      'Version',
      'Type',
      'Date',
      'Validity Date',
      'Status',
      'Company ID',
      'Currency',
      'Subtotal',
      'Discount',
      'Freight',
      'Total',
      'Incoterm',
      'Port Destination',
      'Payment Terms',
      'Created By',
    ];

    const rows = quotes.map(q => [
      q.quoteNumber,
      `v${q.version}`,
      q.type,
      q.date,
      q.validityDate,
      q.status,
      q.companyId,
      q.currency,
      q.subtotal,
      q.discount,
      q.freightCharges,
      q.total,
      q.incoterm,
      `"${(q.portOfDestination || '').replace(/"/g, '""')}"`,
      `"${(q.paymentTerms || '').replace(/"/g, '""')}"`,
      q.createdBy,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TexTrade_Quotes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
