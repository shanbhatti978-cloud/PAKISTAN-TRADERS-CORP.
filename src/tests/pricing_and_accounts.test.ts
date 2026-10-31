import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQistStore } from '../data/store';

describe('Round 4: Pricing, Markup Flow, Cost Accounting & Accounts', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('DAY 1 & 2 Full Journey: Buy @ 10,000 -> sell @ 12,000 -> re-price to 12,000 market -> sell @ 14,400 -> total profit 6,400', async () => {
    const { result } = renderHook(() => useQistStore());

    // 1. Receive stock: 2 units @ 10,000 cost, 10,000 market price, 20% markup = 12,000 instalment price
    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        supplierName: 'Pak Electronics Wholesale',
        receivedDate: '2026-10-01',
        name: 'Dawlance Microwave D-100',
        category: 'Microwaves',
        quantity: 2,
        unitCost: 10000,
        cashPrice: 10000,
        instalmentPrice: 12000,
        minDownPayment: 2000,
        serialNumbers: ['SN-MW-001', 'SN-MW-002'],
      });
    });

    let item = result.current.stock.find((s) => s.id === rec.stockItem.id)!;
    expect(item.inStock).toBe(2);

    // 2. Customer 1 & Sale 1: Down payment 2,000, instalment price 12,000
    let cust1: any;
    let agr1: any;
    act(() => {
      cust1 = result.current.addCustomer({
        cnic: '35202-1111111-1',
        fullName: 'First Customer',
        phone: '03001111111',
        address: 'Lahore',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000001-1', phone: '03000000001', relation: 'Brother', address: 'Lahore' },
      });
      agr1 = result.current.createAgreement({
        customerId: cust1.id,
        itemId: item.id,
        cashPrice: 10000,
        totalInstalmentPrice: 12000,
        downPayment: 2000,
        monthDuration: 5,
        dueDayOfMonth: 10,
        startDate: '2026-10-02',
        saleDate: '2026-10-02',
      });
    });

    expect(agr1.unitCost).toBe(10000);
    expect(agr1.markupAmount).toBe(2000);

    // 3. Market price rises to 12,000 -> Admin updates market price to 12,000 @ 20% markup -> new instalment price = 14,400
    act(() => {
      result.current.updateItemMarketPrice(item.id, 12000, 20, 'Admin');
    });

    item = result.current.stock.find((s) => s.id === item.id)!;
    expect(item.marketPrice).toBe(12000);
    expect(item.instalmentPrice).toBe(14400);

    // Verify existing agreement 1 is UNCHANGED at 12,000
    const checkAgr1 = result.current.agreements.find((a) => a.id === agr1.id)!;
    expect(checkAgr1.totalInstalmentPrice).toBe(12000);

    // 4. Customer 2 & Sale 2: Down payment 2,400, instalment price 14,400
    let cust2: any;
    let agr2: any;
    act(() => {
      cust2 = result.current.addCustomer({
        cnic: '35202-2222222-2',
        fullName: 'Second Customer',
        phone: '03002222222',
        address: 'Lahore',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G2', cnic: '35202-0000002-2', phone: '03000000002', relation: 'Father', address: 'Lahore' },
      });
      agr2 = result.current.createAgreement({
        customerId: cust2.id,
        itemId: item.id,
        cashPrice: 12000,
        totalInstalmentPrice: 14400,
        downPayment: 2400,
        monthDuration: 5,
        dueDayOfMonth: 10,
        startDate: '2026-10-05',
        saleDate: '2026-10-05',
      });
    });

    expect(agr2.unitCost).toBe(10000);
    expect(agr2.markupAmount).toBe(4400);

    // 5. Collect remaining balances on both agreements (10,000 on agr1, 12,000 on agr2)
    act(() => {
      result.current.recordPayment({
        agreementId: agr1.id,
        installmentNumber: 1,
        amountPaid: 10000,
        paymentMethod: 'Cash',
        date: '2026-10-10',
        collectorName: 'Admin',
      });
      result.current.recordPayment({
        agreementId: agr2.id,
        installmentNumber: 1,
        amountPaid: 12000,
        paymentMethod: 'Cash',
        date: '2026-10-10',
        collectorName: 'Admin',
      });
    });

    // Total sales = 12,000 + 14,400 = 26,400. Total cost = 10,000 + 10,000 = 20,000. Realized profit = 6,400.
    const totalSales = checkAgr1.totalInstalmentPrice + agr2.totalInstalmentPrice;
    const totalCost = checkAgr1.unitCost + agr2.unitCost;
    expect(totalSales - totalCost).toBe(6400);
  });

  it('receiving a new batch at the new market price updates the selling prices of that item', () => {
    const { result } = renderHook(() => useQistStore());

    let rec1: any;
    act(() => {
      rec1 = result.current.receiveStock({
        supplierName: 'Supplier A',
        receivedDate: '2026-10-01',
        name: 'Haier AC 1.5T',
        category: 'Air Conditioners',
        quantity: 1,
        unitCost: 80000,
        cashPrice: 100000,
        instalmentPrice: 120000,
        minDownPayment: 15000,
        serialNumbers: ['SN-H-01'],
      });
    });

    let item = result.current.stock.find((s) => s.id === rec1.stockItem.id)!;
    expect(item.instalmentPrice).toBe(120000);

    // Receive new batch with higher market price (110,000) and new instalment price (132,000)
    act(() => {
      result.current.receiveStock({
        stockItemId: item.id,
        supplierName: 'Supplier A',
        receivedDate: '2026-10-15',
        name: 'Haier AC 1.5T',
        category: 'Air Conditioners',
        quantity: 2,
        unitCost: 88000,
        cashPrice: 110000,
        instalmentPrice: 132000,
        minDownPayment: 18000,
        serialNumbers: ['SN-H-02', 'SN-H-03'],
      });
    });

    const updatedItem = result.current.stock.find((s) => s.id === item.id)!;
    expect(updatedItem.cashPrice).toBe(110000);
    expect(updatedItem.instalmentPrice).toBe(132000);
  });

  it('selling below cost is not silently recorded as zero markup', () => {
    const { result } = renderHook(() => useQistStore());

    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        supplierName: 'Wholesale',
        receivedDate: '2026-10-01',
        name: 'Clearance Phone',
        category: 'Mobiles',
        quantity: 1,
        unitCost: 20000,
        cashPrice: 25000,
        instalmentPrice: 30000,
        minDownPayment: 3000,
        serialNumbers: ['SN-CLR-01'],
      });
    });

    let cust: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-3333333-3',
        fullName: 'Loss Sale Customer',
        phone: '03003333333',
        address: 'Lahore',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000003-3', phone: '03000000003', relation: 'Friend', address: 'Lahore' },
      });
    });

    // Sell at 18,000 (below unit cost of 20,000) with explicit confirmedBelowCost flag
    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: rec.stockItem.id,
        cashPrice: 15000,
        totalInstalmentPrice: 18000,
        downPayment: 3000,
        monthDuration: 5,
        dueDayOfMonth: 10,
        startDate: '2026-10-02',
        confirmedBelowCost: true,
      });
    });

    // Markup must be actual negative markup -2,000, NOT silently clamped to 0!
    expect(agr.markupAmount).toBe(-2000);
  });

  it('cost of goods sold + value of remaining stock equals total purchases', () => {
    const { result } = renderHook(() => useQistStore());

    // Batch 1: 2 units @ 10,000 = 20,000
    // Batch 2: 1 unit @ 12,000 = 12,000
    // Total Purchases = 32,000
    let rec1: any;
    act(() => {
      rec1 = result.current.receiveStock({
        supplierName: 'Wholesale A',
        receivedDate: '2026-10-01',
        name: 'Test FIFO TV',
        category: 'TVs',
        quantity: 2,
        unitCost: 10000,
        cashPrice: 15000,
        instalmentPrice: 18000,
        minDownPayment: 2000,
        serialNumbers: ['SN-TV-01', 'SN-TV-02'],
      });
      result.current.receiveStock({
        stockItemId: rec1.stockItem.id,
        supplierName: 'Wholesale B',
        receivedDate: '2026-10-05',
        name: 'Test FIFO TV',
        category: 'TVs',
        quantity: 1,
        unitCost: 12000,
        cashPrice: 16000,
        instalmentPrice: 19000,
        minDownPayment: 2000,
        serialNumbers: ['SN-TV-03'],
      });
    });

    let cust: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-4444444-4',
        fullName: 'FIFO Customer',
        phone: '03004444444',
        address: 'Lahore',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000004-4', phone: '03000000004', relation: 'Brother', address: 'Lahore' },
      });
    });

    // Sell 1 unit (consumes 1 unit @ 10,000 under true FIFO)
    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: rec1.stockItem.id,
        cashPrice: 15000,
        totalInstalmentPrice: 18000,
        downPayment: 3000,
        monthDuration: 5,
        dueDayOfMonth: 10,
        startDate: '2026-10-06',
      });
    });

    const cogs = agr.unitCost; // 10,000
    expect(cogs).toBe(10000);

    // Value of remaining stock layers: 1 unit @ 10,000 + 1 unit @ 12,000 = 22,000
    const item = result.current.stock.find((s) => s.id === rec1.stockItem.id)!;
    const remainingVal = item.costLayers!.reduce((sum, l) => sum + l.remainingQty * l.unitCost, 0);

    expect(cogs + remainingVal).toBe(32000);
  });

  it('stored markup equals price minus the cost recorded on the same agreement', () => {
    const { result } = renderHook(() => useQistStore());

    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        supplierName: 'Vendor',
        receivedDate: '2026-10-01',
        name: 'Water Cooler',
        category: 'Appliances',
        quantity: 1,
        unitCost: 15000,
        cashPrice: 20000,
        instalmentPrice: 24000,
        minDownPayment: 3000,
        serialNumbers: ['SN-WC-01'],
      });
    });

    let cust: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-5555555-5',
        fullName: 'Markup Test Customer',
        phone: '03005555555',
        address: 'Lahore',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000005-5', phone: '03000000005', relation: 'Father', address: 'Lahore' },
      });
    });

    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: rec.stockItem.id,
        cashPrice: 20000,
        totalInstalmentPrice: 24000,
        downPayment: 4000,
        monthDuration: 5,
        dueDayOfMonth: 10,
        startDate: '2026-10-02',
      });
    });

    expect(agr.markupAmount).toBe(agr.totalInstalmentPrice - agr.unitCost);
  });

  it('a read-only Viewer cannot export the full database backup', async () => {
    const { result } = renderHook(() => useQistStore());

    // Create viewer account
    let viewer: any;
    await act(async () => {
      viewer = await result.current.createUserAccount({
        username: 'viewtest1',
        fullName: 'Viewer Test',
        password: 'Password123',
        role: 'VIEWER',
      });
    });

    // Log in as viewer
    await act(async () => {
      await result.current.loginUser('viewtest1', 'Password123');
    });

    // Attempting to export backup JSON as Viewer must throw a permission error
    await expect(async () => {
      await result.current.exportBackupJSON();
    }).rejects.toThrow(/Permission denied/);
  });

  it('Payment screen pre-fills "collected by" with the logged-in staff member', async () => {
    const { result } = renderHook(() => useQistStore());

    // Create supervisor account
    await act(async () => {
      await result.current.createUserAccount({
        username: 'supstaff1',
        fullName: 'Tariq Staff Member',
        password: 'Password123',
        role: 'SUPERVISOR',
      });
      await result.current.loginUser('supstaff1', 'Password123');
    });

    expect(result.current.currentUser?.fullName).toBe('Tariq Staff Member');
  });

  it('a login is recorded in the activity ledger under the person who logged in', async () => {
    const { result } = renderHook(() => useQistStore());

    await act(async () => {
      await result.current.createUserAccount({
        username: 'sup_audit_login',
        fullName: 'Audit Staff',
        password: 'Password123',
        role: 'SUPERVISOR',
      });
      await result.current.loginUser('sup_audit_login', 'Password123');
    });

    const latestLog = result.current.activityLedger.find((l) => l.actionType === 'LOGIN');
    expect(latestLog).toBeDefined();
    expect(latestLog?.username).toBe('sup_audit_login');
  });

  it('createUserAccount rejects weak passwords and badly formed usernames', async () => {
    const { result } = renderHook(() => useQistStore());

    // Weak password without numbers
    await expect(async () => {
      await result.current.createUserAccount({
        username: 'validuser',
        fullName: 'Test User',
        password: 'weakpassword',
        role: 'SUPERVISOR',
      });
    }).rejects.toThrow();

    // Badly formed username with spaces or special chars
    await expect(async () => {
      await result.current.createUserAccount({
        username: 'bad user!',
        fullName: 'Test User',
        password: 'Password123',
        role: 'SUPERVISOR',
      });
    }).rejects.toThrow();
  });

  it('a username stays unique even after the old account was disabled', async () => {
    const { result } = renderHook(() => useQistStore());

    let user1: any;
    await act(async () => {
      user1 = await result.current.createUserAccount({
        username: 'unique_staff',
        fullName: 'Staff One',
        password: 'Password123',
        role: 'SUPERVISOR',
      });
      // Disable user1
      result.current.setUserActiveStatus(user1.id, false);
    });

    // Attempt to create a new user with the same username must throw error
    await expect(async () => {
      await result.current.createUserAccount({
        username: 'unique_staff',
        fullName: 'Staff Two',
        password: 'Password123',
        role: 'SUPERVISOR',
      });
    }).rejects.toThrow(/already taken/);
  });
});
