import { useState, useEffect } from 'react';
import {
  Customer,
  StockItem,
  StockReceipt,
  StockMovement,
  Agreement,
  Payment,
  PaymentReversal,
  CashBookEntry,
  ShopSettings,
  AuditLog,
  InstalmentDueDate,
  CategoryItem,
  User,
  UserRole,
  ActivityLedgerEntry,
  PermissionAction,
  LedgerActionType,
} from '../types';
import {
  INITIAL_SHOP_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_STOCK,
  INITIAL_STOCK_RECEIPTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_AGREEMENTS,
  INITIAL_PAYMENTS,
  INITIAL_CASHBOOK,
  INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORIES,
} from './mockData';
import { PermissionManager } from '../utils/permissionManager';
import { ActivityLogger, calculateHash } from '../utils/activityLogger';

const STORAGE_KEYS = {
  SETTINGS: 'qistflow_settings_v2',
  CUSTOMERS: 'qistflow_customers_v2',
  CATEGORIES: 'qistflow_categories_v2',
  STOCK: 'qistflow_stock_v2',
  STOCK_RECEIPTS: 'qistflow_stock_receipts_v2',
  STOCK_MOVEMENTS: 'qistflow_stock_movements_v2',
  AGREEMENTS: 'qistflow_agreements_v2',
  PAYMENTS: 'qistflow_payments_v2',
  REVERSALS: 'qistflow_reversals_v2',
  CASHBOOK: 'qistflow_cashbook_v2',
  AUDIT: 'qistflow_audit_v2',
  USERS: 'qistflow_users_v4',
  CURRENT_USER: 'qistflow_current_user_v4',
  HAS_REAL_ADMIN: 'qistflow_has_real_admin_v3',
  ACTIVITY_LEDGER: 'qistflow_activity_ledger_v2',
};

// Seed Demo Accounts if none exist
const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    passwordHash: 'admin123',
    salt: 'salt_demo_admin',
    fullName: 'System Administrator (Demo)',
    role: 'ADMIN',
    createdAt: '2026-01-01',
    isDemo: true,
    isActive: true,
  },
  {
    id: 'usr-sup-01',
    username: 'supervisor',
    passwordHash: 'super123',
    salt: 'salt_demo_sup',
    fullName: 'Operations Supervisor (Demo)',
    role: 'SUPERVISOR',
    createdAt: '2026-01-01',
    isDemo: true,
    isActive: true,
  },
  {
    id: 'usr-view-01',
    username: 'viewer',
    passwordHash: 'view123',
    salt: 'salt_demo_view',
    fullName: 'Read-Only Auditor (Demo)',
    role: 'VIEWER',
    createdAt: '2026-01-01',
    isDemo: true,
    isActive: true,
  },
];

export function generateSalt(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function normalizeCnic(cnic: string): string {
  return cnic.replace(/[^0-9]/g, '');
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Failed reading ${key} from storage:`, err);
    return fallback;
  }
}

function setStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed writing ${key} to storage:`, err);
  }
}

