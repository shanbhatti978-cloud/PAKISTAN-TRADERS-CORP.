import jsPDF from 'jspdf';
import { Payment, Agreement, Customer, ShopSettings } from '../types';
import { formatDateDDMMYYYY } from './formatters';

/**
 * Generate & Download Payment Receipt PDF
 */
export function generatePaymentReceiptPDF(
  payment: Payment,
  agreement: Agreement,
  customer: Customer,
  settings: ShopSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 format perfect for receipts
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.address}, ${settings.city} | Ph: ${settings.phone}`, pageWidth / 2, 18, { align: 'center' });
  doc.text(`${settings.regNumber}`, pageWidth / 2, 23, { align: 'center' });

  // Receipt Title Banner
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(10, 32, pageWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL PAYMENT RECEIPT', pageWidth / 2, 37.5, { align: 'center' });

  // Receipt Info Grid
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  
  let y = 48;
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No:`, 12, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payment.receiptNumber}`, 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, pageWidth - 45, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payment.date}`, pageWidth - 15, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Agreement No:`, 12, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${agreement.agreementNumber}`, 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment Mode:`, pageWidth - 45, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payment.paymentMethod}`, pageWidth - 15, y);

  // Line Divider
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(10, y, pageWidth - 10, y);

  // Customer & Item Info
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`CUSTOMER DETAILS`, 12, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customer.fullName}`, 12, y);
  doc.text(`CNIC: ${customer.cnic}`, pageWidth - 55, y);

  y += 5;
  doc.text(`Phone: ${customer.phone}`, 12, y);
  doc.text(`City: ${customer.city}`, pageWidth - 55, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(`ITEM INFORMATION`, 12, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Product: ${agreement.itemName}`, 12, y);
  doc.text(`Serial / IMEI: ${agreement.itemSerial}`, pageWidth - 55, y);

  // Financial Table
  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, pageWidth - 20, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 14, y + 5);
  doc.text('Instalment #', pageWidth / 2, y + 5, { align: 'center' });
  doc.text('Amount (PKR)', pageWidth - 14, y + 5, { align: 'right' });

  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.text(`Monthly Instalment Collection`, 14, y);
  doc.text(`#${payment.installmentNumbers.join(', ')}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`${settings.currencySymbol} ${payment.amountPaid.toLocaleString()}`, pageWidth - 14, y, { align: 'right' });

  if (payment.lateFee > 0) {
    y += 5;
    doc.text(`Late Fee / Penalty`, 14, y);
    doc.text(`+ ${settings.currencySymbol} ${payment.lateFee.toLocaleString()}`, pageWidth - 14, y, { align: 'right' });
  }

  if (payment.discount > 0) {
    y += 5;
    doc.text(`Special Discount`, 14, y);
    doc.text(`- ${settings.currencySymbol} ${payment.discount.toLocaleString()}`, pageWidth - 14, y, { align: 'right' });
  }

  y += 7;
  doc.setDrawColor(15, 23, 42);
  doc.line(10, y, pageWidth - 10, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL AMOUNT RECEIVED:`, 14, y);
  doc.text(`${settings.currencySymbol} ${(payment.amountPaid + payment.lateFee - payment.discount).toLocaleString()}`, pageWidth - 14, y, { align: 'right' });

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Remaining Balance Outstanding:`, 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${settings.currencySymbol} ${agreement.remainingBalance.toLocaleString()}`, pageWidth - 14, y, { align: 'right' });

  // Footer & Signatures
  y = doc.internal.pageSize.getHeight() - 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(15, y, 55, y);
  doc.line(pageWidth - 55, y, pageWidth - 15, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Customer Signature', 35, y, { align: 'center' });
  doc.text('Authorized Cashier', pageWidth - 35, y, { align: 'center' });

  y += 8;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Computer generated receipt. Thank you for your prompt payment!', pageWidth / 2, y, { align: 'center' });

  doc.save(`${payment.receiptNumber}_${customer.fullName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate & Download Sale Agreement Contract PDF
 */
export function generateAgreementContractPDF(
  agreement: Agreement,
  customer: Customer,
  settings: ShopSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.address}, ${settings.city} | Phone: ${settings.phone}`, pageWidth / 2, 21, { align: 'center' });
  doc.text(`FORMAL INSTALMENT SALE AGREEMENT & UNDERTAKING CONTRACT`, pageWidth / 2, 27, { align: 'center' });

  // Contract Metadata
  let y = 40;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`AGREEMENT NO: ${agreement.agreementNumber}`, 14, y);
  doc.text(`DATE OF SALE: ${agreement.startDate}`, pageWidth - 14, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageWidth - 14, y);

  // Section 1: Customer (Purchaser)
  y += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
  doc.text('1. PURCHASER / CUSTOMER DETAILS', 16, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Name: ${customer.fullName}`, 16, y);
  doc.text(`CNIC No: ${customer.cnic}`, pageWidth / 2 + 10, y);

  y += 5;
  doc.text(`Phone No: ${customer.phone}`, 16, y);
  doc.text(`Alt Phone: ${customer.altPhone || 'N/A'}`, pageWidth / 2 + 10, y);

  y += 5;
  doc.text(`Residential Address: ${customer.address}, ${customer.city}`, 16, y);

  // Section 2: Guarantors
  y += 9;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
  doc.text('2. GUARANTORS INFORMATION', 16, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Guarantor 1:', 16, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customer.guarantor1.name} (Relation: ${customer.guarantor1.relation})`, 40, y);
  doc.text(`CNIC: ${customer.guarantor1.cnic} | Ph: ${customer.guarantor1.phone}`, pageWidth / 2 + 10, y);

  if (customer.guarantor2) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Guarantor 2:', 16, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${customer.guarantor2.name} (Relation: ${customer.guarantor2.relation})`, 40, y);
    doc.text(`CNIC: ${customer.guarantor2.cnic} | Ph: ${customer.guarantor2.phone}`, pageWidth / 2 + 10, y);
  }

  // Section 3: Item & Financials
  y += 9;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
  doc.text('3. PURCHASED ITEM & PAYMENT TERMS', 16, y);

  y += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Item Name: ${agreement.itemName}`, 16, y);
  doc.text(`Serial / IMEI / Chassis #: ${agreement.itemSerial}`, pageWidth / 2 + 10, y);

  y += 6;
  doc.text(`Cash Price Ref: ${settings.currencySymbol} ${agreement.cashPrice.toLocaleString()}`, 16, y);
  doc.text(`Total Agreed Instalment Price: ${settings.currencySymbol} ${agreement.totalInstalmentPrice.toLocaleString()}`, pageWidth / 2 + 10, y);

  y += 5;
  doc.text(`Down Payment Received: ${settings.currencySymbol} ${agreement.downPayment.toLocaleString()}`, 16, y);
  doc.text(`Remaining Finance Amount: ${settings.currencySymbol} ${agreement.remainingBalance.toLocaleString()}`, pageWidth / 2 + 10, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Plan Duration: ${agreement.monthDuration} Months`, 16, y);
  doc.text(`Monthly Instalment: ${settings.currencySymbol} ${agreement.monthlyInstalment.toLocaleString()} (Due on ${agreement.dueDayOfMonth}th of each month)`, pageWidth / 2 + 10, y);

  // Schedule Table
  y += 9;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTALMENT RECOVERY SCHEDULE', 16, y);

  y += 4;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Ins #', 18, y + 4.5);
  doc.text('Due Date', 45, y + 4.5);
  doc.text('Monthly Amount', 95, y + 4.5);
  doc.text('Status', 145, y + 4.5);

  doc.setTextColor(15, 23, 42);
  y += 6;
  agreement.schedule.forEach((slot) => {
    y += 5;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.text(`${slot.installmentNumber}`, 20, y);
    doc.text(`${slot.dueDate}`, 45, y);
    doc.text(`${settings.currencySymbol} ${slot.amount.toLocaleString()}`, 95, y);
    doc.text(`${slot.status.toUpperCase()}`, 145, y);
  });

  // Undertaking Terms
  y += 10;
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & UNDERTAKING AGREEMENT:', 14, y);

  y += 5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const termsText = [
    '1. The item remains the sole property of Pakistan Trader Corporation until all installments are paid in full.',
    '2. The purchaser agrees to pay each monthly installment on or before the due date specified above.',
    '3. Failure to pay 2 consecutive installments entitles the seller to repossess the item without prior court notice.',
    '4. Guarantors pledge joint personal responsibility to clear outstanding balance in case of default by purchaser.',
  ];
  termsText.forEach((t) => {
    doc.text(t, 14, y);
    y += 4;
  });

  // Signatures
  y += 12;
  doc.setDrawColor(15, 23, 42);
  doc.line(15, y, 55, y);
  doc.line(65, y, 105, y);
  doc.line(115, y, 155, y);
  doc.line(165, y, 195, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Purchaser Signature', 35, y, { align: 'center' });
  doc.text('Guarantor 1 Signature', 85, y, { align: 'center' });
  doc.text('Guarantor 2 Signature', 135, y, { align: 'center' });
  doc.text('Proprietor Stamp', 180, y, { align: 'center' });

  doc.save(`Contract_${agreement.agreementNumber}_${customer.fullName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate 80mm Thermal Receipt Slip PDF
 */
export function generateThermalReceiptPDF(
  payment: Payment,
  agreement: Agreement,
  customer: Customer,
  settings: ShopSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160], // 80mm thermal slip size
  });

  const pageWidth = 80;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 8, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.address}, ${settings.city}`, pageWidth / 2, 13, { align: 'center' });
  doc.text(`Ph: ${settings.phone}`, pageWidth / 2, 17, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('----------------------------------------------------', pageWidth / 2, 21, { align: 'center' });
  doc.text('OFFICIAL PAYMENT RECEIPT', pageWidth / 2, 25, { align: 'center' });
  doc.text('----------------------------------------------------', pageWidth / 2, 29, { align: 'center' });

  let y = 34;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt #: ${payment.receiptNumber}`, 5, y);
  doc.text(`Date: ${payment.date}`, pageWidth - 5, y, { align: 'right' });

  y += 4;
  doc.text(`AGR #: ${agreement.agreementNumber}`, 5, y);
  doc.text(`Mode: ${payment.paymentMethod}`, pageWidth - 5, y, { align: 'right' });

  y += 5;
  doc.text(`Customer: ${customer.fullName}`, 5, y);
  y += 4;
  doc.text(`CNIC: ${customer.cnic}`, 5, y);

  y += 5;
  doc.text(`Item: ${agreement.itemName}`, 5, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('----------------------------------------------------', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.text(`Paid Amount:`, 5, y);
  doc.text(`${settings.currencySymbol} ${payment.amountPaid.toLocaleString()}`, pageWidth - 5, y, { align: 'right' });

  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Remaining Bal:`, 5, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`${settings.currencySymbol} ${agreement.remainingBalance.toLocaleString()}`, pageWidth - 5, y, { align: 'right' });

  y += 8;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your prompt payment!', pageWidth / 2, y, { align: 'center' });

  doc.save(`Thermal_${payment.receiptNumber}.pdf`);
}

export interface BusinessReportSummaryData {
  startDate: string;
  endDate: string;
  totalCollections: number;
  totalPaymentsRecorded: number;
  activeBookingsCount: number;
  totalPendingOverdue: number;
  transactionRows: Array<{
    receipt_no: string;
    customer_name: string;
    item_name: string;
    date: string;
    amount: number;
  }>;
}

/**
 * Generate & Download Executive Financial Collection Report PDF
 */
export function generateBusinessReportPDF(
  summary: BusinessReportSummaryData,
  settings: ShopSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('EXECUTIVE FINANCIAL COLLECTION REPORT', pageWidth / 2, 19, { align: 'center' });
  doc.text(`Period: ${summary.startDate} to ${summary.endDate} | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 25, { align: 'center' });

  let y = 40;
  doc.setTextColor(15, 23, 42);

  // Performance Metric Cards Row (4 Boxes)
  const boxWidth = (pageWidth - 36) / 4;
  
  // Card 1: Total Collections
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(22, 163, 74);
  doc.roundedRect(14, y, boxWidth, 18, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Collection', 18, y + 5);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(21, 128, 61);
  doc.text(`${settings.currencySymbol} ${summary.totalCollections.toLocaleString()}`, 18, y + 13);

  // Card 2: Transactions Recorded
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(37, 99, 235);
  doc.setTextColor(15, 23, 42);
  doc.roundedRect(14 + boxWidth + 2.5, y, boxWidth, 18, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Transactions', 18 + boxWidth + 2.5, y + 5);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text(`${summary.totalPaymentsRecorded}`, 18 + boxWidth + 2.5, y + 13);

  // Card 3: Active Bookings
  doc.setFillColor(255, 251, 235); // amber-50
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(14 + (boxWidth + 2.5) * 2, y, boxWidth, 18, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Active Bookings', 18 + (boxWidth + 2.5) * 2, y + 5);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`${summary.activeBookingsCount}`, 18 + (boxWidth + 2.5) * 2, y + 13);

  // Card 4: Overdue Amount
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(220, 38, 38);
  doc.roundedRect(14 + (boxWidth + 2.5) * 3, y, boxWidth, 18, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Overdue Amount', 18 + (boxWidth + 2.5) * 3, y + 5);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`${settings.currencySymbol} ${summary.totalPendingOverdue.toLocaleString()}`, 18 + (boxWidth + 2.5) * 3, y + 13);

  y += 26;

  // Section Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILED TRANSACTION LEDGER', 14, y);

  y += 4;
  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt #', 18, y + 5);
  doc.text('Customer Name', 55, y + 5);
  doc.text('Item / Booking Details', 105, y + 5);
  doc.text('Date', 150, y + 5);
  doc.text('Amount Paid', pageWidth - 18, y + 5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');

  summary.transactionRows.forEach((row) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(row.receipt_no, 18, y);
    doc.text(row.customer_name.substring(0, 22), 55, y);
    doc.text(row.item_name.substring(0, 24), 105, y);
    doc.text(row.date, 150, y);
    doc.text(`${settings.currencySymbol} ${row.amount.toLocaleString()}`, pageWidth - 18, y, { align: 'right' });

    y += 6;
    doc.setDrawColor(241, 245, 249);
    doc.line(14, y - 2, pageWidth - 14, y - 2);
  });

  // Footer
  y = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Official Pakistan Trader Corporation Executive Business Report', pageWidth / 2, y, { align: 'center' });

  doc.save(`Executive_Report_${summary.startDate}_to_${summary.endDate}.pdf`);
}

/**
 * Comprehensive Audit Report PDF Generator for all 13 Report Types
 */
export function generateComprehensiveAuditReportPDF(
  reportType: string,
  startDate: string,
  endDate: string,
  stock: any[],
  stockReceipts: any[],
  stockMovements: any[],
  agreements: any[],
  customers: any[],
  payments: any[],
  cashbook: any[],
  auditLogs: any[],
  settings: ShopSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Shop Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.address}, ${settings.city} | Phone: ${settings.phone}`, pageWidth / 2, 18, { align: 'center' });
  doc.text(`STORE AUDIT REPORT | Filter Date: ${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}`, pageWidth / 2, 23, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()} | Mode: Standalone Stored-Cost Audit Ledger`, pageWidth / 2, 28, { align: 'center' });

  let y = 40;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPORT: ${reportType.replace(/_/g, ' ')}`, 14, y);

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, pageWidth - 14, y);

  y += 8;
  doc.setFontSize(8);

  switch (reportType) {
    case 'MONTHLY_INVENTORY_RECEIVED': {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 16, y + 4);
      doc.text('Supplier', 40, y + 4);
      doc.text('Model / Item', 85, y + 4);
      doc.text('Qty', 140, y + 4);
      doc.text('Unit Cost', 155, y + 4);
      doc.text('Total (PKR)', pageWidth - 16, y + 4, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      let totalQty = 0;
      let totalCost = 0;

      const filtered = stockReceipts.filter((r) => r.receivedDate >= startDate && r.receivedDate <= endDate);
      filtered.forEach((r) => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        const lineTotal = r.quantity * r.unitCost;
        totalQty += r.quantity;
        totalCost += lineTotal;

        doc.text(r.receivedDate, 16, y);
        doc.text(r.supplierName.substring(0, 22), 40, y);
        doc.text(r.modelName.substring(0, 26), 85, y);
        doc.text(`${r.quantity}`, 140, y);
        doc.text(`${settings.currencySymbol} ${r.unitCost.toLocaleString()}`, 155, y);
        doc.text(`${settings.currencySymbol} ${lineTotal.toLocaleString()}`, pageWidth - 16, y, { align: 'right' });
        y += 6;
      });

      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Received: ${totalQty} Units | Total Purchase Cost: ${settings.currencySymbol} ${totalCost.toLocaleString()}`, 14, y);
      break;
    }

    case 'MODEL_WISE_STOCK':
    case 'INVENTORY_VALUATION_FIFO': {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Model Name', 16, y + 4);
      doc.text('Category', 75, y + 4);
      doc.text('Location', 115, y + 4);
      doc.text('In Stock', 150, y + 4);
      doc.text('Unit Cost', 168, y + 4);
      doc.text('FIFO Value', pageWidth - 16, y + 4, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      let totalQty = 0;
      let totalVal = 0;

      stock.forEach((s) => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        const cost = s.unitCost || Math.round(s.cashPrice * 0.85);
        const fifoVal = s.inStock * cost;
        totalQty += s.inStock;
        totalVal += fifoVal;

        doc.text(s.name.substring(0, 30), 16, y);
        doc.text(s.category.substring(0, 18), 75, y);
        doc.text((s.counterLocation || 'Main').substring(0, 16), 115, y);
        doc.text(`${s.inStock}`, 150, y);
        doc.text(`${settings.currencySymbol} ${cost.toLocaleString()}`, 168, y);
        doc.text(`${settings.currencySymbol} ${fifoVal.toLocaleString()}`, pageWidth - 16, y, { align: 'right' });
        y += 6;
      });

      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Inventory Qty: ${totalQty} | Total FIFO Inventory Value (At Cost): ${settings.currencySymbol} ${totalVal.toLocaleString()}`, 14, y);
      break;
    }

    case 'GROSS_MARGIN_REPORT': {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Contract #', 16, y + 4);
      doc.text('Purchased Model', 42, y + 4);
      doc.text('Cost Price', 92, y + 4);
      doc.text('Interest', 125, y + 4);
      doc.text('Selling Price', 152, y + 4);
      doc.text('Margin / Profit', pageWidth - 16, y + 4, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      let totalCost = 0;
      let totalInterest = 0;
      let totalSales = 0;

      agreements.forEach((a) => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        const cost = a.unitCost || Math.round(a.cashPrice * 0.85);
        const interest = a.markupAmount || (a.totalInstalmentPrice - a.cashPrice);
        const margin = a.totalInstalmentPrice - cost;
        totalCost += cost;
        totalInterest += interest;
        totalSales += a.totalInstalmentPrice;

        doc.text(a.agreementNumber, 16, y);
        doc.text(a.itemName.substring(0, 22), 42, y);
        doc.text(`${settings.currencySymbol} ${cost.toLocaleString()}`, 92, y);
        doc.text(`${settings.currencySymbol} ${interest.toLocaleString()}`, 125, y);
        doc.text(`${settings.currencySymbol} ${a.totalInstalmentPrice.toLocaleString()}`, 152, y);
        doc.text(`${settings.currencySymbol} ${margin.toLocaleString()}`, pageWidth - 16, y, { align: 'right' });
        y += 6;
      });

      y += 4;
      const totalMargin = totalSales - totalCost;
      doc.setFillColor(16, 185, 129); // emerald summary row
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`GRAND SUM / TOTALS:`, 16, y + 5.5);
      doc.text(`Cost: ${settings.currencySymbol} ${totalCost.toLocaleString()}`, 52, y + 5.5);
      doc.text(`Interest: ${settings.currencySymbol} ${totalInterest.toLocaleString()}`, 95, y + 5.5);
      doc.text(`Selling: ${settings.currencySymbol} ${totalSales.toLocaleString()}`, 135, y + 5.5);
      doc.text(`Net Margin: ${settings.currencySymbol} ${totalMargin.toLocaleString()}`, pageWidth - 16, y + 5.5, { align: 'right' });
      doc.setTextColor(15, 23, 42);
      break;
    }

    default: {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 16, y + 4);
      doc.text('Customer / Ref', 45, y + 4);
      doc.text('Item / Category', 105, y + 4);
      doc.text('Amount (PKR)', pageWidth - 16, y + 4, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      const filteredPayments = payments.filter((p) => p.date >= startDate && p.date <= endDate);
      filteredPayments.forEach((p) => {
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
        doc.text(p.date, 16, y);
        doc.text(p.customerName.substring(0, 26), 45, y);
        doc.text(p.receiptNumber, 105, y);
        doc.text(`${settings.currencySymbol} ${p.amountPaid.toLocaleString()}`, pageWidth - 16, y, { align: 'right' });
        y += 6;
      });
      break;
    }
  }

  // Page Numbers Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} | PAKISTAN TRADER CORPORATION Official Audit Record`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`${reportType.toLowerCase()}_${startDate}_to_${endDate}.pdf`);
}

