import {
  Lot,
  Warehouse,
  StockMovement,
  QualityInspection,
  WeightTicket,
  QualityStatus,
  ProductCategory,
  ProductUnit,
} from '../types';
import { STORAGE_KEYS } from './storageKeys';
import {
  INITIAL_WAREHOUSES,
  INITIAL_LOTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_INSPECTIONS,
  INITIAL_WEIGHT_TICKETS,
} from './seedData';
import { settingsService } from './settingsService';
import { productsService } from './productsService';
import { activitiesService } from './activitiesService';

export interface LotFilters {
  warehouseId?: string;
  qualityStatus?: QualityStatus | 'All';
  productId?: string;
  supplierId?: string;
  search?: string;
}

export interface StockSummaryItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  unit: ProductUnit;
  totalNetWeight: number;
  availableWeight: number;
  reservedWeight: number;
  shippedWeight: number;
  totalBales: number;
  availableBales: number;
  qualityBreakdown: Record<QualityStatus, number>;
  warehouseBreakdown: {
    warehouseId: string;
    warehouseName: string;
    availableWeight: number;
    totalWeight: number;
  }[];
  thresholdKg: number;
  isLowStock: boolean;
}

function initInventoryStorage(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED_M4);
  if (!initialized || !localStorage.getItem(STORAGE_KEYS.LOTS)) {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(INITIAL_WAREHOUSES));
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(INITIAL_LOTS));
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    localStorage.setItem(STORAGE_KEYS.WEIGHT_TICKETS, JSON.stringify(INITIAL_WEIGHT_TICKETS));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED_M4, 'true');
  }
}

