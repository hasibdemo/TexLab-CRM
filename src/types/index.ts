export type UserRole = 'CEO' | 'Sales' | 'Procurement' | 'Accounts' | 'Warehouse';

export type NavPage =
  | 'dashboard'
  | 'companies'
  | 'company-detail'
  | 'contacts'
  | 'products'
  | 'deals'
  | 'deal-detail'
  | 'quotes'
  | 'orders'
  | 'order-detail'
  | 'payments'
  | 'inventory'
  | 'shipments'
  | 'shipment-detail'
  | 'settings'
  | 'activities';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  accessiblePages: (
    | 'dashboard'
    | 'companies'
    | 'contacts'
    | 'products'
    | 'deals'
    | 'quotes'
    | 'orders'
    | 'payments'
    | 'inventory'
    | 'shipments'
    | 'settings'
    | 'activities'
  )[];
}

export type CompanyType = 'Buyer' | 'Supplier' | 'Agent' | 'Freight Forwarder';
export type CompanyStatus = 'Lead' | 'Active' | 'Inactive';
export type CurrencyCode = 'USD' | 'EUR' | 'TRY' | 'INR' | 'CNY' | 'AED' | 'GBP';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  country: string;
  city: string;
  address: string;
  website: string;
  currency: CurrencyCode;
  paymentTerms: string;
  productsOfInterest: string[];
  assignedOwner: string;
  status: CompanyStatus;
  notes: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note';

export interface Activity {
  id: string;
  companyId: string;
  contactId?: string;
  dealId?: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string; // ISO string
  loggedBy: string;
  outcome?: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

// Milestone 2: Product Catalog Types
export type ProductCategory = 'Waste Cloth' | 'Yarn' | 'Fiber' | 'Other';
export type ProductUnit = 'kg' | 'ton' | 'bale' | 'container';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  materialComposition: string; // e.g. '100% Cotton', '65/35 Poly-Cotton'
  grade: string; // e.g. 'Grade A', 'Prime Comber', 'Commercial'
  color: string; // e.g. 'Bleached White', 'Raw Ecru', 'Dark Blue Denim'
  originCountry: string;
  unit: ProductUnit;
  typicalBaleWeight: number; // in kg
  defaultPricePerUnit: number;
  currency: CurrencyCode;
  hsCode: string; // Harmonized Tariff Code e.g. '5202.99.00'
  notes: string;
  status: 'Active' | 'Inactive';
  // Yarn-specific fields
  yarnCount?: string; // e.g. 'Ne 20/1', 'Ne 10/1 OE', 'Nm 28/2'
  yarnPly?: string; // e.g. 'Single', '2-ply', '3-ply'
  spinningType?: string; // e.g. 'Ring Spun', 'Open End (Rotor)', 'Vortex'
  // Waste-cloth-specific fields
  wasteType?: string; // e.g. 'Pre-consumer', 'Post-consumer', 'Cutting Clips'
  cleanlinessLevel?: string; // e.g. 'Sorted 100% Cotton / Zero Lycra', 'Low Contamination'
  createdAt: string;
  updatedAt: string;
}

// Milestone 2: Deals Pipeline Types
export type DealStage =
  | 'New Inquiry'
  | 'Sample Sent'
  | 'Quote Sent'
  | 'Negotiation'
  | 'Order Confirmed'
  | 'Lost';

export type DealType = 'Sale' | 'Purchase';
export type Incoterm = 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DAP';

export interface DealStageHistoryItem {
  stage: DealStage;
  timestamp: string;
  changedBy: string;
  note?: string;
}

