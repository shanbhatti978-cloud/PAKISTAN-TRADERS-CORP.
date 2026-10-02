export type CustomerRating = 'good' | 'watch' | 'defaulter';

export interface Guarantor {
  name: string;
  cnic: string;
  phone: string;
  relation: string;
  address: string;
}

export interface Customer {
  id: string;
  customerCode: string; // e.g. CUST-001
  cnic: string; // e.g. 35202-8492019-1
  fullName: string;
  phone: string;
  altPhone?: string;
  address: string;
  city: string;
  guarantor1: Guarantor;
  guarantor2?: Guarantor;
  photoUrl?: string;
  notes?: string;
  rating: CustomerRating;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  code: string; // e.g. CAT-HA, CAT-MB
  description?: string;
  itemTypes?: string[]; // e.g. ["Refrigerators", "Deep Freezers", "Air Conditioners"]
  lowStockThreshold?: number; // Minimum stock threshold before warning trigger (e.g. 2, 3, 5)
}

export type ProductCategory = string;

export interface StockItem {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  model: string;
  serialNumber: string; // IMEI / Chassis / Serial #
  unitCost: number; // Actual original purchase price paid by corporation (NEVER overwritten)
  landedCost?: number; // Freight / taxes / additional landed cost
  cashPrice: number;
  instalmentPrice: number;
  minDownPayment: number;
  inStock: number;
  totalReceived: number;
  totalIssued: number;
  counterLocation: string; // e.g. "Counter #1 - Main Display", "Warehouse Rack B", "Shelf 4"
  status: 'available' | 'sold' | 'reserved' | 'returned' | 'damaged';
  supplierName?: string;
  purchaseRef?: string;
  purchaseDate?: string;
  imageUrl?: string;
  specifications?: string;
}

export interface StockReceipt {
  id: string;
  supplierName: string;
  purchaseRef: string; // Invoice / Reference #
  receivedDate: string;
  modelName: string;
  counterLocation: string;
  quantity: number;
  unitCost: number;
  serialNumbers: string[];
  notes?: string;
}

export type StockMovementType =
  | 'RECEIVED'
  | 'ISSUED'
  | 'CUSTOMER_RETURN'
  | 'SUPPLIER_RETURN'
  | 'DAMAGED'
  | 'COUNTER_TRANSFER'
  | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  date: string;
  type: StockMovementType;
  stockItemId: string;
  itemName: string;
  serialNumber?: string;
  quantity: number;
  refDocument: string; // Master Code, Receipt #, Supplier Invoice #
  counterLocation: string;
  actor: string;
  reason?: string;
}

export interface InstalmentDueDate {
  installmentNumber: number; // 1, 2, 3...
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  status: 'paid' | 'pending' | 'partially_paid' | 'overdue';
  paidDate?: string;
  receiptNumber?: string;
}

export interface Agreement {
  id: string;
  agreementNumber: string; // e.g. AGR-2026-1001 or SHOP-A-D01-000001
  customerId: string;
  customerCode: string;
  itemId: string;
  itemName: string;
  itemSerial: string;
  unitCost: number; // Stored actual inventory purchase cost for exact COGS and Gross Margin (Shop Kareed)
  purchaseDate?: string; // Date shop purchased item
  deliveryDate?: string; // Date item given / dispatched to customer
  cashPrice: number;
  interestPercentage?: number; // Manual interest / profit percentage entered e.g. 15% or 20%
  markupAmount?: number; // Markup amount in PKR
  totalInstalmentPrice: number;
  downPayment: number;
  remainingBalance: number;
  monthDuration: number; // e.g. 6, 12, 18, 24
  monthlyInstalment: number;
  dueDayOfMonth: number; // 1 - 30
  startDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'defaulter';
  schedule: InstalmentDueDate[];
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. RCP-2026-4011
  agreementId: string;
  customerId: string;
  customerName: string;
  installmentNumbers: number[]; // which installments were paid or partial
  amountPaid: number;
  lateFee: number;
  discount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa';
  date: string;
  collectorName: string;
  isReversed?: boolean;
  notes?: string;
}

export interface PaymentReversal {
  id: string;
  paymentId: string;
  receiptNumber: string;
  agreementId: string;
  amountReversed: number;
  reversedAt: string;
  reversedBy: string;
  reason: string;
}

export interface CashBookEntry {
  id: string;
  date: string;
  type: 'in' | 'out';
  category: 'Instalment Recovery' | 'Down Payment' | 'Stock Purchase' | 'Shop Rent' | 'Utility Bills' | 'Staff Salary' | 'Refund Reversal' | 'Misc Expense' | 'Capital In';
  amount: number;
  referenceNumber: string;
  description: string;
}

export type M3ThemeColor = 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'teal' | 'indigo';

export type DrawerSidePreference = 'left' | 'right' | 'auto';

export type FontSizePreference = 'normal' | 'large' | 'extra_large';

export interface ShopSettings {
  shopName: string;
  proprietorName: string;
  phone: string;
  address: string;
  city: string;
  regNumber: string;
  currencySymbol: string;
  pinCode: string; // Default '1234'
  isLocked: boolean;
  themeMode?: 'dark' | 'light';
  colorScheme?: string;
  drawerSide?: DrawerSidePreference;
  liteMode?: boolean;
  animatedBackground?: boolean;
  fontSize?: FontSizePreference;
}

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Stored securely with per-user salt
  salt?: string; // Per-user cryptographic salt
  fullName: string;
  role: UserRole;
  createdAt: string;
  isDemo?: boolean; // True for default seed demo accounts
  isActive?: boolean; // False when account is disabled
  mustChangePassword?: boolean; // True for temporary accounts or admin reset
  failedAttempts?: number; // Failed login attempts counter
  lockoutUntil?: string; // Timestamp ISO string if account is locked out
  lastLoginAt?: string; // Timestamp ISO string of last successful login
}

export type PermissionAction =
  | 'VIEW_SCREENS_REPORTS'
  | 'ADD_ITEM'
  | 'EDIT_ITEM'
  | 'DELETE_ITEM'
  | 'CHANGE_RECOVERY_AMOUNT'
  | 'ADD_RECOVERY'
  | 'CHANGE_AGREEMENT'
  | 'DELETE_AGREEMENT'
  | 'ADD_AGREEMENT'
  | 'ADD_RELATED_ENTRIES'
  | 'MODIFY_AUDIT_REPORT'
  | 'REVERSE_PAYMENT'
  | 'EXPORT_REPORTS'
  | 'MANAGE_USERS';

export type LedgerActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'VIEW_REPORT'
  | 'ADD_ITEM'
  | 'EDIT_ITEM'
  | 'DELETE_ITEM'
  | 'ADD_RECOVERY'
  | 'EDIT_RECOVERY_AMOUNT'
  | 'ADD_AGREEMENT'
  | 'EDIT_AGREEMENT'
  | 'DELETE_AGREEMENT'
  | 'ADD_ENTRY'
  | 'REVERSE_PAYMENT'
  | 'EXPORT'
  | 'DENIED'
  | 'DEMO_ACCOUNTS_REMOVED'
  | 'USER_CREATED'
  | 'USER_EDITED'
  | 'ROLE_CHANGED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'USER_UNLOCKED'
  | 'USER_LOCKED';

export interface ActivityLedgerEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  username: string;
  role: UserRole;
  actionType: LedgerActionType;
  module: string; // e.g. "Inventory", "Agreements", "Recovery", "Cashbook", "System", "Reports"
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  prevHash: string; // Hash of previous block in chain
  hash: string; // SHA-256 Hash of this block
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}
