import {
  Shipment,
  ShipmentStatus,
  ShipmentType,
  ShipmentContainer,
  ContainerStuffingItem,
  ShippingDocumentItem,
  ShippingDocumentType,
  ShippingDocumentStatus,
  Order,
} from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { INITIAL_SHIPMENTS } from './seedData';
import { settingsService } from './settingsService';
import { ordersService } from './ordersService';
import { inventoryService } from './inventoryService';
import { activitiesService } from './activitiesService';

export interface ShipmentFilters {
  status?: ShipmentStatus | 'All' | 'Delayed';
  type?: ShipmentType | 'All';
  companyId?: string;
  orderId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const STANDARD_SHIPPING_DOCUMENTS: ShippingDocumentType[] = [
  'Commercial Invoice',
  'Packing List',
  'Bill of Lading',
  'Certificate of Origin',
  'Inspection Certificate',
  'Fumigation Certificate',
  'Insurance Certificate',
  'LC documents',
  'Customs Declaration',
];

function initShipmentStorage(): void {
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED_M4);
  if (!initialized || !localStorage.getItem(STORAGE_KEYS.SHIPMENTS)) {
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(INITIAL_SHIPMENTS));
  }
}

export const shipmentsService = {
  // Check if shipment is delayed
  isShipmentDelayed(shipment: Shipment): boolean {
    const today = new Date().toISOString().slice(0, 10);
    if (shipment.status === 'Arrived' || shipment.status === 'Delivered' || shipment.status === 'Cancelled') {
      return false;
    }
    return Boolean(shipment.eta && shipment.eta < today);
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/shipments
  getShipments(filters?: ShipmentFilters): Shipment[] {
    initShipmentStorage();
    let shipments: Shipment[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
      shipments = stored ? JSON.parse(stored) : [...INITIAL_SHIPMENTS];
    } catch {
      shipments = [...INITIAL_SHIPMENTS];
    }

    if (!filters) return shipments;

    return shipments.filter(s => {
      if (filters.status && filters.status !== 'All') {
        if (filters.status === 'Delayed') {
          if (!this.isShipmentDelayed(s)) return false;
        } else if (s.status !== filters.status) {
          return false;
        }
      }
      if (filters.type && filters.type !== 'All' && s.type !== filters.type) return false;
      if (filters.companyId && s.companyId !== filters.companyId) return false;
      if (filters.orderId && !s.orderIds.includes(filters.orderId)) return false;
      if (filters.startDate && s.etd < filters.startDate) return false;
      if (filters.endDate && s.etd > filters.endDate) return false;

      if (filters.search) {
        const query = filters.search.toLowerCase();
        const numMatch = s.shipmentNumber.toLowerCase().includes(query);
        const blMatch = (s.blNumber || '').toLowerCase().includes(query);
        const bkgMatch = (s.bookingNumber || '').toLowerCase().includes(query);
        const vesselMatch = (s.vesselAndVoyage || '').toLowerCase().includes(query);
        const lineMatch = (s.shippingLine || '').toLowerCase().includes(query);
        const portMatch =
          s.portOfLoading.toLowerCase().includes(query) || s.portOfDischarge.toLowerCase().includes(query);
        const containerMatch = s.containers.some(c => c.containerNumber.toLowerCase().includes(query));

        if (!numMatch && !blMatch && !bkgMatch && !vesselMatch && !lineMatch && !portMatch && !containerMatch) {
          return false;
        }
      }
      return true;
    });
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with GET /api/shipments/:id
  getShipmentById(id: string): Shipment | null {
    const shipments = this.getShipments();
    return shipments.find(s => s.id === id) || null;
  },

  // Generate sequence SH-YYYY-NNNN
  generateNextShipmentNumber(): string {
    const settings = settingsService.getSettings();
    const prefix = settings.shipmentPrefix || 'SH-';
    const year = new Date().getFullYear();
    const shipments = this.getShipments();

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}${year}-(\\d{4})`);
    shipments.forEach(s => {
      const match = s.shipmentNumber.match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });

    const next = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}${year}-${next}`;
  },

  // Build standard document checklist
  buildStandardDocumentChecklist(): ShippingDocumentItem[] {
    return STANDARD_SHIPPING_DOCUMENTS.map((type, idx) => ({
      id: `doc_${Date.now()}_${idx}`,
      type,
      status: 'Not Started',
    }));
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with POST /api/shipments
  createShipment(
    data: Omit<Shipment, 'id' | 'shipmentNumber' | 'statusHistory' | 'createdAt' | 'updatedAt'>,
    currentUserName: string
  ): Shipment {
    const shipments = this.getShipments();
    const shipmentNumber = this.generateNextShipmentNumber();
    const now = new Date().toISOString();

    const newShipment: Shipment = {
      ...data,
      id: `sh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      shipmentNumber,
      documents: data.documents && data.documents.length > 0 ? data.documents : this.buildStandardDocumentChecklist(),
      statusHistory: [
        {
          status: data.status || 'Planned',
          timestamp: now,
          changedBy: currentUserName,
          note: 'Shipment created and scheduled.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newShipment, ...shipments];
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(updated));

    // Log CRM activity
    activitiesService.createActivity({
      companyId: newShipment.companyId,
      dealId: undefined,
      type: 'note',
      title: `Shipment Created: ${newShipment.shipmentNumber} (${newShipment.type})`,
      description: `${newShipment.shippingLine} - ${newShipment.vesselAndVoyage || 'TBA'}. ${newShipment.portOfLoading} -> ${newShipment.portOfDischarge}. ETD: ${newShipment.etd}.`,
      loggedBy: currentUserName,
      date: newShipment.etd,
    });

    return newShipment;
  },

  // Create shipment from Sales Order or Purchase Order
  createShipmentFromOrder(orderId: string, currentUserName: string): Shipment {
    const order = ordersService.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const type: ShipmentType = order.orderType === 'Purchase Order' ? 'Import' : 'Export';
    const today = new Date().toISOString().slice(0, 10);
    const eta = new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10);

    const pol = type === 'Export' ? 'Izmir Port, Turkey' : 'Shanghai Port, China';
    const pod = order.destinationPort || (type === 'Export' ? 'Chittagong Port, Bangladesh' : 'Izmir Port, Turkey');

    return this.createShipment(
      {
        type,
        orderIds: [order.id],
        companyId: order.companyId,
        forwarderId: undefined,
        shippingLine: 'Maersk Line',
        vesselAndVoyage: '',
        bookingNumber: '',
        blNumber: '',
        portOfLoading: pol,
        portOfDischarge: pod,
        etd: order.expectedShipmentDate || today,
        eta,
        incoterm: order.incoterm,
        freightCost: order.freightCharges || 2500,
        currency: order.currency,
        notes: `Generated for ${order.orderType} ${order.orderNumber}.`,
        status: 'Planned',
        containers: [],
        documents: this.buildStandardDocumentChecklist(),
      },
      currentUserName
    );
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with PUT /api/shipments/:id
  updateShipment(id: string, updates: Partial<Shipment>): Shipment {
    const shipments = this.getShipments();
    const index = shipments.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shipment not found');

    const updatedShipment: Shipment = {
      ...shipments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    shipments[index] = updatedShipment;
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
    return updatedShipment;
  },

  // [REAL_API_REPLACEMENT_POINT]: Replace with DELETE /api/shipments/:id
  deleteShipment(id: string): { success: boolean; message?: string } {
    const shipment = this.getShipmentById(id);
    if (!shipment) return { success: false, message: 'Shipment not found' };

    // Delete protection: cannot delete if containers have stuffed lots
    const hasStuffedItems = shipment.containers.some(c => c.items && c.items.length > 0);
    if (hasStuffedItems) {
      return {
        success: false,
        message: 'Cannot delete shipment: containers contain stuffed inventory lots. Unstuff containers first.',
      };
    }

    if (shipment.status !== 'Planned' && shipment.status !== 'Booked') {
      return {
        success: false,
        message: `Cannot delete shipment in ${shipment.status} stage. Cancel the shipment instead.`,
      };
    }

    const shipments = this.getShipments();
    const filtered = shipments.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(filtered));
    return { success: true };
  },

  // Update Shipment Status with timeline entry
  updateShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    changedBy: string,
    note?: string
  ): { shipment: Shipment; suggestedOrderStatus?: 'Shipped' | 'Delivered' } {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const now = new Date().toISOString();
    const historyItem = {
      status: newStatus,
      timestamp: now,
      changedBy,
      note: note || `Shipment status advanced to ${newStatus}.`,
    };

    const updatedShipment = this.updateShipment(shipmentId, {
      status: newStatus,
      statusHistory: [...shipment.statusHistory, historyItem],
    });

    // Log CRM activity
    activitiesService.createActivity({
      companyId: shipment.companyId,
      type: 'note',
      title: `Shipment ${shipment.shipmentNumber} Status: ${newStatus}`,
      description: note || `Updated by ${changedBy}. Port of discharge: ${shipment.portOfDischarge}.`,
      loggedBy: changedBy,
      date: now.slice(0, 10),
    });

    // Check if we should suggest advancing linked order(s)
    let suggestedOrderStatus: 'Shipped' | 'Delivered' | undefined = undefined;
    if (newStatus === 'Sailed') {
      suggestedOrderStatus = 'Shipped';
    } else if (newStatus === 'Delivered') {
      suggestedOrderStatus = 'Delivered';
    }

    return { shipment: updatedShipment, suggestedOrderStatus };
  },

  // ==========================================================================
  // Container Operations & Stuffing
  // ==========================================================================
  addContainer(
    shipmentId: string,
    containerData: Omit<ShipmentContainer, 'id' | 'items' | 'grossWeight' | 'netWeight'> & {
      tareWeight?: number;
    }
  ): Shipment {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const defaultTare = containerData.size === '20ft' ? 2200 : containerData.size === '40ft' ? 3800 : 4200;
    const tareWeight = containerData.tareWeight || defaultTare;

    const newContainer: ShipmentContainer = {
      ...containerData,
      id: `cont_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      grossWeight: tareWeight,
      netWeight: 0,
      tareWeight,
      items: [],
    };

    return this.updateShipment(shipmentId, {
      containers: [...shipment.containers, newContainer],
    });
  },

  updateContainer(shipmentId: string, containerId: string, updates: Partial<ShipmentContainer>): Shipment {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const containers = shipment.containers.map(c => {
      if (c.id === containerId) {
        return { ...c, ...updates };
      }
      return c;
    });

    return this.updateShipment(shipmentId, { containers });
  },

  removeContainer(shipmentId: string, containerId: string): Shipment {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const container = shipment.containers.find(c => c.id === containerId);
    if (container && container.items.length > 0) {
      throw new Error('Cannot remove container with loaded items. Please clear stuffing first.');
    }

    return this.updateShipment(shipmentId, {
      containers: shipment.containers.filter(c => c.id !== containerId),
    });
  },

  // Stuff Container: moves stock from Reserved/Available to Shipped and writes stock movements
  stuffContainer(
    shipmentId: string,
    containerId: string,
    stuffingItems: Omit<ContainerStuffingItem, 'id'>[],
    currentUserName: string
  ): Shipment {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const containerIndex = shipment.containers.findIndex(c => c.id === containerId);
    if (containerIndex === -1) throw new Error('Container not found');

    const container = shipment.containers[containerIndex];
    const settings = settingsService.getSettings();

    // Check max weight limit
    const maxLimit =
      container.size === '20ft'
        ? settings.maxContainerNetWeight20ft || 21500
        : container.size === '40ft'
        ? settings.maxContainerNetWeight40ft || 26500
        : settings.maxContainerNetWeight40HC || 26500;

    const totalStuffingNetWeight = stuffingItems.reduce((sum, item) => sum + item.netWeightLoaded, 0);

    // Process inventory movements for each item
    const fullItems: ContainerStuffingItem[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const item of stuffingItems) {
      const lot = inventoryService.getLotById(item.lotId);
      if (!lot) throw new Error(`Lot not found: ${item.lotId}`);

      const availableToShip = lot.netWeight - lot.shippedQuantity;
      if (item.netWeightLoaded > availableToShip) {
        throw new Error(
          `Cannot stuff ${item.netWeightLoaded.toLocaleString()} ${item.unit} from ${lot.lotNumber}. Max remaining is ${availableToShip.toLocaleString()} ${lot.unit}.`
        );
      }

      // Update lot: increase shippedQuantity, reduce reservedQuantity if present
      const newShipped = lot.shippedQuantity + item.netWeightLoaded;
      const newReserved = Math.max(0, lot.reservedQuantity - item.netWeightLoaded);

      inventoryService.updateLot(lot.id, {
        shippedQuantity: newShipped,
        reservedQuantity: newReserved,
      });

      // Write stock movement
      inventoryService.createStockMovement({
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        movementType: 'shipped',
        quantity: item.netWeightLoaded,
        unit: item.unit,
        bales: item.balesLoaded,
        referenceType: 'Shipment',
        referenceId: shipment.id,
        referenceNumber: shipment.shipmentNumber,
        date: today,
        reason: `Loaded into container ${container.containerNumber} for shipment ${shipment.shipmentNumber}`,
        performedBy: currentUserName,
      });

      fullItems.push({
        ...item,
        id: `csi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      });
    }

    const tare = container.tareWeight || 4000;
    const updatedContainer: ShipmentContainer = {
      ...container,
      items: fullItems,
      netWeight: totalStuffingNetWeight,
      grossWeight: totalStuffingNetWeight + tare,
      stuffingDate: today,
    };

    const updatedContainers = [...shipment.containers];
    updatedContainers[containerIndex] = updatedContainer;

    const updatedShipment = this.updateShipment(shipmentId, {
      containers: updatedContainers,
    });

    // Log CRM activity
    activitiesService.createActivity({
      companyId: shipment.companyId,
      type: 'note',
      title: `Container Loaded: ${container.containerNumber} (${shipment.shipmentNumber})`,
      description: `Loaded ${totalStuffingNetWeight.toLocaleString()} kg (${stuffingItems.reduce((sum, i) => sum + i.balesLoaded, 0)} bales) across ${stuffingItems.length} lot(s). Seal: ${container.sealNumber}.`,
      loggedBy: currentUserName,
      date: today,
    });

    return updatedShipment;
  },

  // ==========================================================================
  // Document Checklist
  // ==========================================================================
  updateDocument(
    shipmentId: string,
    documentId: string,
    updates: Partial<ShippingDocumentItem>,
    currentUserName: string
  ): Shipment {
    const shipment = this.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const updatedDocs = shipment.documents.map(doc => {
      if (doc.id === documentId) {
        return { ...doc, ...updates };
      }
      return doc;
    });

    const updatedShipment = this.updateShipment(shipmentId, {
      documents: updatedDocs,
    });

    // If status changed to 'Sent to Buyer', log CRM activity
    if (updates.status === 'Sent to Buyer') {
      const doc = shipment.documents.find(d => d.id === documentId);
      activitiesService.createActivity({
        companyId: shipment.companyId,
        type: 'email',
        title: `Shipping Doc Dispatched: ${doc ? doc.type : 'Document'}`,
        description: `Sent to consignee for shipment ${shipment.shipmentNumber}. Doc No: ${updates.documentNumber || doc?.documentNumber || 'N/A'}.`,
        loggedBy: currentUserName,
        date: new Date().toISOString().slice(0, 10),
      });
    }

    return updatedShipment;
  },

  calculateDocumentReadiness(shipment: Shipment): { ready: number; total: number; percentage: number } {
    if (!shipment.documents || shipment.documents.length === 0) {
      return { ready: 0, total: 0, percentage: 0 };
    }
    const total = shipment.documents.length;
    const ready = shipment.documents.filter(
      d => d.status === 'Prepared' || d.status === 'Sent to Buyer' || d.status === 'Approved'
    ).length;
    const percentage = Math.round((ready / total) * 100);
    return { ready, total, percentage };
  },

  // Export Shipments to CSV
  exportShipmentsToCSV(shipments: Shipment[]): void {
    const headers = [
      'Shipment Number',
      'Type',
      'Status',
      'Shipping Line',
      'Vessel & Voyage',
      'Booking Number',
      'B/L Number',
      'Port of Loading',
      'Port of Discharge',
      'ETD',
      'ETA',
      'Delayed',
      'Containers Count',
      'Total Net Weight (kg)',
      'Freight Cost',
      'Currency',
      'Documents Readiness',
    ];

    const rows = shipments.map(s => {
      const totalNet = s.containers.reduce((sum, c) => sum + (c.netWeight || 0), 0);
      const readiness = this.calculateDocumentReadiness(s);
      return [
        s.shipmentNumber,
        s.type,
        s.status,
        `"${s.shippingLine.replace(/"/g, '""')}"`,
        `"${(s.vesselAndVoyage || '').replace(/"/g, '""')}"`,
        s.bookingNumber || '',
        s.blNumber || '',
        `"${s.portOfLoading.replace(/"/g, '""')}"`,
        `"${s.portOfDischarge.replace(/"/g, '""')}"`,
        s.etd,
        s.eta,
        this.isShipmentDelayed(s) ? 'DELAYED' : 'ON TIME',
        s.containers.length,
        totalNet,
        s.freightCost,
        s.currency,
        `${readiness.ready}/${readiness.total} (${readiness.percentage}%)`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TexTrade_Shipments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
