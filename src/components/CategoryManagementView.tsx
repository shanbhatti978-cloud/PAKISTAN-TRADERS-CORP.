import React, { useState } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Package,
  Layers,
  Tag,
  Check,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { CategoryItem, StockItem } from '../types';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold uppercase tracking-wider">
              Inventory Groups
            </span>
            <span className="text-slate-400 text-xs">• {categories.length} Groups Defined</span>
          </div>
          <h1 className="text-xl font-extrabold text-white font-heading mt-1 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            Stock Categories Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define, organize, and group inventory items (e.g. Home Appliances, Mobiles, Bikes, TVs) for easy stock intake and sales.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Define New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search categories by name, code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const itemCount = getItemCount(cat.name);

          return (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-950 text-emerald-400 font-mono-tabular rounded-lg text-[10px] font-bold border border-slate-800">
                    {cat.code || `CAT-${cat.id}`}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-semibold flex items-center gap-1 font-mono-tabular">
                    <Package className="w-3 h-3 text-emerald-400" />
                    {itemCount} Models
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                {cat.itemTypes && cat.itemTypes.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Sub-Types / Products:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.itemTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded text-[11px] font-medium border border-slate-800"
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
                      className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                        isLowStock
                          ? 'bg-rose-950/40 border-rose-500/50 shadow-sm shadow-rose-950/20'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <AlertTriangle
                            className={`w-3.5 h-3.5 ${
                              isLowStock ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                            }`}
                          />
                          <span className={isLowStock ? 'text-rose-300 font-extrabold' : 'text-slate-300'}>
                            Low-Stock Threshold:
                          </span>
                        </span>

                        {/* Quick inline threshold +/- controls */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateThreshold(cat, -1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                            title="Decrease low stock threshold by 1"
                          >
                            -
                          </button>
                          <span className="font-black font-mono-tabular text-xs text-white px-1">
                            {threshold} units
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickUpdateThreshold(cat, 1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-all"
                            title="Increase low stock threshold by 1"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
                        <span className="text-slate-400">Available In Stock:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-tabular font-bold text-white">
                            {availableUnits} Units
                          </span>
                          {isLowStock ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
                              ⚠️ Low Stock
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase">
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
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  Group ID: #{cat.id}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-700 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(cat)}
                    title="Delete Category"
                    className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-950 rounded-lg hover:bg-rose-950/30 transition-all"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-slate-900 border border-slate-800 rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl relative m3-bottom-sheet-slide sm:animate-in"
          >
            {/* Android Material 3 Drag Handle Pill for Mobile */}
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Create Inventory Group
                </span>
                <h2 className="text-lg font-bold text-white font-heading">
                  Define New Category
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Close dialog"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formValidationError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs animate-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formValidationError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Category Name * (e.g. Home Appliances, Mobile, Bikes)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Appliances"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Group Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CAT-HA"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Low-Stock Warning (Min Units) *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-white font-mono-tabular font-bold"
                  />
                </div>
              </div>

              {/* Quick threshold presets */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Presets:</span>
                {[1, 2, 3, 5, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLowStockThreshold(val)}
                    className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                      lowStockThreshold === val
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {val} {val === 1 ? 'unit' : 'units'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Refrigerators, Deep Freezers, Air Conditioners & Washing Machines"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
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
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemType}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs"
                  >
                    + Add
                  </button>
                </div>

                {itemTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {itemTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-950 text-slate-200 rounded-lg text-xs font-semibold border border-slate-800 flex items-center gap-1.5"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemType(type)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleEditSubmit}
            className="bg-slate-900 border border-slate-800 rounded-t-[28px] sm:rounded-[28px] w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl relative m3-bottom-sheet-slide sm:animate-in"
          >
            {/* Android Material 3 Drag Handle Pill for Mobile */}
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Update Category
                </span>
                <h2 className="text-lg font-bold text-white font-heading">
                  Edit Category Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                aria-label="Close dialog"
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Group Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Low-Stock Warning (Min Units) *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value)))}
                    className="w-full p-2.5 bg-slate-950 border border-amber-500/50 rounded-xl text-white font-mono-tabular font-bold"
                  />
                </div>
              </div>

              {/* Quick threshold presets */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Presets:</span>
                {[1, 2, 3, 5, 10].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLowStockThreshold(val)}
                    className={`px-2 py-1 rounded-lg font-bold text-xs transition-all ${
                      lowStockThreshold === val
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {val} {val === 1 ? 'unit' : 'units'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
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
                    className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemType}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs"
                  >
                    + Add
                  </button>
                </div>

                {itemTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {itemTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-950 text-slate-200 rounded-lg text-xs font-semibold border border-slate-800 flex items-center gap-1.5"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemType(type)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
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
