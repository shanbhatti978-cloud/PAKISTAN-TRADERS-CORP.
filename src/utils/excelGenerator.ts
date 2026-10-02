import * as XLSX from 'xlsx';
import {
  StockItem,
  StockReceipt,
  StockMovement,
  Agreement,
  Payment,
  CashBookEntry,
  Customer,
  AuditLog,
  ShopSettings,
} from '../types';
import { formatDateDDMMYYYY } from './formatters';

export type ReportType =
  | 'MONTHLY_INVENTORY_RECEIVED'
  | 'MONTHLY_INVENTORY_ISSUED'
  | 'MODEL_WISE_STOCK'
  | 'SERIALIZED_INVENTORY_MOVEMENT'
  | 'INVENTORY_VALUATION_FIFO'
  | 'CUSTOMER_CONTRACT_LEDGER'
  | 'CUSTOMER_CASH_COLLECTION'
  | 'DUE_OVERDUE_RECOVERY'
  | 'SUPPLIER_PURCHASE_PAYABLE'
  | 'CASHBOOK_RECONCILIATION'
  | 'GROSS_MARGIN_REPORT'
  | 'FULL_AUDIT_TRAIL'
  | 'MONTHLY_BUSINESS_SUMMARY';

interface ExportReportParams {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  stock: StockItem[];
  stockReceipts: StockReceipt[];
  stockMovements: StockMovement[];
  agreements: Agreement[];
  customers: Customer[];
  payments: Payment[];
  cashbook: CashBookEntry[];
  auditLogs: AuditLog[];
  settings: ShopSettings;
}