export const inventoryService = {
  // ==========================================================================
  // Warehouses
  // ==========================================================================
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/warehouses
  getWarehouses(): Warehouse[] {
    initInventoryStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
      return stored ? JSON.parse(stored) : [...INITIAL_WAREHOUSES];
    } catch {
      return [...INITIAL_WAREHOUSES];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/warehouses/:id
  getWarehouseById(id: string): Warehouse | null {
    const list = this.getWarehouses();
    return list.find(w => w.id === id) || null;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/warehouses
  createWarehouse(data: Omit<Warehouse, 'id' | 'createdAt'>): Warehouse {
    const list = this.getWarehouses();
    const newWarehouse: Warehouse = {
      ...data,
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...list, newWarehouse];
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(updated));
    return newWarehouse;
  },

  // ==========================================================================
  // Lots
  // ==========================================================================
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/lots
  getLots(filters?: LotFilters): Lot[] {
    initInventoryStorage();
    let lots: Lot[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOTS);
      lots = stored ? JSON.parse(stored) : [...INITIAL_LOTS];
    } catch {
      lots = [...INITIAL_LOTS];
    }

    if (!filters) return lots;

    return lots.filter(lot => {
      if (filters.warehouseId && lot.warehouseId !== filters.warehouseId) return false;
      if (filters.qualityStatus && filters.qualityStatus !== 'All' && lot.qualityStatus !== filters.qualityStatus)
        return false;
      if (filters.productId && lot.productId !== filters.productId) return false;
      if (filters.supplierId && lot.supplierId !== filters.supplierId) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const numMatch = lot.lotNumber.toLowerCase().includes(query);
        const prodMatch = lot.productName.toLowerCase().includes(query);
        const locMatch = lot.storageLocation.toLowerCase().includes(query);
        const gradeMatch = lot.grade.toLowerCase().includes(query);
        if (!numMatch && !prodMatch && !locMatch && !gradeMatch) return false;
      }
      return true;
    });
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/lots/:id
  getLotById(id: string): Lot | null {
    const lots = this.getLots();
    return lots.find(l => l.id === id) || null;
  },

  // Generate sequence LOT-YYYY-NNNN
  generateNextLotNumber(): string {
    const settings = settingsService.getSettings();
    const prefix = settings.lotPrefix || 'LOT-';
    const year = new Date().getFullYear();
    const lots = this.getLots();

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}${year}-(\\d{4})`);
    lots.forEach(l => {
      const match = l.lotNumber.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const next = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${year}-${next}`;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/lots
  createLot(
    data: Omit<Lot, 'id' | 'lotNumber' | 'reservedQuantity' | 'shippedQuantity' | 'createdAt' | 'updatedAt'>,
    currentUserName: string
  ): Lot {
    const lots = this.getLots();
    const lotNumber = this.generateNextLotNumber();
    const now = new Date().toISOString();

    const newLot: Lot = {
      ...data,
      id: `lot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      lotNumber,
      reservedQuantity: 0,
      shippedQuantity: 0,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newLot, ...lots];
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(updated));

    // Create initial stock movement
    this.createStockMovement({
      lotId: newLot.id,
      lotNumber: newLot.lotNumber,
      movementType: 'received',
      quantity: newLot.netWeight,
      unit: newLot.unit,
      bales: newLot.balesCount,
      referenceType: newLot.linkedPurchaseOrderId ? 'Purchase Order' : undefined,
      referenceId: newLot.linkedPurchaseOrderId,
      date: newLot.receivedDate,
      reason: `Intake received into ${newLot.storageLocation}`,
      performedBy: currentUserName,
    });

    // Log CRM activity
    activitiesService.createActivity({
      companyId: newLot.supplierId,
      dealId: undefined,
      type: 'note',
      title: `Lot Received: ${newLot.lotNumber} (${newLot.productName})`,
      description: `Intake of ${newLot.netWeight.toLocaleString()} ${newLot.unit} (${newLot.balesCount} bales) at storage location ${newLot.storageLocation}. Status: ${newLot.qualityStatus}.`,
      loggedBy: currentUserName,
      date: newLot.receivedDate,
    });

    return newLot;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/lots/:id
  updateLot(id: string, updates: Partial<Lot>): Lot {
    const lots = this.getLots();
    const index = lots.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lot not found');

    const updatedLot: Lot = {
      ...lots[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    lots[index] = updatedLot;
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(lots));
    return updatedLot;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/lots/:id
  deleteLot(id: string): { success: boolean; message?: string } {
    const lot = this.getLotById(id);
    if (!lot) return { success: false, message: 'Lot not found' };

    // Delete protection: cannot delete if already shipped or reserved or stuffed
    if (lot.shippedQuantity > 0) {
      return { success: false, message: 'Cannot delete lot: parts of this lot have already been shipped or stuffed into containers.' };
    }
    if (lot.reservedQuantity > 0) {
      return { success: false, message: 'Cannot delete lot: active reservations exist on this lot. Release reservation first.' };
    }

    const movements = this.getStockMovements(id);
    // If movements include actions other than initial 'received'
    const nonReceived = movements.filter(m => m.movementType !== 'received');
    if (nonReceived.length > 0) {
      return { success: false, message: 'Cannot delete lot: audit movement history exists (reservations, adjustments, inspections).' };
    }

    const lots = this.getLots();
    const filtered = lots.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LOTS, JSON.stringify(filtered));

    // Clean up associated movements
    const allMovements = this.getStockMovements().filter(m => m.lotId !== id);
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(allMovements));

    return { success: true };
  },

  // Reserve stock against a Sales Order
  reserveStock(
    lotId: string,
    orderId: string,
    orderNumber: string,
    quantity: number,
    bales: number,
    currentUserName: string,
    notes?: string
  ): Lot {
    const lot = this.getLotById(lotId);
    if (!lot) throw new Error('Lot not found');

    const available = Math.max(0, lot.netWeight - lot.reservedQuantity - lot.shippedQuantity);
    if (quantity > available) {
      throw new Error(`Insufficient available stock. Max available to reserve is ${available.toLocaleString()} ${lot.unit}.`);
    }

    const updatedReserved = lot.reservedQuantity + quantity;
    const updated = this.updateLot(lotId, {
      reservedQuantity: updatedReserved,
    });

    const today = new Date().toISOString().slice(0, 10);

    // Create stock movement
    this.createStockMovement({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      movementType: 'reserved',
      quantity,
      unit: lot.unit,
      bales,
      referenceType: 'Sales Order',
      referenceId: orderId,
      referenceNumber: orderNumber,
      date: today,
      reason: notes || `Stock reserved for Sales Order ${orderNumber}`,
      performedBy: currentUserName,
    });

    // Log CRM activity
    activitiesService.createActivity({
      companyId: lot.supplierId,
      dealId: undefined,
      type: 'note',
      title: `Stock Reserved: ${lot.lotNumber} -> ${orderNumber}`,
      description: `Reserved ${quantity.toLocaleString()} ${lot.unit} (${bales} bales) from ${lot.lotNumber} for ${orderNumber}.`,
      loggedBy: currentUserName,
      date: today,
    });

    return updated;
  },

  // Release previously reserved stock
  releaseStock(
    lotId: string,
    quantity: number,
    bales: number,
    currentUserName: string,
    reason: string,
    orderNumber?: string
  ): Lot {
    const lot = this.getLotById(lotId);
    if (!lot) throw new Error('Lot not found');

    const updatedReserved = Math.max(0, lot.reservedQuantity - quantity);
    const updated = this.updateLot(lotId, {
      reservedQuantity: updatedReserved,
    });

    const today = new Date().toISOString().slice(0, 10);

    this.createStockMovement({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      movementType: 'released',
      quantity,
      unit: lot.unit,
      bales,
      referenceType: 'Sales Order',
      referenceNumber: orderNumber,
      date: today,
      reason,
      performedBy: currentUserName,
    });

    activitiesService.createActivity({
      companyId: lot.supplierId,
      type: 'note',
      title: `Stock Released: ${lot.lotNumber}`,
      description: `Released ${quantity.toLocaleString()} ${lot.unit} (${bales} bales) back to available pool. Reason: ${reason}.`,
      loggedBy: currentUserName,
      date: today,
    });

    return updated;
  },

  // Stock Adjustment (requires reason and CEO or Warehouse role)
  adjustStock(
    lotId: string,
    newNetWeight: number,
    newBales: number,
    reason: string,
    currentUserName: string
  ): Lot {
    const lot = this.getLotById(lotId);
    if (!lot) throw new Error('Lot not found');

    const weightDiff = newNetWeight - lot.netWeight;
    const balesDiff = newBales - lot.balesCount;
    const today = new Date().toISOString().slice(0, 10);

    const updated = this.updateLot(lotId, {
      netWeight: newNetWeight,
      balesCount: newBales,
      grossWeight: Math.max(newNetWeight, lot.grossWeight + weightDiff),
    });

    this.createStockMovement({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      movementType: 'adjusted',
      quantity: Math.abs(weightDiff),
      unit: lot.unit,
      bales: Math.abs(balesDiff),
      referenceType: 'Adjustment',
      date: today,
      reason: `${weightDiff >= 0 ? '+' : ''}${weightDiff} ${lot.unit} (${reason})`,
      performedBy: currentUserName,
    });

    activitiesService.createActivity({
      companyId: lot.supplierId,
      type: 'note',
      title: `Stock Adjusted: ${lot.lotNumber}`,
      description: `Net weight adjusted from ${lot.netWeight.toLocaleString()} ${lot.unit} to ${newNetWeight.toLocaleString()} ${lot.unit}. Reason: ${reason}.`,
      loggedBy: currentUserName,
      date: today,
    });

    return updated;
  },

  // ==========================================================================
  // Stock Movements
  // ==========================================================================
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/stock-movements
  getStockMovements(lotId?: string): StockMovement[] {
    initInventoryStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      let list: StockMovement[] = stored ? JSON.parse(stored) : [...INITIAL_STOCK_MOVEMENTS];
      if (lotId) {
        list = list.filter(m => m.lotId === lotId);
      }
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [...INITIAL_STOCK_MOVEMENTS];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/stock-movements
  createStockMovement(data: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement {
    const list = this.getStockMovements();
    const newMovement: StockMovement = {
      ...data,
      id: `sm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newMovement, ...list];
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(updated));
    return newMovement;
  },

  // ==========================================================================
  // Stock Summary (Aggregated by Product, Warehouse, Quality)
  // ==========================================================================
  getStockSummary(warehouseId?: string, categoryFilter?: ProductCategory): StockSummaryItem[] {
    const lots = this.getLots();
    const products = productsService.getProducts();
    const warehouses = this.getWarehouses();
    const settings = settingsService.getSettings();
    const defaultThresholdKg = settings.lowStockThresholdKg || 10000;

    // Filter lots if warehouse specified
    const filteredLots = warehouseId ? lots.filter(l => l.warehouseId === warehouseId) : lots;

    // Group by product
    const summaryMap = new Map<string, StockSummaryItem>();

    products.forEach(p => {
      if (categoryFilter && p.category !== categoryFilter) return;

      summaryMap.set(p.id, {
        productId: p.id,
        productName: p.name,
        category: p.category,
        unit: p.unit,
        totalNetWeight: 0,
        availableWeight: 0,
        reservedWeight: 0,
        shippedWeight: 0,
        totalBales: 0,
        availableBales: 0,
        qualityBreakdown: {
          'Pending Inspection': 0,
          Approved: 0,
          'On Hold': 0,
          Rejected: 0,
        },
        warehouseBreakdown: warehouses.map(w => ({
          warehouseId: w.id,
          warehouseName: w.name,
          availableWeight: 0,
          totalWeight: 0,
        })),
        thresholdKg: defaultThresholdKg,
        isLowStock: false,
      });
    });

    // Aggregate lots
    filteredLots.forEach(lot => {
      let item = summaryMap.get(lot.productId);
      if (!item) {
        // In case lot has a product not in active list
        const product = products.find(p => p.id === lot.productId);
        item = {
          productId: lot.productId,
          productName: lot.productName,
          category: product ? product.category : 'Other',
          unit: lot.unit,
          totalNetWeight: 0,
          availableWeight: 0,
          reservedWeight: 0,
          shippedWeight: 0,
          totalBales: 0,
          availableBales: 0,
          qualityBreakdown: {
            'Pending Inspection': 0,
            Approved: 0,
            'On Hold': 0,
            Rejected: 0,
          },
          warehouseBreakdown: warehouses.map(w => ({
            warehouseId: w.id,
            warehouseName: w.name,
            availableWeight: 0,
            totalWeight: 0,
          })),
          thresholdKg: defaultThresholdKg,
          isLowStock: false,
        };
        summaryMap.set(lot.productId, item);
      }

      const availableInLot =
        lot.qualityStatus === 'Approved'
          ? Math.max(0, lot.netWeight - lot.reservedQuantity - lot.shippedQuantity)
          : 0;

      item.totalNetWeight += lot.netWeight;
      item.reservedWeight += lot.reservedQuantity;
      item.shippedWeight += lot.shippedQuantity;
      item.availableWeight += availableInLot;
      item.totalBales += lot.balesCount;

      if (lot.netWeight > 0 && availableInLot > 0) {
        const estAvailBales = Math.round((availableInLot / lot.netWeight) * lot.balesCount);
        item.availableBales += estAvailBales;
      }

      item.qualityBreakdown[lot.qualityStatus] = (item.qualityBreakdown[lot.qualityStatus] || 0) + lot.netWeight;

      // Warehouse breakdown
      const whEntry = item.warehouseBreakdown.find(w => w.warehouseId === lot.warehouseId);
      if (whEntry) {
        whEntry.totalWeight += lot.netWeight;
        whEntry.availableWeight += availableInLot;
      }
    });

    const result = Array.from(summaryMap.values());
    result.forEach(item => {
      // Evaluate low stock (convert to kg if tons)
      const multiplier = item.unit === 'ton' ? 1000 : 1;
      const weightInKg = item.availableWeight * multiplier;
      item.isLowStock = weightInKg < item.thresholdKg;
    });

    return result.sort((a, b) => b.totalNetWeight - a.totalNetWeight);
  },

  // ==========================================================================
  // Quality Inspection
  // ==========================================================================
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/inspections
  getInspections(lotId?: string): QualityInspection[] {
    initInventoryStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      let list: QualityInspection[] = stored ? JSON.parse(stored) : [...INITIAL_INSPECTIONS];
      if (lotId) {
        list = list.filter(i => i.lotId === lotId);
      }
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [...INITIAL_INSPECTIONS];
    }
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/inspections
  createInspection(data: Omit<QualityInspection, 'id' | 'createdAt'>): QualityInspection {
    const list = this.getInspections();
    const newInspection: QualityInspection = {
      ...data,
      id: `insp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newInspection, ...list];
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(updated));

    // Update lot quality status based on inspection result
    const lot = this.getLotById(data.lotId);
    if (lot) {
      let newQualityStatus: QualityStatus = 'Approved';
      if (data.result === 'Fail') {
        newQualityStatus = 'Rejected';
      } else if (data.result === 'Conditional') {
        newQualityStatus = 'On Hold';
      }

      this.updateLot(lot.id, {
        qualityStatus: newQualityStatus,
        contaminationPercentage: data.contaminationPercentage ?? lot.contaminationPercentage,
        moisturePercentage: data.moisturePercentage ?? lot.moisturePercentage,
      });

      // Log CRM activity
      activitiesService.createActivity({
        companyId: lot.supplierId,
        type: 'meeting',
        title: `Quality Inspection ${data.result}: Lot ${lot.lotNumber}`,
        description: `Conducted by ${data.inspector}. Moisture: ${data.moisturePercentage || 'N/A'}%, Contam: ${data.contaminationPercentage || 'N/A'}%. Remarks: ${data.remarks}. Lot status moved to ${newQualityStatus}.`,
        loggedBy: data.inspector,
        date: data.date,
        outcome: data.result,
      });
    }

    return newInspection;
  },

  // ==========================================================================
  // Weight Tickets
  // ==========================================================================
  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/weight-tickets
  getWeightTickets(lotId?: string): WeightTicket[] {
    initInventoryStorage();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WEIGHT_TICKETS);
      let list: WeightTicket[] = stored ? JSON.parse(stored) : [...INITIAL_WEIGHT_TICKETS];
      if (lotId) {
        list = list.filter(w => w.lotId === lotId);
      }
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return [...INITIAL_WEIGHT_TICKETS];
    }
  },

  generateNextTicketNumber(): string {
    const settings = settingsService.getSettings();
    const prefix = settings.weightTicketPrefix || 'WT-';
    const year = new Date().getFullYear();
    const tickets = this.getWeightTickets();

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}${year}-(\\d{4})`);
    tickets.forEach(t => {
      const match = t.ticketNumber.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const next = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${year}-${next}`;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/weight-tickets
  createWeightTicket(data: Omit<WeightTicket, 'id' | 'ticketNumber' | 'createdAt'>): WeightTicket {
    const list = this.getWeightTickets();
    const ticketNumber = this.generateNextTicketNumber();
    const newTicket: WeightTicket = {
      ...data,
      id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ticketNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTicket, ...list];
    localStorage.setItem(STORAGE_KEYS.WEIGHT_TICKETS, JSON.stringify(updated));
    return newTicket;
  },

  // Update lot's received net weight from weight ticket
  applyTicketToLot(ticketId: string, currentUserName: string): { ticket: WeightTicket; lot: Lot } {
    const tickets = this.getWeightTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error('Weight ticket not found');

    const lot = this.getLotById(ticket.lotId);
    if (!lot) throw new Error('Lot not found');

    const previousNet = lot.netWeight;
    const updatedLot = this.updateLot(lot.id, {
      netWeight: ticket.netWeight,
      grossWeight: Math.max(ticket.grossWeight, ticket.netWeight),
    });

    // Mark ticket as applied
    ticket.appliedToLot = true;
    localStorage.setItem(STORAGE_KEYS.WEIGHT_TICKETS, JSON.stringify(tickets));

    // Log movement adjustment
    const diff = ticket.netWeight - previousNet;
    const today = new Date().toISOString().slice(0, 10);

    this.createStockMovement({
      lotId: lot.id,
      lotNumber: lot.lotNumber,
      movementType: 'adjusted',
      quantity: Math.abs(diff),
      unit: lot.unit,
      referenceType: 'Weight Ticket',
      referenceId: ticket.id,
      referenceNumber: ticket.ticketNumber,
      date: today,
      reason: `Net weight calibrated to Weighbridge Ticket ${ticket.ticketNumber} (${diff >= 0 ? '+' : ''}${diff} ${lot.unit})`,
      performedBy: currentUserName,
    });

    // Log CRM activity
    activitiesService.createActivity({
      companyId: lot.supplierId,
      type: 'note',
      title: `Weight Ticket Applied: ${ticket.ticketNumber} on Lot ${lot.lotNumber}`,
      description: `Verified weighbridge ticket applied. Net weight: ${ticket.netWeight.toLocaleString()} ${lot.unit}. Vehicle: ${ticket.vehicleNumber}. Weighbridge: ${ticket.weighbridgeName}.`,
      loggedBy: currentUserName,
      date: today,
    });

    return { ticket, lot: updatedLot };
  },

  // CSV Export
  exportStockSummaryToCSV(summary: StockSummaryItem[]): void {
    const headers = [
      'Product Name',
      'Category',
      'Unit',
      'Total Net Stock',
      'Available Stock',
      'Reserved Stock',
      'Shipped Stock',
      'Total Bales',
      'Approved (kg)',
      'Pending Inspection (kg)',
      'On Hold (kg)',
      'Rejected (kg)',
      'Low Stock Alert',
    ];

    const rows = summary.map(s => [
      `"${s.productName.replace(/"/g, '""')}"`,
      s.category,
      s.unit,
      s.totalNetWeight,
      s.availableWeight,
      s.reservedWeight,
      s.shippedWeight,
      s.totalBales,
      s.qualityBreakdown.Approved || 0,
      s.qualityBreakdown['Pending Inspection'] || 0,
      s.qualityBreakdown['On Hold'] || 0,
      s.qualityBreakdown.Rejected || 0,
      s.isLowStock ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TexTrade_Stock_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportLotsToCSV(lots: Lot[]): void {
    const warehouses = this.getWarehouses();
    const whMap = new Map(warehouses.map(w => [w.id, w.name]));

    const headers = [
      'Lot Number',
      'Product Name',
      'Warehouse',
      'Location / Bay',
      'Bales',
      'Gross Weight',
      'Net Weight',
      'Reserved Weight',
      'Shipped Weight',
      'Available Weight',
      'Unit',
      'Grade',
      'Color',
      'Quality Status',
      'Received Date',
      'Moisture %',
      'Contamination %',
      'Yarn Count',
    ];

    const rows = lots.map(l => {
      const avail = l.qualityStatus === 'Approved' ? Math.max(0, l.netWeight - l.reservedQuantity - l.shippedQuantity) : 0;
      return [
        l.lotNumber,
        `"${l.productName.replace(/"/g, '""')}"`,
        `"${(whMap.get(l.warehouseId) || l.warehouseId).replace(/"/g, '""')}"`,
        `"${l.storageLocation.replace(/"/g, '""')}"`,
        l.balesCount,
        l.grossWeight,
        l.netWeight,
        l.reservedQuantity,
        l.shippedQuantity,
        avail,
        l.unit,
        `"${l.grade.replace(/"/g, '""')}"`,
        `"${l.color.replace(/"/g, '""')}"`,
        l.qualityStatus,
        l.receivedDate,
        l.moisturePercentage ?? '',
        l.contaminationPercentage ?? '',
        l.yarnCount ?? '',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TexTrade_Inventory_Lots_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
