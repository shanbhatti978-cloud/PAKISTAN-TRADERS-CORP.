import React, { useState } from 'react';
import {
  X,
  PackageCheck,
  Building2,
  Tag,
  Hash,
  DollarSign,
  Plus,
  CheckCircle2,
  MapPin,
  FolderTree,
  AlertCircle,
} from 'lucide-react';
import { StockItem, ProductCategory, ShopSettings, CategoryItem } from '../types';

interface ReceiveStockModalProps {
  stock: StockItem[];
  categories?: CategoryItem[];
  settings: ShopSettings;
  onClose: () => void;
  onAddCategory?: (category: Omit<CategoryItem, 'id'>) => CategoryItem;
  onReceiveStock: (params: {
    supplierName: string;
    purchaseRef: string;
    receivedDate: string;
    stockItemId?: string;
    name: string;
    category: ProductCategory;
    brand: string;
    model: string;
    quantity: number;
    unitCost: number;
    cashPrice: number;
    instalmentPrice: number;
    minDownPayment: number;
    serialNumbers: string[];
    counterLocation: string;
    notes?: string;
  }) => void;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  stock,
  categories = [],
  settings,
  onClose,
  onAddCategory,
  onReceiveStock,
}) => {
  const [supplierName, setSupplierName] = useState('Atlas Honda / Haier Pakistan');
  const [purchaseRef, setPurchaseRef] = useState(`PO-${Date.now().toString().slice(-4)}`);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedStockItemId, setSelectedStockItemId] = useState<string>('new');

  // Item details
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.name || 'Home Appliances');
  const [brand, setBrand] = useState('Haier');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(25000);
  const [cashPrice, setCashPrice] = useState<number>(32000);
  const [instalmentPrice, setInstalmentPrice] = useState<number>(38000);
  const [minDownPayment, setMinDownPayment] = useState<number>(6000);
  const [serialsText, setSerialsText] = useState('');
  const [counterLocation, setCounterLocation] = useState('Counter #1 - Main Showroom');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Pre-fill if existing item selected
  const handleItemSelect = (id: string) => {
    setSelectedStockItemId(id);
    if (id === 'new') {
      setName('');
      setModel('');
      setQuantity(1);
      setUnitCost(25000);
      setCashPrice(32000);
      setInstalmentPrice(38000);
      setMinDownPayment(6000);
    } else {
      const existing = stock.find((s) => s.id === id);
      if (existing) {
        setName(existing.name);
        setCategory(existing.category);
        setBrand(existing.brand);
        setModel(existing.model);
        setUnitCost(existing.unitCost || Math.round(existing.cashPrice * 0.85));
        setCashPrice(existing.cashPrice);
        setInstalmentPrice(existing.instalmentPrice);
        setMinDownPayment(existing.minDownPayment);
        setCounterLocation(existing.counterLocation || 'Counter #1');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('Please enter a product title / model name.');
      return;
    }
    if (quantity <= 0) {
      setValidationError('Quantity received must be greater than zero.');
      return;
    }

    const serialNumbers = serialsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onReceiveStock({
      supplierName,
      purchaseRef,
      receivedDate,
      stockItemId: selectedStockItemId === 'new' ? undefined : selectedStockItemId,
      name,
      category: category as ProductCategory,
      brand,
      model: model || name,
      quantity,
      unitCost,
      cashPrice,
      instalmentPrice,
      minDownPayment,
      serialNumbers,
      counterLocation,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-xl p-5 sm:p-6 space-y-4 relative shadow-2xl max-h-[92vh] overflow-y-auto m3-bottom-sheet-slide sm:animate-in"
        style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}
      >
        {/* Drag Handle Pill for Mobile */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-1 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-2 rounded-full transition-all border"
          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-secondary)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-primary)' }}>Stock Shipment Intake</span>
          <h2 className="text-xl font-extrabold font-heading mt-0.5 flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <PackageCheck className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            Receive Stock Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Record incoming shipments for home appliances, mobiles, TVs, and bikes with counter location assignments.
          </p>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border text-xs animate-in" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)', color: 'var(--theme-primary)' }}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          
          {/* Supplier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Supplier / Factory</label>
              <input
                type="text"
                required
                placeholder="Haier, Dawlance, Honda, etc."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="m3-input p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Purchase Invoice #</label>
              <input
                type="text"
                value={purchaseRef}
                onChange={(e) => setPurchaseRef(e.target.value)}
                className="m3-input p-2 font-mono-tabular text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Received Date</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="m3-input p-2 font-mono-tabular text-xs"
              />
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Select Model / Item Definition</label>
            <select
              value={selectedStockItemId}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="m3-input p-2.5 font-bold text-xs"
            >
              <option value="new">+ Create New Product Model Definition</option>
              {stock.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          {/* Product Details */}
          <div className="space-y-3 p-3 rounded-xl border" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Product Title / Model Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Haier 1.5 Ton Inverter AC / Dawlance Fridge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="m3-input p-2 font-semibold text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Category Group *</label>
                  {onAddCategory && (
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                      className="text-[11px] font-bold flex items-center gap-0.5"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showQuickAddCat ? 'Cancel' : 'New Group'}</span>
                    </button>
                  )}
                </div>

                {showQuickAddCat ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Category name (e.g. Solar Systems)"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="m3-input p-2 font-semibold text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCatName.trim() && onAddCategory) {
                          const created = onAddCategory({
                            name: newCatName.trim(),
                            code: `CAT-${Date.now().toString().slice(-4)}`,
                            description: 'Custom Group',
                          });
                          setCategory(created.name);
                          setNewCatName('');
                          setShowQuickAddCat(false);
                        }
                      }}
                      className="m3-btn-base m3-btn-filled text-xs px-3"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="m3-input p-2 font-semibold text-xs"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Home Appliances">Home Appliances</option>
                        <option value="Smartphones & Mobiles">Smartphones & Mobiles</option>
                        <option value="Motorcycles & Bikes">Motorcycles & Bikes</option>
                        <option value="Electronics & Displays">Electronics & Displays</option>
                        <option value="Home Regular Usage Items">Home Regular Usage Items</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Counter / Storage Location</label>
                <input
                  type="text"
                  placeholder="e.g. Counter #1 - Main Display"
                  value={counterLocation}
                  onChange={(e) => setCounterLocation(e.target.value)}
                  className="m3-input p-2 font-semibold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Quantity Received *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="m3-input p-2 font-bold font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Unit Cost Price (PKR)</label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="m3-input p-2 font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Cash Retail Price</label>
                <input
                  type="number"
                  value={cashPrice}
                  onChange={(e) => setCashPrice(Number(e.target.value))}
                  className="m3-input p-2 font-mono-tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Instalment Plan Price</label>
                <input
                  type="number"
                  value={instalmentPrice}
                  onChange={(e) => setInstalmentPrice(Number(e.target.value))}
                  className="m3-input p-2 font-bold font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Min Down Payment</label>
                <input
                  type="number"
                  value={minDownPayment}
                  onChange={(e) => setMinDownPayment(Number(e.target.value))}
                  className="m3-input p-2 font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Serial / IMEI / Chassis Numbers (1 per line)</label>
              <textarea
                rows={3}
                placeholder="ENG-CG125-984210&#10;ENG-CG125-984211&#10;ENG-CG125-984212"
                value={serialsText}
                onChange={(e) => setSerialsText(e.target.value)}
                className="m3-input p-2 font-mono-tabular text-xs w-full"
              />
            </div>
          </div>

        </div>

        <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="m3-btn-base m3-btn-outlined text-xs py-2 px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="m3-btn-base m3-btn-filled text-xs py-2.5 px-6"
          >
            Save Stock Shipment
          </button>
        </div>
      </form>
    </div>
  );
};
