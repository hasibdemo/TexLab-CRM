import React, { useState, useEffect, useMemo } from 'react';
import {
  Deal,
  DealStage,
  DealType,
  ProductUnit,
  CurrencyCode,
  Incoterm,
  Company,
  Contact,
  Product,
} from '../../types';
import { dealsService, DEAL_STAGES } from '../../services/dealsService';
import { companiesService } from '../../services/companiesService';
import { contactsService } from '../../services/contactsService';
import { productsService } from '../../services/productsService';
import { DEMO_USERS } from '../../services/seedData';
import { currencyService } from '../../services/currencyService';
import { Modal } from '../common/Modal';

interface DealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deal: Deal) => void;
  initialData?: Deal | null;
  defaultCompanyId?: string;
  defaultProductId?: string;
  defaultDealType?: DealType;
  userName: string;
}

const INCOTERMS: Incoterm[] = ['CIF', 'FOB', 'CFR', 'EXW', 'DAP'];

export function DealFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultCompanyId,
  defaultProductId,
  defaultDealType = 'Sale',
  userName,
}: DealFormModalProps) {
  const isEditing = Boolean(initialData);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState(defaultCompanyId || '');
  const [contactId, setContactId] = useState('');
  const [dealType, setDealType] = useState<DealType>(defaultDealType);
  const [productId, setProductId] = useState(defaultProductId || '');
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<ProductUnit>('ton');
  const [pricePerUnit, setPricePerUnit] = useState<number>(1180);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [stage, setStage] = useState<DealStage>('New Inquiry');
  const [paymentTerms, setPaymentTerms] = useState('100% LC at Sight');
  const [incoterm, setIncoterm] = useState<Incoterm>('CIF');
  const [destinationPort, setDestinationPort] = useState('Izmir Port, Turkey');
  const [owner, setOwner] = useState(userName || 'Elena Rossi');
  const [probability, setProbability] = useState<number>(50);
  const [notes, setNotes] = useState('');
  const [lostReason, setLostReason] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const allComps = companiesService.getCompanies({ sortBy: 'name', sortOrder: 'asc' });
      const allProds = productsService.getProducts({ sortBy: 'name', sortOrder: 'asc' });
      setCompanies(allComps);
      setProducts(allProds);
    }
  }, [isOpen]);

  useEffect(() => {
    if (companyId) {
      const compContacts = contactsService.getContacts(companyId);
      setContacts(compContacts);
      if (!isEditing && !contactId) {
        const primary = compContacts.find((c) => c.isPrimary);
        setContactId(primary?.id || (compContacts[0]?.id ?? ''));
      }
    } else {
      setContacts([]);
      setContactId('');
    }
  }, [companyId, isEditing]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCompanyId(initialData.companyId);
      setContactId(initialData.contactId || '');
      setDealType(initialData.dealType);
      setProductId(initialData.productId || '');
      setQuantity(initialData.quantity);
      setUnit(initialData.unit);
      setPricePerUnit(initialData.pricePerUnit);
      setCurrency(initialData.currency);
      setExpectedCloseDate(initialData.expectedCloseDate);
      setStage(initialData.stage);
      setPaymentTerms(initialData.paymentTerms || '');
      setIncoterm(initialData.incoterm);
      setDestinationPort(initialData.destinationPort || '');
      setOwner(initialData.owner || userName);
      setProbability(initialData.probability || 50);
      setNotes(initialData.notes || '');
      setLostReason(initialData.lostReason || '');
    } else {
      const targetComp = defaultCompanyId || (companies[0]?.id ?? '');
      setCompanyId(targetComp);
      const matchedComp = companies.find((c) => c.id === targetComp);

      const targetProdId = defaultProductId || (products[0]?.id ?? '');
      setProductId(targetProdId);
      const matchedProd = products.find((p) => p.id === targetProdId);

      setTitle(
        matchedProd && matchedComp
          ? `Supply of ${matchedProd.name} to ${matchedComp.name}`
          : 'New Textile Trade Contract'
      );
      setDealType(
        defaultDealType || (matchedComp?.type === 'Supplier' ? 'Purchase' : 'Sale')
      );
      setQuantity(100);
      setUnit(matchedProd?.unit || 'ton');
      setPricePerUnit(matchedProd?.defaultPricePerUnit || 1180);
      setCurrency(matchedProd?.currency || 'USD');
      setExpectedCloseDate(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      );
      setStage('New Inquiry');
      setPaymentTerms(matchedComp?.paymentTerms || '100% LC at Sight');
      setIncoterm('CIF');
      setDestinationPort(matchedComp ? `${matchedComp.city} Port, ${matchedComp.country}` : 'Destination Port');
      setOwner(userName || 'Elena Rossi');
      setProbability(40);
      setNotes('');
      setLostReason('');
    }
    setErrors({});
  }, [initialData, isOpen, defaultCompanyId, defaultProductId, defaultDealType, companies, products, userName]);

  // When product changes, optionally auto-fill price, unit, and currency
  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      setPricePerUnit(prod.defaultPricePerUnit);
      setUnit(prod.unit);
      setCurrency(prod.currency);
      if (!isEditing) {
        const comp = companies.find((c) => c.id === companyId);
        setTitle(`${quantity} ${prod.unit} ${prod.name} ${dealType === 'Purchase' ? 'Procurement' : 'Order'}`);
      }
    }
  };

  // When company changes, suggest deal type and payment terms
  const handleCompanyChange = (newCompId: string) => {
    setCompanyId(newCompId);
    const comp = companies.find((c) => c.id === newCompId);
    if (comp) {
      if (comp.type === 'Supplier') {
        setDealType('Purchase');
      } else if (comp.type === 'Buyer') {
        setDealType('Sale');
      }
      if (comp.paymentTerms) {
        setPaymentTerms(comp.paymentTerms);
      }
      if (comp.city && comp.country) {
        setDestinationPort(`${comp.city} Port, ${comp.country}`);
      }
    }
  };

  // Auto-calculated total value
  const totalValue = useMemo(() => {
    return Math.max(0, (Number(quantity) || 0) * (Number(pricePerUnit) || 0));
  }, [quantity, pricePerUnit]);

  const totalValueUSD = useMemo(() => {
    return currencyService.convertToUSD(totalValue, currency);
  }, [totalValue, currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Deal title is required';
    if (!companyId) newErrors.companyId = 'Please select a company';
    if (!destinationPort.trim()) newErrors.destinationPort = 'Destination port is required';
    if (quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (pricePerUnit <= 0) newErrors.pricePerUnit = 'Price per unit must be greater than 0';
    if (!expectedCloseDate) newErrors.expectedCloseDate = 'Expected close date is required';

    if (stage === 'Lost' && !lostReason.trim()) {
      newErrors.lostReason = 'A reason is required when deal is marked as Lost';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      title: title.trim(),
      companyId,
      contactId: contactId || undefined,
      dealType,
      productId: productId || undefined,
      quantity: Number(quantity),
      unit,
      pricePerUnit: Number(pricePerUnit),
      currency,
      totalValue,
      expectedCloseDate,
      stage,
      paymentTerms: paymentTerms.trim(),
      incoterm,
      destinationPort: destinationPort.trim(),
      owner,
      probability: Number(probability),
      notes: notes.trim(),
      lostReason: stage === 'Lost' ? lostReason.trim() : undefined,
    };

    if (isEditing && initialData) {
      const updated = dealsService.updateDeal(initialData.id, payload, userName);
      onSave(updated);
    } else {
      const created = dealsService.createDeal(payload, userName);
      onSave(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Deal Parameters' : 'Create Trade Deal'}
      subtitle="Track cross-border fiber and waste yarn import/export pipeline."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Deal Type Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg max-w-xs">
          <button
            type="button"
            onClick={() => setDealType('Sale')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
              dealType === 'Sale'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Export Sale (To Buyer)
          </button>
          <button
            type="button"
            onClick={() => setDealType('Purchase')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors ${
              dealType === 'Purchase'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import Purchase (From Mill)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Title */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Deal Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="e.g. 300 MT Shankar-6 Comber Noil Quarterly Supply"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.title && <span className="text-xs text-rose-600 mt-0.5 block">{errors.title}</span>}
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Company <span className="text-rose-500">*</span>
            </label>
            <select
              value={companyId}
              onChange={(e) => {
                handleCompanyChange(e.target.value);
                if (errors.companyId) setErrors({ ...errors, companyId: '' });
              }}
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.companyId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            >
              <option value="">-- Select Company --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type} - {c.country})
                </option>
              ))}
            </select>
            {errors.companyId && <span className="text-xs text-rose-600 mt-0.5 block">{errors.companyId}</span>}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Key Contact Person
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="">-- None / General Commercial --</option>
              {contacts.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} ({ct.position})
                </option>
              ))}
            </select>
          </div>

          {/* Product link */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Commodity / Catalog Product
            </label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-medium"
            >
              <option value="">-- Custom Commodity (Not in Catalog) --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.category}] {p.name} - {currencyService.formatAmount(p.defaultPricePerUnit, p.currency)}/{p.unit} ({p.originCountry})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contract Quantity <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => {
                  setQuantity(Number(e.target.value));
                  if (errors.quantity) setErrors({ ...errors, quantity: '' });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-32 px-2 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              >
                <option value="ton">ton</option>
                <option value="kg">kg</option>
                <option value="bale">bale</option>
                <option value="container">container</option>
              </select>
            </div>
            {errors.quantity && <span className="text-xs text-rose-600 mt-0.5 block">{errors.quantity}</span>}
          </div>

          {/* Price Per Unit & Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Price Per Unit <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min={0.01}
                required
                value={pricePerUnit}
                onChange={(e) => {
                  setPricePerUnit(Number(e.target.value));
                  if (errors.pricePerUnit) setErrors({ ...errors, pricePerUnit: '' });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-28 px-2 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="CNY">CNY (¥)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            {errors.pricePerUnit && (
              <span className="text-xs text-rose-600 mt-0.5 block">{errors.pricePerUnit}</span>
            )}
          </div>

          {/* Auto-Calculated Total Value Card */}
          <div className="sm:col-span-2 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                Total Deal Contract Value (Auto-Calculated)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-blue-950">
                  {currencyService.formatAmount(totalValue, currency)}
                </span>
                {currency !== 'USD' && (
                  <span className="text-xs font-mono text-slate-500">
                    ≈ {currencyService.formatUSD(totalValueUSD)} (USD base)
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              {quantity} {unit} &times; {currencyService.formatAmount(pricePerUnit, currency)}
            </div>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Pipeline Stage <span className="text-rose-500">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => {
                const s = e.target.value as DealStage;
                setStage(s);
                if (s === 'Order Confirmed') setProbability(100);
                if (s === 'Lost') setProbability(0);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 font-medium"
            >
              {DEAL_STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Probability */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Win Probability % ({probability}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          {/* Incoterm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Incoterm <span className="text-rose-500">*</span>
            </label>
            <select
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value as Incoterm)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 font-medium"
            >
              {INCOTERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Destination Port / Yard <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={destinationPort}
              onChange={(e) => {
                setDestinationPort(e.target.value);
                if (errors.destinationPort) setErrors({ ...errors, destinationPort: '' });
              }}
              placeholder="e.g. Izmir Port, Nhava Sheva (JNPT), Chittagong Port"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.destinationPort ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900`}
            />
            {errors.destinationPort && (
              <span className="text-xs text-rose-600 mt-0.5 block">{errors.destinationPort}</span>
            )}
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. 100% LC at Sight, 30% Advance + 70% BL"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>

          {/* Expected Close Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Expected Close Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono"
            />
          </div>

          {/* Owner */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Deal Owner (Account Staff)
            </label>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Lost Reason if stage is Lost */}
          {stage === 'Lost' && (
            <div className="sm:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-rose-900 uppercase tracking-wider">
                Reason for Lost Deal <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={lostReason}
                onChange={(e) => {
                  setLostReason(e.target.value);
                  if (errors.lostReason) setErrors({ ...errors, lostReason: '' });
                }}
                placeholder="Required: State why this deal was lost..."
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.lostReason ? 'border-rose-400 bg-white' : 'border-rose-300'
                } focus:outline-none focus:ring-1 focus:ring-rose-800`}
              />
              {errors.lostReason && (
                <span className="text-xs text-rose-600 block">{errors.lostReason}</span>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Trading Notes & Counter-Offers
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Discussion details, freight quotes, special LC clauses, lab approvals..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-lg transition-colors shadow-xs"
          >
            {isEditing ? 'Save Deal Changes' : 'Create Trade Deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
