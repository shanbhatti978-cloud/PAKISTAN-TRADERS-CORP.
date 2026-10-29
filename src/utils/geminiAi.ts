export interface RiskAssessmentResult {
  score: number; // 0 - 100 (Higher is safer)
  tier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  recommendedDownPaymentPercent: number;
  maxRecommendedMonths: number;
  recommendations: string[];
  source: 'ai' | 'offline_rules';
}

/**
 * Intelligent Offline Rule Engine for Credit Risk Assessment
 */
export function assessCustomerRiskOffline(params: {
  monthlyIncome: number;
  itemPrice: number;
  requestedDownPayment: number;
  requestedMonths: number;
  hasGuarantors: boolean;
}): RiskAssessmentResult {
  const itemPrice = Math.max(1, Number(params.itemPrice) || 0);
  const downPayment = Math.max(0, Number(params.requestedDownPayment) || 0);
  const months = Math.max(1, Number(params.requestedMonths) || 1);
  const income = Math.max(0, Number(params.monthlyIncome) || 0);

  const downPercent = (downPayment / itemPrice) * 100;
  const remainingDebt = Math.max(0, itemPrice - downPayment);
  const monthlyPayment = remainingDebt / months;
  const incomeRatio = income > 0 ? (monthlyPayment / income) * 100 : 50;

  let score = 70;
  if (downPercent >= 30) score += 15;
  else if (downPercent >= 20) score += 10;
  else if (downPercent < 15) score -= 20;

  if (incomeRatio <= 20) score += 15;
  else if (incomeRatio <= 35) score += 5;
  else if (incomeRatio > 50) score -= 25;
  else if (incomeRatio > 40) score -= 15;

  if (params.hasGuarantors) score += 10;
  else score -= 15;

  score = Math.min(99, Math.max(10, Math.round(score)));
  const tier: 'Low Risk' | 'Moderate Risk' | 'High Risk' =
    score >= 75 ? 'Low Risk' : score >= 50 ? 'Moderate Risk' : 'High Risk';

  const recommendations: string[] = [
    `Monthly instalment (Rs. ${Math.round(monthlyPayment).toLocaleString()}) is ${Math.round(incomeRatio)}% of reported monthly income.`,
    params.hasGuarantors
      ? 'Verified local guarantors confirmed.'
      : 'Strongly recommend obtaining at least 2 verified local guarantors before releasing merchandise.',
    downPercent < 20
      ? 'Advance down payment is below the recommended 20% safety threshold. Request a larger down payment.'
      : 'Advance down payment meets recommended safety buffer.',
  ];

  return {
    score,
    tier,
    recommendedDownPaymentPercent: score >= 75 ? 20 : score >= 50 ? 25 : 35,
    maxRecommendedMonths: score >= 75 ? 18 : score >= 50 ? 12 : 6,
    recommendations,
    source: 'offline_rules',
  };
}

/**
 * Assess Credit Risk for New Instalment Customer
 * Anonymizes applicant data before calling server API.
 * Falls back cleanly to offline rule engine.
 */
export async function assessCustomerRisk(params: {
  fullName?: string;
  profession: string;
  monthlyIncome: number;
  itemPrice: number;
  requestedDownPayment: number;
  requestedMonths: number;
  hasGuarantors: boolean;
}): Promise<RiskAssessmentResult> {
  const offlineResult = assessCustomerRiskOffline(params);

  try {
    const res = await fetch('/api/ai/risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-qist-client': 'ptc-app',
      },
      body: JSON.stringify({
        profession: params.profession || 'Trader / Business',
        monthlyIncome: params.monthlyIncome,
        itemPrice: params.itemPrice,
        requestedDownPayment: params.requestedDownPayment,
        requestedMonths: params.requestedMonths,
        hasGuarantors: params.hasGuarantors,
      }),
    });

    if (res.ok) {
      const parsed = await res.json();
      const rawScore = Number(parsed.score);
      const score = Math.max(1, Math.min(100, Number.isFinite(rawScore) ? Math.round(rawScore) : offlineResult.score));

      let tier: 'Low Risk' | 'Moderate Risk' | 'High Risk' = offlineResult.tier;
      if (parsed.tier === 'Low Risk' || parsed.tier === 'Moderate Risk' || parsed.tier === 'High Risk') {
        tier = parsed.tier;
      } else {
        tier = score >= 75 ? 'Low Risk' : score >= 50 ? 'Moderate Risk' : 'High Risk';
      }

      const rawDown = Number(parsed.recommendedDownPaymentPercent);
      const recommendedDownPaymentPercent = Math.max(
        10,
        Math.min(60, Number.isFinite(rawDown) ? Math.round(rawDown) : offlineResult.recommendedDownPaymentPercent)
      );

      const rawMonths = Number(parsed.maxRecommendedMonths);
      const maxRecommendedMonths = Math.max(
        1,
        Math.min(36, Number.isFinite(rawMonths) ? Math.round(rawMonths) : offlineResult.maxRecommendedMonths)
      );

      const recs = Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((r: any) => String(r).trim()).filter(Boolean)
        : offlineResult.recommendations;

      return {
        score,
        tier,
        recommendedDownPaymentPercent,
        maxRecommendedMonths,
        recommendations: recs.length > 0 ? recs.slice(0, 4) : offlineResult.recommendations,
        source: 'ai',
      };
    }
  } catch (err) {
    // Offline mode or server unavailable
  }

  return offlineResult;
}

