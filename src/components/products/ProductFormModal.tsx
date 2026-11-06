import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductUnit, CurrencyCode } from '../../types';
import { productsService } from '../../services/productsService';
import { Modal } from '../common/Modal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialData?: Product | null;
}

const COMMON_ORIGINS = [
  'Turkey',
  'India',
  'Bangladesh',
  'China',
  'Italy',
  'UAE',
  'Pakistan',
  'Vietnam',
  'Egypt',
  'Germany',
  'United States',
];

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProductFormModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Waste Cloth');
  const [materialComposition, setMaterialComposition] = useState('100% Cotton');
  const [grade, setGrade] = useState('Grade A');
  const [color, setColor] = useState('Raw Ecru');
  const [originCountry, setOriginCountry] = useState('Turkey');
  const [unit, setUnit] = useState<ProductUnit>('ton');
  const [typicalBaleWeight, setTypicalBaleWeight] = useState<number>(220);
  const [defaultPricePerUnit, setDefaultPricePerUnit] = useState<number>(1100);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [hsCode, setHsCode] = useState('5202.99.00');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Yarn specific
  const [yarnCount, setYarnCount] = useState('Ne 20/1');
  const [yarnPly, setYarnPly] = useState('Single');
  const [spinningType, setSpinningType] = useState('Open End (Rotor)');

  // Waste cloth specific
  const [wasteType, setWasteType] = useState('Pre-consumer');
  const [cleanlinessLevel, setCleanlinessLevel] = useState('Sorted 100% Cotton / Zero Lycra');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setMaterialComposition(initialData.materialComposition);
      setGrade(initialData.grade);
      setColor(initialData.color);
      setOriginCountry(initialData.originCountry);
      setUnit(initialData.unit);
      setTypicalBaleWeight(initialData.typicalBaleWeight || 220);
      setDefaultPricePerUnit(initialData.defaultPricePerUnit || 0);
      setCurrency(initialData.currency);
      setHsCode(initialData.hsCode || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status);

      // Yarn
      setYarnCount(initialData.yarnCount || 'Ne 20/1');
      setYarnPly(initialData.yarnPly || 'Single');
      setSpinningType(initialData.spinningType || 'Open End (Rotor)');

      // Waste cloth
      setWasteType(initialData.wasteType || 'Pre-consumer');
      setCleanlinessLevel(initialData.cleanlinessLevel || 'Sorted 100% Cotton / Zero Lycra');
    } else {
      setName('');
      setCategory('Waste Cloth');
      setMaterialComposition('100% Cotton');
      setGrade('Grade A');
      setColor('Raw Ecru');
      setOriginCountry('Turkey');
      setUnit('ton');
      setTypicalBaleWeight(220);
      setDefaultPricePerUnit(1100);
      setCurrency('USD');
      setHsCode('5202.99.00');
      setNotes('');
      setStatus('Active');

      setYarnCount('Ne 20/1');
      setYarnPly('Single');
      setSpinningType('Open End (Rotor)');

      setWasteType('Pre-consumer');
      setCleanlinessLevel('Sorted 100% Cotton / Zero Lycra');
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Adjust defaults when category changes
  const handleCategoryChange = (newCat: ProductCategory) => {
    setCategory(newCat);
    if (newCat === 'Yarn' && !yarnCount) {
      setYarnCount('Ne 20/1');
      setSpinningType('Open End (Rotor)');
      setHsCode('5205.11.00');
    } else if (newCat === 'Waste Cloth') {
      setHsCode('5202.99.00');
    } else if (newCat === 'Fiber') {
      setHsCode('5503.20.00');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!materialComposition.trim()) newErrors.materialComposition = 'Material composition is required';
    if (!originCountry.trim()) newErrors.originCountry = 'Origin country is required';
    if (defaultPricePerUnit <= 0) newErrors.defaultPricePerUnit = 'Price must be greater than 0';
    if (typicalBaleWeight <= 0) newErrors.typicalBaleWeight = 'Bale weight must be greater than 0';

    if (category === 'Yarn' && !yarnCount.trim()) {
      newErrors.yarnCount = 'Yarn count is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      category,
      materialComposition: materialComposition.trim(),
      grade: grade.trim(),
      color: color.trim(),
      originCountry: originCountry.trim(),
      unit,
      typicalBaleWeight: Number(typicalBaleWeight),
      defaultPricePerUnit: Number(defaultPricePerUnit),
      currency,
      hsCode: hsCode.trim(),
      notes: notes.trim(),
      status,
      ...(category === 'Yarn'
        ? {
            yarnCount: yarnCount.trim(),
            yarnPly: yarnPly.trim(),
            spinningType: spinningType.trim(),
          }
        : {}),
      ...(category === 'Waste Cloth'
        ? {
            wasteType: wasteType.trim(),
            cleanlinessLevel: cleanlinessLevel.trim(),
          }
        : {}),
    };

    if (isEditing && initialData) {
      const updated = productsService.updateProduct(initialData.id, payload);
      onSave(updated);
    } else {
      const created = productsService.createProduct(payload);
      onSave(created);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Catalog Product' : 'Add Product to Catalog'}
      subtitle="Register trade specifications, HS tariff classification, and pricing benchmarks."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product / Commodity Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Shankar-6 Cotton Comber Noil, Ne 10/1 Regenerated Denim Yarn"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.name && <span className="text-xs text-rose-600 mt-0.5 block">{errors.name}</span>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as ProductCategory)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-medium"
            >
              <option value="Waste Cloth">Waste Cloth (Clips, Droppings, Noils)</option>
              <option value="Yarn">Yarn (Rotor, Ring, Recycled Cones)</option>
              <option value="Fiber">Fiber (Staple, Tow, Scraps)</option>
              <option value="Other">Other (Packaging, Wire, Supplies)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="Active">Active (In Current Trading Book)</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Material Composition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Material Composition <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={materialComposition}
              onChange={(e) => {
                setMaterialComposition(e.target.value);
                if (errors.materialComposition) setErrors({ ...errors, materialComposition: '' });
              }}
              placeholder="e.g. 100% Cotton, 65/35 Poly-Cotton, 100% rPET"
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.materialComposition ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            {errors.materialComposition && (
              <span className="text-xs text-rose-600 mt-0.5 block">{errors.materialComposition}</span>
            )}
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Commercial Grade
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="e.g. Prime Comber, Grade A Export, Commercial"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Color / Shade
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Bleached White, Raw Ecru, Dark Indigo Blue"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Origin Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Origin Country <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="product-countries-list"
              required
              value={originCountry}
              onChange={(e) => {
                setOriginCountry(e.target.value);
                if (errors.originCountry) setErrors({ ...errors, originCountry: '' });
              }}
              placeholder="e.g. Turkey, India, Bangladesh..."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${
                errors.originCountry ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900`}
            />
            <datalist id="product-countries-list">
              {COMMON_ORIGINS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {errors.originCountry && (
              <span className="text-xs text-rose-600 mt-0.5 block">{errors.originCountry}</span>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trading Unit <span className="text-rose-500">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="ton">Metric Ton (MT)</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="bale">Standard Bale</option>
              <option value="container">40ft HC Container</option>
            </select>
          </div>

          {/* Typical Bale Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Typical Bale Weight (kg) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={typicalBaleWeight}
              onChange={(e) => setTypicalBaleWeight(Number(e.target.value))}
              placeholder="e.g. 220"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono"
            />
          </div>

          {/* Default Price Per Unit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default Price Per Unit <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min={0.01}
              required
              value={defaultPricePerUnit}
              onChange={(e) => setDefaultPricePerUnit(Number(e.target.value))}
              placeholder="e.g. 1180"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono"
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

          {/* HS Code */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              HS Code (Harmonized System Tariff)
            </label>
            <input
              type="text"
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              placeholder="e.g. 5202.99.00 (Cotton waste), 5205.11.00 (Cotton yarn)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900 font-mono"
            />
          </div>

          {/* Conditional Yarn Fields */}
          {category === 'Yarn' && (
            <div className="sm:col-span-2 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-blue-950 uppercase tracking-wider block">
                Yarn Specifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Yarn Count (e.g. Ne 20/1, Nm 28/2) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={yarnCount}
                    onChange={(e) => setYarnCount(e.target.value)}
                    placeholder="e.g. Ne 20/1"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ply
                  </label>
                  <select
                    value={yarnPly}
                    onChange={(e) => setYarnPly(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="Single">Single (1-ply)</option>
                    <option value="2-ply">2-ply</option>
                    <option value="3-ply">3-ply</option>
                    <option value="Multi-filament">Multi-filament</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Spinning Type
                  </label>
                  <select
                    value={spinningType}
                    onChange={(e) => setSpinningType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="Open End (Rotor)">Open End (Rotor)</option>
                    <option value="Ring Spun">Ring Spun</option>
                    <option value="Carded Woolen">Carded Woolen</option>
                    <option value="Melt Extrusion Filament">Melt Extrusion Filament</option>
                    <option value="Vortex / Air Jet">Vortex / Air Jet</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Waste Cloth Fields */}
          {category === 'Waste Cloth' && (
            <div className="sm:col-span-2 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                Waste Cloth Specifications
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Waste Source Type
                  </label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  >
                    <option value="Pre-consumer">Pre-consumer (Factory/Ginning clips)</option>
                    <option value="Post-consumer">Post-consumer (Garment recycling)</option>
                    <option value="Spinning Waste">Spinning Waste (Comber Noils, Droppings)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cleanliness & Contamination Level
                  </label>
                  <input
                    type="text"
                    value={cleanlinessLevel}
                    onChange={(e) => setCleanlinessLevel(e.target.value)}
                    placeholder="e.g. Sorted 100% Cotton / Zero Lycra, Trash <1%"
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quality Specs & Handling Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Moisture limits, baling density, packaging wire, certification (GRS, Oeko-Tex)..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
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
            {isEditing ? 'Save Product' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
