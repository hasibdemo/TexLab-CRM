import React, { useState, useEffect } from 'react';
import { Lot, QualityStatus, ProductUnit } from '../../types';
import { inventoryService } from '../../services/inventoryService';
import { productsService } from '../../services/productsService';
import { companiesService } from '../../services/companiesService';
import { ordersService } from '../../services/ordersService';
import Modal from '../common/Modal';
import { Package, AlertCircle } from 'lucide-react';

interface LotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lot: Lot) => void;
  lotToEdit?: Lot | null;
  initialProductId?: string;
  initialWarehouseId?: string;
  currentUserName: string;
}

export default function LotFormModal({
  isOpen,
  onClose,
  onSave,
  lotToEdit,
  initialProductId,
  initialWarehouseId,
  currentUserName,
}: LotFormModalProps) {
  const warehouses = inventoryService.getWarehouses();
  const products = productsService.getProducts({ status: 'Active' });
  const suppliers = companiesService.getCompanies({ type: 'Supplier' });
  const purchaseOrders = ordersService.getOrders({ type: 'Purchase Order' });

  const [productId, setProductId] = useState(lotToEdit?.productId || initialProductId || '');
  const [supplierId, setSupplierId] = useState(lotToEdit?.supplierId || '');
  const [linkedPurchaseOrderId, setLinkedPurchaseOrderId] = useState(lotToEdit?.linkedPurchaseOrderId || '');
  const [warehouseId, setWarehouseId] = useState(lotToEdit?.warehouseId || initialWarehouseId || (warehouses[0]?.id || ''));
  const [receivedDate, setReceivedDate] = useState(lotToEdit?.receivedDate || new Date().toISOString().slice(0, 10));
  const [balesCount, setBalesCount] = useState<number>(lotToEdit?.balesCount || 100);
  const [grossWeight, setGrossWeight] = useState<number>(lotToEdit?.grossWeight || 20500);
  const [netWeight, setNetWeight] = useState<number>(lotToEdit?.netWeight || 20000);
  const [unit, setUnit] = useState<ProductUnit>(lotToEdit?.unit || 'kg');
  const [grade, setGrade] = useState(lotToEdit?.grade || 'Prime Export');
  const [color, setColor] = useState(lotToEdit?.color || 'Natural Raw');
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>(lotToEdit?.qualityStatus || 'Pending Inspection');
  const [storageLocation, setStorageLocation] = useState(lotToEdit?.storageLocation || 'Bay A-01');
  const [notes, setNotes] = useState(lotToEdit?.notes || '');

  // Category specific fields
  const [yarnCount, setYarnCount] = useState(lotToEdit?.yarnCount || '');
  const [yarnPly, setYarnPly] = useState(lotToEdit?.yarnPly || 'Single');
  const [conesOrCartons, setConesOrCartons] = useState<number | undefined>(lotToEdit?.conesOrCartons);

  const [contaminationPercentage, setContaminationPercentage] = useState<number | undefined>(lotToEdit?.contaminationPercentage);
  const [moisturePercentage, setMoisturePercentage] = useState<number | undefined>(lotToEdit?.moisturePercentage);
  const [baleWeightRange, setBaleWeightRange] = useState(lotToEdit?.baleWeightRange || '195-205 kg');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProduct = products.find(p => p.id === productId);
  const isYarn = selectedProduct?.category === 'Yarn';
  const isWasteCloth = selectedProduct?.category === 'Waste Cloth';

  useEffect(() => {
    if (isOpen) {
      if (lotToEdit) {
        setProductId(lotToEdit.productId);
        setSupplierId(lotToEdit.supplierId);
        setLinkedPurchaseOrderId(lotToEdit.linkedPurchaseOrderId || '');
        setWarehouseId(lotToEdit.warehouseId);
        setReceivedDate(lotToEdit.receivedDate);
        setBalesCount(lotToEdit.balesCount);
        setGrossWeight(lotToEdit.grossWeight);
        setNetWeight(lotToEdit.netWeight);
        setUnit(lotToEdit.unit);
        setGrade(lotToEdit.grade);
        setColor(lotToEdit.color);
        setQualityStatus(lotToEdit.qualityStatus);
        setStorageLocation(lotToEdit.storageLocation);
        setNotes(lotToEdit.notes || '');
        setYarnCount(lotToEdit.yarnCount || '');
        setYarnPly(lotToEdit.yarnPly || 'Single');
        setConesOrCartons(lotToEdit.conesOrCartons);
        setContaminationPercentage(lotToEdit.contaminationPercentage);
        setMoisturePercentage(lotToEdit.moisturePercentage);
        setBaleWeightRange(lotToEdit.baleWeightRange || '');
      } else {
        setProductId(initialProductId || products[0]?.id || '');
        setSupplierId(suppliers[0]?.id || '');
        setWarehouseId(initialWarehouseId || warehouses[0]?.id || '');
        setReceivedDate(new Date().toISOString().slice(0, 10));
        setBalesCount(100);
        setGrossWeight(20500);
        setNetWeight(20000);
        setUnit('kg');
        setGrade('Prime Export');
        setColor('Natural Raw Ecru');
        setQualityStatus('Pending Inspection');
        setStorageLocation('Bay A-01');
        setNotes('');
        setYarnCount('');
        setYarnPly('Single');
        setConesOrCartons(undefined);
        setContaminationPercentage(1.2);
        setMoisturePercentage(7.5);
        setBaleWeightRange('195-205 kg');
      }
      setErrors({});
    }
  }, [isOpen, lotToEdit, initialProductId, initialWarehouseId]);

  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prod = products.find(p => p.id === newProdId);
    if (prod) {
      setGrade(prod.grade);
      setColor(prod.color);
      setUnit(prod.unit);
      if (prod.category === 'Yarn') {
        setYarnCount(prod.yarnCount || 'Ne 20/1 OE');
        setYarnPly(prod.yarnPly || 'Single');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!productId) newErrors.productId = 'Product is required';
    if (!supplierId) newErrors.supplierId = 'Supplier is required';
    if (!warehouseId) newErrors.warehouseId = 'Warehouse is required';
    if (!storageLocation.trim()) newErrors.storageLocation = 'Storage location / bay is required';
    if (!balesCount || balesCount <= 0) newErrors.balesCount = 'Must have at least 1 bale/carton';
    if (!netWeight || netWeight <= 0) newErrors.netWeight = 'Net weight must be greater than zero';
    if (grossWeight < netWeight) newErrors.grossWeight = 'Gross weight cannot be less than net weight';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const prod = products.find(p => p.id === productId);
    const productName = prod ? prod.name : 'Textile Lot';

    if (lotToEdit) {
      const updated = inventoryService.updateLot(lotToEdit.id, {
        productId,
        productName,
        supplierId,
        linkedPurchaseOrderId: linkedPurchaseOrderId || undefined,
        warehouseId,
        receivedDate,
        balesCount: Number(balesCount),
        grossWeight: Number(grossWeight),
        netWeight: Number(netWeight),
        unit,
        grade,
        color,
        qualityStatus,
        storageLocation,
        notes,
        yarnCount: isYarn ? yarnCount : undefined,
        yarnPly: isYarn ? yarnPly : undefined,
        conesOrCartons: isYarn ? (conesOrCartons ? Number(conesOrCartons) : undefined) : undefined,
        contaminationPercentage: isWasteCloth ? (contaminationPercentage !== undefined ? Number(contaminationPercentage) : undefined) : undefined,
        moisturePercentage: isWasteCloth ? (moisturePercentage !== undefined ? Number(moisturePercentage) : undefined) : undefined,
        baleWeightRange: isWasteCloth ? baleWeightRange : undefined,
      });
      onSave(updated);
    } else {
      const created = inventoryService.createLot(
        {
          productId,
          productName,
          supplierId,
          linkedPurchaseOrderId: linkedPurchaseOrderId || undefined,
          warehouseId,
          receivedDate,
          balesCount: Number(balesCount),
          grossWeight: Number(grossWeight),
          netWeight: Number(netWeight),
          unit,
          grade,
          color,
          qualityStatus,
          storageLocation,
          notes,
          yarnCount: isYarn ? yarnCount : undefined,
          yarnPly: isYarn ? yarnPly : undefined,
          conesOrCartons: isYarn ? (conesOrCartons ? Number(conesOrCartons) : undefined) : undefined,
          contaminationPercentage: isWasteCloth ? (contaminationPercentage !== undefined ? Number(contaminationPercentage) : undefined) : undefined,
          moisturePercentage: isWasteCloth ? (moisturePercentage !== undefined ? Number(moisturePercentage) : undefined) : undefined,
          baleWeightRange: isWasteCloth ? baleWeightRange : undefined,
        },
        currentUserName
      );
      onSave(created);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lotToEdit ? `Edit Lot: ${lotToEdit.lotNumber}` : 'Register New Inventory Lot'}
      subtitle="Track physical bales, yarn cartons, weights, and quality inspection grading"
      size="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product & Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Product (Catalog) *
            </label>
            <select
              value={productId}
              onChange={e => handleProductChange(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category} - {p.grade})
                </option>
              ))}
            </select>
            {errors.productId && <p className="text-red-600 text-xs mt-1">{errors.productId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Supplier (Company) *
            </label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">Select supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.country})
                </option>
              ))}
            </select>
            {errors.supplierId && <p className="text-red-600 text-xs mt-1">{errors.supplierId}</p>}
          </div>
        </div>

        {/* Warehouse, Bay, PO, Received Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Warehouse *
            </label>
            <select
              value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.country})
                </option>
              ))}
            </select>
            {errors.warehouseId && <p className="text-red-600 text-xs mt-1">{errors.warehouseId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Storage Bay / Rack *
            </label>
            <input
              type="text"
              value={storageLocation}
              onChange={e => setStorageLocation(e.target.value)}
              placeholder="e.g. Bay A-04 / Rack 12"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
            {errors.storageLocation && <p className="text-red-600 text-xs mt-1">{errors.storageLocation}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Linked Purchase Order
            </label>
            <select
              value={linkedPurchaseOrderId}
              onChange={e => setLinkedPurchaseOrderId(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="">None / Standalone Lot</option>
              {purchaseOrders.map(po => (
                <option key={po.id} value={po.id}>
                  {po.orderNumber} ({po.companyName || po.companyId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Received Date *
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={e => setReceivedDate(e.target.value)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>
        </div>

        {/* Weights, Bales, Unit */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Bales / Cartons *
            </label>
            <input
              type="number"
              min="1"
              value={balesCount}
              onChange={e => setBalesCount(parseInt(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border tabular-nums font-mono"
            />
            {errors.balesCount && <p className="text-red-600 text-xs mt-1">{errors.balesCount}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Net Weight *
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={netWeight}
              onChange={e => setNetWeight(parseFloat(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border tabular-nums font-mono font-bold text-blue-900"
            />
            {errors.netWeight && <p className="text-red-600 text-xs mt-1">{errors.netWeight}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Gross Weight
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={grossWeight}
              onChange={e => setGrossWeight(parseFloat(e.target.value) || 0)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border tabular-nums font-mono"
            />
            {errors.grossWeight && <p className="text-red-600 text-xs mt-1">{errors.grossWeight}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Weight Unit
            </label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value as ProductUnit)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="kg">kg (Kilograms)</option>
              <option value="ton">ton (Metric Tons)</option>
              <option value="bale">bale (Bales)</option>
            </select>
          </div>
        </div>

        {/* Grade, Color, Quality Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Grade / Specification
            </label>
            <input
              type="text"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              placeholder="e.g. Prime Comber, GOTS Grade A"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Color Shade
            </label>
            <input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              placeholder="e.g. Raw Ecru, Bright White, Indigo"
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Quality Status *
            </label>
            <select
              value={qualityStatus}
              onChange={e => setQualityStatus(e.target.value as QualityStatus)}
              className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
            >
              <option value="Pending Inspection">Pending Inspection</option>
              <option value="Approved">Approved (Spinnable/Export)</option>
              <option value="On Hold">On Hold (Quarantine)</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Conditional Category Specific Fields: Yarn */}
        {isYarn && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Yarn Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Yarn Count</label>
                <input
                  type="text"
                  value={yarnCount}
                  onChange={e => setYarnCount(e.target.value)}
                  placeholder="e.g. Ne 20/1, Ne 10/1 OE"
                  className="w-full text-xs rounded border-amber-300 bg-white px-2.5 py-1.5 border"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Ply</label>
                <input
                  type="text"
                  value={yarnPly}
                  onChange={e => setYarnPly(e.target.value)}
                  placeholder="e.g. Single, 2-ply"
                  className="w-full text-xs rounded border-amber-300 bg-white px-2.5 py-1.5 border"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Cones / Cartons</label>
                <input
                  type="number"
                  value={conesOrCartons || ''}
                  onChange={e => setConesOrCartons(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="e.g. 720"
                  className="w-full text-xs rounded border-amber-300 bg-white px-2.5 py-1.5 border font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditional Category Specific Fields: Waste Cloth */}
        {isWasteCloth && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Waste Cloth & Fiber Parameters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">
                  Contamination / Trash %
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={contaminationPercentage !== undefined ? contaminationPercentage : ''}
                  onChange={e =>
                    setContaminationPercentage(e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="e.g. 1.2%"
                  className="w-full text-xs rounded border-emerald-300 bg-white px-2.5 py-1.5 border font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">Moisture %</label>
                <input
                  type="number"
                  step="0.1"
                  value={moisturePercentage !== undefined ? moisturePercentage : ''}
                  onChange={e => setMoisturePercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g. 7.5%"
                  className="w-full text-xs rounded border-emerald-300 bg-white px-2.5 py-1.5 border font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">
                  Bale Weight Range
                </label>
                <input
                  type="text"
                  value={baleWeightRange}
                  onChange={e => setBaleWeightRange(e.target.value)}
                  placeholder="e.g. 195-205 kg"
                  className="w-full text-xs rounded border-emerald-300 bg-white px-2.5 py-1.5 border"
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Lot Inspection & Storage Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Origin mill, press machine number, moisture check or storage condition remarks..."
            className="w-full text-sm rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-3 py-2 border"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 shadow-sm flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            {lotToEdit ? 'Update Lot' : 'Register Lot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
