import React, { useState, useEffect } from 'react';
import { Order, OrderType, OrderStatus, OrderLineItem, CurrencyCode, Incoterm, ProductUnit, Contact } from '../../types';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { productsService } from '../../services/productsService';
import { dealsService } from '../../services/dealsService';
import { quotesService } from '../../services/quotesService';
import { ordersService } from '../../services/ordersService';
import { settingsService } from '../../services/settingsService';
import Modal from '../common/Modal';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Order) => void;
  orderToEdit?: Order | null;
  initialDealId?: string;
  initialQuoteId?: string;
  initialCompanyId?: string;
  initialOrderType?: OrderType;
  currentUserName: string;
  canViewPrices?: boolean;
}

export default function OrderFormModal({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  initialDealId,
  initialQuoteId,
  initialCompanyId,
  initialOrderType,
  currentUserName,
  canViewPrices = true,
}: OrderFormModalProps) {
  const companies = companiesService.getCompanies();
  const products = productsService.getProducts({ status: 'Active' });
  const settings = settingsService.getSettings();

  const [orderType, setOrderType] = useState<OrderType>(
    orderToEdit?.orderType || initialOrderType || 'Sales Order'
  );
  const [companyId, setCompanyId] = useState(orderToEdit?.companyId || initialCompanyId || '');
  const [contactId, setContactId] = useState(orderToEdit?.contactId || '');
  const [dealId, setDealId] = useState(orderToEdit?.dealId || initialDealId || '');
  const [quoteId, setQuoteId] = useState(orderToEdit?.quoteId || initialQuoteId || '');

  const [orderDate, setOrderDate] = useState(
    orderToEdit?.orderDate || new Date().toISOString().slice(0, 10)
  );
  const [expectedShipmentDate, setExpectedShipmentDate] = useState(
    orderToEdit?.expectedShipmentDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  const [currency, setCurrency] = useState<CurrencyCode>(orderToEdit?.currency || 'USD');
  const [incoterm, setIncoterm] = useState<Incoterm>(
    orderToEdit?.incoterm || settings.defaultIncoterm || 'CIF'
  );
  const [destinationPort, setDestinationPort] = useState(orderToEdit?.destinationPort || '');
  const [paymentTerms, setPaymentTerms] = useState(
    orderToEdit?.paymentTerms || settings.defaultPaymentTerms
  );
  const [owner, setOwner] = useState(orderToEdit?.owner || currentUserName);
  const [status, setStatus] = useState<OrderStatus>(orderToEdit?.status || 'Confirmed');
  const [notes, setNotes] = useState(orderToEdit?.notes || '');

  const [discount, setDiscount] = useState<number>(orderToEdit?.discount || 0);
  const [freightCharges, setFreightCharges] = useState<number>(orderToEdit?.freightCharges || 0);

  const [lineItems, setLineItems] = useState<OrderLineItem[]>(
    orderToEdit?.lineItems || [
      {
        id: `oli_${Date.now()}`,
        productId: '',
        productName: '',
        description: '',
        quantity: 20,
        unit: 'ton',
        unitPrice: 1000,
        lineTotal: 20000,
      },
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableContacts = companyId ? contactsService.getContacts(companyId) : [];
  const availableDeals = companyId ? dealsService.getDeals({ companyId }) : [];
  const availableQuotes = companyId ? quotesService.getQuotes({ companyId }) : [];

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(freightCharges) || 0));

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setOrderType(orderToEdit.orderType);
        setCompanyId(orderToEdit.companyId);
        setContactId(orderToEdit.contactId || '');
        setDealId(orderToEdit.dealId || '');
        setQuoteId(orderToEdit.quoteId || '');
        setOrderDate(orderToEdit.orderDate);
        setExpectedShipmentDate(orderToEdit.expectedShipmentDate);
        setCurrency(orderToEdit.currency);
        setIncoterm(orderToEdit.incoterm);
        setDestinationPort(orderToEdit.destinationPort);
        setPaymentTerms(orderToEdit.paymentTerms);
        setOwner(orderToEdit.owner);
        setStatus(orderToEdit.status);
        setNotes(orderToEdit.notes);
        setDiscount(orderToEdit.discount || 0);
        setFreightCharges(orderToEdit.freightCharges || 0);
        setLineItems(orderToEdit.lineItems);
      } else {
        const cId = initialCompanyId || (companies[0]?.id || '');
        setCompanyId(cId);
        setDealId(initialDealId || '');
        setQuoteId(initialQuoteId || '');
        setOrderType(initialOrderType || 'Sales Order');
        setOrderDate(new Date().toISOString().slice(0, 10));
        setExpectedShipmentDate(
          new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
        );
        setDiscount(0);
        setFreightCharges(0);
        setOwner(currentUserName);
        setStatus('Confirmed');
        setLineItems([
          {
            id: `oli_${Date.now()}`,
            productId: products[0]?.id || '',
            productName: products[0]?.name || 'Textile Fiber/Waste',
            description: products[0]?.materialComposition || '',
            quantity: 25,
            unit: 'ton',
            unitPrice: products[0]?.defaultPricePerUnit || 1200,
            lineTotal: 25 * (products[0]?.defaultPricePerUnit || 1200),
          },
        ]);
      }
      setErrors({});
    }
  }, [isOpen, orderToEdit, initialCompanyId, initialDealId, initialQuoteId, initialOrderType]);

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find(p => p.id === pId);
    setLineItems(prev => {
      const copy = [...prev];
      if (prod) {
        copy[index] = {
          ...copy[index],
          productId: prod.id,
          productName: prod.name,
          description: `${prod.materialComposition} - ${prod.grade}`,
          unit: prod.unit,
          unitPrice: prod.defaultPricePerUnit,
          lineTotal: copy[index].quantity * prod.defaultPricePerUnit,
        };
      } else {
        copy[index] = { ...copy[index], productId: '', productName: '' };
      }
      return copy;
    });
  };

  const handleLineItemChange = (index: number, field: keyof OrderLineItem, value: any) => {
    setLineItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(value) : copy[index].quantity;
        const p = field === 'unitPrice' ? Number(value) : copy[index].unitPrice;
        item.lineTotal = (q || 0) * (p || 0);
      }
      copy[index] = item;
      return copy;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `oli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        productId: '',
        productName: '',
        description: '',
        quantity: 1,
        unit: 'ton',
        unitPrice: 0,
        lineTotal: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!companyId) newErrors.companyId = 'Please select a company';
    if (!destinationPort) newErrors.destinationPort = 'Destination port is required';
    if (lineItems.length === 0) newErrors.lineItems = 'At least one line item is required';

    const hasInvalidLine = lineItems.some(item => !item.productName || item.quantity <= 0);
    if (hasInvalidLine) newErrors.lineItems = 'Each item must have a product name and quantity > 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (orderToEdit) {
      const updated = ordersService.updateOrder(orderToEdit.id, {
        orderType,
        companyId,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        quoteId: quoteId || undefined,
        orderDate,
        expectedShipmentDate,
        currency,
        incoterm,
        destinationPort,
        paymentTerms,
        owner,
        status,
        notes,
        lineItems,
        subtotal,
        discount: Number(discount) || 0,
        freightCharges: Number(freightCharges) || 0,
        total,
      });
      onSave(updated);
    } else {
      const created = ordersService.createOrder({
        orderType,
        companyId,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        quoteId: quoteId || undefined,
        orderDate,
        expectedShipmentDate,
        currency,
        incoterm,
        destinationPort,
        paymentTerms,
        owner,
        status,
        notes,
        lineItems,
        subtotal,
        discount: Number(discount) || 0,
        freightCharges: Number(freightCharges) || 0,
        total,
      });
      onSave(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderToEdit ? `Edit Order - ${orderToEdit.orderNumber}` : 'Register New Order (Sales or Purchase)'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type & Party Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Order Type *
            </label>
            <select
              value={orderType}
              onChange={e => setOrderType(e.target.value as OrderType)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border font-medium text-blue-900"
            >
              <option value="Sales Order">Sales Order (SO to Buyer)</option>
              <option value="Purchase Order">Purchase Order (PO from Supplier)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Trading Partner / Company *
            </label>
            <select
              value={companyId}
              onChange={e => {
                setCompanyId(e.target.value);
                setContactId('');
                setDealId('');
                setQuoteId('');
              }}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">Select Company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type} - {c.country})
                </option>
              ))}
            </select>
            {errors.companyId && <p className="text-red-600 text-xs mt-1">{errors.companyId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Contact Person
            </label>
            <select
              value={contactId}
              onChange={e => setContactId(e.target.value)}
              disabled={!companyId}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border disabled:bg-gray-100"
            >
              <option value="">Select Contact (Optional)...</option>
              {availableContacts.map((c: Contact) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.position}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates & Logistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Order Date *
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Expected Shipment *
            </label>
            <input
              type="date"
              value={expectedShipmentDate}
              onChange={e => setExpectedShipmentDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Incoterm *
            </label>
            <select
              value={incoterm}
              onChange={e => setIncoterm(e.target.value as Incoterm)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="CIF">CIF</option>
              <option value="CFR">CFR</option>
              <option value="FOB">FOB</option>
              <option value="EXW">EXW</option>
              <option value="DAP">DAP</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Destination Port / Yard *
            </label>
            <input
              type="text"
              value={destinationPort}
              onChange={e => setDestinationPort(e.target.value)}
              placeholder="e.g. Izmir Alsancak Port"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
            {errors.destinationPort && (
              <p className="text-red-600 text-xs mt-1">{errors.destinationPort}</p>
            )}
          </div>
        </div>

        {/* Currency & Financial Settings (masked if Warehouse) */}
        {canViewPrices ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Currency *
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as CurrencyCode)}
                className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="INR">INR (₹)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="AED">AED</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Terms *
              </label>
              <input
                type="text"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                placeholder="e.g. 30% Advance T/T, 70% against B/L copy"
                className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            Financial terms and pricing are hidden for the Warehouse role.
          </div>
        )}

        {/* Optional Quote / Deal links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Link to Proforma / Quote (Optional)
            </label>
            <select
              value={quoteId}
              onChange={e => setQuoteId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">None</option>
              {availableQuotes.map(q => (
                <option key={q.id} value={q.id}>
                  {q.quoteNumber} ({q.status} - {q.currency} {q.total.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Link to Deal (Optional)
            </label>
            <select
              value={dealId}
              onChange={e => setDealId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">None</option>
              {availableDeals.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.stage})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50/70">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              Goods / Items Ordered ({lineItems.length})
            </h4>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          {errors.lineItems && <p className="text-red-600 text-xs mb-3">{errors.lineItems}</p>}

          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className={canViewPrices ? 'sm:col-span-5' : 'sm:col-span-8'}>
                    <label className="block text-xs text-gray-500 mb-0.5">Catalog Preset or Product</label>
                    <div className="flex gap-1.5">
                      <select
                        value={item.productId || ''}
                        onChange={e => handleProductSelect(idx, e.target.value)}
                        className="text-xs rounded border-gray-300 border px-2 py-1.5 bg-gray-50 w-1/2"
                      >
                        <option value="">Preset...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={e => handleLineItemChange(idx, 'productName', e.target.value)}
                        placeholder="Product Name *"
                        className="text-xs rounded border-gray-300 border px-2 py-1.5 w-1/2 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={item.quantity}
                      onChange={e => handleLineItemChange(idx, 'quantity', e.target.value)}
                      className="w-full text-xs rounded border-gray-300 border px-2 py-1.5 text-right font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-0.5">Unit</label>
                    <select
                      value={item.unit}
                      onChange={e => handleLineItemChange(idx, 'unit', e.target.value as ProductUnit)}
                      className="w-full text-xs rounded border-gray-300 border px-2 py-1.5 bg-white"
                    >
                      <option value="ton">ton</option>
                      <option value="kg">kg</option>
                      <option value="bale">bale</option>
                      <option value="container">container</option>
                    </select>
                  </div>

                  {canViewPrices && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-0.5">Unit Price ({currency})</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={item.unitPrice}
                        onChange={e => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full text-xs rounded border-gray-300 border px-2 py-1.5 text-right font-mono"
                        required
                      />
                    </div>
                  )}

                  <div className="sm:col-span-1 flex items-end justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      disabled={lineItems.length <= 1}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-30 p-1"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleLineItemChange(idx, 'description', e.target.value)}
                    placeholder="Lot details, packaging, moisture specs..."
                    className="w-full text-xs text-gray-600 rounded border-gray-200 border px-2.5 py-1 bg-gray-50"
                  />
                  {canViewPrices && (
                    <div className="shrink-0 text-right text-xs font-semibold text-gray-800 font-mono w-28">
                      = {currency} {item.lineTotal.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {canViewPrices && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col items-end space-y-1.5 text-sm">
              <div className="flex justify-between w-64 text-gray-600 text-xs">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">
                  {currency} {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center w-64 text-xs text-gray-600">
                <span>Freight:</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">+</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={freightCharges}
                    onChange={e => setFreightCharges(Number(e.target.value) || 0)}
                    className="w-24 text-right text-xs rounded border border-gray-300 px-1.5 py-0.5 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-gray-300 font-bold text-gray-900">
                <span>Order Total:</span>
                <span className="font-mono text-base text-blue-800">
                  {currency} {total.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Operational Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Operational Notes & Inspection Requirements
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Moisture limit strictly 8.5%, SGS report mandatory prior to stuffing, seal numbers to be logged on B/L."
            className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition"
          >
            {orderToEdit ? 'Save Changes' : 'Confirm & Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