export interface RecoveryMessageParams {
  customerName: string;
  itemName: string;
  overdueAmount: number;
  dueDate: string;
  daysLate: number;
  language?: 'Roman Urdu' | 'Urdu' | 'English';
  shopName?: string;
  shopPhone?: string;
}

/**
 * Format Offline Recovery Reminder
 */
export function formatOfflineRecoveryMessage(params: RecoveryMessageParams): string {
  const shop = params.shopName || 'Pakistan Trader Corporation';
  const phoneLine = params.shopPhone ? `\nShop Contact: ${params.shopPhone}` : '';
  const lang = params.language || 'Roman Urdu';
  const amountStr = Math.round(params.overdueAmount).toLocaleString();
  const name = params.customerName || 'Valued Customer';

  if (lang === 'Urdu') {
    return `السلام علیکم ${name} صاحب،\n${shop} کی طرف سے مودبانہ یاد دہانی: آپ کی سامان (${params.itemName}) کی ماہانہ قسط مبلغ -/${amountStr} روپے بتاریخ ${params.dueDate} واجب الادا تھی جو کہ ${params.daysLate} دن تاخیر کا شکار ہے۔\nبراہ کرم آج ہی دکان تشریف لا کر یا جاز کیش / ایزی پیسہ کے ذریعے ادائیگی فرمائیں تا کہ آپ کا کھاتہ باقاعدہ رہے۔ شکریہ!${params.shopPhone ? `\nرابطہ نمبر: ${params.shopPhone}` : ''}`;
  }
  if (lang === 'English') {
    return `Dear ${name},\nThis is a courteous reminder from ${shop} regarding your pending installment payment of PKR ${amountStr} for ${params.itemName}, which was due on ${params.dueDate} (${params.daysLate} days overdue).\nPlease visit the counter or transfer via JazzCash / EasyPaisa / Bank Transfer today to maintain an uninterrupted credit standing. Thank you!${phoneLine}`;
  }
  // Default: Roman Urdu
  return `Assalam-o-Alaikum ${name} Sahib,\n${shop} ki taraf se yaad-dihani: Aap ki ${params.itemName} ki qist ba-mablagh Rs. ${amountStr} tareekh ${params.dueDate} ko wajib-ul-ada thi jo k ${params.daysLate} din se takheer ka shikar hai.\nBarah-e-karam shop par tashreef layein ya JazzCash / EasyPaisa / Bank Transfer k zariye aaj hi adaaigi farmaiye taake aap ka record theek rahe. Shukriya!${params.shopPhone ? `\nRabta Shop: ${params.shopPhone}` : ''}`;
}

/**
 * Generate Customized WhatsApp/SMS Recovery Message
 * Calls server route when available, re-inserting customer name locally for privacy.
 */
export async function generateRecoveryMessage(params: RecoveryMessageParams): Promise<string> {
  const offlineMsg = formatOfflineRecoveryMessage(params);

  try {
    const res = await fetch('/api/ai/reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-qist-client': 'ptc-app',
      },
      body: JSON.stringify({
        itemName: params.itemName,
        overdueAmount: params.overdueAmount,
        dueDate: params.dueDate,
        daysLate: params.daysLate,
        language: params.language || 'Roman Urdu',
        shopName: params.shopName,
        shopPhone: params.shopPhone,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.length > 20) {
        // Re-insert customer's actual name locally
        let text = data.text;
        const name = params.customerName || 'Valued Customer';
        if (text.includes('the customer')) {
          text = text.replace(/the customer/gi, name);
        }
        return text;
      }
    }
  } catch (err) {
    // Offline mode
  }

  return offlineMsg;
}