/**
 * Generate & Download Printable Customer Payment Ledger Statement PDF
 */
export function generateCustomerPaymentLedgerPDF(
  customer: Customer,
  agreements: Agreement[],
  payments: Payment[],
  settings: ShopSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const custAgreements = agreements.filter((a) => a.customerId === customer.id);
  const custPayments = payments.filter(
    (p) => !p.isReversed && (p.customerId === customer.id || custAgreements.some((a) => a.id === p.agreementId))
  );

  // Financial aggregates
  const totalAgreedValue = custAgreements.reduce((sum, a) => sum + a.totalInstalmentPrice, 0);
  const totalDownPayments = custAgreements.reduce((sum, a) => sum + a.downPayment, 0);
  const totalInstallmentsPaid = custPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPaidToDate = totalDownPayments + totalInstallmentsPaid;
  const totalOutstandingBalance = custAgreements.reduce((sum, a) => sum + a.remainingBalance, 0);
  const totalOverdue = custAgreements.reduce((sum, a) => {
    return (
      sum +
      a.schedule
        .filter((s) => s.status === 'overdue')
        .reduce((slotSum, s) => slotSum + (s.amount - s.paidAmount), 0)
    );
  }, 0);

  // 1. Official Store Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, 11, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.address}, ${settings.city} | Ph: ${settings.phone}`, pageWidth / 2, 17, { align: 'center' });
  doc.text(`${settings.regNumber} | Official Customer Accounting & Payment Ledger`, pageWidth / 2, 22, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()} | Account Status: ${customer.rating.toUpperCase()}`, pageWidth / 2, 27, { align: 'center' });

  let y = 36;

  // Title Banner
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER PAYMENT LEDGER & ACCOUNT STATEMENT', pageWidth / 2, y + 5.5, { align: 'center' });

  y += 12;

  // Section 1: Customer Profile & Guarantors (Side-by-side)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 28, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.fullName, 18, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Customer Code: ${customer.customerCode || 'CUST-001'}  |  CNIC: ${customer.cnic}`, 18, y + 11);
  doc.text(`Phone: ${customer.phone} ${customer.altPhone ? `/ ${customer.altPhone}` : ''}  |  City: ${customer.city}`, 18, y + 16);
  doc.text(`Address: ${customer.address}`, 18, y + 21);

  // Right column: Guarantor summary
  const midX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Guarantor Details:', midX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`1. ${customer.guarantor1.name} (${customer.guarantor1.relation}) - Ph: ${customer.guarantor1.phone}`, midX, y + 11);
  doc.text(`   CNIC: ${customer.guarantor1.cnic}`, midX, y + 15);
  if (customer.guarantor2) {
    doc.text(`2. ${customer.guarantor2.name} (${customer.guarantor2.relation}) - Ph: ${customer.guarantor2.phone}`, midX, y + 20);
    doc.text(`   CNIC: ${customer.guarantor2.cnic}`, midX, y + 24);
  } else {
    doc.text(`2. N/A`, midX, y + 20);
  }

  y += 33;

  // Account KPI Cards
  const cardW = (pageWidth - 28 - 9) / 4;
  
  // Card 1: Agreed Contract Value
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, cardW, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL CONTRACT VALUE', 16, y + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${settings.currencySymbol} ${totalAgreedValue.toLocaleString()}`, 16, y + 10.5);

  // Card 2: Total Paid to Date
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.rect(14 + cardW + 3, y, cardW, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TOTAL PAID (ADV + INSTALMENT)', 14 + cardW + 5, y + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(6, 95, 70);
  doc.text(`${settings.currencySymbol} ${totalPaidToDate.toLocaleString()}`, 14 + cardW + 5, y + 10.5);

  // Card 3: Remaining Balance
  doc.setFillColor(254, 243, 199); // amber-100
  doc.rect(14 + (cardW + 3) * 2, y, cardW, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('REMAINING BALANCE', 14 + (cardW + 3) * 2 + 2, y + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text(`${settings.currencySymbol} ${totalOutstandingBalance.toLocaleString()}`, 14 + (cardW + 3) * 2 + 2, y + 10.5);

  // Card 4: Overdue Balance
  doc.setFillColor(totalOverdue > 0 ? 254 : 241, totalOverdue > 0 ? 226 : 245, totalOverdue > 0 ? 226 : 249);
  doc.rect(14 + (cardW + 3) * 3, y, cardW, 14, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(totalOverdue > 0 ? 185 : 100, totalOverdue > 0 ? 28 : 116, totalOverdue > 0 ? 28 : 139);
  doc.text('OVERDUE DUES', 14 + (cardW + 3) * 3 + 2, y + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(totalOverdue > 0 ? 153 : 15, totalOverdue > 0 ? 27 : 23, totalOverdue > 0 ? 27 : 42);
  doc.text(`${settings.currencySymbol} ${totalOverdue.toLocaleString()}`, 14 + (cardW + 3) * 3 + 2, y + 10.5);

  y += 19;

  // Section 2: Agreements Details
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PURCHASE AGREEMENT(S) DETAILS', 16, y + 4.2);

  y += 8;

  if (custAgreements.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No active or previous purchase agreements on file.', 16, y);
    y += 6;
  } else {
    custAgreements.forEach((agr) => {
      if (y > pageHeight - 40) { doc.addPage(); y = 20; }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, pageWidth - 28, 18, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${agr.agreementNumber} — ${agr.itemName}`, 18, y + 5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const dispDeliveryDate = formatDateDDMMYYYY(agr.deliveryDate || agr.startDate);
      doc.text(`Serial / IMEI: ${agr.itemSerial}  |  Delivery Date: ${dispDeliveryDate}  |  Status: ${agr.status.toUpperCase()}`, 18, y + 9.5);
      
      doc.text(
        `Plan Duration: ${agr.monthDuration} Months  |  Monthly Installment: ${settings.currencySymbol} ${agr.monthlyInstalment.toLocaleString()} (Due ${agr.dueDayOfMonth}th)`,
        18,
        y + 14
      );

      // Financials on the right: Customer agreed price only
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Agreed Sale Price: ${settings.currencySymbol} ${agr.totalInstalmentPrice.toLocaleString()}`, pageWidth - 18, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Advance / Down Payment: ${settings.currencySymbol} ${agr.downPayment.toLocaleString()}`, pageWidth - 18, y + 9.5, { align: 'right' });
      doc.setTextColor(agr.remainingBalance > 0 ? 180 : 4, agr.remainingBalance > 0 ? 83 : 120, agr.remainingBalance > 0 ? 9 : 87);
      doc.setFont('helvetica', 'bold');
      doc.text(`Remaining Balance: ${settings.currencySymbol} ${agr.remainingBalance.toLocaleString()}`, pageWidth - 18, y + 14, { align: 'right' });

      y += 21;
    });
  }

  // Section 3: Payment Transaction History
  if (y > pageHeight - 50) { doc.addPage(); y = 20; }

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`2. PAYMENT RECEIPTS & CASH TRANSACTION HISTORY (${custPayments.length} Transactions)`, 16, y + 4.2);

  y += 7;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 5.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt #', 16, y + 3.8);
  doc.text('Date', 42, y + 3.8);
  doc.text('Agreement #', 65, y + 3.8);
  doc.text('Slot(s)', 95, y + 3.8);
  doc.text('Method', 120, y + 3.8);
  doc.text('Collector', 145, y + 3.8);
  doc.text('Amount Paid', pageWidth - 16, y + 3.8, { align: 'right' });

  y += 6.5;

  if (custPayments.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text('No instalment cash receipts recorded yet. (Only down payments paid at booking)', 16, y + 2);
    y += 7;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    custPayments.forEach((p) => {
      if (y > pageHeight - 35) { doc.addPage(); y = 20; }

      doc.text(p.receiptNumber, 16, y);
      doc.text(formatDateDDMMYYYY(p.date), 42, y);
      
      const agr = custAgreements.find((a) => a.id === p.agreementId);
      doc.text(agr?.agreementNumber || p.agreementId, 65, y);
      doc.text(p.installmentNumbers?.length > 0 ? `#${p.installmentNumbers.join(', #')}` : 'Slot', 95, y);
      doc.text(p.paymentMethod || 'Cash', 120, y);
      doc.text((p.collectorName || 'Staff').substring(0, 15), 145, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${settings.currencySymbol} ${p.amountPaid.toLocaleString()}`, pageWidth - 16, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += 5;
    });

    // Subtotal Row for Payments
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 1, pageWidth - 28, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Total Installments Recovered:', 16, y + 2.5);
    doc.text(`${settings.currencySymbol} ${totalInstallmentsPaid.toLocaleString()}`, pageWidth - 16, y + 2.5, { align: 'right' });
    y += 8;
  }

  // Section 4: Detailed Instalment Schedule Status
  if (y > pageHeight - 55) { doc.addPage(); y = 20; }

  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('3. MONTHLY INSTALMENT SCHEDULE STATUS', 16, y + 4.2);

  y += 7;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 5.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Agreement', 16, y + 3.8);
  doc.text('Slot #', 48, y + 3.8);
  doc.text('Due Date', 65, y + 3.8);
  doc.text('Due Amount', 95, y + 3.8);
  doc.text('Paid Amount', 125, y + 3.8);
  doc.text('Pending', 155, y + 3.8);
  doc.text('Status', pageWidth - 16, y + 3.8, { align: 'right' });

  y += 6.5;

  let totalScheduled = 0;
  let totalSchedPaid = 0;
  let totalSchedPending = 0;

  custAgreements.forEach((agr) => {
    agr.schedule.forEach((slot) => {
      if (y > pageHeight - 25) { doc.addPage(); y = 20; }

      const pending = slot.amount - slot.paidAmount;
      totalScheduled += slot.amount;
      totalSchedPaid += slot.paidAmount;
      totalSchedPending += pending;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      doc.text(agr.agreementNumber, 16, y);
      doc.text(`Instalment #${slot.installmentNumber}`, 48, y);
      doc.text(formatDateDDMMYYYY(slot.dueDate), 65, y);
      doc.text(`${settings.currencySymbol} ${slot.amount.toLocaleString()}`, 95, y);
      doc.text(`${settings.currencySymbol} ${slot.paidAmount.toLocaleString()}`, 125, y);
      doc.text(`${settings.currencySymbol} ${pending.toLocaleString()}`, 155, y);
      
      // Status with color
      if (slot.status === 'paid') {
        doc.setTextColor(4, 120, 87);
        doc.setFont('helvetica', 'bold');
        doc.text('PAID', pageWidth - 16, y, { align: 'right' });
      } else if (slot.status === 'overdue') {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text('OVERDUE', pageWidth - 16, y, { align: 'right' });
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text('PENDING', pageWidth - 16, y, { align: 'right' });
      }

      y += 5;
    });
  });

  // Schedule Summary Total Row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 1, pageWidth - 28, 5.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SCHEDULE TOTALS:', 16, y + 3);
  doc.text(`${settings.currencySymbol} ${totalScheduled.toLocaleString()}`, 95, y + 3);
  doc.text(`${settings.currencySymbol} ${totalSchedPaid.toLocaleString()}`, 125, y + 3);
  doc.text(`${settings.currencySymbol} ${totalSchedPending.toLocaleString()}`, 155, y + 3);
  y += 10;

  // Section 5: Verification & Signatures (Guaranteed on Page)
  if (y > pageHeight - 35) { doc.addPage(); y = 20; }

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, y, pageWidth - 14, y);
  doc.setLineDashPattern([], 0);

  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Verification Note: This is an official computer-generated account statement. Payments are recorded under Pakistan Trader Corporation instalment terms. For discrepancies, please present original payment receipts within 7 days of statement generation.',
    14,
    y,
    { maxWidth: pageWidth - 28 }
  );

  y += 14;

  // Signature lines
  const sigY = y + 8;
  doc.setDrawColor(100, 116, 139);
  doc.line(20, sigY, 75, sigY);
  doc.line(pageWidth - 75, sigY, pageWidth - 20, sigY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Customer / Account Holder Signature', 47.5, sigY + 4, { align: 'center' });
  doc.text('Authorized Shop Stamp & Signature', pageWidth - 47.5, sigY + 4, { align: 'center' });

  // Page numbering footer across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} | Customer Statement: ${customer.fullName} (${customer.customerCode || 'CUST'}) | ${settings.shopName}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save document
  const safeCustomerCode = (customer.customerCode || customer.fullName).replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Customer_Ledger_${safeCustomerCode}_${new Date().toISOString().split('T')[0]}.pdf`);
}

