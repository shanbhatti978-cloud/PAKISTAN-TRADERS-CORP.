import React, { useState } from 'react';
import {
  Package,
  Plus,
  Tag,
  Boxes,
  CheckCircle2,
  XCircle,
  X,
  Edit,
  Trash2,
  MapPin,
  TrendingUp,
  History,
  FolderTree,
  AlertTriangle,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { StockItem, ProductCategory, ShopSettings, StockMovement, CategoryItem } from '../types';
import { CategoryManagementView } from './CategoryManagementView';
import { CategoryThresholdModal } from './CategoryThresholdModal';
import { getCategoryStockStatuses, isItemLowStock } from '../utils/stockThresholds';
import { ExpandableSearch } from './ExpandableSearch';

interface StockViewProps {
  stock: StockItem[];
  categories: CategoryItem[];
  stockMovements: StockMovement[];
  settings: ShopSettings;
  searchQuery: string;
  setSearchQuery?: (query: string) => void;
  onAddStockItem: (itemData: Omit<StockItem, 'id'>) => void;
  onUpdateStockItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteStockItem: (id: string) => void;
  onOpenReceiveStock: () => void;
  onOpenNewBooking?: (itemId?: string) => void;
  onAddCategory: (category: Omit<CategoryItem, 'id'>) => CategoryItem;
  onUpdateCategory: (id: string, updates: Partial<CategoryItem>) => void;
  onDeleteCategory: (id: string) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  stock,
  categories,
  stockMovements,
  settings,
  searchQuery,
  setSearchQuery,
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
  onOpenReceiveStock,
  onOpenNewBooking,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [subTab, setSubTab] = useState<'inventory' | 'categories' | 'movements'>('inventory');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showThresholdSettingsModal, setShowThresholdSettingsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(categories[0]?.name || 'Home Appliances');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cashPrice, setCashPrice] = useState<number>(0);
  const [instalmentPrice, setInstalmentPrice] = useState<number>(0);
  const [minDownPayment, setMinDownPayment] = useState<number>(0);
  const [inStock, setInStock] = useState<number>(1);
  const [counterLocation, setCounterLocation] = useState('Main Showroom Counter #1');
  const [addStockValidationError, setAddStockValidationError] = useState<string | null>(null);

  const categoryNamesList: string[] = ['all', ...categories.map((c) => c.name)];
  const locations = ['all', ...Array.from(new Set(stock.map((s) => s.counterLocation || 'Main Showroom')))];

  const categoryStatuses = getCategoryStockStatuses(categories, stock);
  const lowStockCategories = categoryStatuses.filter((s) => s.isLowStock);
  const lowStockCatNames = lowStockCategories.map((c) => c.category.name.toLowerCase().trim());

  const filtered = stock.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.counterLocation || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLoc = selectedLocation === 'all' || item.counterLocation === selectedLocation;

    const itemLowInfo = isItemLowStock(item, categories);
    const isItemLow =
      item.status === 'available' &&
      (itemLowInfo.isLow || lowStockCatNames.includes(item.category.toLowerCase().trim()));

    const matchesLowFilter = !showOnlyLowStock || isItemLow;

    return matchesSearch && matchesCat && matchesLoc && matchesLowFilter;
  });

  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddStockValidationError(null);
    if (!name.trim()) {
      setAddStockValidationError('Please enter a product title.');
      return;
    }
    if (cashPrice <= 0 || instalmentPrice <= 0) {
      setAddStockValidationError('Cash price and instalment price must be greater than zero.');
      return;
    }

    onAddStockItem({
      name,
      category,
      brand,
      model,
      serialNumber,
      unitCost: Math.round(cashPrice * 0.85),
      cashPrice,
      instalmentPrice,
      minDownPayment,
      inStock,
      totalReceived: inStock,
      totalIssued: 0,
      counterLocation: counterLocation || 'Main Showroom Counter #1',
      status: inStock > 0 ? 'available' : 'sold',
    });

    setShowAddModal(false);
    setName('');
    setCashPrice(0);
    setInstalmentPrice(0);
    setSerialNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Header */}
      <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
        <button
          onClick={() => setSubTab('inventory')}
          className="px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 border"
          style={{
            backgroundColor: subTab === 'inventory' ? 'var(--theme-tonal-bg)' : 'transparent',
            color: subTab === 'inventory' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            borderColor: subTab === 'inventory' ? 'var(--theme-primary)' : 'transparent',
          }}
        >
          <Boxes className="w-4 h-4" />
          <span>Stock Inventory ({stock.length})</span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className="px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-2 border"
          style={{
            backgroundColor: subTab === 'categories' ? 'var(--theme-tonal-bg)' : 'transparent',
            color: subTab === 'categories' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            borderColor: subTab === 'categories' ? 'var(--theme-primary)' : 'transparent',
          }}
        >
          <FolderTree className="w-4 h-4" />
          <span>Category Groups ({categories.length})</span>
          {lowStockCategories.length > 0 && (
            <span className="px-2 py-0.5 rounded-full border text-caption font-mono-tabular font-extrabold" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
              {lowStockCategories.length} Low
            </span>
          )}
        </button>

        {stockMovements.length > 0 && (
          <button
            onClick={() => setSubTab('movements')}
            className="px-4 py-2 text-body-sm font-bold rounded-full transition-all flex items-center gap-2 border"
            style={{
              backgroundColor: subTab === 'movements' ? 'var(--theme-tonal-bg)' : 'transparent',
              color: subTab === 'movements' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
              borderColor: subTab === 'movements' ? 'var(--theme-primary)' : 'transparent',
            }}
          >
            <History className="w-4 h-4" />
            <span>Movements Log</span>
          </button>
        )}
      </div>

      {subTab === 'categories' ? (
        <CategoryManagementView
          categories={categories}
          stock={stock}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      ) : subTab === 'movements' ? (
        <div className="m3-card p-5 space-y-4">
          <h2 className="text-title font-bold flex items-center gap-2 font-heading" style={{ color: 'var(--theme-text-primary)' }}>
            <History className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            Stock Movements Log
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b text-caption font-bold uppercase tracking-wider text-text-muted" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Serial / IMEI</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Ref Document</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono-tabular" style={{ borderColor: 'var(--theme-surface-border)' }}>
                {stockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-primary/5">
                    <td className="p-3 text-text-muted">{m.date}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full text-caption font-bold uppercase border" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold" style={{ color: 'var(--theme-text-primary)' }}>{m.itemName}</td>
                    <td className="p-3">{m.serialNumber || 'N/A'}</td>
                    <td className="p-3 font-bold">{m.quantity}</td>
                    <td className="p-3 text-text-muted">{m.refDocument}</td>
                    <td className="p-3">{m.counterLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Header Bar */}
          <div className="m3-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-heading font-extrabold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
                <Boxes className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                Master Inventory & Booking
              </h1>
              <p className="text-caption text-text-muted mt-0.5 font-medium">
                Total {stock.length} models in showroom & warehouse • Available units ready for customer booking.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-end">
              <ExpandableSearch
                value={searchQuery}
                onChange={(val) => setSearchQuery?.(val)}
                placeholder="Search stock"
                resultCount={{ current: filtered.length, total: stock.length }}
                recentKey="stock"
                shortcut="/"
                chipLabelPrefix="Stock"
              />

              <button
                type="button"
                onClick={() => setShowThresholdSettingsModal(true)}
                className="m3-btn-base m3-btn-outlined text-body-sm font-bold"
                title="Configure low-stock minimum thresholds"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Threshold Settings</span>
                <span className="sm:hidden">Thresholds</span>
              </button>

              <button
                onClick={onOpenReceiveStock}
                className="m3-btn-base m3-btn-tonal text-body-sm font-bold shrink-0"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Receive</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="m3-btn-base m3-btn-filled text-body-sm font-bold shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Model</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="m3-card p-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-surface-variant text-text-muted">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-title font-bold text-text">No inventory match found</h3>
              <p className="text-body-sm text-text-muted max-w-md mx-auto">
                {searchQuery
                  ? `No match. Try name, CNIC, phone or serial.`
                  : 'No inventory items in stock.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery?.('')}
                  className="m3-btn-base m3-btn-tonal text-caption py-2 px-4 font-bold"
                >
                  Clear Search Query
                </button>
              )}
            </div>
          )}

          {/* Grid of Stock Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="m3-card p-4 flex flex-col justify-between space-y-3 hover:border-current transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-bold px-2.5 py-1 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      {item.category}
                    </span>
                    <span className="text-caption font-semibold px-2.5 py-1 rounded-full border font-mono-tabular" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                      {item.inStock > 0 ? `${item.inStock} Available` : 'Out of Stock'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-title font-bold font-heading text-text" style={{ color: 'var(--theme-text-primary)' }}>
                      {item.name}
                    </h3>
                    <div className="text-caption text-text-muted font-mono-tabular mt-0.5 font-medium">
                      Brand: {item.brand} | Model: {item.model}
                    </div>
                    {item.serialNumber && (
                      <div className="text-caption text-text-muted font-mono-tabular mt-0.5 font-medium">
                        S/N: {item.serialNumber}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t text-body-sm grid grid-cols-2 gap-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
                    <div>
                      <div className="text-text-muted text-caption font-bold">Cash Price</div>
                      <div className="font-extrabold font-mono-tabular text-body" style={{ color: 'var(--theme-text-primary)' }}>
                        {settings.currencySymbol} {item.cashPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-muted text-caption font-bold">Instalment Price</div>
                      <div className="font-extrabold font-mono-tabular text-body" style={{ color: 'var(--theme-primary)' }}>
                        {settings.currencySymbol} {item.instalmentPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--theme-surface-border)' }}>
                  {item.inStock > 0 && onOpenNewBooking && (
                    <button
                      onClick={() => onOpenNewBooking(item.id)}
                      className="m3-btn-base m3-btn-filled text-body-sm py-2 flex-1 font-bold"
                    >
                      <span>Book Instalment</span>
                    </button>
                  )}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="m3-btn-base m3-btn-outlined text-body-sm py-2 px-3 font-bold"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Threshold Settings Modal */}
      {showThresholdSettingsModal && (
        <CategoryThresholdModal
          isOpen={showThresholdSettingsModal}
          onClose={() => setShowThresholdSettingsModal(false)}
          categories={categories}
          stock={stock}
          onUpdateCategory={onUpdateCategory}
          onOpenReceiveStock={onOpenReceiveStock}
        />
      )}

    </div>
  );
};
