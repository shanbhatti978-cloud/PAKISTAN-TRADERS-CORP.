import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Package,
  Boxes,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { CategoryItem, StockItem } from '../types';
import { getCategoryStockStatuses } from '../utils/stockThresholds';

interface CategoryThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  stock: StockItem[];
  onUpdateCategory: (id: string, updates: Partial<CategoryItem>) => void;
  onOpenReceiveStock?: () => void;
}

export const CategoryThresholdModal: React.FC<CategoryThresholdModalProps> = ({
  isOpen,
  onClose,
  categories,
  stock,
  onUpdateCategory,
  onOpenReceiveStock,
}) => {
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const statuses = getCategoryStockStatuses(categories, stock);
  const lowCount = statuses.filter((s) => s.isLowStock).length;
  const healthyCount = statuses.length - lowCount;

  const handleUpdate = (catId: string, newThreshold: number) => {
    const val = Math.max(1, Math.min(100, newThreshold));
    onUpdateCategory(catId, { lowStockThreshold: val });
    setJustUpdatedId(catId);
    setTimeout(() => {
      setJustUpdatedId((curr) => (curr === catId ? null : curr));
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="m3-card border rounded-t-[28px] sm:rounded-[28px] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-0 sm:my-auto m3-bottom-sheet-slide sm:animate-in" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
        {/* Drag Handle Pill for Mobile */}
        <div className="w-10 h-1 bg-slate-400/40 rounded-full mx-auto my-2 sm:hidden shrink-0" />
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b flex items-start justify-between gap-4 shrink-0" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                <Sliders className="w-3 h-3" />
                Inventory Safety Levels
              </span>
              {lowCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-bold font-mono-tabular flex items-center gap-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  <AlertTriangle className="w-3 h-3" />
                  {lowCount} Below Minimum Threshold
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                  <CheckCircle2 className="w-3 h-3" />
                  All Categories Healthy
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
              <span>Category Low-Stock Thresholds</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Configure minimum reserve units for each category. When physical stock reaches or drops below this threshold, automatic visual warning badges and alerts display on the Home Dashboard.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full transition-all border shrink-0"
            style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-secondary)' }}
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b text-xs" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
          <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
            <span className="text-slate-400 font-medium">Categories:</span>
            <span className="font-bold font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>{categories.length}</span>
          </div>
          <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
            <span className="font-medium text-slate-400">Low Stock:</span>
            <span className="font-extrabold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{lowCount}</span>
          </div>
          <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
            <span className="font-medium text-slate-400">Healthy:</span>
            <span className="font-extrabold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>{healthyCount}</span>
          </div>
        </div>

        {/* Scrollable Category Threshold List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 divide-y" style={{ borderColor: 'var(--theme-surface-border)' }}>
          {statuses.map(({ category, threshold, availableUnits, isLowStock, isOutOfStock }) => {
            const isSaved = justUpdatedId === category.id;

            return (
              <div
                key={category.id}
                className="pt-3.5 first:pt-0 rounded-2xl p-4 transition-all border"
                style={{
                  backgroundColor: isLowStock ? 'var(--theme-tonal-bg)' : 'var(--theme-surface-input)',
                  borderColor: isLowStock ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Category Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 font-mono-tabular rounded text-[10px] font-bold border" style={{ backgroundColor: 'var(--theme-surface-card)', color: 'var(--theme-primary)', borderColor: 'var(--theme-surface-border)' }}>
                        {category.code || `CAT-${category.id}`}
                      </span>
                      <h3 className="text-sm font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>
                        {category.name}
                      </h3>

                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                          Depleted (0 In Shop)
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock Alert ({availableUnits} left &le; {threshold})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-semibold text-slate-400" style={{ borderColor: 'var(--theme-surface-border)' }}>
                          Adequate ({availableUnits} units)
                        </span>
                      )}

                      {isSaved && (
                        <span className="px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', color: 'var(--theme-primary)', borderColor: 'var(--theme-tonal-border)' }}>
                          <CheckCircle2 className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>

                    {category.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {category.description}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-0.5">
                      <span>
                        Current Physical Stock:{' '}
                        <strong className="font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                          {availableUnits} Units
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Safe Reserve Level:{' '}
                        <strong className="font-mono-tabular" style={{ color: 'var(--theme-text-primary)' }}>
                          &gt; {threshold} Units
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Threshold Controls */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                        Minimum Threshold
                      </span>

                      <div className="flex items-center gap-1 border rounded-xl p-1" style={{ backgroundColor: 'var(--theme-surface-card)', borderColor: 'var(--theme-surface-border)' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdate(category.id, threshold - 1)}
                          disabled={threshold <= 1}
                          className="w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center transition-all border disabled:opacity-40"
                          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
                          title="Decrease threshold"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={threshold}
                          onChange={(e) => handleUpdate(category.id, parseInt(e.target.value) || 1)}
                          className="w-14 text-center bg-transparent font-extrabold font-mono-tabular text-sm focus:outline-none"
                          style={{ color: 'var(--theme-text-primary)' }}
                        />

                        <button
                          type="button"
                          onClick={() => handleUpdate(category.id, threshold + 1)}
                          className="w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center transition-all border"
                          style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}
                          title="Increase threshold"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick presets */}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px]">
                        <span className="text-slate-400 font-medium">Presets:</span>
                        {[1, 2, 3, 5, 10].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleUpdate(category.id, preset)}
                            className="px-1.5 py-0.5 rounded font-mono-tabular transition-all border"
                            style={{
                              backgroundColor: threshold === preset ? 'var(--theme-primary)' : 'var(--theme-surface-input)',
                              color: threshold === preset ? 'var(--theme-primary-foreground)' : 'var(--theme-text-secondary)',
                              borderColor: threshold === preset ? 'var(--theme-primary)' : 'var(--theme-surface-border)',
                            }}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span className="font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Tip:</span> Set higher thresholds (e.g. 5–10) for fast-selling items like mobile phones and iron appliances.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {lowCount > 0 && onOpenReceiveStock && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceiveStock();
                }}
                className="m3-btn-base m3-btn-tonal text-xs py-2.5 px-4 flex items-center justify-center gap-2"
              >
                <Boxes className="w-4 h-4" />
                <span>Restock Low Categories</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="m3-btn-base m3-btn-filled text-xs py-2.5 px-5"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
