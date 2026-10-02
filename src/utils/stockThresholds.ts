import { CategoryItem, StockItem } from '../types';

export interface CategoryStockStatus {
  category: CategoryItem;
  threshold: number;
  availableUnits: number;
  totalReceived: number;
  totalIssued: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  affectedItems: StockItem[];
}

/**
 * Checks whether a given stock item belongs to a product category
 * Evaluates exact match, containment, and registered itemTypes.
 */
export function isStockItemInCategory(item: StockItem, cat: CategoryItem): boolean {
  if (!item || !cat) return false;
  const itemCat = (item.category || '').toLowerCase().trim();
  const catName = (cat.name || '').toLowerCase().trim();
  const catCode = (cat.code || '').toLowerCase().trim();

  if (itemCat === catName) return true;
  if (catCode && itemCat === catCode) return true;
  if (itemCat.includes(catName) || catName.includes(itemCat)) return true;

  if (cat.itemTypes && cat.itemTypes.length > 0) {
    const matched = cat.itemTypes.some((type) => {
      const typeLower = type.toLowerCase().trim();
      return (
        itemCat.includes(typeLower) ||
        typeLower.includes(itemCat) ||
        (item.name || '').toLowerCase().includes(typeLower)
      );
    });
    if (matched) return true;
  }

  return false;
}

/**
 * Calculates stock status, available physical count, and threshold compliance for each category.
 */
export function getCategoryStockStatuses(
  categories: CategoryItem[],
  stock: StockItem[]
): CategoryStockStatus[] {
  return categories.map((cat) => {
    const threshold = Math.max(1, cat.lowStockThreshold ?? 2);
    const catItems = stock.filter((s) => isStockItemInCategory(s, cat));

    const availableUnits = catItems
      .filter((s) => s.status === 'available')
      .reduce((sum, s) => sum + Math.max(0, s.inStock), 0);

    const totalReceived = catItems.reduce(
      (sum, s) => sum + (s.totalReceived || s.inStock || 0),
      0
    );

    const totalIssued = catItems.reduce(
      (sum, s) => sum + (s.totalIssued || (s.status === 'sold' ? 1 : 0)),
      0
    );

    const isOutOfStock = availableUnits === 0;
    const isLowStock = availableUnits <= threshold;

    // Items belonging to this category with low or depleted units
    const affectedItems = catItems.filter(
      (s) => s.status === 'available' && s.inStock <= threshold
    );

    return {
      category: cat,
      threshold,
      availableUnits,
      totalReceived,
      totalIssued,
      isLowStock,
      isOutOfStock,
      affectedItems,
    };
  });
}

/**
 * Returns only the categories that have fallen below or equal to their low stock threshold.
 */
export function getLowStockCategories(
  categories: CategoryItem[],
  stock: StockItem[]
): CategoryStockStatus[] {
  return getCategoryStockStatuses(categories, stock).filter((s) => s.isLowStock);
}

/**
 * Evaluates whether an individual stock item is at or below its category threshold.
 */
export function isItemLowStock(
  item: StockItem,
  categories: CategoryItem[]
): {
  isLow: boolean;
  threshold: number;
  categoryName: string;
  availableUnits: number;
} {
  const matchedCat = categories.find((c) => isStockItemInCategory(item, c));
  const threshold = Math.max(1, matchedCat?.lowStockThreshold ?? 2);
  const isLow = item.status === 'available' && item.inStock <= threshold;

  return {
    isLow,
    threshold,
    categoryName: matchedCat?.name || item.category,
    availableUnits: item.inStock,
  };
}