export const generateExcelAuditReport = ({
  reportType,
  startDate,
  endDate,
  stock,
  stockReceipts,
  stockMovements,
  agreements,
  customers,
  payments,
  cashbook,
  auditLogs,
  settings,
}: ExportReportParams) => {
  const wb = XLSX.utils.book_new();

  // Common Header Information
  const reportTitle = getReportTitle(reportType);
  const metadataRows = [
    [settings.shopName.toUpperCase()],
    [`Address: ${settings.address}, ${settings.city}`],
    [`Report Title: ${reportTitle}`],
    [`Filter Date Range: ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}`],
    [`Generated Timestamp: ${new Date().toLocaleString()}`],
    [`Accounting Mode: Standalone FIFO Stored-Cost Audit Ledger`],
    [],
  ];

  let sheetData: any[][] = [...metadataRows];

  switch (reportType) {
    case 'MONTHLY_INVENTORY_RECEIVED': {
      const filteredReceipts = stockReceipts.filter(
        (r) => r.receivedDate >= startDate && r.receivedDate <= endDate
      );
      sheetData.push([
        'Receipt ID',
        'Date Received',
        'Supplier Name',
        'Purchase Invoice Ref',
        'Model Name',
        'Counter Location',
        'Qty Received',
        'Actual Unit Cost (PKR)',
        'Total Purchase Cost (PKR)',
        'Serial Numbers',
      ]);

      let totalQty = 0;
      let totalCost = 0;

      filteredReceipts.forEach((r) => {
        const lineTotal = r.quantity * r.unitCost;
        totalQty += r.quantity;
        totalCost += lineTotal;
        sheetData.push([
          r.id,
          formatDateDDMMYYYY(r.receivedDate),
          r.supplierName,
          r.purchaseRef,
          r.modelName,
          r.counterLocation,
          r.quantity,
          r.unitCost,
          lineTotal,
          r.serialNumbers.join(', '),
        ]);
      });

      sheetData.push([]);
      sheetData.push(['TOTALS', '', '', '', '', '', totalQty, '', totalCost, '']);
      break;
    }

    case 'MONTHLY_INVENTORY_ISSUED': {
      const issuedMovements = stockMovements.filter(
        (m) => m.type === 'ISSUED' && m.date >= startDate && m.date <= endDate
      );
      sheetData.push([
        'Movement ID',
        'Date Issued',
        'Model Name',
        'Serial / IMEI #',
        'Ref Contract / Doc',
        'Location Issued From',
        'Quantity',
        'Reason / Customer Notes',
        'Actor / User',
      ]);

      let totalQty = 0;
      issuedMovements.forEach((m) => {
        totalQty += m.quantity;
        sheetData.push([
          m.id,
          m.date,
          m.itemName,
          m.serialNumber || 'N/A',
          m.refDocument,
          m.counterLocation,
          m.quantity,
          m.reason || '',
          m.actor,
        ]);
      });

      sheetData.push([]);
      sheetData.push(['TOTAL ISSUED UNITS', '', '', '', '', '', totalQty, '', '']);
      break;
    }

    case 'MODEL_WISE_STOCK': {
      sheetData.push([
        'Item ID',
        'Product Model Name',
        'Category Group',
        'Brand',
        'Serial / IMEI Code',
        'Actual Unit Cost (PKR)',
        'Retail Cash Price (PKR)',
        'Instalment Price (PKR)',
        'In Stock Qty',
        'Counter Location',
        'Status',
        'Total Valuation (At Cost)',
      ]);

      let totalQty = 0;
      let totalValuationCost = 0;

      stock.forEach((s) => {
        const valCost = s.inStock * (s.unitCost || Math.round(s.cashPrice * 0.85));
        totalQty += s.inStock;
        totalValuationCost += valCost;

        sheetData.push([
          s.id,
          s.name,
          s.category,
          s.brand,
          s.serialNumber || 'N/A',
          s.unitCost || Math.round(s.cashPrice * 0.85),
          s.cashPrice,
          s.instalmentPrice,
          s.inStock,
          s.counterLocation,
          s.status.toUpperCase(),
          valCost,
        ]);
      });

      sheetData.push([]);
      sheetData.push(['TOTAL AVAILABLE STOCK', '', '', '', '', '', '', '', totalQty, '', '', totalValuationCost]);
      break;
    }

    case 'SERIALIZED_INVENTORY_MOVEMENT': {
      const filteredMovements = stockMovements.filter(
        (m) => m.date >= startDate && m.date <= endDate
      );

      sheetData.push([
        'Date',
        'Type',
        'Model Name',
        'Serial / IMEI Code',
        'Ref Document',
        'Location',
        'Quantity',
        'Actor / Manager',
        'Reason / Audit Note',
      ]);

      filteredMovements.forEach((m) => {
        sheetData.push([
          m.date,
          m.type,
          m.itemName,
          m.serialNumber || 'N/A',
          m.refDocument,
          m.counterLocation,
          m.quantity,
          m.actor,
          m.reason || '',
        ]);
      });
      break;
    }

    case 'INVENTORY_VALUATION_FIFO': {
      sheetData.push([
        'Product Model Name',
        'Category',
        'Storage Counter / Warehouse',
        'In-Stock Qty',
        'Original Unit Cost (PKR)',
        'Landed Freight Cost (PKR)',
        'Total Unit Purchase Cost (PKR)',
        'Extended FIFO Inventory Value (PKR)',
        'Retail Valuation (PKR)',
      ]);

      let totalFifoValue = 0;
      let totalRetailVal = 0;

      stock.forEach((s) => {
        const cost = s.unitCost || Math.round(s.cashPrice * 0.85);
        const landed = s.landedCost || 0;
        const totalUnitCost = cost + landed;
        const extFifo = s.inStock * totalUnitCost;
        const extRetail = s.inStock * s.cashPrice;

        totalFifoValue += extFifo;
        totalRetailVal += extRetail;

        sheetData.push([
          s.name,
          s.category,
          s.counterLocation,
          s.inStock,
          cost,
          landed,
          totalUnitCost,
          extFifo,
          extRetail,
        ]);
      });

      sheetData.push([]);
      sheetData.push(['TOTAL FIFO INVENTORY VALUATION', '', '', '', '', '', '', totalFifoValue, totalRetailVal]);
      break;
    }

    case 'CUSTOMER_CONTRACT_LEDGER': {
      sheetData.push([
        'Contract #',
        'Customer Name',
        'Customer Code',
        'CNIC',
        'Item Name',
        'Item Serial / IMEI',
        'Actual Purchase Cost (PKR)',
        'Interest / Markup %',
        'Interest / Markup Amount (PKR)',
        'Total Agreed Selling Price (PKR)',
        'Advance Received (PKR)',
        'Remaining Balance (PKR)',
        'Net Profit / Gross Margin (PKR)',
        'Duration',
        'Monthly Instalment',
        'Status',
        'Date Created',
      ]);

      let totalCostSum = 0;
      let totalInterestSum = 0;
      let totalContractValue = 0;
      let totalAdvanceSum = 0;
      let totalRemaining = 0;
      let totalBachatSum = 0;

      agreements.forEach((a) => {
        const cust = customers.find((c) => c.id === a.customerId);
        const actualCost = a.unitCost || Math.round(a.cashPrice * 0.85);
        const markupAmt = a.markupAmount || (a.totalInstalmentPrice - a.cashPrice);
        const bachat = a.totalInstalmentPrice - actualCost;

        totalCostSum += actualCost;
        totalInterestSum += markupAmt;
        totalContractValue += a.totalInstalmentPrice;
        totalAdvanceSum += a.downPayment;
        totalRemaining += a.remainingBalance;
        totalBachatSum += bachat;

        sheetData.push([
          a.agreementNumber,
          cust?.fullName || 'Customer',
          a.customerCode,
          cust?.cnic || '',
          a.itemName,
          a.itemSerial,
          actualCost,
          a.interestPercentage ? `${a.interestPercentage}%` : 'N/A',
          markupAmt,
          a.totalInstalmentPrice,
          a.downPayment,
          a.remainingBalance,
          bachat,
          `${a.monthDuration} Months`,
          a.monthlyInstalment,
          a.status.toUpperCase(),
          formatDateDDMMYYYY(a.startDate),
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        'GRAND TOTALS (SUM)',
        '',
        '',
        '',
        '',
        '',
        totalCostSum,
        '',
        totalInterestSum,
        totalContractValue,
        totalAdvanceSum,
        totalRemaining,
        totalBachatSum,
        '',
        '',
        '',
        '',
      ]);
      break;
    }

    case 'CUSTOMER_CASH_COLLECTION': {
      const filteredPayments = payments.filter(
        (p) => p.date >= startDate && p.date <= endDate
      );

      sheetData.push([
        'Receipt #',
        'Date',
        'Customer Name',
        'Agreement #',
        'Instalment Slot(s)',
        'Amount Collected (PKR)',
        'Late Fee (PKR)',
        'Discount (PKR)',
        'Net Cash Received (PKR)',
        'Payment Method',
        'Collector Name',
        'Reversed?',
      ]);

      let totalCollected = 0;

      filteredPayments.forEach((p) => {
        const agr = agreements.find((a) => a.id === p.agreementId);
        const net = p.amountPaid + p.lateFee - p.discount;
        totalCollected += net;

        sheetData.push([
          p.receiptNumber,
          p.date,
          p.customerName,
          agr?.agreementNumber || 'N/A',
          `Ins #${p.installmentNumbers.join(', ')}`,
          p.amountPaid,
          p.lateFee,
          p.discount,
          net,
          p.paymentMethod,
          p.collectorName,
          p.isReversed ? 'YES (REVERSED)' : 'NO',
        ]);
      });

      sheetData.push([]);
      sheetData.push(['TOTAL NET CASH COLLECTED', '', '', '', '', '', '', '', totalCollected, '', '', '']);
      break;
    }

    case 'DUE_OVERDUE_RECOVERY': {
      sheetData.push([
        'Contract #',
        'Customer Name',
        'Phone Number',
        'Item Name',
        'Instalment Slot #',
        'Due Date',
        'Slot Due Amount (PKR)',
        'Paid Amount (PKR)',
        'Pending Balance (PKR)',
        'Status',
      ]);

      let totalPendingDues = 0;

      agreements.forEach((agr) => {
        const cust = customers.find((c) => c.id === agr.customerId);
        agr.schedule.forEach((slot) => {
          if (slot.status === 'overdue' || slot.status === 'pending') {
            const pending = slot.amount - slot.paidAmount;
            totalPendingDues += pending;

            sheetData.push([
              agr.agreementNumber,
              cust?.fullName || 'Customer',
              cust?.phone || '',
              agr.itemName,
              `#${slot.installmentNumber}`,
              slot.dueDate,
              slot.amount,
              slot.paidAmount,
              pending,
              slot.status.toUpperCase(),
            ]);
          }
        });
      });

      sheetData.push([]);
      sheetData.push(['TOTAL PENDING DUES TO RECOVER', '', '', '', '', '', '', '', totalPendingDues, '']);
      break;
    }

    case 'SUPPLIER_PURCHASE_PAYABLE': {
      sheetData.push([
        'Receipt ID',
        'Date Received',
        'Supplier Name',
        'Purchase Invoice Ref',
        'Item Model',
        'Qty Received',
        'Unit Cost (PKR)',
        'Total Payable Amount (PKR)',
      ]);

      let totalPurchases = 0;

      stockReceipts.forEach((r) => {
        const total = r.quantity * r.unitCost;
        totalPurchases += total;

        sheetData.push([
          r.id,
          r.receivedDate,
          r.supplierName,
          r.purchaseRef,
          r.modelName,
          r.quantity,
          r.unitCost,
          total,
        ]);
      });

      sheetData.push([]);
      sheetData.push(['TOTAL SUPPLIER PURCHASES', '', '', '', '', '', '', totalPurchases]);
      break;
    }

    case 'CASHBOOK_RECONCILIATION': {
      const filteredCashbook = cashbook.filter(
        (cb) => cb.date >= startDate && cb.date <= endDate
      );

      sheetData.push([
        'Entry ID',
        'Date',
        'Type (In / Out)',
        'Accounting Category',
        'Ref Document #',
        'Description / Note',
        'Amount In (Inflow)',
        'Amount Out (Outflow)',
      ]);

      let totalIn = 0;
      let totalOut = 0;

      filteredCashbook.forEach((cb) => {
        if (cb.type === 'in') {
          totalIn += cb.amount;
          sheetData.push([cb.id, cb.date, 'CASH IN', cb.category, cb.referenceNumber, cb.description, cb.amount, 0]);
        } else {
          totalOut += cb.amount;
          sheetData.push([cb.id, cb.date, 'CASH OUT', cb.category, cb.referenceNumber, cb.description, 0, cb.amount]);
        }
      });

      sheetData.push([]);
      sheetData.push(['RECONCILIATION TOTALS', '', '', '', '', '', totalIn, totalOut]);
      sheetData.push(['NET CASH FLOW POSITION', '', '', '', '', '', totalIn - totalOut, '']);
      break;
    }

    case 'GROSS_MARGIN_REPORT': {
      sheetData.push([
        'Contract #',
        'Date Created',
        'Customer Name',
        'Purchased Model',
        'Serial / IMEI',
        'Actual Purchase Cost (PKR)',
        'Interest / Markup Charged (PKR)',
        'Contract Selling Price (PKR)',
        'Net Profit / Gross Margin (PKR)',
        'Gross Margin %',
      ]);

      let totalCost = 0;
      let totalInterest = 0;
      let totalSales = 0;
      let totalMargin = 0;

      agreements.forEach((a) => {
        const cust = customers.find((c) => c.id === a.customerId);
        const cost = a.unitCost || Math.round(a.cashPrice * 0.85);
        const markupAmt = a.markupAmount || (a.totalInstalmentPrice - a.cashPrice);
        const margin = a.totalInstalmentPrice - cost;
        const marginPct = cost > 0 ? Math.round((margin / cost) * 1000) / 10 : 0;

        totalCost += cost;
        totalInterest += markupAmt;
        totalSales += a.totalInstalmentPrice;
        totalMargin += margin;

        sheetData.push([
          a.agreementNumber,
          formatDateDDMMYYYY(a.startDate),
          cust?.fullName || 'Customer',
          a.itemName,
          a.itemSerial,
          cost,
          markupAmt,
          a.totalInstalmentPrice,
          margin,
          `${marginPct}%`,
        ]);
      });

      sheetData.push([]);
      sheetData.push([
        'GRAND TOTALS (SUM)',
        '',
        '',
        '',
        '',
        totalCost,
        totalInterest,
        totalSales,
        totalMargin,
        `${totalCost > 0 ? Math.round((totalMargin / totalCost) * 100) : 0}%`,
      ]);
      break;
    }

    case 'FULL_AUDIT_TRAIL': {
      sheetData.push([
        'Audit ID',
        'Timestamp',
        'User / Actor',
        'Action Code',
        'Audit Details / Message',
      ]);

      auditLogs.forEach((log) => {
        sheetData.push([
          log.id,
          log.timestamp,
          log.user,
          log.action,
          log.details,
        ]);
      });
      break;
    }

    case 'MONTHLY_BUSINESS_SUMMARY':
    default: {
      const filteredPayments = payments.filter(
        (p) => !p.isReversed && p.date >= startDate && p.date <= endDate
      );
      const filteredAgreements = agreements.filter(
        (a) => a.startDate >= startDate && a.startDate <= endDate
      );
      const filteredCashbook = cashbook.filter(
        (cb) => cb.date >= startDate && cb.date <= endDate
      );

      const downPaymentsCollected = filteredAgreements.reduce((sum, a) => sum + a.downPayment, 0);
      const installmentsCollected = filteredPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const totalCollectedPayments = downPaymentsCollected + installmentsCollected;

      const productCostOfSoldUnits = filteredAgreements.reduce((sum, a) => {
        return sum + (a.unitCost || Math.round(a.cashPrice * 0.85));
      }, 0);

      const grossRealizedCashProfit = totalCollectedPayments - productCostOfSoldUnits;

      const rentExpenses = filteredCashbook
        .filter((cb) => cb.type === 'out' && cb.category === 'Shop Rent')
        .reduce((sum, cb) => sum + cb.amount, 0);
      const utilityExpenses = filteredCashbook
        .filter((cb) => cb.type === 'out' && cb.category === 'Utility Bills')
        .reduce((sum, cb) => sum + cb.amount, 0);
      const salaryExpenses = filteredCashbook
        .filter((cb) => cb.type === 'out' && cb.category === 'Staff Salary')
        .reduce((sum, cb) => sum + cb.amount, 0);
      const miscExpenses = filteredCashbook
        .filter((cb) => cb.type === 'out' && cb.category === 'Misc Expense')
        .reduce((sum, cb) => sum + cb.amount, 0);

      const totalGeneralShopExpenses = rentExpenses + utilityExpenses + salaryExpenses + miscExpenses;
      const netBusinessProfit = grossRealizedCashProfit - totalGeneralShopExpenses;

      const stockPurchasesCashbook = filteredCashbook
        .filter((cb) => cb.type === 'out' && cb.category === 'Stock Purchase')
        .reduce((sum, cb) => sum + cb.amount, 0);

      const activeContracts = agreements.filter((a) => a.status === 'active' || a.status === 'defaulter').length;
      const totalInventoryVal = stock.reduce((sum, s) => sum + s.inStock * (s.unitCost || Math.round(s.cashPrice * 0.85)), 0);

      sheetData.push(['FINANCIAL AUDIT & REALIZED PROFIT METRIC', 'VALUE (PKR) / COUNT', 'ACCOUNTING CLASSIFICATION']);
      sheetData.push(['1. Customer Down Payments Collected (Advances)', downPaymentsCollected, 'Cash Inflow']);
      sheetData.push(['2. Customer Instalment Payments Collected', installmentsCollected, 'Cash Inflow']);
      sheetData.push(['TOTAL CUSTOMER COLLECTED PAYMENTS (1 + 2)', totalCollectedPayments, 'Total Realized Cash Collections']);
      sheetData.push([]);
      sheetData.push(['3. Original Purchase Cost of Sold Units', productCostOfSoldUnits, 'Product-Specific Cost (COGS)']);
      sheetData.push(['GROSS REALIZED CASH PROFIT (Collections - Product Cost)', grossRealizedCashProfit, 'Realized Gross Margin']);
      sheetData.push([]);
      sheetData.push(['4. Shop Rent Expense', rentExpenses, 'General Shop Expense (Cashbook)']);
      sheetData.push(['5. Electricity & Utility Bills', utilityExpenses, 'General Shop Expense (Cashbook)']);
      sheetData.push(['6. Staff Salaries', salaryExpenses, 'General Shop Expense (Cashbook)']);
      sheetData.push(['7. Misc Operating Overheads', miscExpenses, 'General Shop Expense (Cashbook)']);
      sheetData.push(['TOTAL GENERAL SHOP OPERATING EXPENSES (4+5+6+7)', totalGeneralShopExpenses, 'Operating Overhead Deductions']);
      sheetData.push([]);
      sheetData.push(['NET BUSINESS PROFIT (Gross Realized Profit - General Expenses)', netBusinessProfit, 'Net Realized Profit Result']);
      sheetData.push([]);
      sheetData.push(['Capital Outlay: Inventory Stock Purchases', stockPurchasesCashbook, 'Balance Sheet Asset Outlay (Not General Expense)']);
      sheetData.push(['Current In-Store Inventory Valuation (At Cost)', totalInventoryVal, 'Closing Stock Asset Valuation']);
      sheetData.push(['Total Active Contracts in Store', activeContracts, 'Active Customer Accounts']);
      sheetData.push(['Total Registered Customers', customers.length, 'Master Database']);
      sheetData.push(['Total Payment Receipts Issued in Period', filteredPayments.length, 'Audit Receipt Count']);
      break;
    }
  }

  // Convert array to worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto column widths
  ws['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Audit Report');

  // Trigger download
  const fileName = `${reportType.toLowerCase()}_${startDate}_to_${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

function getReportTitle(type: ReportType): string {
  switch (type) {
    case 'MONTHLY_INVENTORY_RECEIVED':
      return '1. Monthly Inventory Received Report';
    case 'MONTHLY_INVENTORY_ISSUED':
      return '2. Monthly Inventory Issued / Sold Report';
    case 'MODEL_WISE_STOCK':
      return '3. Current Model-wise Stock Report';
    case 'SERIALIZED_INVENTORY_MOVEMENT':
      return '4. Serialized Inventory Movement Report';
    case 'INVENTORY_VALUATION_FIFO':
      return '5. Inventory Valuation Report (FIFO Cost Method)';
    case 'CUSTOMER_CONTRACT_LEDGER':
      return '6. Customer Contract & Instalment Ledger';
    case 'CUSTOMER_CASH_COLLECTION':
      return '7. Customer Cash Collection Report';
    case 'DUE_OVERDUE_RECOVERY':
      return '8. Due & Overdue Recovery Report';
    case 'SUPPLIER_PURCHASE_PAYABLE':
      return '9. Supplier Purchase & Payable Report';
    case 'CASHBOOK_RECONCILIATION':
      return '10. Cashbook & Payment Method Reconciliation';
    case 'GROSS_MARGIN_REPORT':
      return '11. Gross Margin Report (Actual Cost vs Customer Price)';
    case 'FULL_AUDIT_TRAIL':
      return '12. Full System Audit Trail Report';
    case 'MONTHLY_BUSINESS_SUMMARY':
    default:
      return '13. Monthly Business Performance Summary';
  }
}