export interface Deal {
  id: string;
  title: string;
  companyId: string;
  contactId?: string;
  dealType: DealType;
  productId?: string;
  quantity: number;
  unit: ProductUnit;
  pricePerUnit: number;
  currency: CurrencyCode;
  totalValue: number; // calculated: quantity * pricePerUnit
  expectedCloseDate: string; // ISO date YYYY-MM-DD
  stage: DealStage;
  paymentTerms: string;
  incoterm: Incoterm;
  destinationPort: string;
  owner: string; // Staff member name
  probability: number; // 0 - 100
  notes: string;
  lostReason?: string;
  stageHistory: DealStageHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

// Milestone 3: Quotations / Proforma Invoices
export type QuoteType = 'Quotation' | 'Proforma Invoice';
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface QuoteLineItem {
  id: string;
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  quoteNumber: string; // e.g. 'QT-2026-0001', 'QT-2026-0001-v2'
  version: number;
  parentQuoteId?: string;
  dealId?: string;
  companyId: string;
  contactId?: string;
  type: QuoteType;
  date: string; // YYYY-MM-DD
  validityDate: string; // YYYY-MM-DD
  currency: CurrencyCode;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discount: number;
  freightCharges: number;
  total: number;
  incoterm: Incoterm;
  portOfLoading: string;
  portOfDestination: string;
  paymentTerms: string;
  deliveryTime: string;
  bankDetails: string;
  notesAndTerms: string;
  status: QuoteStatus;
  convertedToOrderId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Milestone 3: Orders (Sales and Purchase)
export type OrderType = 'Sales Order' | 'Purchase Order';
export type OrderStatus =
  | 'Confirmed'
  | 'In Production/Preparation'
  | 'Ready to Ship'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  changedBy: string;
  note?: string;
  cancelReason?: string;
}

export interface OrderAttachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface OrderLineItem {
  id: string;
  productId?: string;
  productName: string;
  description: string;
  quantity: number;
  unit: ProductUnit;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // SO-2026-0001 or PO-2026-0001
  orderType: OrderType;
  dealId?: string;
  quoteId?: string;
  companyId: string;
  contactId?: string;
  lineItems: OrderLineItem[];
  currency: CurrencyCode;
  subtotal: number;
  discount: number;
  freightCharges: number;
  total: number;
  incoterm: Incoterm;
  paymentTerms: string;
  orderDate: string;
  expectedShipmentDate: string;
  destinationPort: string;
  owner: string;
  status: OrderStatus;
  notes: string;
  cancelReason?: string;
  statusHistory: OrderStatusHistoryItem[];
  attachments: OrderAttachment[];
  createdAt: string;
  updatedAt: string;
}

// Milestone 3: Payments
export type PaymentMethod = 'TT' | 'LC at sight' | 'Usance LC' | 'CAD' | 'Cash';
export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface PaymentMilestone {
  id: string;
  orderId: string;
  name: string; // e.g. "Advance (30%)", "Against Documents (70%)", "Balance"
  percentage?: number;
  amount: number;
  currency: CurrencyCode;
  dueDate: string; // YYYY-MM-DD
  method: PaymentMethod;
  status: PaymentStatus;
  paidAmount: number;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  milestoneId: string;
  orderId: string;
  amount: number;
  currency: CurrencyCode;
  paymentDate: string; // YYYY-MM-DD
  referenceNumber: string; // e.g. Swift TXN, UTR, Check No
  method: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// Milestone 3 & 4: Company Settings (singleton)
export interface CompanySettings {
  companyName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  postalCode: string;
  taxId: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankAddress: string;
  accountName: string;
  iban: string;
  swiftBic: string;
  quotePrefix: string;
  salesOrderPrefix: string;
  purchaseOrderPrefix: string;
  defaultCurrency: CurrencyCode;
  exchangeRates: Record<CurrencyCode, number>;
  defaultPaymentTerms: string;
  defaultIncoterm: Incoterm;
  defaultQuoteValidityDays: number;
  standardQuoteTerms: string;
  logoUrl?: string;
  // Milestone 4 Settings
  maxContainerNetWeight20ft?: number; // default: 21500 kg
  maxContainerNetWeight40ft?: number; // default: 26500 kg
  maxContainerNetWeight40HC?: number; // default: 26500 kg
  lowStockThresholdKg?: number; // default: 10000 kg (10 tons)
  shipmentPrefix?: string; // default: SH-
  lotPrefix?: string; // default: LOT-
  weightTicketPrefix?: string; // default: WT-
}

// Milestone 4: Warehouse and Inventory
export interface Warehouse {
  id: string;
  name: string;
  location: string;
  country: string;
  capacity: string;
  manager: string;
  createdAt: string;
}

export type QualityStatus = 'Pending Inspection' | 'Approved' | 'Rejected' | 'On Hold';

export interface Lot {
  id: string;
  lotNumber: string; // LOT-2026-0001
  productId: string;
  productName: string;
  supplierId: string;
  linkedPurchaseOrderId?: string;
  receivedDate: string; // YYYY-MM-DD
  warehouseId: string;
  balesCount: number;
  grossWeight: number;
  netWeight: number;
  reservedQuantity: number;
  shippedQuantity: number;
  unit: ProductUnit;
  grade: string;
  color: string;
  qualityStatus: QualityStatus;
  storageLocation: string; // e.g. Rack A-12
  notes?: string;
  // Yarn specific
  yarnCount?: string;
  yarnPly?: string;
  conesOrCartons?: number;
  // Waste cloth specific
  contaminationPercentage?: number;
  moisturePercentage?: number;
  baleWeightRange?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'received' | 'reserved' | 'released' | 'shipped' | 'adjusted';

export interface StockMovement {
  id: string;
  lotId: string;
  lotNumber: string;
  movementType: StockMovementType;
  quantity: number;
  unit: ProductUnit;
  bales?: number;
  referenceType?: 'Purchase Order' | 'Sales Order' | 'Shipment' | 'Inspection' | 'Adjustment' | 'Weight Ticket';
  referenceId?: string;
  referenceNumber?: string;
  date: string;
  reason: string;
  performedBy: string;
  createdAt: string;
}

// Milestone 4: Quality Inspection
export type InspectionResult = 'Pass' | 'Fail' | 'Conditional';

export interface QualityInspection {
  id: string;
  lotId: string;
  lotNumber: string;
  date: string; // YYYY-MM-DD
  inspector: string;
  moisturePercentage?: number;
  contaminationPercentage?: number;
  weightCheckKg?: number;
  colorMatch?: string;
  yarnCountStrengthTest?: string;
  result: InspectionResult;
  photos: string[]; // file names placeholder
  remarks: string;
  createdAt: string;
}

// Milestone 4: Weight Tickets
export interface WeightTicket {
  id: string;
  ticketNumber: string; // WT-2026-0001
  date: string;
  lotId: string;
  lotNumber: string;
  vehicleNumber: string;
  driverName: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  unit: ProductUnit;
  weighbridgeName: string;
  remarks?: string;
  appliedToLot?: boolean;
  createdAt: string;
}

// Milestone 4: Shipments and Containers
export type ShipmentType = 'Export' | 'Import';

export type ShipmentStatus =
  | 'Planned'
  | 'Booked'
  | 'Stuffing'
  | 'Loaded'
  | 'Sailed'
  | 'In Transit'
  | 'Arrived'
  | 'Customs Clearance'
  | 'Delivered'
  | 'Cancelled';

export type ContainerSize = '20ft' | '40ft' | '40HC';

export interface ContainerStuffingItem {
  id: string;
  lotId: string;
  lotNumber: string;
  productName: string;
  balesLoaded: number;
  netWeightLoaded: number;
  unit: ProductUnit;
}

export interface ShipmentContainer {
  id: string;
  containerNumber: string;
  size: ContainerSize;
  sealNumber: string;
  stuffingDate?: string;
  grossWeight: number;
  netWeight: number;
  tareWeight?: number;
  items: ContainerStuffingItem[];
}

export interface ShipmentStatusHistoryItem {
  status: ShipmentStatus;
  timestamp: string;
  changedBy: string;
  note?: string;
}

export type ShippingDocumentType =
  | 'Commercial Invoice'
  | 'Packing List'
  | 'Bill of Lading'
  | 'Certificate of Origin'
  | 'Inspection Certificate'
  | 'Fumigation Certificate'
  | 'Insurance Certificate'
  | 'LC documents'
  | 'Customs Declaration'
  | 'Other';

export type ShippingDocumentStatus =
  | 'Not Started'
  | 'Prepared'
  | 'Sent to Buyer'
  | 'Received'
  | 'Approved';

export interface ShippingDocumentItem {
  id: string;
  type: ShippingDocumentType;
  status: ShippingDocumentStatus;
  documentNumber?: string;
  date?: string;
  notes?: string;
  fileName?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string; // SH-2026-0001
  type: ShipmentType;
  orderIds: string[]; // Linked sales or purchase order IDs
  companyId: string; // Buyer (Export) or Supplier (Import)
  forwarderId?: string; // Company of type 'Freight Forwarder'
  shippingLine: string;
  vesselAndVoyage: string;
  bookingNumber: string;
  blNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
  etd: string; // YYYY-MM-DD
  eta: string; // YYYY-MM-DD
  incoterm: Incoterm;
  freightCost: number;
  currency: CurrencyCode;
  notes?: string;
  status: ShipmentStatus;
  statusHistory: ShipmentStatusHistoryItem[];
  containers: ShipmentContainer[];
  documents: ShippingDocumentItem[];
  createdAt: string;
  updatedAt: string;
}

