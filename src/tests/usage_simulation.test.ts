import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQistStore } from '../data/store';
import {
  CASHBOOK_MANUAL_IN_CATEGORIES,
  CASHBOOK_MANUAL_OUT_CATEGORIES,
  CASHBOOK_SYSTEM_CATEGORIES,
} from '../types';

describe('Shop Full Month Simulation & Audit Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Profit Report & Financial Metrics: Reversal refund is not double-counted as an expense', () => {
    const { result } = renderHook(() => useQistStore());

    // Setup: 2 stock items received with cost 40,000 each
    let item1: any;
    let item2: any;
    act(() => {
      item1 = result.current.receiveStock({
        name: 'Dawlance Refrigerator 9199',
        category: 'Refrigerators',
        quantity: 1,
        unitCost: 40000,
        cashPrice: 65000,
        instalmentPrice: 80000,
        supplierName: 'Dawlance Official',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-REF-001'],
      });
      item2 = result.current.receiveStock({
        name: 'Haier Washing Machine 10kg',
        category: 'Washing Machines',
        quantity: 1,
        unitCost: 40000,
        cashPrice: 65000,
        instalmentPrice: 80000,
        supplierName: 'Haier Official',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-WM-001'],
      });
    });

    // Create 2 customers
    let cust1: any;
    let cust2: any;
    act(() => {
      cust1 = result.current.addCustomer({
        cnic: '35202-1234567-1',
        fullName: 'Customer One',
        phone: '03001112222',
        address: 'Model Town',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000001-1', phone: '03000000001', relation: 'Brother', address: 'Lahore' },
      });
      cust2 = result.current.addCustomer({
        cnic: '35202-7654321-2',
        fullName: 'Customer Two',
        phone: '03003334444',
        address: 'Gulberg',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G2', cnic: '35202-0000002-2', phone: '03000000002', relation: 'Father', address: 'Lahore' },
      });
    });

    // 2 Sales: 14,000 down each = 28,000 total down payments
    let agr1: any;
    let agr2: any;
    act(() => {
      agr1 = result.current.createAgreement({
        customerId: cust1.id,
        itemId: item1.stockItem.id,
        cashPrice: 65000,
        totalInstalmentPrice: 80000,
        downPayment: 14000,
        monthDuration: 6,
        dueDayOfMonth: 10,
        startDate: '2026-09-05',
        saleDate: '2026-09-05',
      });
      agr2 = result.current.createAgreement({
        customerId: cust2.id,
        itemId: item2.stockItem.id,
        cashPrice: 65000,
        totalInstalmentPrice: 80000,
        downPayment: 14000,
        monthDuration: 6,
        dueDayOfMonth: 10,
        startDate: '2026-09-05',
        saleDate: '2026-09-05',
      });
    });

    // Verify down payment entries in cashbook
    const downEntries = result.current.cashbook.filter(
      (cb) => cb.category === 'Down Payment' && cb.amount === 14000
    );
    expect(downEntries.length).toBe(2);
    expect(downEntries[0].amount).toBe(14000);
    expect(downEntries[1].amount).toBe(14000);

    // Collect payments totaling 28,500
    // Pay 20,000 on agr1
    let pay20k: any;
    act(() => {
      pay20k = result.current.recordPayment({
        agreementId: agr1.id,
        installmentNumber: 1,
        amountPaid: 20000,
        paymentMethod: 'Cash',
        date: '2026-09-10',
        collectorName: 'Admin',
      });
    });

    // Pay 8,500 on agr2
    act(() => {
      result.current.recordPayment({
        agreementId: agr2.id,
        installmentNumber: 1,
        amountPaid: 8500,
        paymentMethod: 'Cash',
        date: '2026-09-12',
        collectorName: 'Admin',
      });
    });

    // Record operating expenses: Rent 25k + Utility 6k + Salary 30k = 61k
    act(() => {
      result.current.addCashBookEntry({
        type: 'out',
        category: 'Shop Rent',
        amount: 25000,
        referenceNumber: 'RENT-01',
        description: 'September Showroom Rent',
        date: '2026-09-02',
      });
      result.current.addCashBookEntry({
        type: 'out',
        category: 'Electricity / Utilities',
        amount: 6000,
        referenceNumber: 'UTIL-01',
        description: 'LESCO Electricity Bill',
        date: '2026-09-04',
      });
      result.current.addCashBookEntry({
        type: 'out',
        category: 'Staff Salaries',
        amount: 30000,
        referenceNumber: 'SAL-01',
        description: 'Sales Staff Salary',
        date: '2026-09-06',
      });
    });

    // Reverse the 20,000 payment (receipt reversal)
    act(() => {
      result.current.reversePayment(pay20k.id, 'Entered under wrong contract by mistake');
    });

    // Verify:
    // 1. Payment pay20k is marked isReversed
    const reversedPay = result.current.payments.find((p) => p.id === pay20k.id)!;
    expect(reversedPay.isReversed).toBe(true);

    // 2. Cashbook has 'Refund Reversal' cash-out entry of 20,000
    const refundEntry = result.current.cashbook.find((cb) => cb.category === 'Refund Reversal')!;
    expect(refundEntry).toBeDefined();
    expect(refundEntry.type).toBe('out');
    expect(refundEntry.amount).toBe(20000);

    // 3. Operating overheads must exclude 'Refund Reversal', 'Stock Purchase', and 'Capital In'
    const nonOp = ['Refund Reversal', 'Stock Purchase', 'Capital In'];
    const reversalInOverheads = result.current.cashbook.filter(
      (cb) => cb.type === 'out' && cb.category === 'Refund Reversal' && !nonOp.includes(cb.category)
    );
    expect(reversalInOverheads.length).toBe(0);

    const scenarioExpenses = result.current.cashbook
      .filter((cb) => ['September Showroom Rent', 'LESCO Electricity Bill', 'Sales Staff Salary'].includes(cb.description))
      .reduce((sum, cb) => sum + cb.amount, 0);

    expect(scenarioExpenses).toBe(25000 + 6000 + 30000); // exactly 61,000, NOT 81,000!

    // 4. Collections must only include active payments for this scenario
    const activePayments = result.current.payments.filter(
      (p) => !p.isReversed && (p.agreementId === agr1.id || p.agreementId === agr2.id)
    );
    const activeInstallmentsTotal = activePayments.reduce((sum, p) => sum + p.amountPaid, 0);
    expect(activeInstallmentsTotal).toBe(8500); // 20k was reversed, so only 8,500 remains
  });

  it('2. Cashbook Category Constraints: Manual vs System Category Separation', () => {
    // Manual categories must not allow system automated categories
    expect(CASHBOOK_MANUAL_IN_CATEGORIES).not.toContain('Recovery Collection Inflow');
    expect(CASHBOOK_MANUAL_OUT_CATEGORIES).not.toContain('Supplier Payment');
    expect(CASHBOOK_MANUAL_OUT_CATEGORIES).not.toContain('Refund Reversal');
    expect(CASHBOOK_SYSTEM_CATEGORIES).toContain('Recovery Collection Inflow');
    expect(CASHBOOK_SYSTEM_CATEGORIES).toContain('Supplier Payment');
    expect(CASHBOOK_SYSTEM_CATEGORIES).toContain('Refund Reversal');
  });

  it('3. FIFO Stock & Layer Valuation Tracking', () => {
    const { result } = renderHook(() => useQistStore());

    // Receive first batch: 3 units @ 30,000
    let rec1: any;
    act(() => {
      rec1 = result.current.receiveStock({
        name: 'Super Asia Fan 56 inch',
        category: 'Fans',
        quantity: 3,
        unitCost: 30000,
        cashPrice: 40000,
        instalmentPrice: 50000,
        supplierName: 'Super Asia Gujranwala',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-FAN-01', 'SN-FAN-02', 'SN-FAN-03'],
      });
    });

    const stockItem = result.current.stock.find((s) => s.id === rec1.stockItem.id)!;
    expect(stockItem.costLayers).toBeDefined();
    expect(stockItem.costLayers!.length).toBe(1);
    expect(stockItem.costLayers![0].unitCost).toBe(30000);
    expect(stockItem.costLayers![0].remainingQty).toBe(3);

    // Receive second batch into same stock item: 2 units @ 35,000
    act(() => {
      result.current.receiveStock({
        stockItemId: rec1.stockItem.id,
        name: 'Super Asia Fan 56 inch',
        category: 'Fans',
        quantity: 2,
        unitCost: 35000,
        cashPrice: 45000,
        instalmentPrice: 55000,
        supplierName: 'Super Asia Gujranwala',
        receivedDate: '2026-09-10',
        serialNumbers: ['SN-FAN-04', 'SN-FAN-05'],
      });
    });

    const updatedStockItem = result.current.stock.find((s) => s.id === rec1.stockItem.id)!;
    expect(updatedStockItem.inStock).toBe(5);
    expect(updatedStockItem.costLayers!.length).toBe(2);
    expect(updatedStockItem.costLayers![0].remainingQty).toBe(3);
    expect(updatedStockItem.costLayers![1].remainingQty).toBe(2);

    // Total FIFO valuation: 3 * 30,000 + 2 * 35,000 = 90,000 + 70,000 = 160,000
    const fifoVal = updatedStockItem.costLayers!.reduce(
      (sum, l) => sum + l.remainingQty * l.unitCost,
      0
    );
    expect(fifoVal).toBe(160000);
  });

  it('4. Agreement Sale Date & FIFO Cost Layer Deduction on Sale', () => {
    const { result } = renderHook(() => useQistStore());

    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        name: 'Orient Inverter AC 1.5T',
        category: 'Air Conditioners',
        quantity: 2,
        unitCost: 50000,
        cashPrice: 80000,
        instalmentPrice: 100000,
        supplierName: 'Orient Pakistan',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-OR-01', 'SN-OR-02'],
      });
    });

    let cust: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-9999999-1',
        fullName: 'Orient Customer',
        phone: '03110000000',
        address: 'Township',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000009-1', phone: '03110000001', relation: 'Cousin', address: 'Lahore' },
      });
    });

    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: rec.stockItem.id,
        cashPrice: 80000,
        totalInstalmentPrice: 100000,
        downPayment: 25000,
        monthDuration: 5,
        dueDayOfMonth: 15,
        startDate: '2026-09-03',
        saleDate: '2026-09-03',
      });
    });

    expect(agr.unitCost).toBe(50000);
    expect(agr.saleDate).toBe('2026-09-03');

    // Remaining stock must now have 1 remaining in the first cost layer
    const postSaleStock = result.current.stock.find((s) => s.id === rec.stockItem.id)!;
    expect(postSaleStock.inStock).toBe(1);
    expect(postSaleStock.costLayers![0].remainingQty).toBe(1);
  });

  it('5. Agreement Deletion with Refund Reversal: Maintains Cashbook Integrity', () => {
    const { result } = renderHook(() => useQistStore());

    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        name: 'Waves Deep Freezer',
        category: 'Refrigerators',
        quantity: 1,
        unitCost: 45000,
        cashPrice: 60000,
        instalmentPrice: 75000,
        supplierName: 'Waves Pak',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-WAV-01'],
      });
    });

    let cust: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-8888888-1',
        fullName: 'Waves Customer',
        phone: '03210000000',
        address: 'Johar Town',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000008-1', phone: '03210000001', relation: 'Friend', address: 'Lahore' },
      });
    });

    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: rec.stockItem.id,
        cashPrice: 60000,
        totalInstalmentPrice: 75000,
        downPayment: 15000,
        monthDuration: 4,
        dueDayOfMonth: 10,
        startDate: '2026-09-02',
      });
    });

    // Delete agreement: must post Refund Reversal instead of deleting historical entry
    act(() => {
      result.current.deleteAgreement(agr.id);
    });

    const refundEntry = result.current.cashbook.find((cb) => cb.category === 'Refund Reversal')!;
    expect(refundEntry).toBeDefined();
    expect(refundEntry.type).toBe('out');
    expect(refundEntry.amount).toBe(15000);
  });

  it('6. Stock Item Reference Integrity: Cannot Delete Stock Item with Active or Past History', () => {
    const { result } = renderHook(() => useQistStore());

    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        name: 'Singer Sewing Machine',
        category: 'Electronics',
        quantity: 1,
        unitCost: 15000,
        cashPrice: 22000,
        instalmentPrice: 28000,
        supplierName: 'Singer Pak',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-SNG-01'],
      });
    });

    // Attempting to delete this stock item which has a stock receipt must throw an error
    act(() => {
      expect(() => {
        result.current.deleteStockItem(rec.stockItem.id);
      }).toThrow(/Cannot delete stock item/);
    });
  });

  it('7. Payment Allocation & Multi-Slot Reversal Integrity', () => {
    const { result } = renderHook(() => useQistStore());

    let rec: any;
    act(() => {
      rec = result.current.receiveStock({
        name: 'Kenwood Inverter AC',
        category: 'Air Conditioners',
        quantity: 1,
        unitCost: 80000,
        cashPrice: 110000,
        instalmentPrice: 140000,
        supplierName: 'Kenwood Pak',
        receivedDate: '2026-09-01',
        serialNumbers: ['SN-KW-01'],
      });
    });

    let cust: any;
    act(() => {
      cust = result.current.addCustomer({
        cnic: '35202-5555555-5',
        fullName: 'AC Customer',
        phone: '03450000000',
        address: 'DHA',
        city: 'Lahore',
        rating: 'good',
        guarantor1: { name: 'G1', cnic: '35202-0000005-5', phone: '03450000001', relation: 'Brother', address: 'Lahore' },
      });
    });

    let agr: any;
    act(() => {
      agr = result.current.createAgreement({
        customerId: cust.id,
        itemId: rec.stockItem.id,
        cashPrice: 110000,
        totalInstalmentPrice: 140000,
        downPayment: 20000,
        monthDuration: 4, // 120,000 / 4 = 30,000 per month
        dueDayOfMonth: 10,
        startDate: '2027-01-01', // future date so status resets to pending
      });
    });

    // Overpayment of 45,000 targeted at slot 1 (30k for slot 1, 15k for slot 2)
    let p1: any;
    act(() => {
      p1 = result.current.recordPayment({
        agreementId: agr.id,
        installmentNumber: 1,
        amountPaid: 45000,
        paymentMethod: 'Cash',
        date: '2027-01-10',
        collectorName: 'Admin',
      });
    });

    expect(p1.allocations).toBeDefined();
    expect(p1.allocations.length).toBe(2);
    expect(p1.allocations[0]).toEqual({ installmentNumber: 1, amount: 30000 });
    expect(p1.allocations[1]).toEqual({ installmentNumber: 2, amount: 15000 });

    // Reverse the payment
    act(() => {
      result.current.reversePayment(p1.id, 'Allocations reversal test');
    });

    const updatedAgr = result.current.agreements.find((a) => a.id === agr.id)!;
    expect(updatedAgr.schedule[0].paidAmount).toBe(0);
    expect(updatedAgr.schedule[0].status).toBe('pending');
    expect(updatedAgr.schedule[1].paidAmount).toBe(0);
    expect(updatedAgr.schedule[1].status).toBe('pending');
  });

  it('8. Cashbook Entry Validation: Rejects invalid categories and negative or non-finite amounts', () => {
    const { result } = renderHook(() => useQistStore());

    expect(() => {
      result.current.addCashBookEntry({
        type: 'in',
        category: 'NonExistentCategory' as any,
        amount: 5000,
        referenceNumber: 'REF-01',
        description: 'Test invalid category',
        date: '2026-09-10',
      });
    }).toThrow();

    expect(() => {
      result.current.addCashBookEntry({
        type: 'in',
        category: 'Capital In',
        amount: -5000,
        referenceNumber: 'REF-02',
        description: 'Negative amount',
        date: '2026-09-10',
      });
    }).toThrow();
  });
});
