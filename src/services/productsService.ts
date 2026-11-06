import { Product, ProductCategory } from '../types';
import { INITIAL_PRODUCTS } from './seedData';
import { STORAGE_KEYS } from './storageKeys';

function initStorage(): void {
  const initializedM2 = localStorage.getItem(STORAGE_KEYS.INITIALIZED_M2);
  if (!initializedM2 || !localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED_M2, 'true');
  }
}

export interface ProductFilterOptions {
  search?: string;
  category?: string;
  originCountry?: string;
  status?: string;
  sortBy?: 'name' | 'category' | 'defaultPricePerUnit' | 'originCountry' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const productsService = {
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/products?search=...&category=...
  getProducts(filters?: ProductFilterOptions): Product[] {
    initStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      let list: Product[] = stored ? JSON.parse(stored) : [...INITIAL_PRODUCTS];

      if (!filters) return list;

      const searchLower = (filters.search || '').trim().toLowerCase();
      if (searchLower) {
        list = list.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.materialComposition.toLowerCase().includes(searchLower) ||
          p.grade.toLowerCase().includes(searchLower) ||
          p.color.toLowerCase().includes(searchLower) ||
          p.hsCode.toLowerCase().includes(searchLower) ||
          p.originCountry.toLowerCase().includes(searchLower) ||
          (p.yarnCount && p.yarnCount.toLowerCase().includes(searchLower)) ||
          (p.spinningType && p.spinningType.toLowerCase().includes(searchLower)) ||
          (p.notes && p.notes.toLowerCase().includes(searchLower))
        );
      }

      if (filters.category && filters.category !== 'All') {
        list = list.filter(p => p.category === filters.category);
      }

      if (filters.originCountry && filters.originCountry !== 'All') {
        list = list.filter(p => p.originCountry.toLowerCase() === filters.originCountry!.toLowerCase());
      }

      if (filters.status && filters.status !== 'All') {
        list = list.filter(p => p.status === filters.status);
      }

      const sortBy = filters.sortBy || 'name';
      const order = filters.sortOrder === 'desc' ? -1 : 1;

      list.sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });

      return list;
    } catch {
      return [...INITIAL_PRODUCTS];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/products/:id
  getProductById(id: string): Product | null {
    const list = this.getProducts();
    return list.find(p => p.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/products
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const list = this.getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newProduct, ...list];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    return newProduct;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/products/:id
  updateProduct(id: string, updates: Partial<Product>): Product {
    const list = this.getProducts();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const updatedProduct: Product = {
      ...list[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updatedProduct;
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
    return updatedProduct;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/products/:id
  deleteProduct(id: string): boolean {
    const list = this.getProducts();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  },

  getUniqueCategories(): ProductCategory[] {
    return ['Waste Cloth', 'Yarn', 'Fiber', 'Other'];
  },

  getUniqueOrigins(): string[] {
    const list = this.getProducts();
    const origins = Array.from(new Set(list.map(p => p.originCountry))).filter(Boolean);
    return origins.sort();
  },
};
