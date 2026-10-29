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
  CASHBOOK_CATEGORIES,
  CASHBOOK_IN_CATEGORIES,
  CASHBOOK_OUT_CATEGORIES,
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
import {
  ActivityLogger,
  calculateHash,
  hashPassword,
  verifyPassword,
  generateSecureSalt,
} from '../utils/activityLogger';
import {
  toLocalISODate,
  todayLocal,
  parseLocalDate,
  addMonthsClamped,
} from '../utils/dates';
import { encryptBackup, decryptBackup } from '../utils/backupEncryption';

export const STORAGE_KEYS = {
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

// Seed Demo Accounts - no plaintext passwords in source!
export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    passwordHash: '',
    salt: 'salt_demo_admin_v4',
    fullName: 'System Administrator (Demo)',
    role: 'ADMIN',
    createdAt: '2026-01-01',
    isDemo: true,
    isActive: false,
  },
  {
    id: 'usr-sup-01',
    username: 'supervisor',
    passwordHash: '',
    salt: 'salt_demo_sup_v4',
    fullName: 'Operations Supervisor (Demo)',
    role: 'SUPERVISOR',
    createdAt: '2026-01-01',
    isDemo: true,
    isActive: false,
  },
  {
    id: 'usr-view-01',
    username: 'viewer',
    passwordHash: '',
    salt: 'salt_demo_view_v4',
    fullName: 'Read-Only Auditor (Demo)',
    role: 'VIEWER',
    createdAt: '2026-01-01',
    isDemo: true,
    isActive: false,
  },
];

export function generateSecureId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateSalt(): string {
  return generateSecureSalt();
}

export function normalizeCnic(cnic: string): string {
  return cnic.replace(/[^0-9]/g, '');
}

export function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Failed reading ${key} from storage:`, err);
    return fallback;
  }
}

export function setStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed writing ${key} to storage:`, err);
  }
}

/**
 * Migration 1.1: Recomputes installment due dates in local timezone without rollbacks.
 * Backs up data first, then runs only once.
 */
function runInstallmentDateMigration(currentAgreements: Agreement[]): Agreement[] {
  const MIGRATION_FLAG_KEY = 'qistflow_date_migration_done_v1';
  const BACKUP_KEY = 'qistflow_pre_date_fix_backup_v1';

  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
      return currentAgreements;
    }

    // Step 1: Automatic pre-migration backup
    const backupSnapshot = {
      timestamp: new Date().toISOString(),
      agreements: currentAgreements,
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupSnapshot));

    // Step 2: Recompute dueDate for pending/partially_paid/overdue slots
    let modified = false;
    const updatedAgreements = currentAgreements.map((agr) => {
      if (!agr.schedule || agr.schedule.length === 0) return agr;
      const start = parseLocalDate(agr.deliveryDate || agr.startDate || todayLocal());
      const dueDay = agr.dueDayOfMonth || 10;

      const updatedSchedule = agr.schedule.map((slot) => {
        // Never touch paid slots!
        if (slot.status === 'paid') return slot;

        const i = slot.installmentNumber;
        const newDueDate = toLocalISODate(addMonthsClamped(start, i, dueDay));
        if (slot.dueDate !== newDueDate) {
          modified = true;
          return { ...slot, dueDate: newDueDate };
        }
        return slot;
      });

      return { ...agr, schedule: updatedSchedule };
    });

    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    try {
      localStorage.removeItem(BACKUP_KEY);
    } catch {}
    if (modified) {
      setStored(STORAGE_KEYS.AGREEMENTS, updatedAgreements);
    }
    return updatedAgreements;
  } catch (err) {
    console.error('Failed to run date migration:', err);
    return currentAgreements;
  }
}

/**
 * Derives the next unique Agreement number from the highest existing number
 */
