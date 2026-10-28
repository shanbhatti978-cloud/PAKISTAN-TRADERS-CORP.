import { describe, it, expect } from 'vitest';
import { toLocalISODate, parseLocalDate, addMonthsClamped, todayLocal } from '../utils/dates';
import { PermissionManager } from '../utils/permissionManager';
import { encryptBackup, decryptBackup } from '../utils/backupEncryption';
import { assessCustomerRiskOffline, generateRecoveryMessage } from '../utils/geminiAi';
import { PermissionAction } from '../types';

describe('1. Date Calculations & Local Midnight (Asia/Karachi UTC+5)', () => {
  it('toLocalISODate should format local midnight without UTC day-decrement', () => {
    // In UTC+5, local midnight Jan 10 2026 is Jan 9 19:00 UTC.
    // toLocalISODate MUST return '2026-01-10', never '2026-01-09'
    const d = new Date(2026, 0, 10, 0, 0, 0); // Jan 10, local midnight
    expect(toLocalISODate(d)).toBe('2026-01-10');
  });

  it('addMonthsClamped should clamp day 31 cleanly without overflowing into next month', () => {
    const base = new Date(2026, 0, 31); // Jan 31, 2026

    // Month 1 -> Feb 2026 (non-leap year has 28 days)
    const febDate = addMonthsClamped(base, 1, 31);
    expect(toLocalISODate(febDate)).toBe('2026-02-28');

    // Month 2 -> March 2026 (has 31 days)
    const marDate = addMonthsClamped(base, 2, 31);
    expect(toLocalISODate(marDate)).toBe('2026-03-31');

    // Month 3 -> April 2026 (has 30 days)
    const aprDate = addMonthsClamped(base, 3, 31);
    expect(toLocalISODate(aprDate)).toBe('2026-04-30');
  });

  it('addMonthsClamped should correctly handle leap year February', () => {
    const baseLeap = new Date(2024, 0, 31); // Jan 31, 2024
    const febLeap = addMonthsClamped(baseLeap, 1, 31);
    expect(toLocalISODate(febLeap)).toBe('2024-02-29');
  });

  it('addMonthsClamped preserves target day of month (e.g. 10th of every month)', () => {
    const start = new Date(2026, 5, 10); // June 10, 2026
    for (let i = 1; i <= 6; i++) {
      const nextMonth = addMonthsClamped(start, i, 10);
      expect(nextMonth.getDate()).toBe(10);
    }
  });

  it('parseLocalDate should parse YYYY-MM-DD into exact local date representation', () => {
    const parsed = parseLocalDate('2026-08-15');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7); // 0-indexed August
    expect(parsed.getDate()).toBe(15);
  });
});

describe('2. Permission Matrix & Access Control (RBAC)', () => {
  it('ADMIN must have permission for sensitive operations', () => {
    const adminActions: PermissionAction[] = [
      'ADD_AGREEMENT',
      'CHANGE_AGREEMENT',
      'DELETE_AGREEMENT',
      'ADD_RECOVERY',
      'REVERSE_PAYMENT',
      'ADD_ITEM',
      'EDIT_ITEM',
      'DELETE_ITEM',
      'RESTORE_BACKUP',
      'RESET_DATABASE',
      'MANAGE_USERS',
    ];

    adminActions.forEach((action) => {
      expect(PermissionManager.can('ADMIN', action)).toBe(true);
    });
  });

  it('SUPERVISOR must NOT have access to destructive actions or inventory modification', () => {
    const forbiddenForSupervisor: PermissionAction[] = [
      'DELETE_AGREEMENT',
      'CHANGE_AGREEMENT',
      'ADD_ITEM',
      'EDIT_ITEM',
      'DELETE_ITEM',
      'REVERSE_PAYMENT',
      'MANAGE_USERS',
      'RESTORE_BACKUP',
      'RESET_DATABASE',
    ];

    forbiddenForSupervisor.forEach((action) => {
      expect(PermissionManager.can('SUPERVISOR', action)).toBe(false);
    });
  });

  it('SUPERVISOR should have daily operational add-only permissions', () => {
    expect(PermissionManager.can('SUPERVISOR', 'ADD_AGREEMENT')).toBe(true);
    expect(PermissionManager.can('SUPERVISOR', 'ADD_RECOVERY')).toBe(true);
    expect(PermissionManager.can('SUPERVISOR', 'ADD_RELATED_ENTRIES')).toBe(true);
    expect(PermissionManager.can('SUPERVISOR', 'VIEW_SCREENS_REPORTS')).toBe(true);
    expect(PermissionManager.can('SUPERVISOR', 'EXPORT_REPORTS')).toBe(true);
  });

  it('VIEWER must be strictly read-only and blocked from recording data', () => {
    const writeActions: PermissionAction[] = [
      'ADD_AGREEMENT',
      'CHANGE_AGREEMENT',
      'DELETE_AGREEMENT',
      'ADD_RECOVERY',
      'REVERSE_PAYMENT',
      'ADD_ITEM',
      'RESTORE_BACKUP',
      'RESET_DATABASE',
    ];

    writeActions.forEach((action) => {
      expect(PermissionManager.can('VIEWER', action)).toBe(false);
    });
    expect(PermissionManager.can('VIEWER', 'VIEW_SCREENS_REPORTS')).toBe(true);
    expect(PermissionManager.can('VIEWER', 'EXPORT_REPORTS')).toBe(true);
  });

  it('MODIFY_AUDIT_REPORT must be strictly blocked for ALL roles including ADMIN', () => {
    expect(PermissionManager.can('ADMIN', 'MODIFY_AUDIT_REPORT')).toBe(false);
    expect(PermissionManager.can('SUPERVISOR', 'MODIFY_AUDIT_REPORT')).toBe(false);
    expect(PermissionManager.can('VIEWER', 'MODIFY_AUDIT_REPORT')).toBe(false);
  });
});



