import {
  Home,
  FileSignature,
  Wallet,
  Package,
  Users,
  BookOpen,
  FileSpreadsheet,
  Activity,
  Sparkles,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { UserRole, PermissionAction } from '../types';
import { PermissionManager } from '../utils/permissionManager';

export type NavTabId =
  | 'home'
  | 'agreements'
  | 'recovery'
  | 'stock'
  | 'customers'
  | 'cashbook'
  | 'reports'
  | 'activity_ledger'
  | 'ai_assistant'
  | 'settings';

export interface NavItemConfig {
  id: NavTabId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: LucideIcon;
  permission?: PermissionAction;
  inDock?: boolean; // Mobile bottom dock (4 main items)
  inMoreSheet?: boolean; // Secondary items sheet
  badgeType?: 'overdue' | 'low_stock';
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Home Command',
    shortLabel: 'Home',
    subtitle: 'KPIs & Daily Summary',
    icon: Home,
    inDock: true,
    inMoreSheet: false,
  },
  {
    id: 'agreements',
    label: 'Dispatches & Sales',
    shortLabel: 'Sales',
    subtitle: 'Signed Agreements & Booking',
    icon: FileSignature,
    inDock: true,
    inMoreSheet: false,
  },
  {
    id: 'recovery',
    label: 'Installment Recovery',
    shortLabel: 'Recovery',
    subtitle: 'Collections & Overdue Dues',
    icon: Wallet,
    badgeType: 'overdue',
    inDock: true,
    inMoreSheet: false,
  },
  {
    id: 'stock',
    label: 'Master Inventory',
    shortLabel: 'Stock',
    subtitle: 'Warehouse & Models Catalog',
    icon: Package,
    badgeType: 'low_stock',
    inDock: true,
    inMoreSheet: false,
  },
  {
    id: 'customers',
    label: 'Customer Directory',
    shortLabel: 'Customers',
    subtitle: 'Client Profiles & CNIC Verification',
    icon: Users,
    inDock: false,
    inMoreSheet: true,
  },
  {
    id: 'cashbook',
    label: 'Cashbook & Expenses',
    shortLabel: 'Cashbook',
    subtitle: 'Daily Outflows & Cash Drawer',
    icon: BookOpen,
    inDock: false,
    inMoreSheet: true,
  },
  {
    id: 'reports',
    label: 'Financial Audit & PnL',
    shortLabel: 'Reports',
    subtitle: 'Executive Margin Analysis',
    icon: FileSpreadsheet,
    permission: 'VIEW_SCREENS_REPORTS',
    inDock: false,
    inMoreSheet: true,
  },
  {
    id: 'activity_ledger',
    label: 'Activity Audit Ledger',
    shortLabel: 'Ledger',
    subtitle: 'Cryptographic Hash Chain Logs',
    icon: Activity,
    permission: 'VIEW_SCREENS_REPORTS',
    inDock: false,
    inMoreSheet: true,
  },
  {
    id: 'ai_assistant',
    label: 'AI Risk Evaluator',
    shortLabel: 'AI Risk',
    subtitle: 'Guarantor Risk Intelligence',
    icon: Sparkles,
    inDock: false,
    inMoreSheet: true,
  },
  {
    id: 'settings',
    label: 'System Settings',
    shortLabel: 'Settings',
    subtitle: 'Shop Profile, Users & Backup',
    icon: Settings,
    inDock: false,
    inMoreSheet: true,
  },
];

/**
  Normalizes legacy tab aliases to current canonical tab IDs.
 */
export function normalizeTabId(rawTab: string): NavTabId {
  if (rawTab === 'app_center' || rawTab === 'dashboard') return 'home';
  const found = NAV_ITEMS.find((n) => n.id === rawTab);
  if (found) return found.id;
  return 'home';
}

/**
  Filters navigation items visible for a given user role.
 */
export function getVisibleNavItems(role?: UserRole): NavItemConfig[] {
  if (!role) return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return PermissionManager.can(role, item.permission);
  });
}
