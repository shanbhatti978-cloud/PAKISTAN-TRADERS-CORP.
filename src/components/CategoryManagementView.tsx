import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { CategoryItem, StockItem } from '../types';
import { ExpandableSearch } from './ExpandableSearch';

interface CategoryManagementViewProps {
  categories: CategoryItem[];
  stock: StockItem[];
  onAddCategory: (category: Omit<CategoryItem, 'id'>) => CategoryItem;
  onUpdateCategory: (id: string, updates: Partial<CategoryItem>) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({
  categories,
  stock,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State for Add / Edit
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(3);
  const [itemTypeInput, setItemTypeInput] = useState('');
  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Count items per category
  const getItemCount = (categoryName: string) => {
    return stock.filter(
      (s) => s.category.toLowerCase().trim() === categoryName.toLowerCase().trim()
    ).length;
  };

  // Count available in-stock units per category
  const getAvailableUnitsCount = (categoryName: string) => {
    return stock
      .filter(
        (s) =>
          s.category.toLowerCase().trim() === categoryName.toLowerCase().trim() &&
          s.status === 'available'
      )
      .reduce((sum, s) => sum + s.inStock, 0);
  };

  const handleOpenAddModal = () => {
    setName('');
    setCode(`CAT-${Math.floor(1000 + Math.random() * 9000)}`);
    setDescription('');
    setLowStockThreshold(3);
    setItemTypes([]);
    setItemTypeInput('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code || `CAT-${cat.id}`);
    setDescription(cat.description || '');
    setLowStockThreshold(cat.lowStockThreshold ?? 2);
    setItemTypes(cat.itemTypes || []);
    setItemTypeInput('');
  };

  const handleQuickUpdateThreshold = (cat: CategoryItem, delta: number) => {
    const current = cat.lowStockThreshold ?? 2;
    const nextVal = Math.max(1, current + delta);
    onUpdateCategory(cat.id, { lowStockThreshold: nextVal });
  };

  const handleAddItemType = () => {
    const trimmed = itemTypeInput.trim();
    if (trimmed && !itemTypes.includes(trimmed)) {
      setItemTypes([...itemTypes, trimmed]);
      setItemTypeInput('');
    }
  };

  const handleRemoveItemType = (typeToRemove: string) => {
    setItemTypes(itemTypes.filter((t) => t !== typeToRemove));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);
    if (!name.trim()) {
      setFormValidationError('Please enter a category name.');
      return;
    }

    onAddCategory({
      name: name.trim(),
      code: code.trim() || `CAT-${Date.now().toString().slice(-4)}`,
      description: description.trim(),
      lowStockThreshold: Math.max(1, Number(lowStockThreshold) || 2),
      itemTypes,
    });

    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !name.trim()) return;

    onUpdateCategory(editingCategory.id, {
      name: name.trim(),
      code: code.trim(),
      description: description.trim(),
      lowStockThreshold: Math.max(1, Number(lowStockThreshold) || 2),
      itemTypes,
    });

    setEditingCategory(null);
  };

  const handleDelete = (cat: CategoryItem) => {
    const count = getItemCount(cat.name);
    if (count > 0) {
      if (
        !window.confirm(
          `Warning: "${cat.name}" has ${count} registered stock items. Are you sure you want to delete this category group?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete the category group "${cat.name}"?`)) {
        return;
      }
    }
    onDeleteCategory(cat.id);
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      (cat.code && cat.code.toLowerCase().includes(q)) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="m3-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-primary-container text-on-primary-container border border-border text-caption font-bold uppercase tracking-wider">
              Inventory Groups
            </span>
            <span className="text-text-muted text-caption font-semibold">• {categories.length} Groups Defined</span>
          </div>
          <h1 className="text-heading font-extrabold text-text font-heading mt-1 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            Stock Categories Management
          </h1>
          <p className="text-caption text-text-muted mt-0.5 font-medium">
            Define, organize, and group inventory items (e.g. Home Appliances, Mobiles, Bikes, TVs) for easy stock intake and sales.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <ExpandableSearch
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            placeholder="Search categories"
            resultCount={{ current: filteredCategories.length, total: categories.length }}
            recentKey="categories"
            shortcut="/"
            chipLabelPrefix="Category"
          />

          <button
            onClick={handleOpenAddModal}
            className="m3-btn-base m3-btn-filled text-body-sm font-bold py-2.5 px-4 shadow-1 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Define New Category</span>
            <span className="sm:hidden">New Category</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="m3-card p-10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center bg-surface-variant text-text-muted">
            <FolderTree className="w-6 h-6" />
          </div>
          <h3 className="text-title font-bold text-text">No category matches found</h3>
          <p className="text-body-sm text-text-muted max-w-md mx-auto">
            {searchQuery
              ? `No match. Try name, CNIC, phone or serial.`
              : 'No category groups defined yet.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="m3-btn-base m3-btn-tonal text-caption py-2 px-4 font-bold"
            >
              Clear Search Query
            </button>
          )}
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const itemCount = getItemCount(cat.name);

          return (
            <div
              key={cat.id}
              className="m3-card p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-surface-2 text-primary font-mono-tabular rounded-lg text-caption font-bold border border-border">
                    {cat.code || `CAT-${cat.id}`}
                  </span>
                  <span className="px-2.5 py-1 bg-primary-container text-on-primary-container rounded text-caption font-bold flex items-center gap-1 font-mono-tabular">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    {itemCount} Models
                  </span>
                </div>

                <div>
                  <h3 className="text-title font-bold text-text font-heading">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-caption text-text-muted mt-1 line-clamp-2 leading-relaxed font-medium">
                      {cat.description}
                    </p>
                  )}
                </div>

