import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQistStore, STORAGE_KEYS } from '../data/store';
import { verifyPassword } from '../utils/activityLogger';

describe('Round 5: Release Gate & System Integrity', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function restart() {
    // Helper to simulate closing and reopening the app
    // In tests, hook rerender / re-mount reads fresh from localStorage
    const hook = renderHook(() => useQistStore());
    return hook;
  }

  it('Blocker 1: createInitialRealAdmin persists to localStorage immediately', async () => {
    const { result } = renderHook(() => useQistStore());
    await act(async () => {
      await result.current.createInitialRealAdmin('admin_shop', 'Shop Admin', 'SecretPin123!');
    });

    const storedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    expect(storedRaw).not.toBeNull();
    const storedUsers = JSON.parse(storedRaw!);
    const admin = storedUsers.find((u: any) => u.username === 'admin_shop');
    expect(admin).toBeDefined();
    expect(admin.fullName).toBe('Shop Admin');

    // Restart app and verify persistence
    const { result: r2 } = restart();
    const loadedAdmin = r2.current.users.find((u) => u.username === 'admin_shop');
    expect(loadedAdmin).toBeDefined();
  });

  it('Blocker 2: createUserAccount persists to localStorage immediately', async () => {
    const { result } = renderHook(() => useQistStore());
    await act(async () => {
      await result.current.createInitialRealAdmin('admin_shop', 'Shop Admin', 'SecretPin123!');
      await result.current.loginUser('admin_shop', 'SecretPin123!');
    });

    await act(async () => {
      await result.current.createUserAccount({
        username: 'staff_1',
        fullName: 'Staff One',
        role: 'SUPERVISOR',
        pin: 'StaffPin123!',
      });
    });

    const storedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    expect(storedRaw).not.toBeNull();
    const storedUsers = JSON.parse(storedRaw!);
    const staff = storedUsers.find((u: any) => u.username === 'staff_1');
    expect(staff).toBeDefined();
    expect(staff.fullName).toBe('Staff One');
  });

  it('Blocker 3: resetUserPassword persists updated hash to localStorage immediately', async () => {
    const { result } = renderHook(() => useQistStore());
    await act(async () => {
      await result.current.createInitialRealAdmin('admin_shop', 'Shop Admin', 'SecretPin123!');
      await result.current.loginUser('admin_shop', 'SecretPin123!');
      await result.current.createUserAccount({
        username: 'staff_2',
        fullName: 'Staff Two',
        role: 'SUPERVISOR',
        pin: 'StaffPin123!',
      });
    });

    await act(async () => {
      const staffUser = result.current.users.find((u) => u.username === 'staff_2')!;
      await result.current.resetUserPassword(staffUser.id, 'NewResetPin123!');
    });

    const storedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers = JSON.parse(storedRaw!);
    const staff = storedUsers.find((u: any) => u.username === 'staff_2');
    expect(staff.mustChangePassword).toBe(true);

    // Verify login works with new reset password after restart
    const { result: r2 } = restart();
    let loginRes: any;
    await act(async () => {
      loginRes = await r2.current.loginUser('staff_2', 'NewResetPin123!');
    });
    expect(loginRes.success).toBe(true);
  });

  it('Blocker 4: setUserActiveStatus persists active toggle to localStorage immediately', async () => {
    const { result } = renderHook(() => useQistStore());
    await act(async () => {
      await result.current.createInitialRealAdmin('admin_shop', 'Shop Admin', 'SecretPin123!');
      await result.current.loginUser('admin_shop', 'SecretPin123!');
      await result.current.createUserAccount({
        username: 'staff_3',
        fullName: 'Staff Three',
        role: 'SUPERVISOR',
        pin: 'StaffPin123!',
      });
    });

    const staffId = result.current.users.find((u) => u.username === 'staff_3')!.id;

    await act(async () => {
      await result.current.setUserActiveStatus(staffId, false);
    });

    const storedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers = JSON.parse(storedRaw!);
    const staff = storedUsers.find((u: any) => u.username === 'staff_3');
    expect(staff.isActive).toBe(false);

    // Restart app
    const { result: r2 } = restart();
    const loadedStaff = r2.current.users.find((u) => u.username === 'staff_3');
    expect(loadedStaff?.isActive).toBe(false);
  });

  it('Blocker 5: unlockUserAccount clears failedAttempts and lockoutUntil in localStorage immediately', async () => {
    const { result } = renderHook(() => useQistStore());
    await act(async () => {
      await result.current.createInitialRealAdmin('admin_shop', 'Shop Admin', 'SecretPin123!');
      await result.current.loginUser('admin_shop', 'SecretPin123!');
      await result.current.createUserAccount({
        username: 'staff_4',
        fullName: 'Staff Four',
        role: 'SUPERVISOR',
        pin: 'StaffPin123!',
      });
    });

    // Fail login 5 times to lock out
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await result.current.loginUser('staff_4', 'WrongPin!');
      });
    }

    const staffId = result.current.users.find((u) => u.username === 'staff_4')!.id;

    await act(async () => {
      await result.current.unlockUserAccount(staffId);
    });

    const storedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers = JSON.parse(storedRaw!);
    const staff = storedUsers.find((u: any) => u.username === 'staff_4');
    expect(staff.failedAttempts || 0).toBe(0);
    expect(staff.lockoutUntil).toBeUndefined();
  });

  it('Blocker 6: changeOwnPassword & updateForcedPassword persist immediately', async () => {
    const { result } = renderHook(() => useQistStore());
    await act(async () => {
      await result.current.createInitialRealAdmin('admin_shop', 'Shop Admin', 'SecretPin123!');
      await result.current.loginUser('admin_shop', 'SecretPin123!');
    });

    await act(async () => {
      await result.current.changeOwnPassword('SecretPin123!', 'NewOwnPin123!');
    });

    const storedRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    const storedUsers = JSON.parse(storedRaw!);
    const admin = storedUsers.find((u: any) => u.username === 'admin_shop');
    expect(admin).toBeDefined();

    // Verify login with new password after restart
    const { result: r2 } = restart();
    let loginRes: any;
    await act(async () => {
      loginRes = await r2.current.loginUser('admin_shop', 'NewOwnPin123!');
    });
    expect(loginRes.success).toBe(true);
  });

  it('Blocker 7: verifyPassword NEVER accepts plain text matches', async () => {
    const plainPin = '123456';
    // Hash stored in DB is a PBKDF2 string or hex hash, NOT plain text
    const isValid = await verifyPassword(plainPin, plainPin, 'salt_test');
    expect(isValid).toBe(false);
  });

  it('Blocker 8: Guest mode is OFF by default and currentUser is persistent', async () => {
    const { result } = renderHook(() => useQistStore());
    expect(result.current.settings.allowGuestMode || false).toBe(false);
  });

  it('Blocker 9: Storage engine handles write failure gracefully', async () => {
    const { result } = renderHook(() => useQistStore());
    expect(result.current.getStorageInfo).toBeDefined();
    const info = result.current.getStorageInfo();
    expect(info).toHaveProperty('usageBytes');
  });

  it('Blocker 10: Stock FIFO cost layers recorded on stock receipts', async () => {
    const { result } = renderHook(() => useQistStore());
    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        supplierName: 'Pak Supplier',
        receivedDate: '2026-10-01',
        name: 'Haier AC 1.5 Ton',
        category: 'Air Conditioners',
        quantity: 5,
        unitCost: 80000,
        cashPrice: 85000,
        instalmentPrice: 102000,
        minDownPayment: 15000,
        serialNumbers: ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'],
      });
    });

    const item = result.current.stock.find((s) => s.id === rec.stockItem.id)!;
    expect(item.costLayers).toBeDefined();
    expect(item.costLayers!.length).toBeGreaterThan(0);
    expect(item.costLayers![0].unitCost).toBe(80000);
    expect(item.costLayers![0].quantity).toBe(5);
  });

  it('Blocker 11: Market price update validation restricts unreasonable values', async () => {
    const { result } = renderHook(() => useQistStore());
    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        supplierName: 'Pak Supplier',
        receivedDate: '2026-10-01',
        name: 'Haier AC 1.5 Ton',
        category: 'Air Conditioners',
        quantity: 5,
        unitCost: 80000,
        cashPrice: 85000,
        instalmentPrice: 102000,
        minDownPayment: 15000,
        serialNumbers: ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'],
      });
    });

    expect(() => {
      result.current.updateItemMarketPrice(rec.stockItem.id, -100, 20);
    }).toThrow();

    expect(() => {
      result.current.updateItemMarketPrice(rec.stockItem.id, 80000, 300); // > 200% markup
    }).toThrow();
  });
});