export function getNextAgreementNumber(agreements: Agreement[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 1000;
  agreements.forEach((a) => {
    const match = a.agreementNumber?.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });
  return `AGR-${year}-${maxSeq + 1}`;
}

/**
 * Derives the next unique Receipt number from the highest existing number
 */
export function getNextReceiptNumber(payments: Payment[]): string {
  const year = new Date().getFullYear();
  let maxSeq = 3000;
  payments.forEach((p) => {
    const match = p.receiptNumber?.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });
  return `RCP-${year}-${maxSeq + 1}`;
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
  const [agreements, setAgreements] = useState<Agreement[]>(() => {
    const initialAgrs = getStored(STORAGE_KEYS.AGREEMENTS, INITIAL_AGREEMENTS);
    return runInstallmentDateMigration(initialAgrs);
  });
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
      id: generateSecureId('log'),
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
    proprietorName?: string;
    phone?: string;
    address?: string;
    city?: string;
    regNumber?: string;
    keepDemoData?: boolean;
  }) => {
    const cleanUsername = params.username.toLowerCase().trim();
    const salt = generateSecureSalt();
    const passwordHash = await hashPassword(params.password, salt);

    const realAdminUser: User = {
      id: generateSecureId('usr-real-admin'),
      username: cleanUsername,
      passwordHash,
      salt,
      fullName: params.fullName.trim(),
      role: 'ADMIN',
      createdAt: todayLocal(),
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

    // Default: start with empty data for real shop, clearing all business collections and resetting shop profile
    if (!params.keepDemoData) {
      setSettings((prev) => ({
        ...prev,
        shopName: params.shopName?.trim() || 'Pakistan Trader Corporation',
        proprietorName: params.proprietorName?.trim() || params.fullName.trim(),
        phone: params.phone?.trim() || '',
        address: params.address?.trim() || '',
        city: params.city?.trim() || '',
        regNumber: params.regNumber?.trim() || '',
      }));
      setCustomers([]);
      setStock([]);
      setStockReceipts([]);
      setStockMovements([]);
      setAgreements([]);
      setPayments([]);
      setReversals([]);
      setCashbook([]);
      setAuditLogs([]);
    } else if (params.shopName && params.shopName.trim()) {
      setSettings((prev) => ({
        ...prev,
        shopName: params.shopName!.trim(),
      }));
    }

    logActivity(
      'DEMO_ACCOUNTS_REMOVED',
      'System',
      `Master Real Admin account '${realAdminUser.username}' created. ${
        params.keepDemoData ? 'Demo records retained.' : 'Empty business database initialized for production.'
      }`,
      realAdminUser.id,
      'Demo Accounts Active',
      'Demo Accounts Disabled'
    );

    addAuditLog(
      'DEMO_ACCOUNTS_REMOVED',
      `Owner Admin ${realAdminUser.username} created. ${
        params.keepDemoData ? 'Demo records retained.' : 'Demo business data wiped.'
      }`
    );

    return {
      success: true,
      message: params.keepDemoData
        ? 'Master Admin account created. Demo data preserved for testing.'
        : 'Master Admin account created. Clean production database initialized.',
    };
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

    // Verify Password Hash (PBKDF2 or Legacy Salted SHA-256)
    const isMatch = await verifyPassword(passwordAttempt, user.salt, user.passwordHash);

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

    // Successful Login: Reset failed attempts & upgrade legacy hash to PBKDF2 if needed
    let updatedHash = user.passwordHash;
    let updatedSalt = user.salt;
    if (!user.passwordHash.startsWith('pbkdf2:')) {
      try {
        updatedSalt = generateSecureSalt();
        updatedHash = await hashPassword(passwordAttempt, updatedSalt);
      } catch {
        // Keep existing if derivation fails
      }
    }

    const updatedUser: User = {
      ...user,
      passwordHash: updatedHash,
      salt: updatedSalt,
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
    addAuditLog('USER_LOGOUT', `User ${currentUser.username} logged out`);

    let activeViewer = users.find((u) => u.role === 'VIEWER' && u.isActive !== false);
    if (!activeViewer) {
      activeViewer = {
        id: 'usr-guest-viewer',
        username: 'viewer',
        passwordHash: '',
        fullName: 'Read-Only Viewer',
        role: 'VIEWER',
        createdAt: todayLocal(),
        isActive: true,
      };
      setUsers((prev) => [...prev.filter((u) => u.username !== 'viewer'), activeViewer!]);
    }

    setCurrentUser(activeViewer);
    setStored(STORAGE_KEYS.CURRENT_USER, activeViewer);
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

    const salt = generateSecureSalt();
    const passwordHash = await hashPassword(params.password, salt);

    const newUser: User = {
      id: generateSecureId('usr'),
      username: cleanUsername,
      passwordHash,
      salt,
      fullName: params.fullName.trim(),
      role: params.role,
      createdAt: todayLocal(),
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

    const salt = generateSecureSalt();
    const passwordHash = await hashPassword(newTempPassword, salt);

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
    const isOldMatch = await verifyPassword(oldPasswordAttempt, currentUser.salt, currentUser.passwordHash);

    if (!isOldMatch) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    const newSalt = generateSecureSalt();
    const newPasswordHash = await hashPassword(newPasswordAttempt, newSalt);

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
    const newSalt = generateSecureSalt();
    const newPasswordHash = await hashPassword(newPasswordAttempt, newSalt);

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

    const id = generateSecureId('cust');
    const customerCode = `CUST-${(customers.length + 1).toString().padStart(3, '0')}`;
    const newCust: Customer = {
      ...customerData,
      id,
      customerCode,
      createdAt: todayLocal(),
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
    if (!verifyPermission('EDIT_ITEM', 'Customers', 'Update Customer Profile')) {
      throw new Error("Only Admin has permission to modify customer records.");
    }

    const oldCust = customers.find((c) => c.id === id);
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

    logActivity(
      'EDIT_ITEM',
      'Customers',
      `Updated customer profile: ${oldCust?.fullName || id}`,
      id,
      oldCust ? JSON.stringify(oldCust) : undefined,
      JSON.stringify(updates)
    );

    addAuditLog('CUSTOMER_UPDATED', `Updated customer details: ${oldCust?.fullName || id}`);
  };

  const deleteCustomer = (id: string) => {
    if (!verifyPermission('DELETE_ITEM', 'Customers', 'Delete Customer Profile')) {
      throw new Error("Only Admin has permission to delete customers.");
    }

    // Phase 2.1: Refuse when customer has agreements
    const hasLinkedAgreements = agreements.some((a) => a.customerId === id);
    if (hasLinkedAgreements) {
      throw new Error("Cannot delete customer with active or past instalment agreements. Remove or cancel the agreements first.");
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
    purchaseRef?: string;
    receivedDate: string;
    stockItemId?: string;
    name: string;
    category: StockItem['category'];
    brand?: string;
    model?: string;
    quantity: number;
    unitCost: number;
    cashPrice: number;
    instalmentPrice: number;
    minDownPayment?: number;
    serialNumbers: string[];
    counterLocation?: string;
    notes?: string;
  }) => {
    if (!verifyPermission('ADD_ITEM', 'Inventory', 'Receive Stock Shipment')) {
      throw new Error("You don't have permission to add stock or inventory items.");
    }

    // Input Validation (Item 3 Store Validation)
    if (!Number.isInteger(params.quantity) || params.quantity <= 0) {
      throw new Error("Quantity must be a positive integer.");
    }
    if (typeof params.unitCost !== 'number' || !isFinite(params.unitCost) || params.unitCost < 0) {
      throw new Error("Unit cost must be a non-negative finite number.");
    }
    if (
      typeof params.cashPrice !== 'number' ||
      !isFinite(params.cashPrice) ||
      params.cashPrice < 0 ||
      typeof params.instalmentPrice !== 'number' ||
      !isFinite(params.instalmentPrice) ||
      params.instalmentPrice < 0
    ) {
      throw new Error("Retail and instalment prices must be non-negative finite numbers.");
    }
    if (params.serialNumbers) {
      if (params.serialNumbers.length > params.quantity) {
        throw new Error("Serial numbers count cannot exceed quantity.");
      }
      const uniqueSerials = new Set(params.serialNumbers);
      if (uniqueSerials.size !== params.serialNumbers.length) {
        throw new Error("Serial numbers in shipment must be unique.");
      }
      const existingSerials = new Set<string>();
      stock.forEach((s) => {
        if (s.serialNumber) existingSerials.add(s.serialNumber);
      });
      stockReceipts.forEach((r) => {
        r.serialNumbers?.forEach((sn) => existingSerials.add(sn));
      });
      for (const sn of params.serialNumbers) {
        if (existingSerials.has(sn)) {
          throw new Error(`Serial number ${sn} already exists in inventory.`);
        }
      }
    }
    if (!params.receivedDate || !/^\d{4}-\d{2}-\d{2}$/.test(params.receivedDate) || isNaN(Date.parse(params.receivedDate))) {
      throw new Error("Invalid receipt date.");
    }

    const effectiveName = params.name || (params as any).modelName || 'Stock Item';
    const effectiveBrand = params.brand || 'General';
    const effectiveModel = params.model || effectiveName;
    const effectivePurchaseRef = params.purchaseRef || `PO-${Date.now().toString().slice(-4)}`;
    const effectiveLocation = params.counterLocation || 'Main Showroom Counter #1';
    const effectiveMinDown = params.minDownPayment !== undefined ? params.minDownPayment : Math.round(params.cashPrice * 0.2);

    let targetItem = stock.find((s) => s.id === params.stockItemId);
    const oldQty = targetItem ? targetItem.inStock : 0;

    if (!targetItem) {
      const newStockId = generateSecureId('stock');
      const initialLayers = [{ quantity: params.quantity, unitCost: params.unitCost, remainingQty: params.quantity }];
      targetItem = {
        id: newStockId,
        name: effectiveName,
        category: params.category,
        brand: effectiveBrand,
        model: effectiveModel,
        serialNumber: params.serialNumbers[0] || `SER-${Date.now()}`,
        unitCost: params.unitCost,
        costLayers: initialLayers,
        cashPrice: params.cashPrice,
        instalmentPrice: params.instalmentPrice,
        minDownPayment: effectiveMinDown,
        inStock: params.quantity,
        totalReceived: params.quantity,
        totalIssued: 0,
        counterLocation: effectiveLocation,
        status: 'available',
        supplierName: params.supplierName,
        purchaseRef: effectivePurchaseRef,
        purchaseDate: params.receivedDate,
      };
      setStock((prev) => [targetItem!, ...prev]);
    } else {
      const existingLayers = targetItem.costLayers && targetItem.costLayers.length > 0
        ? [...targetItem.costLayers]
        : targetItem.inStock > 0
          ? [{ quantity: targetItem.inStock, unitCost: targetItem.unitCost, remainingQty: targetItem.inStock }]
          : [];

      existingLayers.push({
        quantity: params.quantity,
        unitCost: params.unitCost,
        remainingQty: params.quantity,
      });

      const totalRemQty = existingLayers.reduce((sum, l) => sum + l.remainingQty, 0);
      const totalRemVal = existingLayers.reduce((sum, l) => sum + l.remainingQty * l.unitCost, 0);
      const newWeightedUnitCost = totalRemQty > 0 ? Math.round(totalRemVal / totalRemQty) : params.unitCost;

      setStock((prev) =>
        prev.map((s) =>
          s.id === targetItem!.id
            ? {
                ...s,
                inStock: s.inStock + params.quantity,
                totalReceived: s.totalReceived + params.quantity,
                unitCost: newWeightedUnitCost,
                costLayers: existingLayers,
                counterLocation: params.counterLocation || s.counterLocation,
                status: 'available',
              }
            : s
        )
      );
    }

    const newReceipt: StockReceipt = {
      id: generateSecureId('rcpt'),
      supplierName: params.supplierName,
      purchaseRef: effectivePurchaseRef,
      receivedDate: params.receivedDate,
      modelName: effectiveName,
      counterLocation: effectiveLocation,
      quantity: params.quantity,
      unitCost: params.unitCost,
      serialNumbers: params.serialNumbers,
      notes: params.notes,
    };
    setStockReceipts((prev) => [newReceipt, ...prev]);

    const movement: StockMovement = {
      id: generateSecureId('mov'),
      date: params.receivedDate,
      type: 'RECEIVED',
      stockItemId: targetItem.id,
      itemName: effectiveName,
      serialNumber: params.serialNumbers.join(', '),
      quantity: params.quantity,
      refDocument: effectivePurchaseRef || newReceipt.id,
      counterLocation: effectiveLocation,
      actor: currentUser.username,
      reason: `Received shipment from ${params.supplierName}`,
    };
    setStockMovements((prev) => [movement, ...prev]);

    if (params.unitCost > 0) {
      const cbEntry: CashBookEntry = {
        id: generateSecureId('cb'),
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

    addAuditLog('STOCK_RECEIVED', `Received ${params.quantity} units of ${effectiveName}`);
    return Object.assign(newReceipt, { stockItem: targetItem });
  };

  // --- ADD / EDIT / DELETE INDIVIDUAL STOCK ITEM ---
  const addStockItem = (itemData: Omit<StockItem, 'id' | 'totalReceived' | 'totalIssued'>) => {
    if (!verifyPermission('ADD_ITEM', 'Inventory', 'Add Inventory Model')) {
      throw new Error("You don't have permission to add stock items.");
    }

    const newId = generateSecureId('stock');
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
    if (!oldItem) return;

    const isReferencedInAgreement = agreements.some((a) => a.itemId === id);
    const isReferencedInReceipt = stockReceipts.some((r) => r.modelName === oldItem.name);
    if (isReferencedInAgreement || isReferencedInReceipt) {
      throw new Error("Cannot delete stock item referenced in agreements or stock receipts.");
    }

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
    saleDate?: string;
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

    // Input Validation (Phase 1.5)
    if (!params.cashPrice || isNaN(params.cashPrice) || !isFinite(params.cashPrice) || params.cashPrice <= 0) {
      throw new Error("Cash price must be a valid positive number.");
    }
    if (!params.totalInstalmentPrice || isNaN(params.totalInstalmentPrice) || !isFinite(params.totalInstalmentPrice) || params.totalInstalmentPrice <= 0) {
      throw new Error("Total instalment price must be a valid positive number.");
    }
    if (params.downPayment === undefined || isNaN(params.downPayment) || !isFinite(params.downPayment) || params.downPayment < 0) {
      throw new Error("Down payment cannot negative.");
    }
    if (params.downPayment > params.totalInstalmentPrice) {
      throw new Error("Down payment cannot exceed total instalment price.");
    }
    if (!params.monthDuration || !Number.isInteger(params.monthDuration) || params.monthDuration < 1) {
      throw new Error("Duration must be an integer of at least 1 month.");
    }
    if (!params.dueDayOfMonth || !Number.isInteger(params.dueDayOfMonth) || params.dueDayOfMonth < 1 || params.dueDayOfMonth > 31) {
      throw new Error("Due day of month must be an integer between 1 and 31.");
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

    // Monthly installment calculation & validation
    let monthlyInstalment = 0;
    if (remainingBalance > 0) {
      if (params.monthlyInstalment && params.monthlyInstalment > 0) {
        const totalCustomExceptLast = params.monthlyInstalment * (params.monthDuration - 1);
        if (totalCustomExceptLast >= remainingBalance) {
          throw new Error("Custom monthly installment is too large for the remaining balance and duration.");
        }
        monthlyInstalment = params.monthlyInstalment;
      } else {
        monthlyInstalment = params.monthDuration > 0
          ? Math.floor(remainingBalance / params.monthDuration)
          : 0;
      }
    }

    const schedule: InstalmentDueDate[] = [];
    const start = parseLocalDate(params.deliveryDate || params.startDate || todayLocal());

    for (let i = 1; i <= params.monthDuration; i++) {
      const dueDate = addMonthsClamped(start, i, params.dueDayOfMonth);
      const amount = remainingBalance === 0
        ? 0
        : (i === params.monthDuration
            ? remainingBalance - monthlyInstalment * (params.monthDuration - 1)
            : monthlyInstalment);

      schedule.push({
        installmentNumber: i,
        dueDate: toLocalISODate(dueDate),
        amount: Math.max(0, amount),
        paidAmount: 0,
        status: remainingBalance === 0 ? 'paid' : 'pending',
      });
    }

    // Guarantee schedule sum equals remaining balance exactly
    const scheduleSum = schedule.reduce((sum, slot) => sum + slot.amount, 0);
    if (scheduleSum !== remainingBalance) {
      throw new Error(`Schedule calculation error: sum (${scheduleSum}) must equal remaining balance (${remainingBalance}).`);
    }

    const agreementNumber = getNextAgreementNumber(agreements);

    // FIFO Cost Layer Allocation
    let agreementUnitCost = params.unitCost;
    let updatedLayers = item.costLayers ? item.costLayers.map((l) => ({ ...l })) : undefined;

    if (agreementUnitCost === undefined) {
      if (updatedLayers && updatedLayers.length > 0) {
        const availableLayer = updatedLayers.find((l) => l.remainingQty > 0);
        if (availableLayer) {
          agreementUnitCost = availableLayer.unitCost;
          availableLayer.remainingQty -= 1;
        } else {
          agreementUnitCost = item.unitCost || Math.round(params.cashPrice * 0.85);
        }
      } else {
        agreementUnitCost = item.unitCost || Math.round(params.cashPrice * 0.85);
      }
    } else if (updatedLayers && updatedLayers.length > 0) {
      const availableLayer = updatedLayers.find((l) => l.remainingQty > 0);
      if (availableLayer) {
        availableLayer.remainingQty -= 1;
      }
    }

    const effectiveSaleDate = params.saleDate || params.startDate || todayLocal();

    const newAgr: Agreement = {
      id: generateSecureId('agr'),
      agreementNumber,
      customerId: params.customerId,
      customerCode: customer.customerCode,
      itemId: params.itemId,
      itemName: item.name,
      itemSerial: item.serialNumber,
      unitCost: agreementUnitCost,
      purchaseDate: params.purchaseDate || item.purchaseDate || todayLocal(),
      saleDate: effectiveSaleDate,
      deliveryDate: params.deliveryDate || params.startDate || todayLocal(),
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
      startDate: params.deliveryDate || params.startDate || todayLocal(),
      status: remainingBalance === 0 ? 'completed' : 'active',
      schedule,
      notes: params.notes,
      createdAt: todayLocal(),
    };

    setAgreements((prev) => [newAgr, ...prev]);

    const newStockCount = Math.max(0, item.inStock - 1);
    let updatedUnitCost = item.unitCost;
    if (updatedLayers && updatedLayers.length > 0) {
      const remQty = updatedLayers.reduce((sum, l) => sum + l.remainingQty, 0);
      const remVal = updatedLayers.reduce((sum, l) => sum + l.remainingQty * l.unitCost, 0);
      updatedUnitCost = remQty > 0 ? Math.round(remVal / remQty) : item.unitCost;
    }

    setStock((prev) =>
      prev.map((s) =>
        s.id === params.itemId
          ? {
              ...s,
              inStock: newStockCount,
              totalIssued: s.totalIssued + 1,
              costLayers: updatedLayers,
              unitCost: updatedUnitCost,
              status: newStockCount === 0 ? 'sold' : 'available',
            }
          : s
      )
    );

    const movement: StockMovement = {
      id: generateSecureId('mov'),
      date: effectiveSaleDate,
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
        id: generateSecureId('cb'),
        date: effectiveSaleDate,
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

  const updateAgreement = (
    id: string,
    updates: {
      deliveryDate?: string;
      dueDayOfMonth?: number;
      status?: 'active' | 'completed' | 'cancelled' | 'defaulter';
      notes?: string;
    }
  ) => {
    if (!verifyPermission('CHANGE_AGREEMENT', 'Agreements', 'Edit Sale Agreement')) {
      throw new Error("Only Admin has permission to modify sales agreements.");
    }

    const oldAgr = agreements.find((a) => a.id === id);
    if (!oldAgr) throw new Error("Agreement not found");

    const safeUpdates: Partial<Agreement> = {};
    if (updates.notes !== undefined) safeUpdates.notes = updates.notes;
    if (updates.status !== undefined) safeUpdates.status = updates.status;
    if (updates.deliveryDate !== undefined) safeUpdates.deliveryDate = updates.deliveryDate;
    if (updates.dueDayOfMonth !== undefined) safeUpdates.dueDayOfMonth = updates.dueDayOfMonth;

    // When delivery date or due day changes, regenerate dates of unpaid instalments
    const newDeliveryDate = updates.deliveryDate || oldAgr.deliveryDate;
    const newDueDay = updates.dueDayOfMonth || oldAgr.dueDayOfMonth;

    if (
      (updates.deliveryDate && updates.deliveryDate !== oldAgr.deliveryDate) ||
      (updates.dueDayOfMonth && updates.dueDayOfMonth !== oldAgr.dueDayOfMonth)
    ) {
      const baseDate = parseLocalDate(newDeliveryDate || oldAgr.startDate);
      const updatedSchedule = oldAgr.schedule.map((slot) => {
        if (slot.status === 'paid') return slot;
        const targetMonthDate = addMonthsClamped(baseDate, slot.installmentNumber, newDueDay);
        const y = targetMonthDate.getFullYear();
        const m = targetMonthDate.getMonth() + 1;
        const maxDaysInM = new Date(y, m, 0).getDate();
        const clampedDay = Math.min(newDueDay, maxDaysInM);
        const newDueDate = `${y}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
        const isPast = parseLocalDate(newDueDate).getTime() < parseLocalDate(todayLocal()).getTime();
        return {
          ...slot,
          dueDate: newDueDate,
          status: (slot.paidAmount > 0 ? 'partially_paid' : (isPast ? 'overdue' : 'pending')) as InstalmentDueDate['status'],
        };
      });
      safeUpdates.schedule = updatedSchedule;
    }

    // When status becomes cancelled, return unit to stock
    if (updates.status === 'cancelled' && oldAgr.status !== 'cancelled') {
      if (oldAgr.itemId) {
        setStock((prev) =>
          prev.map((s) =>
            s.id === oldAgr.itemId
              ? { ...s, inStock: s.inStock + 1, status: 'available' }
              : s
          )
        );
      }
    }

    setAgreements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...safeUpdates } : a))
    );

    logActivity(
      'EDIT_AGREEMENT',
      'Agreements',
      `Admin updated agreement: ${oldAgr?.agreementNumber || id}`,
      id,
      JSON.stringify(oldAgr),
      JSON.stringify(safeUpdates)
    );

    addAuditLog('AGREEMENT_UPDATED', `Updated agreement: ${oldAgr?.agreementNumber || id}`);
  };

  const deleteAgreement = (id: string, restoreStock: boolean = true) => {
    if (!verifyPermission('DELETE_AGREEMENT', 'Agreements', 'Delete Sale Agreement')) {
      throw new Error("Only Admin has permission to delete sales agreements.");
    }

    const target = agreements.find((a) => a.id === id);
    if (!target) return;

    // Phase 2.2: Block deletion when payments exist
    const hasPayments = payments.some((p) => p.agreementId === id);
    if (hasPayments) {
      throw new Error("Cannot delete agreement with recorded payment history. To close it, mark its status as cancelled or completed.");
    }

    if (restoreStock && target.itemId) {
      setStock((prev) =>
        prev.map((s) =>
          s.id === target.itemId
            ? { ...s, inStock: s.inStock + 1, status: 'available' }
            : s
        )
      );
    }

    // Preserve historical down payment in-entry and post matching reversal entry
    if (target.downPayment > 0) {
      const cbOut: CashBookEntry = {
        id: generateSecureId('cb'),
        date: todayLocal(),
        type: 'out',
        category: 'Refund Reversal',
        amount: target.downPayment,
        referenceNumber: `REV-${target.agreementNumber}`,
        description: `Refund Down Payment for deleted agreement ${target.agreementNumber}`,
      };
      setCashbook((prev) => [cbOut, ...prev]);
    }

    setAgreements((prev) => prev.filter((a) => a.id !== id));

    logActivity(
      'DELETE_AGREEMENT',
      'Agreements',
      `Admin deleted agreement ${target.agreementNumber} (${target.itemName})`,
      id,
      JSON.stringify(target)
    );

    addAuditLog('AGREEMENT_DELETED', `Deleted agreement: ${target.agreementNumber}`);
  };

  // --- PAYMENT COLLECTION (Phase 1.4 Accounting Safety) ---
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

    // Input Validation
    if (!params.amountPaid || isNaN(params.amountPaid) || !isFinite(params.amountPaid) || params.amountPaid <= 0) {
      throw new Error("Payment amount must be a valid positive number.");
    }

    const agreement = agreements.find((a) => a.id === params.agreementId);
    if (!agreement) throw new Error("Agreement not found");

    if (agreement.status === 'completed') {
      throw new Error("Agreement is already completed. No further payments can be accepted.");
    }
    if (agreement.status === 'cancelled') {
      throw new Error("Agreement is cancelled. Payments cannot be accepted.");
    }

    if (params.amountPaid > agreement.remainingBalance) {
      throw new Error(
        `Payment amount (${settings.currencySymbol} ${params.amountPaid.toLocaleString()}) exceeds agreement remaining balance (${settings.currencySymbol} ${agreement.remainingBalance.toLocaleString()}).`
      );
    }

    const customer = customers.find((c) => c.id === agreement.customerId);
    const receiptNumber = getNextReceiptNumber(payments);
    const lateFee = Math.max(0, params.lateFee || 0);
    const discount = Math.max(0, params.discount || 0);

    if (discount > params.amountPaid + lateFee) {
      throw new Error("Discount cannot exceed payment amount plus late fee.");
    }

    // Multi-slot auto-allocation for overpayment across unpaid instalments
    let unallocatedAmount = params.amountPaid;
    const affectedInstallmentNumbers: number[] = [];

    // Sort unpaid slots prioritizing the requested installment number
    const sortedSlots = [...agreement.schedule].sort((a, b) => a.installmentNumber - b.installmentNumber);
    const targetSlot = sortedSlots.find((s) => s.installmentNumber === params.installmentNumber && s.status !== 'paid');
    const otherUnpaidSlots = sortedSlots.filter((s) => s.installmentNumber !== params.installmentNumber && s.status !== 'paid');
    const prioritySlots = targetSlot ? [targetSlot, ...otherUnpaidSlots] : otherUnpaidSlots;

    if (prioritySlots.length === 0) {
      throw new Error("No unpaid installments found for this agreement.");
    }

    const slotAllocationMap = new Map<number, number>();

    for (const slot of prioritySlots) {
      if (unallocatedAmount <= 0) break;
      const unpaidOnSlot = slot.amount - slot.paidAmount;
      if (unpaidOnSlot <= 0) continue;

      const allocation = Math.min(unallocatedAmount, unpaidOnSlot);
      slotAllocationMap.set(slot.installmentNumber, allocation);
      affectedInstallmentNumbers.push(slot.installmentNumber);
      unallocatedAmount -= allocation;
    }

    const allocationsList: { installmentNumber: number; amount: number }[] = [];
    slotAllocationMap.forEach((amount, installmentNumber) => {
      if (amount > 0) {
        allocationsList.push({ installmentNumber, amount });
      }
    });

    const updatedSchedule = agreement.schedule.map((slot) => {
      const allocation = slotAllocationMap.get(slot.installmentNumber);
      if (allocation !== undefined && allocation > 0) {
        const newPaidAmount = slot.paidAmount + allocation;
        const isSlotPaid = newPaidAmount >= slot.amount;
        return {
          ...slot,
          paidAmount: newPaidAmount,
          status: isSlotPaid ? ('paid' as const) : ('partially_paid' as const),
          paidDate: params.date,
          receiptNumber,
        };
      }
      return slot;
    });

    const isFullyPaid = updatedSchedule.every((s) => s.status === 'paid');
    const newRemainingBalance = Math.max(0, agreement.remainingBalance - params.amountPaid);
    const updatedStatus = isFullyPaid ? 'completed' : agreement.status;

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

    const paymentId = generateSecureId('pay');
    const newPayment: Payment = {
      id: paymentId,
      receiptNumber,
      agreementId: agreement.id,
      customerId: agreement.customerId,
      customerName: customer?.fullName || 'Customer',
      installmentNumbers: affectedInstallmentNumbers.length > 0 ? affectedInstallmentNumbers : [params.installmentNumber],
      allocations: allocationsList,
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

    // Cashbook In = net cash collected (amountPaid + lateFee - discount)
    const netCashIn = params.amountPaid + lateFee - discount;
    if (netCashIn > 0) {
      const cbEntry: CashBookEntry = {
        id: generateSecureId('cb'),
        date: params.date,
        type: 'in',
        category: 'Instalment Recovery',
        amount: netCashIn,
        referenceNumber: receiptNumber,
        description: `Installment #${newPayment.installmentNumbers.join(', ')} collection (${customer?.fullName || 'Customer'})`,
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

  // --- REVERSE PAYMENT (Phase 1.4 Accounting Safe Reversal) ---
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

    // Find other non-reversed payments for this agreement to restore previous receipt/date on partial reversal
    const otherValidPayments = payments.filter(
      (p) => p.id !== paymentId && !p.isReversed && p.agreementId === agreement.id
    );

    const restoredBalance = agreement.remainingBalance + targetPayment.amountPaid;
    let remainingToDeduct = targetPayment.amountPaid;

    const allocationMap = new Map<number, number>();
    if (targetPayment.allocations && targetPayment.allocations.length > 0) {
      targetPayment.allocations.forEach((a) => {
        allocationMap.set(a.installmentNumber, a.amount);
      });
    }

    const restoredSchedule = agreement.schedule.map((slot) => {
      let deductFromSlot = 0;
      if (allocationMap.has(slot.installmentNumber)) {
        deductFromSlot = allocationMap.get(slot.installmentNumber) || 0;
      } else if (targetPayment.installmentNumbers.includes(slot.installmentNumber) && remainingToDeduct > 0) {
        deductFromSlot = Math.min(remainingToDeduct, slot.paidAmount);
        remainingToDeduct -= deductFromSlot;
      }

      if (deductFromSlot > 0) {
        const newPaidAmount = Math.max(0, slot.paidAmount - deductFromSlot);
        const priorPayment = otherValidPayments
          .filter((p) => p.installmentNumbers.includes(slot.installmentNumber))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        const isDuePast = parseLocalDate(slot.dueDate).getTime() < parseLocalDate(todayLocal()).getTime();
        let newStatus: InstalmentDueDate['status'] = 'pending';
        if (newPaidAmount >= slot.amount) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partially_paid';
        } else if (isDuePast) {
          newStatus = 'overdue';
        } else {
          newStatus = 'pending';
        }

        return {
          ...slot,
          paidAmount: newPaidAmount,
          status: newStatus,
          paidDate: newPaidAmount > 0 ? (priorPayment?.date || slot.paidDate) : undefined,
          receiptNumber: newPaidAmount > 0 ? (priorPayment?.receiptNumber || slot.receiptNumber) : undefined,
        };
      }
      return slot;
    });

    // If agreement was completed, it now has an outstanding balance so it becomes active
    const restoredStatus = agreement.status === 'completed' ? 'active' : agreement.status;

    setAgreements((prev) =>
      prev.map((a) =>
        a.id === agreement.id
          ? {
              ...a,
              remainingBalance: restoredBalance,
              status: restoredStatus,
              schedule: restoredSchedule,
            }
          : a
      )
    );

    const reversalRecord: PaymentReversal = {
      id: generateSecureId('rev'),
      paymentId: targetPayment.id,
      receiptNumber: targetPayment.receiptNumber,
      agreementId: agreement.id,
      amountReversed: targetPayment.amountPaid,
      reversedAt: new Date().toISOString(),
      reversedBy: currentUser.username,
      reason,
    };

    setReversals((prev) => [reversalRecord, ...prev]);

    // Cashbook Reversal match: refund cash-out must equal original net cash-in (amountPaid + lateFee - discount)
    const originalNetCashIn = targetPayment.amountPaid + (targetPayment.lateFee || 0) - (targetPayment.discount || 0);

    if (originalNetCashIn > 0) {
      const cbOut: CashBookEntry = {
        id: generateSecureId('cb'),
        date: todayLocal(),
        type: 'out',
        category: 'Refund Reversal',
        amount: originalNetCashIn,
        referenceNumber: `REV-${targetPayment.receiptNumber}`,
        description: `Reversal of payment receipt ${targetPayment.receiptNumber} (Net: Rs. ${originalNetCashIn.toLocaleString()}). Reason: ${reason}`,
      };
      setCashbook((prev) => [cbOut, ...prev]);
    }

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

    // Input Validation (Item 4 Cashbook Validation)
    if (typeof entryData.amount !== 'number' || !isFinite(entryData.amount) || entryData.amount <= 0) {
      throw new Error("Amount must be a positive finite number.");
    }

    if (entryData.type !== 'in' && entryData.type !== 'out') {
      throw new Error("Entry type must be 'in' or 'out'.");
    }

    if (!CASHBOOK_CATEGORIES.includes(entryData.category as any)) {
      throw new Error(`Category "${entryData.category}" is not an allowed cashbook category.`);
    }

    if (entryData.type === 'in' && !CASHBOOK_IN_CATEGORIES.includes(entryData.category as any)) {
      throw new Error(`Category "${entryData.category}" is not an allowed Cash IN category.`);
    }

    if (entryData.type === 'out' && !CASHBOOK_OUT_CATEGORIES.includes(entryData.category as any)) {
      throw new Error(`Category "${entryData.category}" is not an allowed Cash OUT category.`);
    }

    if (!entryData.date || !/^\d{4}-\d{2}-\d{2}$/.test(entryData.date) || isNaN(Date.parse(entryData.date))) {
      throw new Error("Invalid transaction date.");
    }

    if (!entryData.description || !entryData.description.trim()) {
      throw new Error("Description cannot be empty.");
    }

    const newEntry: CashBookEntry = {
      ...entryData,
      id: generateSecureId('cb'),
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

    const newId = generateSecureId('cat');
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
    if (!verifyPermission('EDIT_ITEM', 'Inventory', 'Update Product Category')) {
      throw new Error("Only Admin has permission to modify product categories.");
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logActivity('EDIT_ITEM', 'Inventory', `Updated Category ID: ${id}`, id);
  };

  const deleteCategory = (id: string) => {
    if (!verifyPermission('DELETE_ITEM', 'Inventory', 'Delete Product Category')) {
      throw new Error("Only Admin has permission to delete product categories.");
    }

    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    logActivity('DELETE_ITEM', 'Inventory', `Deleted category: ${cat?.name || id}`, id);
    addAuditLog('CATEGORY_DELETED', `Deleted category ${cat?.name || id}`);
  };

  // --- BACKUP DATA MANAGEMENT (Phase 2.3 & 2.4) ---
  const exportBackupJSON = async (encryptionPassword?: string): Promise<string> => {
    if (!verifyPermission('EXPORT_REPORTS', 'System', 'Export Database Backup')) {
      throw new Error("You don't have permission to export database backups.");
    }

    const backupData = {
      schemaVersion: '4.0',
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

    const rawJson = JSON.stringify(backupData, null, 2);

    if (encryptionPassword) {
      const encrypted = await encryptBackup(rawJson, encryptionPassword);
      logActivity('EXPORT', 'System', 'Exported Password-Encrypted AES-GCM Database Backup');
      return encrypted;
    }

    logActivity('EXPORT', 'System', 'Exported Plaintext JSON Database Backup');
    return rawJson;
  };

  const importBackupJSON = async (
    rawInput: string,
    decryptionPassword?: string,
    adminConfirmPassword?: string
  ): Promise<{ success: boolean; message: string }> => {
    // Phase 1.2: Guarded by RESTORE_BACKUP (Admin only)
    if (!verifyPermission('RESTORE_BACKUP', 'System', 'Restore Database Backup')) {
      throw new Error("Only Admin can import/restore database backups.");
    }

    // Require Admin password confirmation
    if (!adminConfirmPassword) {
      throw new Error("Admin confirmation password is required to restore database backup.");
    }
    const isAuth = await verifyPassword(adminConfirmPassword, currentUser.salt, currentUser.passwordHash);
    if (!isAuth) {
      throw new Error("Incorrect Admin confirmation password. Restore aborted.");
    }

    try {
      let jsonStringToParse = rawInput;

      // Detect if encrypted
      if (rawInput.includes('"version": "4.0-ENCRYPTED-AES-GCM"')) {
        if (!decryptionPassword) {
          throw new Error("This backup is password-encrypted. Please provide the decryption password.");
        }
        jsonStringToParse = await decryptBackup(rawInput, decryptionPassword);
      }

      const data = JSON.parse(jsonStringToParse);

      // Validation of required JSON object & collections
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid backup data: content is not a valid JSON object.");
      }

      const requiredCollections = ['settings', 'customers', 'categories', 'stock', 'agreements', 'payments', 'cashbook'];
      for (const reqKey of requiredCollections) {
        if (!(reqKey in data)) {
          throw new Error(`Corrupted or incomplete backup: missing required '${reqKey}' collection. Restore aborted without modifying existing records.`);
        }
      }

      // Record shape validation (Item 4)
      if (Array.isArray(data.agreements)) {
        for (const a of data.agreements) {
          if (!a || typeof a !== 'object' || typeof a.id !== 'string' || !Array.isArray(a.schedule)) {
            throw new Error("Corrupted or malformed backup: agreement records are missing required schedule or ID.");
          }
          for (const s of a.schedule) {
            if (!s || typeof s.installmentNumber !== 'number' || typeof s.amount !== 'number' || typeof s.dueDate !== 'string') {
              throw new Error("Corrupted or malformed backup: agreement schedule contains invalid slot entries.");
            }
          }
        }
      }

      if (Array.isArray(data.customers)) {
        for (const c of data.customers) {
          if (!c || typeof c !== 'object' || typeof c.id !== 'string' || typeof c.fullName !== 'string') {
            throw new Error("Corrupted or malformed backup: customer records are missing required fields.");
          }
        }
      }

      // Pre-restore snapshot backup (Abort if quota exceeded!)
      try {
        localStorage.setItem(
          'qistflow_pre_restore_snapshot',
          JSON.stringify({
            timestamp: new Date().toISOString(),
            customers,
            stock,
            agreements,
            payments,
            cashbook,
          })
        );
      } catch (err) {
        throw new Error("Cannot create pre-restore safety backup snapshot (localStorage quota exceeded). Restore aborted for safety.");
      }

      // Item 2: Legacy date recompute on imported agreements without schemaVersion or < '4.0'
      const importedAgreements: Agreement[] = Array.isArray(data.agreements) ? data.agreements : [];
      const needsDateCorrection = !data.schemaVersion || data.schemaVersion < '4.0';

      const correctedAgreements = importedAgreements.map((agr) => {
        if (!needsDateCorrection || !Array.isArray(agr.schedule)) return agr;
        const start = parseLocalDate(agr.deliveryDate || agr.startDate || todayLocal());
        const dueDay = agr.dueDayOfMonth || 10;

        const fixedSchedule = agr.schedule.map((slot) => {
          if (slot.status === 'paid') return slot; // Never touch paid slots!
          const recomputedDue = addMonthsClamped(start, slot.installmentNumber, dueDay);
          return {
            ...slot,
            dueDate: toLocalISODate(recomputedDue),
          };
        });

        return {
          ...agr,
          schedule: fixedSchedule,
        };
      });

      // Apply all-or-nothing state transitions
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.users)) setUsers(data.users);
      if (data.hasRealAdmin !== undefined) setHasRealAdmin(data.hasRealAdmin);

      const importedHasReal = (data.users || []).some(
        (u: User) => !u.isDemo && u.role === 'ADMIN' && u.isActive !== false
      );
      if (importedHasReal) {
        setHasRealAdmin(true);
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
      setStock(Array.isArray(data.stock) ? data.stock : []);
      setStockReceipts(Array.isArray(data.stockReceipts) ? data.stockReceipts : []);
      setStockMovements(Array.isArray(data.stockMovements) ? data.stockMovements : []);
      setAgreements(correctedAgreements);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setReversals(Array.isArray(data.reversals) ? data.reversals : []);
      setCashbook(Array.isArray(data.cashbook) ? data.cashbook : []);
      setAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
      setActivityLedger(Array.isArray(data.activityLedger) ? data.activityLedger : []);

      logActivity('ADD_ENTRY', 'System', 'Restored JSON Database Backup successfully');
      return { success: true, message: 'Backup successfully restored! All collections updated.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Invalid or incompatible backup file.' };
    }
  };

  const resetToDemoData = () => {
    // Phase 1.2: Guarded by RESET_DATABASE (Admin only)
    if (!verifyPermission('RESET_DATABASE', 'System', 'Reset Database')) {
      throw new Error("Only Admin can reset database.");
    }

    setSettings(INITIAL_SHOP_SETTINGS);
    setUsers(DEFAULT_USERS);
    setHasRealAdmin(false);
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

    // Phase 2.5: Log out user instead of silently logging in as demo admin without a password
    logoutUser();
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
    updateAgreement,
    deleteAgreement,
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
