import React, { useState, useEffect } from 'react';
import { Quote, QuoteLineItem, QuoteType, QuoteStatus, CurrencyCode, Incoterm, ProductUnit, Contact } from '../../types';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { productsService } from '../../services/productsService';
import { dealsService } from '../../services/dealsService';
import { settingsService } from '../../services/settingsService';
import { quotesService } from '../../services/quotesService';
import Modal from '../common/Modal';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quote: Quote) => void;
  quoteToEdit?: Quote | null;
  initialDealId?: string;
  initialCompanyId?: string;
  currentUserName: string;
}

export default function QuoteFormModal({
  isOpen,
  onClose,
  onSave,
  quoteToEdit,
  initialDealId,
  initialCompanyId,
  currentUserName,
}: QuoteFormModalProps) {
  const companies = companiesService.getCompanies();
  const products = productsService.getProducts({ status: 'Active' });
  const settings = settingsService.getSettings();

  const [companyId, setCompanyId] = useState(quoteToEdit?.companyId || initialCompanyId || '');
  const [contactId, setContactId] = useState(quoteToEdit?.contactId || '');
  const [dealId, setDealId] = useState(quoteToEdit?.dealId || initialDealId || '');
  const [type, setType] = useState<QuoteType>(quoteToEdit?.type || 'Quotation');
  const [date, setDate] = useState(quoteToEdit?.date || new Date().toISOString().slice(0, 10));
  const [validityDate, setValidityDate] = useState(
    quoteToEdit?.validityDate ||
      new Date(Date.now() + (settings.defaultQuoteValidityDays || 15) * 86400000).toISOString().slice(0, 10)
  );
  const [currency, setCurrency] = useState<CurrencyCode>(quoteToEdit?.currency || 'USD');
  const [incoterm, setIncoterm] = useState<Incoterm>(quoteToEdit?.incoterm || settings.defaultIncoterm || 'CIF');
  const [portOfLoading, setPortOfLoading] = useState(quoteToEdit?.portOfLoading || 'Origin Port / Jebel Ali');
  const [portOfDestination, setPortOfDestination] = useState(quoteToEdit?.portOfDestination || '');
  const [paymentTerms, setPaymentTerms] = useState(quoteToEdit?.paymentTerms || settings.defaultPaymentTerms);
  const [deliveryTime, setDeliveryTime] = useState(quoteToEdit?.deliveryTime || '20-25 days from confirmation');
  const [bankDetails, setBankDetails] = useState(
    quoteToEdit?.bankDetails ||
      `${settings.bankName} | IBAN: ${settings.iban} | SWIFT: ${settings.swiftBic}`
  );
  const [notesAndTerms, setNotesAndTerms] = useState(
    quoteToEdit?.notesAndTerms || settings.standardQuoteTerms
  );
  const [status, setStatus] = useState<QuoteStatus>(quoteToEdit?.status || 'Draft');

  const [discount, setDiscount] = useState<number>(quoteToEdit?.discount || 0);
  const [freightCharges, setFreightCharges] = useState<number>(quoteToEdit?.freightCharges || 0);

  const [lineItems, setLineItems] = useState<QuoteLineItem[]>(
    quoteToEdit?.lineItems || [
      {
        id: `qli_${Date.now()}`,
        productId: '',
        productName: '',
        description: '',
        quantity: 1,
        unit: 'ton',
        unitPrice: 0,
        lineTotal: 0,
      },
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Contacts filtered by selected company
  const availableContacts = companyId ? contactsService.getContacts(companyId) : [];
  // Deals filtered by selected company
  const availableDeals = companyId ? dealsService.getDeals({ companyId }) : [];

  // Recalculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(freightCharges) || 0));

  useEffect(() => {
    if (isOpen) {
      if (quoteToEdit) {
        setCompanyId(quoteToEdit.companyId);
        setContactId(quoteToEdit.contactId || '');
        setDealId(quoteToEdit.dealId || '');
        setType(quoteToEdit.type);
        setDate(quoteToEdit.date);
        setValidityDate(quoteToEdit.validityDate);
        setCurrency(quoteToEdit.currency);
        setIncoterm(quoteToEdit.incoterm);
        setPortOfLoading(quoteToEdit.portOfLoading);
        setPortOfDestination(quoteToEdit.portOfDestination);
        setPaymentTerms(quoteToEdit.paymentTerms);
        setDeliveryTime(quoteToEdit.deliveryTime);
        setBankDetails(quoteToEdit.bankDetails);
        setNotesAndTerms(quoteToEdit.notesAndTerms);
        setStatus(quoteToEdit.status);
        setDiscount(quoteToEdit.discount || 0);
        setFreightCharges(quoteToEdit.freightCharges || 0);
        setLineItems(quoteToEdit.lineItems);
      } else {
        const cId = initialCompanyId || (companies[0]?.id || '');
        setCompanyId(cId);
        setDealId(initialDealId || '');
        const freshDate = new Date().toISOString().slice(0, 10);
        setDate(freshDate);
        setValidityDate(
          new Date(Date.now() + (settings.defaultQuoteValidityDays || 15) * 86400000).toISOString().slice(0, 10)
        );
        setDiscount(0);
        setFreightCharges(0);
        setLineItems([
          {
            id: `qli_${Date.now()}`,
            productId: products[0]?.id || '',
            productName: products[0]?.name || 'Textile Material',
            description: products[0]?.materialComposition || '',
            quantity: 20,
            unit: 'ton',
            unitPrice: products[0]?.defaultPricePerUnit || 1000,
            lineTotal: 20 * (products[0]?.defaultPricePerUnit || 1000),
          },
        ]);
      }
      setErrors({});
    }
  }, [isOpen, quoteToEdit, initialCompanyId, initialDealId]);

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find(p => p.id === pId);
    setLineItems(prev => {
      const copy = [...prev];
      if (prod) {
        copy[index] = {
          ...copy[index],
          productId: prod.id,
          productName: prod.name,
          description: `${prod.materialComposition} - ${prod.grade} (${prod.color})`,
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

  const handleLineItemChange = (index: number, field: keyof QuoteLineItem, value: any) => {
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
        id: `qli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
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
    if (!portOfDestination) newErrors.portOfDestination = 'Destination port is required';
    if (lineItems.length === 0) newErrors.lineItems = 'At least one line item is required';

    const hasInvalidLine = lineItems.some(item => !item.productName || item.quantity <= 0);
    if (hasInvalidLine) newErrors.lineItems = 'Each item must have a product name and quantity > 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (quoteToEdit) {
      const updated = quotesService.updateQuote(quoteToEdit.id, {
        companyId,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        type,
        date,
        validityDate,
        currency,
        incoterm,
        portOfLoading,
        portOfDestination,
        paymentTerms,
        deliveryTime,
        bankDetails,
        notesAndTerms,
        status,
        lineItems,
        subtotal,
        discount: Number(discount) || 0,
        freightCharges: Number(freightCharges) || 0,
        total,
      });
      onSave(updated);
    } else {
      const created = quotesService.createQuote({
        companyId,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        type,
        date,
        validityDate,
        currency,
        incoterm,
        portOfLoading,
        portOfDestination,
        paymentTerms,
        deliveryTime,
        bankDetails,
        notesAndTerms,
        status,
        lineItems,
        subtotal,
        discount: Number(discount) || 0,
        freightCharges: Number(freightCharges) || 0,
        total,
        createdBy: currentUserName,
      });
      onSave(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quoteToEdit ? `Edit ${quoteToEdit.quoteNumber}` : 'Create New Quotation / Proforma'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top metadata grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Document Type *
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as QuoteType)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="Quotation">Commercial Quotation</option>
              <option value="Proforma Invoice">Proforma Invoice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Company *
            </label>
            <select
              value={companyId}
              onChange={e => {
                setCompanyId(e.target.value);
                setContactId('');
                setDealId('');
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

        {/* Date, Validity, Currency, Incoterm */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Validity Date *
            </label>
            <input
              type="date"
              value={validityDate}
              onChange={e => setValidityDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

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
              <option value="GBP">GBP (£)</option>
              <option value="AED">AED</option>
              <option value="TRY">TRY (₺)</option>
              <option value="INR">INR (₹)</option>
              <option value="CNY">CNY (¥)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as QuoteStatus)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border font-medium"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Shipping & Payment details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Incoterm *
            </label>
            <select
              value={incoterm}
              onChange={e => setIncoterm(e.target.value as Incoterm)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="CIF">CIF (Cost, Insurance & Freight)</option>
              <option value="CFR">CFR (Cost & Freight)</option>
              <option value="FOB">FOB (Free On Board)</option>
              <option value="EXW">EXW (Ex Works)</option>
              <option value="DAP">DAP (Delivered At Place)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Port of Loading
            </label>
            <input
              type="text"
              value={portOfLoading}
              onChange={e => setPortOfLoading(e.target.value)}
              placeholder="e.g. Jebel Ali / Izmir"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Port of Destination *
            </label>
            <input
              type="text"
              value={portOfDestination}
              onChange={e => setPortOfDestination(e.target.value)}
              placeholder="e.g. Izmir Alsancak Port"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
            {errors.portOfDestination && (
              <p className="text-red-600 text-xs mt-1">{errors.portOfDestination}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Delivery Time
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={e => setDeliveryTime(e.target.value)}
              placeholder="e.g. 20-25 days"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>
        </div>

        {/* Linked Deal */}
        {availableDeals.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Link to Existing Deal (Optional)
            </label>
            <select
              value={dealId}
              onChange={e => setDealId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">No deal linked</option>
              {availableDeals.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.stage} - {d.currency} {d.totalValue.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Line Items Section */}
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50/70">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Line Items ({lineItems.length})
            </h4>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded border border-blue-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product Row
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
                  <div className="sm:col-span-5">
                    <label className="block text-xs text-gray-500 mb-0.5">Catalog Preset or Product Name</label>
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

                {/* Description row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => handleLineItemChange(idx, 'description', e.target.value)}
                    placeholder="Material composition, grade, moisture threshold, cone wax, packing specs..."
                    className="w-full text-xs text-gray-600 rounded border-gray-200 border px-2.5 py-1 bg-gray-50"
                  />
                  <div className="shrink-0 text-right text-xs font-semibold text-gray-800 font-mono w-28">
                    = {currency} {item.lineTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal, discount, freight, total summary */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col items-end space-y-1.5 text-sm">
            <div className="flex justify-between w-64 text-gray-600 text-xs">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">
                {currency} {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center w-64 text-xs text-gray-600">
              <span>Discount:</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="w-24 text-right text-xs rounded border border-gray-300 px-1.5 py-0.5 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-between items-center w-64 text-xs text-gray-600">
              <span>Freight & Other Charges:</span>
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
              <span>Grand Total:</span>
              <span className="font-mono text-base text-blue-800">
                {currency} {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Terms & Bank Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Terms *
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
              placeholder="e.g. 30% Advance T/T, 70% against B/L copy"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Bank Details Block
            </label>
            <input
              type="text"
              value={bankDetails}
              onChange={e => setBankDetails(e.target.value)}
              placeholder="Bank, IBAN, SWIFT"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border text-xs"
            />
          </div>
        </div>

        {/* Standard Terms & Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Notes and Terms of Sale
          </label>
          <textarea
            rows={3}
            value={notesAndTerms}
            onChange={e => setNotesAndTerms(e.target.value)}
            className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border font-mono"
          />
        </div>

        {/* Modal Actions */}
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
            {quoteToEdit ? 'Save Changes' : 'Generate Document'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
