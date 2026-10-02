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
  Package,
} from 'lucide-react';
import { StockItem, ProductCategory, ShopSettings, CategoryItem } from '../types';
import { ListPicker } from './ListPicker';

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
  const [isNewModelMode, setIsNewModelMode] = useState<boolean>(stock.length === 0);

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

  // Handle existing item select
  const handleItemSelect = (item: StockItem) => {
    setSelectedStockItemId(item.id);
    setIsNewModelMode(false);
    setName(item.name);
    setCategory(item.category);
    setBrand(item.brand);
    setModel(item.model);
    setUnitCost(item.unitCost || Math.round(item.cashPrice * 0.85));
    setCashPrice(item.cashPrice);
    setInstalmentPrice(item.instalmentPrice);
    setMinDownPayment(item.minDownPayment);
    setCounterLocation(item.counterLocation || 'Counter #1 - Main Showroom');
  };

  const handleSwitchToNew = () => {
    setSelectedStockItemId('new');
    setIsNewModelMode(true);
    setName('');
    setModel('');
    setQuantity(1);
    setUnitCost(25000);
    setCashPrice(32000);
    setInstalmentPrice(38000);
    setMinDownPayment(6000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Please specify the product title or model name.');
      return;
    }

    if (quantity <= 0) {
      setValidationError('Quantity received must be at least 1.');
      return;
    }

    const serialNumbers = serialsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    onReceiveStock({
      supplierName,
      purchaseRef,
      receivedDate,
      stockItemId: isNewModelMode ? undefined : selectedStockItemId,
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
        style={{
          backgroundColor: 'var(--theme-surface-card)',
          borderColor: 'var(--theme-surface-border)',
        }}
      >
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto mb-1 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-2 rounded-full transition-all border hover:bg-surface-2 cursor-pointer"
          style={{
            backgroundColor: 'var(--theme-surface-input)',
            borderColor: 'var(--theme-surface-border)',
            color: 'var(--theme-text-secondary)',
          }}
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span
            className="text-caption font-bold uppercase tracking-wider font-mono-tabular"
            style={{ color: 'var(--theme-primary)' }}
          >
            Inventory Intake Terminal
          </span>
          <h2
            className="text-title font-extrabold font-heading text-text"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Receive Stock Delivery
          </h2>
          <p className="text-caption text-text-muted mt-0.5 font-medium">
            Log supplier shipments, inventory costs, and individual product serial/IMEI codes.
          </p>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border text-body-sm font-semibold bg-danger/10 text-danger border-danger/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-3.5 text-body-sm">
          {/* Supplier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-border bg-surface-input">
            <div>
              <label className="block font-bold mb-1 text-caption text-text">
                Supplier / Brand Factory
              </label>
              <input
                type="text"
                required
                placeholder="Haier, Dawlance, Honda, etc."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="m3-input p-2 text-body"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-caption text-text">
                Purchase Invoice #
              </label>
              <input
                type="text"
                value={purchaseRef}
                onChange={(e) => setPurchaseRef(e.target.value)}
                className="m3-input p-2 font-mono-tabular text-body"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-caption text-text">
                Received Date
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="m3-input p-2 font-mono-tabular text-body"
              />
            </div>
          </div>

          {/* Model Selection via ListPicker (List + Search) or New Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-caption text-text">
                Select Model Definition or Create New
              </label>
              <button
                type="button"
                onClick={handleSwitchToNew}
                className={`text-caption font-bold px-3 py-1 rounded-full border transition-all ${
                  isNewModelMode
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-2 border-border text-text hover:border-primary'
                }`}
              >
                + Define Brand New Model
              </button>
            </div>

            {!isNewModelMode && stock.length > 0 ? (
              <ListPicker<StockItem>
                type="stock"
                items={stock}
                selectedId={selectedStockItemId !== 'new' ? selectedStockItemId : undefined}
                onSelect={handleItemSelect}
                currencySymbol={settings.currencySymbol}
                placeholder="Search existing stock definition..."
                title="Choose Existing Product Specification"
                maxHeight="max-h-[200px]"
              />
            ) : (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-primary text-body-sm flex items-center justify-between">
                <span className="font-semibold">Defining New Product Model Specification</span>
                {stock.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModelMode(false);
                      if (stock[0]) handleItemSelect(stock[0]);
                    }}
                    className="text-caption font-bold underline"
                  >
                    Select from existing instead
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Product Specifications */}
          <div className="space-y-3 p-3.5 rounded-2xl border border-border bg-surface-input">
            <div>
              <label className="block font-bold mb-1 text-caption text-text">
                Product Title / Model Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Haier 1.5 Ton DC Inverter HSU-18HFP"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="m3-input p-2 font-bold text-body"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-caption text-text">Category Group *</label>
                  {onAddCategory && (
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                      className="text-caption font-bold text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showQuickAddCat ? 'Cancel' : 'New Group'}</span>
                    </button>
                  )}
                </div>

                {showQuickAddCat ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="e.g. Solar Generators"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="m3-input p-2 font-semibold text-body flex-1"
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
                      className="m3-btn-base m3-btn-filled text-caption px-3 font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(categories.length > 0
                      ? categories.map((c) => c.name)
                      : ['Home Appliances', 'Smartphones & Mobiles', 'Motorcycles & Bikes', 'Electronics & Displays']
                    ).map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCategory(catName)}
                        className={`px-2.5 py-1 rounded-full text-caption font-semibold border transition-all ${
                          category === catName
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-2 border-border text-text-muted hover:border-primary/50'
                        }`}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-1 text-caption text-text">
                  Counter / Storage Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Counter #1 - Main Display"
                  value={counterLocation}
                  onChange={(e) => setCounterLocation(e.target.value)}
                  className="m3-input p-2 font-semibold text-body"
                />
              </div>
            </div>

            {/* Quantity and Pricing */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
              <div>
                <label className="block font-bold mb-1 text-caption text-text">Quantity Received *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="m3-input p-2 font-bold font-mono-tabular text-body"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-caption text-text">Unit Cost (PKR)</label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="m3-input p-2 font-mono-tabular text-body"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-caption text-text">Cash Retail Price</label>
                <input
                  type="number"
                  value={cashPrice}
                  onChange={(e) => setCashPrice(Number(e.target.value))}
                  className="m3-input p-2 font-mono-tabular text-body"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1 text-caption text-text">Instalment Plan Price</label>
                <input
                  type="number"
                  value={instalmentPrice}
                  onChange={(e) => setInstalmentPrice(Number(e.target.value))}
                  className="m3-input p-2 font-bold font-mono-tabular text-body"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-caption text-text">Min Down Payment</label>
                <input
                  type="number"
                  value={minDownPayment}
                  onChange={(e) => setMinDownPayment(Number(e.target.value))}
                  className="m3-input p-2 font-mono-tabular text-body"
                />
              </div>
            </div>

            {/* Serials / IMEI */}
            <div>
              <label className="block font-bold mb-1 text-caption text-text">
                Serial / IMEI / Engine Numbers (1 per line)
              </label>
              <textarea
                rows={3}
                placeholder="ENG-CG125-984210&#10;ENG-CG125-984211&#10;ENG-CG125-984212"
                value={serialsText}
                onChange={(e) => setSerialsText(e.target.value)}
                className="m3-input p-2 font-mono-tabular text-body-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="m3-btn-base m3-btn-outlined text-body-sm py-2 px-4 font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="m3-btn-base m3-btn-filled text-body-sm py-2.5 px-6 shadow-md font-bold"
          >
            Save Stock Shipment
          </button>
        </div>
      </form>
    </div>
  );
};