                {cat.itemTypes && cat.itemTypes.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-caption font-bold text-text-muted uppercase tracking-wider block">
                      Sub-Types / Products:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.itemTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-surface-2 text-text-muted rounded text-caption font-semibold border border-border"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Low-Stock Threshold Configuration & Stock Status */}
                {(() => {
                  const availableUnits = getAvailableUnitsCount(cat.name);
                  const threshold = cat.lowStockThreshold ?? 2;
                  const isLowStock = availableUnits <= threshold;

                  return (
                    <div
                      className={`p-3 rounded-xl border text-body-sm space-y-2 transition-all ${
                        isLowStock
                          ? 'bg-danger-container/50 border-danger/50 text-on-danger-container'
                          : 'bg-surface-2 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <AlertTriangle
                            className={`w-3.5 h-3.5 ${
                              isLowStock ? 'text-danger animate-pulse' : 'text-warning'
                            }`}
                          />
                          <span className={isLowStock ? 'text-danger font-extrabold' : 'text-text'}>
                            Low-Stock Threshold:
                          </span>
                        </span>

                        {/* Quick inline threshold +/- controls */}
                        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateThreshold(cat, -1)}
                            className="w-6 h-6 rounded bg-surface-2 hover:bg-border text-text flex items-center justify-center font-bold text-caption active:scale-95 transition-all cursor-pointer"
                            title="Decrease low stock threshold by 1"
                          >
                            -
                          </button>
                          <span className="font-black font-mono-tabular text-caption text-text px-1">
                            {threshold} units
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateThreshold(cat, 1)}
                            className="w-6 h-6 rounded bg-surface-2 hover:bg-border text-text flex items-center justify-center font-bold text-caption active:scale-95 transition-all cursor-pointer"
                            title="Increase low stock threshold by 1"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-caption pt-1.5 border-t border-border font-medium">
                        <span className="text-text-muted">Available In Stock:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-tabular font-bold text-text">
                            {availableUnits} Units
                          </span>
                          {isLowStock ? (
                            <span className="px-2 py-0.5 rounded bg-danger-container text-on-danger-container border border-border text-caption font-black uppercase tracking-wider animate-pulse">
                              ⚠️ Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-success-container text-on-success-container border border-border text-caption font-bold uppercase">
                              ✓ Normal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-caption text-text-muted font-bold font-mono-tabular">
                  Group ID: #{cat.id}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="m3-btn-base m3-btn-tonal text-body-sm font-bold py-1.5 px-3.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-primary" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(cat)}
                    title="Delete Category"
                    className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-surface border border-border rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5 sm:p-6 space-y-4 shadow-3 relative"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Create Inventory Group
                </span>
                <h2 className="text-lg font-bold text-text font-heading">
                  Define New Category
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
                className="p-1.5 text-text-subtle hover:text-text bg-surface-2 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formValidationError && (
              <div className="flex items-center gap-2 p-3 bg-danger-container text-on-danger-container border border-border rounded-xl text-xs animate-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  Category Name * (e.g. Home Appliances, Mobile, Bikes)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Appliances"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="m3-input font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">Group Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CAT-HA"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="m3-input text-xs font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-warning font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Low-Stock Warning *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                    className="m3-input text-xs font-mono-tabular font-bold"
                  />
                </div>
              </div>

              {/* Quick threshold presets */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] text-text-subtle font-semibold mr-1">Presets:</span>
                {[1, 2, 3, 5, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLowStockThreshold(val)}
                    className={`px-2 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      lowStockThreshold === val
                        ? 'bg-primary text-on-primary font-black'
                        : 'bg-surface-2 text-text-muted hover:bg-border'
                    }`}
                  >
                    {val} {val === 1 ? 'unit' : 'units'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Refrigerators, Deep Freezers, Air Conditioners & Washing Machines"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="m3-input text-xs"
                />
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  Sub-Types / Included Items
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Refrigerators"
                    value={itemTypeInput}
                    onChange={(e) => setItemTypeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItemType();
                      }
                    }}
                    className="m3-input text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemType}
                    className="m3-btn-base m3-btn-tonal text-xs py-2 px-3"
                  >
                    + Add
                  </button>
                </div>

                {itemTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {itemTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-surface-2 text-text rounded-lg text-xs font-semibold border border-border flex items-center gap-1.5"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemType(type)}
                          className="text-text-subtle hover:text-danger"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="m3-btn-base m3-btn-outlined text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="m3-btn-base m3-btn-filled text-xs py-2 px-5"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-scrim backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-surface border border-border rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5 sm:p-6 space-y-4 shadow-3 relative"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Update Category
                </span>
                <h2 className="text-lg font-bold text-text font-heading">
                  Edit Category Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                aria-label="Close dialog"
                className="p-1.5 text-text-subtle hover:text-text bg-surface-2 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text-muted font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="m3-input text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-muted font-semibold mb-1">Group Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="m3-input text-xs font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-warning font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Low-Stock Warning *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                    className="m3-input text-xs font-mono-tabular font-bold"
                  />
                </div>
              </div>

              {/* Quick threshold presets */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] text-text-subtle font-semibold mr-1">Presets:</span>
                {[1, 2, 3, 5, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLowStockThreshold(val)}
                    className={`px-2 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      lowStockThreshold === val
                        ? 'bg-primary text-on-primary font-black'
                        : 'bg-surface-2 text-text-muted hover:bg-border'
                    }`}
                  >
                    {val} {val === 1 ? 'unit' : 'units'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="m3-input text-xs"
                />
              </div>

              <div>
                <label className="block text-text-muted font-semibold mb-1">
                  Sub-Types / Included Items
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add item sub-type"
                    value={itemTypeInput}
                    onChange={(e) => setItemTypeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItemType();
                      }
                    }}
                    className="m3-input text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemType}
                    className="m3-btn-base m3-btn-tonal text-xs py-2 px-3"
                  >
                    + Add
                  </button>
                </div>

                {itemTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {itemTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-surface-2 text-text rounded-lg text-xs font-semibold border border-border flex items-center gap-1.5"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemType(type)}
                          className="text-text-subtle hover:text-danger"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="m3-btn-base m3-btn-outlined text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="m3-btn-base m3-btn-filled text-xs py-2 px-5"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
