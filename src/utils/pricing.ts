/**
 * Pricing & Markup Helper Functions for Pakistan Trader Corporation
 */

export function roundToStep(amount: number, step: 100 | 500 = 100): number {
  if (!amount || amount <= 0) return 0;
  return Math.round(amount / step) * step;
}

export function calculateInstalmentPrice(
  marketPrice: number,
  markupPercent: number = 20,
  step: 100 | 500 = 100
): number {
  if (!marketPrice || marketPrice <= 0) return 0;
  const raw = marketPrice * (1 + markupPercent / 100);
  return roundToStep(raw, step);
}

export function calculateMinDownPayment(
  marketPrice: number,
  downPaymentPercent: number = 15,
  step: 100 | 500 = 100
): number {
  if (!marketPrice || marketPrice <= 0) return 0;
  const raw = marketPrice * (downPaymentPercent / 100);
  return roundToStep(raw, step);
}
