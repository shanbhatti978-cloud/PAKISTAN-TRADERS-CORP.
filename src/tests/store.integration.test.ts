import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQistStore } from '../data/store';
import { toLocalISODate, parseLocalDate, addMonthsClamped, todayLocal } from '../utils/dates';

describe('Store Integration Tests (useQistStore)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Reversing a multi-instalment payment subtracts exact allocated amounts per instalment', () => {
    const { result } = renderHook(() => useQistStore());

    // Create a customer and stock item
    let cust: any;
    let stockItem: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-1111111-1',
        fullName: 'Test Customer',
        phone: '03001234567',
        address: 'Test Address',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000000-1', phone: '03000000000', relation: 'Brother', address: 'Lahore' },
      });
      stockItem = result.current.addStockItem({
        name: 'Haier AC',
        category: 'Air Conditioners',
        brand: 'Haier',
        model: '1.5 Ton',
        serialNumber: 'SN-AC-101',
        unitCost: 100000,
        cashPrice: 150000,
        instalmentPrice: 180000,
        minDownPayment: 20000,
        inStock: 5,
        counterLocation: 'Main Display',
        status: 'available',
      });
    });

    // Create an agreement: 180,000 total, 20,000 down, 160,000 balance across 4 months @ 40,000 / month
    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: stockItem.id,
        cashPrice: 150000,
        totalInstalmentPrice: 180000,
        downPayment: 20000,
        monthDuration: 4,
        dueDayOfMonth: 10,
        startDate: '2027-01-01',
      });
    });

    expect(agr.schedule.length).toBe(4);
    expect(agr.schedule[0].amount).toBe(40000);
    expect(agr.schedule[1].amount).toBe(40000);

    // Pay partial 10,000 on instalment #1
    let pay1: any;
    act(() => {
      pay1 = result.current.recordPayment({
        agreementId: agr.id,
        installmentNumber: 1,
        amountPaid: 10000,
        paymentMethod: 'Cash',
        date: '2026-01-10',
        collectorName: 'admin',
      });
    });

    // Check slot 1 paidAmount is 10,000
    let updatedAgr = result.current.agreements.find((a) => a.id === agr.id)!;
    expect(updatedAgr.schedule[0].paidAmount).toBe(10000);

    // Now collect 50,000 targeted at instalment #2 (slot amount 40,000).
    // It puts 40,000 on slot #2 (filling slot #2) and 10,000 on slot #1.
    let pay2: any;
    act(() => {
      pay2 = result.current.recordPayment({
        agreementId: agr.id,
        installmentNumber: 2,
        amountPaid: 50000,
        paymentMethod: 'Cash',
        date: '2026-02-10',
        collectorName: 'admin',
      });
    });

    updatedAgr = result.current.agreements.find((a) => a.id === agr.id)!;
    expect(updatedAgr.schedule[0].paidAmount).toBe(20000); // 10k + 10k
    expect(updatedAgr.schedule[1].paidAmount).toBe(40000); // filled 40k

    // Reverse pay2 (the 50,000 payment).
    // Reversal MUST deduct 40,000 from slot #2 (leaving 0) and 10,000 from slot #1 (leaving 10,000 as before pay2).
    act(() => {
      result.current.reversePayment(pay2.id, 'Customer request reversal');
    });

    updatedAgr = result.current.agreements.find((a) => a.id === agr.id)!;
    expect(updatedAgr.schedule[0].paidAmount).toBe(10000); // reverted back to 10k
    expect(updatedAgr.schedule[1].paidAmount).toBe(0); // reverted back to 0
    expect(updatedAgr.schedule[0].status).toBe('partially_paid');
    expect(updatedAgr.schedule[1].status).toBe('pending');
  });

  it('2. Restored legacy agreements get their due dates corrected automatically', async () => {
    const { result } = renderHook(() => useQistStore());

    // First setup real admin so currentUser has a known password
    await act(async () => {
      await result.current.createInitialRealAdmin({
        fullName: 'Admin Owner',
        username: 'admin',
        password: 'Password123!',
        shopName: 'Pakistan Trader Corporation',
        keepDemoData: true,
      });
    });

    // Construct a legacy backup without schemaVersion where due dates were saved 1 day early (e.g., due date 9th instead of 10th)
    const legacyBackup = JSON.stringify({
      version: '3.0-LEGACY',
      settings: result.current.settings,
      customers: [{ id: 'CUST-LEG', customerCode: 'C1', fullName: 'Legacy Customer', cnic: '35202-0000000-1', phone: '03001234567', address: 'Addr', city: 'Lahore', rating: 'good', guarantor1: { name: 'G1', cnic: '0', phone: '0', relation: 'R', address: 'A' } }],
      categories: [],
      stock: [],
      agreements: [
        {
          id: 'AGR-LEG-1',
          agreementNumber: 'AGR-2026-0001',
          customerId: 'CUST-LEG',
          customerCode: 'C1',
          itemId: 'ITEM-1',
          itemName: 'Refrigerator',
          itemSerial: 'SN-1',
          unitCost: 50000,
          cashPrice: 70000,
          totalInstalmentPrice: 90000,
          downPayment: 10000,
          remainingBalance: 80000,
          monthDuration: 2,
          monthlyInstalment: 40000,
          dueDayOfMonth: 10,
          deliveryDate: '2026-01-01',
          startDate: '2026-01-01',
          status: 'active',
          schedule: [
            { installmentNumber: 1, dueDate: '2026-02-09', amount: 40000, paidAmount: 0, status: 'pending' },
            { installmentNumber: 2, dueDate: '2026-03-09', amount: 40000, paidAmount: 0, status: 'pending' },
          ],
        },
      ],
      payments: [],
      cashbook: [],
    });

    let importRes: any;
    await act(async () => {
      importRes = await result.current.importBackupJSON(legacyBackup, undefined, 'Password123!');
    });

    expect(importRes.success).toBe(true);

    const importedAgr = result.current.agreements.find((a) => a.id === 'AGR-LEG-1')!;
    // Slot #1 due date must be corrected from 2026-02-09 to 2026-02-10
    expect(importedAgr.schedule[0].dueDate).toBe('2026-02-10');
    expect(importedAgr.schedule[1].dueDate).toBe('2026-03-10');
  });

  it('3. An agreement paid in full upfront receives status completed and balance 0', () => {
    const { result } = renderHook(() => useQistStore());

    let cust: any;
    let stockItem: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-3333333-3',
        fullName: 'Upfront Customer',
        phone: '03003333333',
        address: 'Lahore',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '0', phone: '0', relation: 'R', address: 'A' },
      });
      stockItem = result.current.addStockItem({
        name: 'Washing Machine',
        category: 'Appliances',
        brand: 'Dawlance',
        model: 'WM-10',
        serialNumber: 'SN-WM-1',
        unitCost: 30000,
        cashPrice: 40000,
        instalmentPrice: 45000,
        minDownPayment: 10000,
        inStock: 3,
        counterLocation: 'Display',
        status: 'available',
      });
    });

    // Create agreement paid in full upfront: downPayment = totalInstalmentPrice = 45000
    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: stockItem.id,
        cashPrice: 40000,
        totalInstalmentPrice: 45000,
        downPayment: 45000,
        monthDuration: 6,
        dueDayOfMonth: 10,
        startDate: '2026-01-01',
      });
    });

    expect(agr.remainingBalance).toBe(0);
    expect(agr.status).toBe('completed');
  });

  it('4. Backup restore requires Admin password confirmation and validates record shape', async () => {
    const { result } = renderHook(() => useQistStore());

    // Missing admin password must throw
    await expect(
      act(async () => {
        await result.current.importBackupJSON(JSON.stringify({ settings: {}, customers: [], categories: [], stock: [], agreements: [], payments: [], cashbook: [] }));
      })
    ).rejects.toThrow('Admin confirmation password is required');

    // Invalid admin password must throw
    await expect(
      act(async () => {
        await result.current.importBackupJSON(
          JSON.stringify({ settings: {}, customers: [], categories: [], stock: [], agreements: [], payments: [], cashbook: [] }),
          undefined,
          'WrongPassword'
        );
      })
    ).rejects.toThrow('Incorrect Admin confirmation password');
  });
});
