import { Company } from '../types';
import { INITIAL_COMPANIES } from './seedData';
import { STORAGE_KEYS } from './storageKeys';

function initStorage(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized || !localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
  }
}

export interface CompanyFilterOptions {
  search?: string;
  type?: string;
  country?: string;
  status?: string;
  sortBy?: 'name' | 'country' | 'type' | 'status' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const companiesService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/companies?search=...&type=...
  getCompanies(filters?: CompanyFilterOptions): Company[] {
    initStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      let list: Company[] = stored ? JSON.parse(stored) : [...INITIAL_COMPANIES];

      if (!filters) return list;

      const searchLower = (filters.search || '').trim().toLowerCase();
      if (searchLower) {
        list = list.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.city.toLowerCase().includes(searchLower) ||
          c.country.toLowerCase().includes(searchLower) ||
          c.productsOfInterest.some(p => p.toLowerCase().includes(searchLower)) ||
          c.assignedOwner.toLowerCase().includes(searchLower) ||
          c.notes.toLowerCase().includes(searchLower)
        );
      }

      if (filters.type && filters.type !== 'All') {
        list = list.filter(c => c.type === filters.type);
      }

      if (filters.country && filters.country !== 'All') {
        list = list.filter(c => c.country.toLowerCase() === filters.country!.toLowerCase());
      }

      if (filters.status && filters.status !== 'All') {
        list = list.filter(c => c.status === filters.status);
      }

      const sortBy = filters.sortBy || 'name';
      const order = filters.sortOrder === 'desc' ? -1 : 1;

      list.sort((a, b) => {
        let valA = a[sortBy] || '';
        let valB = b[sortBy] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });

      return list;
    } catch {
      return [...INITIAL_COMPANIES];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/companies/:id
  getCompanyById(id: string): Company | null {
    const list = this.getCompanies();
    return list.find(c => c.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/companies/check-duplicate?name=...&country=...
  checkDuplicate(name: string, country: string, excludeId?: string): boolean {
    const list = this.getCompanies();
    const cleanName = name.trim().toLowerCase();
    const cleanCountry = country.trim().toLowerCase();

    return list.some(c =>
      c.id !== excludeId &&
      c.name.trim().toLowerCase() === cleanName &&
      c.country.trim().toLowerCase() === cleanCountry
    );
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/companies
  createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company {
    const list = this.getCompanies();
    const now = new Date().toISOString();
    const newCompany: Company = {
      ...data,
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newCompany, ...list];
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updated));
    return newCompany;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/companies/:id
  updateCompany(id: string, updates: Partial<Company>): Company {
    const list = this.getCompanies();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Company not found');

    const updatedCompany: Company = {
      ...list[index],
      ...updates,
      id, // protect id
      updatedAt: new Date().toISOString(),
    };

    list[index] = updatedCompany;
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(list));
    return updatedCompany;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/companies/:id
  deleteCompany(id: string): boolean {
    const list = this.getCompanies();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(filtered));

    // Also remove associated contacts and activities
    try {
      const contactsStr = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (contactsStr) {
        const contacts = JSON.parse(contactsStr);
        localStorage.setItem(
          STORAGE_KEYS.CONTACTS,
          JSON.stringify(contacts.filter((ct: { companyId: string }) => ct.companyId !== id))
        );
      }
      const actsStr = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (actsStr) {
        const acts = JSON.parse(actsStr);
        localStorage.setItem(
          STORAGE_KEYS.ACTIVITIES,
          JSON.stringify(acts.filter((a: { companyId: string }) => a.companyId !== id))
        );
      }
    } catch {
      // ignore
    }
    return true;
  },

  // Export current list to CSV
  exportCompaniesToCSV(): void {
    const list = this.getCompanies();
    const headers = [
      'Company Name',
      'Type',
      'Status',
      'Country',
      'City',
      'Currency',
      'Payment Terms',
      'Assigned Owner',
      'Products of Interest',
      'Website',
      'Address',
      'Notes',
      'Created Date'
    ];

    const escapeCSV = (str: string | undefined | null) => {
      if (!str) return '""';
      const clean = str.replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = list.map(c => [
      escapeCSV(c.name),
      escapeCSV(c.type),
      escapeCSV(c.status),
      escapeCSV(c.country),
      escapeCSV(c.city),
      escapeCSV(c.currency),
      escapeCSV(c.paymentTerms),
      escapeCSV(c.assignedOwner),
      escapeCSV(c.productsOfInterest.join('; ')),
      escapeCSV(c.website),
      escapeCSV(c.address),
      escapeCSV(c.notes),
      escapeCSV(c.createdAt),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `textrade_companies_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Helper to get all unique countries for filter dropdowns
  getUniqueCountries(): string[] {
    const list = this.getCompanies();
    const countries = Array.from(new Set(list.map(c => c.country))).filter(Boolean);
    return countries.sort();
  },
};