export function useQistStore() {
  const [settings, setSettings] = useState<ShopSettings>(() =>
    getStored(STORAGE_KEYS.SETTINGS, INITIAL_SHOP_SETTINGS)
  );
  const [users, setUsers] = useState<User[]>(() =>
    getStored(STORAGE_KEYS.USERS, DEFAULT_USERS)
  );
  const [hasRealAdmin, setHasRealAdmin] = useState<boolean>(() => {
    const storedHasReal = getStored<boolean | null>(STORAGE_KEYS.HAS_REAL_ADMIN, null);
    if (storedHasReal !== null) return storedHasReal;
    const currentUsers = getStored<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
    return currentUsers.some((u) => !u.isDemo && u.role === 'ADMIN' && u.isActive !== false);
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const storedCurr = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (storedCurr && storedCurr.isActive !== false) return storedCurr;
    const activeAdmin = users.find((u) => u.role === 'ADMIN' && u.isActive !== false);
    return activeAdmin || users[0] || DEFAULT_USERS[0];
  });

  const [customers, setCustomers] = useState<Customer[]>(() =>
    getStored(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );
  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    getStored(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );
  const [stock, setStock] = useState<StockItem[]>(() =>
    getStored(STORAGE_KEYS.STOCK, INITIAL_STOCK)
  );
  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>(() =>
    getStored(STORAGE_KEYS.STOCK_RECEIPTS, INITIAL_STOCK_RECEIPTS)
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    getStored(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS)
  );
  const [agreements, setAgreements] = useState<Agreement[]>(() =>
    getStored(STORAGE_KEYS.AGREEMENTS, INITIAL_AGREEMENTS)
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    getStored(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS)
  );
  const [reversals, setReversals] = useState<PaymentReversal[]>(() =>
    getStored(STORAGE_KEYS.REVERSALS, [])
  );
  const [cashbook, setCashbook] = useState<CashBookEntry[]>(() =>
    getStored(STORAGE_KEYS.CASHBOOK, INITIAL_CASHBOOK)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getStored(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS)
  );
  const [activityLedger, setActivityLedger] = useState<ActivityLedgerEntry[]>(() =>
    getStored(STORAGE_KEYS.ACTIVITY_LEDGER, [])
  );

  // Sync state to LocalStorage
  useEffect(() => setStored(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => setStored(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => setStored(STORAGE_KEYS.HAS_REAL_ADMIN, hasRealAdmin), [hasRealAdmin]);
  useEffect(() => setStored(STORAGE_KEYS.CURRENT_USER, currentUser), [currentUser]);
  useEffect(() => setStored(STORAGE_KEYS.CUSTOMERS, customers), [customers]);
  useEffect(() => setStored(STORAGE_KEYS.CATEGORIES, categories), [categories]);
  useEffect(() => setStored(STORAGE_KEYS.STOCK, stock), [stock]);
  useEffect(() => setStored(STORAGE_KEYS.STOCK_RECEIPTS, stockReceipts), [stockReceipts]);
  useEffect(() => setStored(STORAGE_KEYS.STOCK_MOVEMENTS, stockMovements), [stockMovements]);
  useEffect(() => setStored(STORAGE_KEYS.AGREEMENTS, agreements), [agreements]);
  useEffect(() => setStored(STORAGE_KEYS.PAYMENTS, payments), [payments]);
  useEffect(() => setStored(STORAGE_KEYS.REVERSALS, reversals), [reversals]);
  useEffect(() => setStored(STORAGE_KEYS.CASHBOOK, cashbook), [cashbook]);
  useEffect(() => setStored(STORAGE_KEYS.AUDIT, auditLogs), [auditLogs]);
  useEffect(() => setStored(STORAGE_KEYS.ACTIVITY_LEDGER, activityLedger), [activityLedger]);

  // Central Cryptographic Append-Only Activity Logger
  const logActivity = async (
    actionType: LedgerActionType,
    moduleName: string,
    description: string,
    recordId?: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const prevEntry = activityLedger.length > 0 ? activityLedger[0] : null;
    const entry = await ActivityLogger.createEntry(
      prevEntry,
      currentUser.username,
      currentUser.role,
      actionType,
      moduleName,
      description,
      recordId,
      oldValue,
      newValue
    );
    setActivityLedger((prev) => [entry, ...prev]);
    return entry;
  };

  // Enforce Permission Check
  const verifyPermission = (
    action: PermissionAction,
    moduleName: string,
    actionDesc: string
  ): boolean => {
    const isAllowed = PermissionManager.can(currentUser.role, action);
    if (!isAllowed) {
      logActivity(
        'DENIED',
        moduleName,
        `Permission DENIED: User '${currentUser.username}' (${currentUser.role}) attempted restricted action: ${actionDesc}`
      );
    }
    return isAllowed;
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      details,
      user: `${currentUser.username} (${currentUser.role})`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // --- INITIAL REAL ADMIN SETUP (REMOVE DEMO CREDENTIALS) ---
  const createInitialRealAdmin = async (params: {
    fullName: string;
    username: string;
    password: string;
    shopName?: string;
  }) => {
    const cleanUsername = params.username.toLowerCase().trim();
    const salt = generateSalt();
    const passwordHash = await calculateHash(`SALT:${salt}|PASS:${params.password}`);

    const realAdminUser: User = {
      id: `usr-real-admin-${Date.now()}`,
      username: cleanUsername,
      passwordHash,
      salt,
      fullName: params.fullName.trim(),
      role: 'ADMIN',
      createdAt: new Date().toISOString().split('T')[0],
      isDemo: false,
      isActive: true,
      mustChangePassword: false,
    };

    // Deactivate Demo Users in one transaction
    const sanitizedUsers = users.map((u) => {
      if (u.isDemo) {
        return {
          ...u,
          passwordHash: '',
          isActive: false,
        };
      }
      return u;
    });

    const updatedUserList = [realAdminUser, ...sanitizedUsers];
    setUsers(updatedUserList);
    setHasRealAdmin(true);
    setCurrentUser(realAdminUser);

    if (params.shopName && params.shopName.trim()) {
      setSettings((prev) => ({
        ...prev,
        shopName: params.shopName!.trim(),
      }));
    }

    logActivity(
      'DEMO_ACCOUNTS_REMOVED',
      'System',
      `Master Real Admin account '${realAdminUser.username}' created. All default demo credentials permanently disabled.`,
      realAdminUser.id,
      'Demo Accounts Active',
      'Demo Accounts Disabled'
    );

    addAuditLog(
      'DEMO_ACCOUNTS_REMOVED',
      `Owner Admin ${realAdminUser.username} created. Demo accounts wiped.`
    );

    return { success: true, message: 'Master Admin account created. Demo accounts removed.' };
  };

  // --- AUTHENTICATION & LOGIN (WITH LOCKOUT & GENERIC ERROR) ---
  const loginUser = async (usernameAttempt: string, passwordAttempt: string) => {
    const cleanUser = usernameAttempt.toLowerCase().trim();
    const userIndex = users.findIndex((u) => u.username.toLowerCase() === cleanUser);

    // Generic error message for security (does not reveal if username exists)
    const GENERIC_ERROR = 'Invalid username or password';

    if (userIndex === -1) {
      logActivity(
        'FAILED_LOGIN',
        'Auth',
        `Failed login attempt for non-existent username: '${cleanUser}'`
      );
      return { success: false, message: GENERIC_ERROR };
    }

    const user = users[userIndex];

    // Check if account is locked out (5 failed attempts = 5-minute lockout)
    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
      const remainingMins = Math.ceil(
        (new Date(user.lockoutUntil).getTime() - Date.now()) / 60000
      );
      logActivity(
        'FAILED_LOGIN',
        'Auth',
        `Failed login attempt during active lockout for account: '${user.username}'`
      );
      return {
        success: false,
        message: `Account is temporarily locked due to 5 failed attempts. Please try again in ${remainingMins} minute(s) or contact Admin.`,
      };
    }

    // Reject deactivated demo accounts or disabled users
    if (user.isActive === false || !user.passwordHash) {
      logActivity(
        'FAILED_LOGIN',
        'Auth',
        `Failed login attempt for disabled user account: '${user.username}'`
      );
      return { success: false, message: GENERIC_ERROR };
    }

    // Verify Password Hash (Salted or Legacy Plaintext)
    let isMatch = false;
    if (user.salt) {
      const computedHash = await calculateHash(`SALT:${user.salt}|PASS:${passwordAttempt}`);
      isMatch = computedHash === user.passwordHash;
    } else {
      isMatch = user.passwordHash === passwordAttempt;
    }

    if (!isMatch) {
      const newAttempts = (user.failedAttempts || 0) + 1;
      let lockoutTime: string | undefined = undefined;

      if (newAttempts >= 5) {
        lockoutTime = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min lock
        logActivity(
          'USER_LOCKED',
          'Auth',
          `Account '${user.username}' locked for 5 minutes after 5 consecutive failed login attempts.`
        );
      } else {
        logActivity(
          'FAILED_LOGIN',
          'Auth',
          `Failed login attempt for username: '${user.username}' (Attempt ${newAttempts}/5)`
        );
      }

      setUsers((prev) =>
        prev.map((u, idx) =>
          idx === userIndex
            ? {
                ...u,
                failedAttempts: newAttempts,
                lockoutUntil: lockoutTime || u.lockoutUntil,
              }
            : u
        )
      );

      return {
        success: false,
        message: lockoutTime
          ? 'Account is temporarily locked due to 5 failed attempts. Please try again in 5 minutes or contact Admin.'
          : GENERIC_ERROR,
      };
    }

    // Successful Login: Reset failed attempts & record last login
    const updatedUser: User = {
      ...user,
      failedAttempts: 0,
      lockoutUntil: undefined,
      lastLoginAt: new Date().toISOString(),
    };

    setUsers((prev) => prev.map((u, idx) => (idx === userIndex ? updatedUser : u)));
    setCurrentUser(updatedUser);

    logActivity(
      'LOGIN',
      'Auth',
      `User '${updatedUser.username}' successfully logged in with role: ${updatedUser.role}`
    );
    addAuditLog('USER_LOGIN', `User ${updatedUser.username} logged in`);

    return {
      success: true,
      message: 'Login successful',
      mustChangePassword: updatedUser.mustChangePassword,
    };
  };

  const logoutUser = () => {
    logActivity('LOGOUT', 'Auth', `User '${currentUser.username}' logged out`);
    const activeViewer = users.find((u) => u.role === 'VIEWER' && u.isActive !== false);
    if (activeViewer) {
      setCurrentUser(activeViewer);
    }
  };

  // --- USER MANAGEMENT (ADMIN ONLY) ---
  const createUserAccount = async (params: {
    username: string;
    fullName: string;
    password: string;
    role: UserRole;
  }) => {
    if (!verifyPermission('MANAGE_USERS', 'System', 'Create User Account')) {
      throw new Error("You don't have permission to create user accounts.");
    }

    const cleanUsername = params.username.toLowerCase().trim();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername && u.isActive !== false)) {
      throw new Error(`Username '${cleanUsername}' is already taken.`);
    }

    const salt = generateSalt();
    const passwordHash = await calculateHash(`SALT:${salt}|PASS:${params.password}`);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      passwordHash,
      salt,
      fullName: params.fullName.trim(),
      role: params.role,
      createdAt: new Date().toISOString().split('T')[0],
      isDemo: false,
      isActive: true,
      mustChangePassword: true,
      failedAttempts: 0,
    };

    setUsers((prev) => [newUser, ...prev]);

    logActivity(
      'USER_CREATED',
      'System',
      `Admin '${currentUser.username}' created new ${params.role} account '${newUser.username}' for ${newUser.fullName}`,
      newUser.id
    );

    return newUser;
  };

  const editUserAccount = (id: string, updates: { fullName?: string; role?: UserRole }) => {
    if (!verifyPermission('MANAGE_USERS', 'System', 'Edit User Account')) {
      throw new Error("You don't have permission to edit user accounts.");
    }

    const target = users.find((u) => u.id === id);
    if (!target) throw new Error("User account not found.");

    // Safety Rule: Cannot demote the last active real Admin
    const activeRealAdmins = users.filter(
      (u) => u.role === 'ADMIN' && !u.isDemo && u.isActive !== false
    );
    if (
      target.role === 'ADMIN' &&
      updates.role &&
      updates.role !== 'ADMIN' &&
      !target.isDemo &&
      activeRealAdmins.length <= 1
    ) {
      throw new Error("Action blocked: You must keep at least ONE active Real Admin account.");
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
    );

    if (updates.role && updates.role !== target.role) {
      logActivity(
        'ROLE_CHANGED',
        'System',
        `Changed role for '${target.username}' from ${target.role} to ${updates.role}`,
        id,
        target.role,
        updates.role
      );
    } else {
      logActivity(
        'USER_EDITED',
        'System',
        `Updated details for user account '${target.username}'`,
        id
      );
    }
  };

  const resetUserPassword = async (id: string, newTempPassword: string) => {
    if (!verifyPermission('MANAGE_USERS', 'System', 'Reset User Password')) {
      throw new Error("You don't have permission to reset user passwords.");
    }

    const target = users.find((u) => u.id === id);
    if (!target) throw new Error("User account not found.");

    const salt = generateSalt();
    const passwordHash = await calculateHash(`SALT:${salt}|PASS:${newTempPassword}`);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              passwordHash,
              salt,
              mustChangePassword: true,
              failedAttempts: 0,
              lockoutUntil: undefined,
            }
          : u
      )
    );

    logActivity(
      'PASSWORD_RESET',
      'System',
      `Admin '${currentUser.username}' reset password for user '${target.username}'. Temporary password assigned.`,
      id
    );
  };

  const setUserActiveStatus = (id: string, isActive: boolean) => {
    if (!verifyPermission('MANAGE_USERS', 'System', 'Change Account Status')) {
      throw new Error("You don't have permission to change account status.");
    }

    const target = users.find((u) => u.id === id);
    if (!target) throw new Error("User account not found.");

    // Safety Rule: Cannot disable the last active real Admin
    const activeRealAdmins = users.filter(
      (u) => u.role === 'ADMIN' && !u.isDemo && u.isActive !== false
    );
    if (!isActive && target.role === 'ADMIN' && !target.isDemo && activeRealAdmins.length <= 1) {
      throw new Error("Action blocked: You must keep at least ONE active Real Admin account.");
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              isActive,
              passwordHash: isActive ? u.passwordHash : '',
            }
          : u
      )
    );

    logActivity(
      isActive ? 'USER_ENABLED' : 'USER_DISABLED',
      'System',
      `Account '${target.username}' (${target.role}) was ${isActive ? 'enabled' : 'disabled'} by Admin '${currentUser.username}'`,
      id
    );
  };

  const unlockUserAccount = (id: string) => {
    if (!verifyPermission('MANAGE_USERS', 'System', 'Unlock Account')) {
      throw new Error("You don't have permission to unlock accounts.");
    }

    const target = users.find((u) => u.id === id);
    if (!target) throw new Error("User account not found.");

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              failedAttempts: 0,
              lockoutUntil: undefined,
            }
          : u
      )
    );

    logActivity(
      'USER_UNLOCKED',
      'System',
      `Admin '${currentUser.username}' unlocked account for user '${target.username}'`,
      id
    );
  };

  // --- OWN PASSWORD CHANGE FOR ANY USER ---
  const changeOwnPassword = async (oldPasswordAttempt: string, newPasswordAttempt: string) => {
    // Verify Old Password
    let isOldMatch = false;
    if (currentUser.salt) {
      const computedOldHash = await calculateHash(`SALT:${currentUser.salt}|PASS:${oldPasswordAttempt}`);
      isOldMatch = computedOldHash === currentUser.passwordHash;
    } else {
      isOldMatch = currentUser.passwordHash === oldPasswordAttempt;
    }

    if (!isOldMatch) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    const newSalt = generateSalt();
    const newPasswordHash = await calculateHash(`SALT:${newSalt}|PASS:${newPasswordAttempt}`);

    const updatedUser: User = {
      ...currentUser,
      passwordHash: newPasswordHash,
      salt: newSalt,
      mustChangePassword: false,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    logActivity(
      'PASSWORD_CHANGED',
      'Auth',
      `User '${currentUser.username}' successfully updated their own password.`
    );

    return { success: true, message: 'Password updated successfully.' };
  };

  // --- FORCED PASSWORD CHANGE (MUST CHANGE TEMP PASSWORD) ---
  const updateForcedPassword = async (newPasswordAttempt: string) => {
    const newSalt = generateSalt();
    const newPasswordHash = await calculateHash(`SALT:${newSalt}|PASS:${newPasswordAttempt}`);

    const updatedUser: User = {
      ...currentUser,
      passwordHash: newPasswordHash,
      salt: newSalt,
      mustChangePassword: false,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    logActivity(
      'PASSWORD_CHANGED',
      'Auth',
      `User '${currentUser.username}' replaced temporary password with new secure password.`
    );

    return { success: true, message: 'Password set successfully.' };
  };

  const changeOwnDisplayName = (fullName: string) => {
    const updatedUser: User = {
      ...currentUser,
      fullName: fullName.trim(),
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    logActivity(
      'USER_EDITED',
      'Auth',
      `User '${currentUser.username}' updated display name to '${fullName.trim()}'`
    );
  };

  // --- CUSTOMER ACTIONS ---
  const addCustomer = (customerData: Omit<Customer, 'id' | 'customerCode' | 'createdAt'>) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Customers', 'Add Customer Profile')) {
      throw new Error("You don't have permission to add customers.");
    }

    const id = `cust-${Date.now()}`;
    const customerCode = `CUST-${(customers.length + 1).toString().padStart(3, '0')}`;
    const newCust: Customer = {
      ...customerData,
      id,
      customerCode,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);

    logActivity(
      'ADD_ENTRY',
      'Customers',
      `Added new customer profile: ${newCust.fullName} (CNIC: ${newCust.cnic})`,
      id,
      undefined,
      JSON.stringify({ name: newCust.fullName, phone: newCust.phone, cnic: newCust.cnic })
    );

    addAuditLog('CUSTOMER_CREATED', `Added new customer: ${newCust.fullName} (${customerCode})`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Customers', 'Update Customer')) {
      throw new Error("You don't have permission to modify customer records.");
    }

    const oldCust = customers.find((c) => c.id === id);
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    logActivity(
      'ADD_ENTRY',
      'Customers',
      `Updated customer profile ID: ${id}`,
      id,
      oldCust ? JSON.stringify(oldCust) : undefined,
      JSON.stringify(updates)
    );

    addAuditLog('CUSTOMER_UPDATED', `Updated customer details ID: ${id}`);
  };

  const deleteCustomer = (id: string) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Customers', 'Delete Customer')) {
      throw new Error("You don't have permission to delete customers.");
    }

    const target = customers.find((c) => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));

    logActivity(
      'DELETE_ITEM',
      'Customers',
      `Deleted customer profile: ${target?.fullName || id}`,
      id,
      target ? JSON.stringify(target) : undefined
    );

    addAuditLog('CUSTOMER_DELETED', `Deleted customer: ${target?.fullName || id}`);
  };

  // --- RECEIVE STOCK / INVENTORY SHIPMENT ---
  const receiveStock = (params: {
    supplierName: string;
    purchaseRef: string;
    receivedDate: string;
    stockItemId?: string;
    name: string;
    category: StockItem['category'];
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
  }) => {
    if (!verifyPermission('ADD_ITEM', 'Inventory', 'Receive Stock Shipment')) {
      throw new Error("You don't have permission to add stock or inventory items.");
    }

    let targetItem = stock.find((s) => s.id === params.stockItemId);
    const oldQty = targetItem ? targetItem.inStock : 0;

    if (!targetItem) {
      const newStockId = `stock-${Date.now()}`;
      targetItem = {
        id: newStockId,
        name: params.name,
        category: params.category,
        brand: params.brand,
        model: params.model,
        serialNumber: params.serialNumbers[0] || `SER-${Date.now()}`,
        unitCost: params.unitCost,
        cashPrice: params.cashPrice,
        instalmentPrice: params.instalmentPrice,
        minDownPayment: params.minDownPayment,
        inStock: params.quantity,
        totalReceived: params.quantity,
        totalIssued: 0,
        counterLocation: params.counterLocation || 'Main Showroom Counter #1',
        status: 'available',
        supplierName: params.supplierName,
        purchaseRef: params.purchaseRef,
        purchaseDate: params.receivedDate,
      };
      setStock((prev) => [targetItem!, ...prev]);
    } else {
      setStock((prev) =>
        prev.map((s) =>
          s.id === targetItem!.id
            ? {
                ...s,
                inStock: s.inStock + params.quantity,
                totalReceived: s.totalReceived + params.quantity,
                counterLocation: params.counterLocation || s.counterLocation,
                status: 'available',
              }
            : s
        )
      );
    }

    const newReceipt: StockReceipt = {
      id: `rcpt-${Date.now()}`,
      supplierName: params.supplierName,
      purchaseRef: params.purchaseRef,
      receivedDate: params.receivedDate,
      modelName: params.name,
      counterLocation: params.counterLocation,
      quantity: params.quantity,
      unitCost: params.unitCost,
      serialNumbers: params.serialNumbers,
      notes: params.notes,
    };
    setStockReceipts((prev) => [newReceipt, ...prev]);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: params.receivedDate,
      type: 'RECEIVED',
      stockItemId: targetItem.id,
      itemName: params.name,
      serialNumber: params.serialNumbers.join(', '),
      quantity: params.quantity,
      refDocument: params.purchaseRef || newReceipt.id,
      counterLocation: params.counterLocation,
      actor: currentUser.username,
      reason: `Received shipment from ${params.supplierName}`,
    };
    setStockMovements((prev) => [movement, ...prev]);

    if (params.unitCost > 0) {
      const cbEntry: CashBookEntry = {
        id: `cb-${Date.now()}`,
        date: params.receivedDate,
        type: 'out',
        category: 'Stock Purchase',
        amount: params.quantity * params.unitCost,
        referenceNumber: params.purchaseRef || newReceipt.id,
        description: `Purchased ${params.quantity} units of ${params.name} from ${params.supplierName}`,
      };
      setCashbook((prev) => [cbEntry, ...prev]);
    }

    logActivity(
      'ADD_ITEM',
      'Inventory',
      `Received ${params.quantity} units of ${params.name} from ${params.supplierName}`,
      targetItem.id,
      `Quantity: ${oldQty}`,
      `Quantity: ${oldQty + params.quantity}`
    );

    addAuditLog('STOCK_RECEIVED', `Received ${params.quantity} units of ${params.name}`);
    return newReceipt;
  };

  // --- ADD / EDIT / DELETE INDIVIDUAL STOCK ITEM ---
  const addStockItem = (itemData: Omit<StockItem, 'id' | 'totalReceived' | 'totalIssued'>) => {
    if (!verifyPermission('ADD_ITEM', 'Inventory', 'Add Inventory Model')) {
      throw new Error("You don't have permission to add stock items.");
    }

    const newId = `stock-${Date.now()}`;
    const newItem: StockItem = {
      ...itemData,
      id: newId,
      totalReceived: itemData.inStock,
      totalIssued: 0,
    };
    setStock((prev) => [newItem, ...prev]);

    logActivity(
      'ADD_ITEM',
      'Inventory',
      `Added new stock model: ${newItem.name} (${newItem.brand} ${newItem.model})`,
      newId,
      undefined,
      JSON.stringify(newItem)
    );

    addAuditLog('STOCK_ITEM_ADDED', `Added stock item: ${newItem.name}`);
    return newItem;
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    if (!verifyPermission('EDIT_ITEM', 'Inventory', 'Edit Inventory Model')) {
      throw new Error("You don't have permission to edit stock items.");
    }

    const oldItem = stock.find((s) => s.id === id);
    setStock((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    logActivity(
      'EDIT_ITEM',
      'Inventory',
      `Updated inventory item: ${oldItem?.name || id}`,
      id,
      oldItem ? JSON.stringify(oldItem) : undefined,
      JSON.stringify(updates)
    );

    addAuditLog('STOCK_ITEM_UPDATED', `Updated stock item ID: ${id}`);
  };

  const deleteStockItem = (id: string) => {
    if (!verifyPermission('DELETE_ITEM', 'Inventory', 'Delete Stock Item')) {
      throw new Error("You don't have permission to delete stock items.");
    }

    const oldItem = stock.find((s) => s.id === id);
    setStock((prev) => prev.filter((s) => s.id !== id));

    logActivity(
      'DELETE_ITEM',
      'Inventory',
      `Deleted stock item: ${oldItem?.name || id}`,
      id,
      oldItem ? JSON.stringify(oldItem) : undefined
    );

    addAuditLog('STOCK_ITEM_DELETED', `Deleted stock item ID: ${id}`);
  };

  // --- AGREEMENT ACTIONS ---
  const createAgreement = (params: {
    customerId: string;
    itemId: string;
    cashPrice: number;
    interestPercentage?: number;
    markupAmount?: number;
    unitCost?: number;
    purchaseDate?: string;
    deliveryDate?: string;
    totalInstalmentPrice: number;
    downPayment: number;
    monthDuration: number;
    monthlyInstalment?: number;
    dueDayOfMonth: number;
    startDate: string;
    notes?: string;
  }) => {
    if (!verifyPermission('ADD_AGREEMENT', 'Agreements', 'Create Sale Agreement')) {
      throw new Error("You don't have permission to create sales agreements.");
    }

    const customer = customers.find((c) => c.id === params.customerId);
    const item = stock.find((s) => s.id === params.itemId);

    if (!customer || !item) {
      throw new Error("Customer or Stock Item not found");
    }

    if (item.inStock <= 0) {
      throw new Error("Insufficient stock available for this model");
    }

    const remainingBalance = Math.max(0, params.totalInstalmentPrice - params.downPayment);
    const monthlyInstalment =
      params.monthlyInstalment && params.monthlyInstalment > 0
        ? params.monthlyInstalment
        : params.monthDuration > 0
        ? Math.round(remainingBalance / params.monthDuration)
        : 0;

    const schedule: InstalmentDueDate[] = [];
    const start = new Date(params.deliveryDate || params.startDate);

    for (let i = 1; i <= params.monthDuration; i++) {
      const dueDate = new Date(start.getFullYear(), start.getMonth() + i, params.dueDayOfMonth);
      const amount =
        i === params.monthDuration
          ? remainingBalance - monthlyInstalment * (params.monthDuration - 1)
          : monthlyInstalment;

      schedule.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: Math.max(0, amount),
        paidAmount: 0,
        status: 'pending',
      });
    }

    const agreementNumber = `AGR-${new Date().getFullYear()}-${1000 + agreements.length + 1}`;

    const newAgr: Agreement = {
      id: `agr-${Date.now()}`,
      agreementNumber,
      customerId: params.customerId,
      customerCode: customer.customerCode,
      itemId: params.itemId,
      itemName: item.name,
      itemSerial: item.serialNumber,
      unitCost:
        params.unitCost !== undefined
          ? params.unitCost
          : item.unitCost || Math.round(params.cashPrice * 0.85),
      purchaseDate: params.purchaseDate || item.purchaseDate || '2026-09-01',
      deliveryDate: params.deliveryDate || params.startDate,
      cashPrice: params.cashPrice,
      interestPercentage: params.interestPercentage || 0,
      markupAmount:
        params.markupAmount ||
        Math.max(
          0,
          params.totalInstalmentPrice - (item.unitCost || Math.round(params.cashPrice * 0.85))
        ),
      totalInstalmentPrice: params.totalInstalmentPrice,
      downPayment: params.downPayment,
      remainingBalance,
      monthDuration: params.monthDuration,
      monthlyInstalment,
      dueDayOfMonth: params.dueDayOfMonth,
      startDate: params.deliveryDate || params.startDate,
      status: 'active',
      schedule,
      notes: params.notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAgreements((prev) => [newAgr, ...prev]);

    const newStockCount = Math.max(0, item.inStock - 1);
    setStock((prev) =>
      prev.map((s) =>
        s.id === params.itemId
          ? {
              ...s,
              inStock: newStockCount,
              totalIssued: s.totalIssued + 1,
              status: newStockCount === 0 ? 'sold' : 'available',
            }
          : s
      )
    );

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: params.startDate,
      type: 'ISSUED',
      stockItemId: item.id,
      itemName: item.name,
      serialNumber: item.serialNumber,
      quantity: 1,
      refDocument: agreementNumber,
      counterLocation: item.counterLocation || 'Main Showroom Counter #1',
      actor: currentUser.username,
      reason: `Issued on contract ${agreementNumber} to ${customer.fullName}`,
    };
    setStockMovements((prev) => [movement, ...prev]);

    if (params.downPayment > 0) {
      const cbEntry: CashBookEntry = {
        id: `cb-${Date.now()}`,
        date: params.startDate,
        type: 'in',
        category: 'Down Payment',
        amount: params.downPayment,
        referenceNumber: agreementNumber,
        description: `Advance Down Payment for ${item.name} (${customer.fullName})`,
      };
      setCashbook((prev) => [cbEntry, ...prev]);
    }

    logActivity(
      'ADD_AGREEMENT',
      'Agreements',
      `Created agreement ${agreementNumber} for ${customer.fullName} (${item.name})`,
      newAgr.id,
      undefined,
      JSON.stringify({
        agreementNumber,
        customer: customer.fullName,
        item: item.name,
        total: params.totalInstalmentPrice,
        downPayment: params.downPayment,
      })
    );

    addAuditLog('AGREEMENT_CREATED', `Committed sale contract ${agreementNumber}`);
    return newAgr;
  };

  // --- PAYMENT COLLECTION ---
  const recordPayment = (params: {
    agreementId: string;
    installmentNumber: number;
    amountPaid: number;
    lateFee?: number;
    discount?: number;
    paymentMethod: 'Cash' | 'Bank Transfer' | 'JazzCash' | 'EasyPaisa';
    date: string;
    collectorName: string;
    notes?: string;
  }) => {
    if (!verifyPermission('ADD_RECOVERY', 'Recovery', 'Collect Installment Payment')) {
      throw new Error("You don't have permission to record recovery payments.");
    }

    const agreement = agreements.find((a) => a.id === params.agreementId);
    if (!agreement) throw new Error("Agreement not found");

    const customer = customers.find((c) => c.id === agreement.customerId);
    const receiptNumber = `RCP-${new Date().getFullYear()}-${3000 + payments.length + 1}`;

    const lateFee = params.lateFee || 0;
    const discount = params.discount || 0;

    let isFullyPaid = true;
    const updatedSchedule = agreement.schedule.map((slot) => {
      if (slot.installmentNumber === params.installmentNumber) {
        const newPaidAmount = slot.paidAmount + params.amountPaid;
        const isSlotPaid = newPaidAmount >= slot.amount;
        return {
          ...slot,
          paidAmount: newPaidAmount,
          status: isSlotPaid ? ('paid' as const) : ('partially_paid' as const),
          paidDate: params.date,
          receiptNumber,
        };
      }
      if (slot.status !== 'paid' && slot.installmentNumber !== params.installmentNumber) {
        isFullyPaid = false;
      }
      return slot;
    });

    const updatedStatus =
      isFullyPaid && updatedSchedule.every((s) => s.status === 'paid')
        ? 'completed'
        : agreement.status;

    const newRemainingBalance = Math.max(0, agreement.remainingBalance - params.amountPaid);

    setAgreements((prev) =>
      prev.map((a) =>
        a.id === params.agreementId
          ? {
              ...a,
              schedule: updatedSchedule,
              remainingBalance: newRemainingBalance,
              status: updatedStatus,
            }
          : a
      )
    );

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      agreementId: agreement.id,
      customerId: agreement.customerId,
      customerName: customer?.fullName || 'Customer',
      installmentNumbers: [params.installmentNumber],
      amountPaid: params.amountPaid,
      lateFee,
      discount,
      paymentMethod: params.paymentMethod,
      date: params.date,
      collectorName: params.collectorName || currentUser.username,
      isReversed: false,
      notes: params.notes,
    };

    setPayments((prev) => [newPayment, ...prev]);

    const netCashIn = params.amountPaid + lateFee - discount;
    if (netCashIn > 0) {
      const cbEntry: CashBookEntry = {
        id: `cb-${Date.now()}`,
        date: params.date,
        type: 'in',
        category: 'Instalment Recovery',
        amount: netCashIn,
        referenceNumber: receiptNumber,
        description: `Installment #${params.installmentNumber} collection (${customer?.fullName || 'Customer'})`,
      };
      setCashbook((prev) => [cbEntry, ...prev]);
    }

    logActivity(
      'ADD_RECOVERY',
      'Recovery',
      `Recorded recovery payment ${receiptNumber}: Rs. ${params.amountPaid.toLocaleString()} for ${agreement.agreementNumber}`,
      newPayment.id,
      `Balance: Rs. ${agreement.remainingBalance.toLocaleString()}`,
      `Balance: Rs. ${newRemainingBalance.toLocaleString()}`
    );

    addAuditLog('PAYMENT_RECORDED', `Collected Rs. ${params.amountPaid.toLocaleString()} (${receiptNumber})`);
    return newPayment;
  };

  // --- REVERSE PAYMENT ---
  const reversePayment = (paymentId: string, reason: string) => {
    if (!verifyPermission('REVERSE_PAYMENT', 'Recovery', 'Reverse Payment Receipt')) {
      throw new Error("You don't have permission to reverse payments.");
    }

    const targetPayment = payments.find((p) => p.id === paymentId);
    if (!targetPayment || targetPayment.isReversed) {
      throw new Error("Payment not found or already reversed");
    }

    const agreement = agreements.find((a) => a.id === targetPayment.agreementId);
    if (!agreement) throw new Error("Linked agreement not found");

    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, isReversed: true } : p))
    );

    const restoredBalance = agreement.remainingBalance + targetPayment.amountPaid;
    const restoredSchedule = agreement.schedule.map((slot) => {
      if (targetPayment.installmentNumbers.includes(slot.installmentNumber)) {
        const newPaidAmount = Math.max(0, slot.paidAmount - targetPayment.amountPaid);
        return {
          ...slot,
          paidAmount: newPaidAmount,
          status: (newPaidAmount === 0 ? 'pending' : 'partially_paid') as InstalmentDueDate['status'],
          paidDate: undefined,
          receiptNumber: undefined,
        };
      }
      return slot;
    });

    setAgreements((prev) =>
      prev.map((a) =>
        a.id === agreement.id
          ? {
              ...a,
              remainingBalance: restoredBalance,
              status: 'active',
              schedule: restoredSchedule,
            }
          : a
      )
    );

    const reversalRecord: PaymentReversal = {
      id: `rev-${Date.now()}`,
      paymentId: targetPayment.id,
      receiptNumber: targetPayment.receiptNumber,
      agreementId: agreement.id,
      amountReversed: targetPayment.amountPaid,
      reversedAt: new Date().toISOString(),
      reversedBy: currentUser.username,
      reason,
    };

    setReversals((prev) => [reversalRecord, ...prev]);

    const cbOut: CashBookEntry = {
      id: `cb-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'out',
      category: 'Refund Reversal',
      amount: targetPayment.amountPaid,
      referenceNumber: `REV-${targetPayment.receiptNumber}`,
      description: `Reversal of payment receipt ${targetPayment.receiptNumber}. Reason: ${reason}`,
    };
    setCashbook((prev) => [cbOut, ...prev]);

    logActivity(
      'REVERSE_PAYMENT',
      'Recovery',
      `Reversed payment receipt ${targetPayment.receiptNumber} (Rs. ${targetPayment.amountPaid.toLocaleString()}). Reason: ${reason}`,
      paymentId,
      `Balance: Rs. ${agreement.remainingBalance.toLocaleString()}`,
      `Restored Balance: Rs. ${restoredBalance.toLocaleString()}`
    );

    addAuditLog('PAYMENT_REVERSED', `Reversed payment receipt ${targetPayment.receiptNumber}`);
  };

  // --- CASHBOOK ENTRY ---
  const addCashBookEntry = (entryData: Omit<CashBookEntry, 'id'>) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Cashbook', 'Add Expense/Income Entry')) {
      throw new Error("You don't have permission to add cashbook entries.");
    }

    const newEntry: CashBookEntry = {
      ...entryData,
      id: `cb-${Date.now()}`,
    };
    setCashbook((prev) => [newEntry, ...prev]);

    logActivity(
      'ADD_ENTRY',
      'Cashbook',
      `Added Cashbook ${newEntry.type.toUpperCase()} entry: Rs. ${newEntry.amount.toLocaleString()} (${newEntry.category})`,
      newEntry.id,
      undefined,
      JSON.stringify(newEntry)
    );

    addAuditLog('CASHBOOK_ADDED', `Added cash entry: ${newEntry.category}`);
    return newEntry;
  };

  // --- CATEGORIES ---
  const addCategory = (category: Omit<CategoryItem, 'id' | 'code'>) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Inventory', 'Add Product Category')) {
      throw new Error("You don't have permission to add product categories.");
    }

    const newId = `cat-${Date.now()}`;
    const code = `CAT-${category.name.substring(0, 2).toUpperCase()}`;
    const newCat: CategoryItem = {
      ...category,
      id: newId,
      code,
      lowStockThreshold: category.lowStockThreshold || 2,
    };
    setCategories((prev) => [newCat, ...prev]);

    logActivity('ADD_ENTRY', 'Inventory', `Added Category: ${newCat.name}`, newId);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<CategoryItem>) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Inventory', 'Update Product Category')) {
      throw new Error("You don't have permission to modify product categories.");
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logActivity('EDIT_ITEM', 'Inventory', `Updated Category ID: ${id}`, id);
  };

  const deleteCategory = (id: string) => {
    if (!verifyPermission('ADD_RELATED_ENTRIES', 'Inventory', 'Delete Product Category')) {
      throw new Error("You don't have permission to delete product categories.");
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    logActivity('DELETE_ITEM', 'Inventory', `Deleted Category ID: ${id}`, id);
  };

  // --- BACKUP DATA MANAGEMENT ---
  const exportBackupJSON = () => {
    if (!verifyPermission('EXPORT_REPORTS', 'System', 'Export Database Backup')) {
      throw new Error("You don't have permission to export database backups.");
    }

    const backupData = {
      version: '4.0-SALTED-RBAC',
      exportedAt: new Date().toISOString(),
      hasRealAdmin,
      settings,
      users: users.map((u) => (u.isDemo ? { ...u, passwordHash: '' } : u)),
      customers,
      categories,
      stock,
      stockReceipts,
      stockMovements,
      agreements,
      payments,
      reversals,
      cashbook,
      auditLogs,
      activityLedger,
    };

    logActivity('EXPORT', 'System', 'Exported JSON Database Backup');
    return JSON.stringify(backupData, null, 2);
  };

  const importBackupJSON = (jsonString: string) => {
    if (!verifyPermission('ADD_ITEM', 'System', 'Restore Database Backup')) {
      throw new Error("Only Admin can import/restore database backups.");
    }

    try {
      const data = JSON.parse(jsonString);
      if (data.settings) setSettings(data.settings);
      if (data.users) setUsers(data.users);
      if (data.hasRealAdmin !== undefined) setHasRealAdmin(data.hasRealAdmin);

      const importedHasReal = (data.users || []).some(
        (u: User) => !u.isDemo && u.role === 'ADMIN' && u.isActive !== false
      );
      if (importedHasReal) {
        setHasRealAdmin(true);
      }

      if (data.customers) setCustomers(data.customers);
      if (data.categories) setCategories(data.categories);
      if (data.stock) setStock(data.stock);
      if (data.stockReceipts) setStockReceipts(data.stockReceipts);
      if (data.stockMovements) setStockMovements(data.stockMovements);
      if (data.agreements) setAgreements(data.agreements);
      if (data.payments) setPayments(data.payments);
      if (data.reversals) setReversals(data.reversals);
      if (data.cashbook) setCashbook(data.cashbook);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.activityLedger) setActivityLedger(data.activityLedger);

      logActivity('ADD_ENTRY', 'System', 'Restored JSON Database Backup');
      return { success: true, message: 'Backup imported successfully' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid backup JSON file' };
    }
  };

  const resetToDemoData = () => {
    if (!verifyPermission('ADD_ITEM', 'System', 'Reset Demo Data')) {
      throw new Error("Only Admin can reset database.");
    }

    setSettings(INITIAL_SHOP_SETTINGS);
    setUsers(DEFAULT_USERS);
    setHasRealAdmin(false);
    setCurrentUser(DEFAULT_USERS[0]);
    setCustomers(INITIAL_CUSTOMERS);
    setCategories(INITIAL_CATEGORIES);
    setStock(INITIAL_STOCK);
    setStockReceipts(INITIAL_STOCK_RECEIPTS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setAgreements(INITIAL_AGREEMENTS);
    setPayments(INITIAL_PAYMENTS);
    setReversals([]);
    setCashbook(INITIAL_CASHBOOK);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setActivityLedger([]);

    logActivity('ADD_ENTRY', 'System', 'Reset application database to factory defaults');
  };

  const logReportView = (reportName: string) => {
    logActivity('VIEW_REPORT', 'Reports', `Viewed Audit & Financial Report: ${reportName}`);
  };

  return {
    settings,
    setSettings,
    users,
    hasRealAdmin,
    createInitialRealAdmin,
    createUserAccount,
    editUserAccount,
    resetUserPassword,
    setUserActiveStatus,
    unlockUserAccount,
    changeOwnPassword,
    updateForcedPassword,
    changeOwnDisplayName,
    currentUser,
    loginUser,
    logoutUser,
    activityLedger,
    logActivity,
    verifyPermission,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    stock,
    receiveStock,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    stockReceipts,
    stockMovements,
    agreements,
    createAgreement,
    payments,
    recordPayment,
    reversePayment,
    reversals,
    cashbook,
    addCashBookEntry,
    auditLogs,
    exportBackupJSON,
    importBackupJSON,
    resetToDemoData,
    logReportView,
  };
}