describe('5. Backup Encryption & Decryption Round-Trip', () => {
  it('Should successfully encrypt and decrypt backup using WebCrypto AES-GCM', async () => {
    const sampleDb = JSON.stringify({
      version: '4.0',
      exportedAt: '2026-10-28',
      customers: [{ id: 'CUST-1', fullName: 'Muhammad Imran' }],
      agreements: [{ id: 'AGR-1', agreementNumber: 'AGR-2026-0001', remainingBalance: 45000 }],
    });

    const password = 'SuperSecretShopPassword123!';
    const encryptedPkg = await encryptBackup(sampleDb, password);
    expect(encryptedPkg).toContain('"version": "4.0-ENCRYPTED-AES-GCM"');
    expect(encryptedPkg).toContain('"algorithm": "AES-GCM-256"');

    const decrypted = await decryptBackup(encryptedPkg, password);
    expect(decrypted).toBe(sampleDb);
    const parsed = JSON.parse(decrypted);
    expect(parsed.customers[0].fullName).toBe('Muhammad Imran');
  });

  it('Should reject decryption if given an incorrect password', async () => {
    const sampleDb = JSON.stringify({ shop: 'Pakistan Trader' });
    const encryptedPkg = await encryptBackup(sampleDb, 'CorrectPassword123');

    await expect(decryptBackup(encryptedPkg, 'WrongPassword456')).rejects.toThrow(
      'Incorrect backup decryption password'
    );
  });
});

describe('6. AI and Offline Recovery Message Templates', () => {
  it('Offline rule engine evaluates credit risk safely without crashing', () => {
    const res = assessCustomerRiskOffline({
      monthlyIncome: 80000,
      itemPrice: 200000,
      requestedDownPayment: 50000,
      requestedMonths: 12,
      hasGuarantors: true,
    });

    expect(res.score).toBeGreaterThanOrEqual(10);
    expect(res.score).toBeLessThanOrEqual(100);
    expect(['Low Risk', 'Moderate Risk', 'High Risk']).toContain(res.tier);
    expect(res.source).toBe('offline_rules');
    expect(res.recommendations.length).toBeGreaterThan(0);
  });

  it('Recovery message generator formats multi-language templates with shop contact', async () => {
    const msg = await generateRecoveryMessage({
      customerName: 'Usman Ali',
      itemName: 'Dawlance Refrigerator',
      overdueAmount: 18500,
      dueDate: '2026-09-10',
      daysLate: 14,
      language: 'Roman Urdu',
      shopName: 'Pakistan Trader Corporation',
      shopPhone: '+92 300 8472910',
    });

    expect(msg).toContain('Pakistan Trader Corporation');
    expect(msg).toContain('+92 300 8472910');
    expect(msg).toContain('Usman Ali');
  }, 15000);

  it('Generates Urdu offline recovery reminder correctly', async () => {
    const msg = await generateRecoveryMessage({
      customerName: 'تارق محمود',
      itemName: 'ہونڈا سی ڈی 70',
      overdueAmount: 12000,
      dueDate: '2026-09-05',
      daysLate: 20,
      language: 'Urdu',
      shopName: 'پاکستان ٹریڈرز',
      shopPhone: '+92 300 1234567',
    });

    expect(msg).toContain('پاکستان ٹریڈرز');
    expect(msg).toContain('+92 300 1234567');
    expect(msg).toContain('تارق محمود');
  }, 15000);
});
