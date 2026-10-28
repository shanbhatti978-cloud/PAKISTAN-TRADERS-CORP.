import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with runtime key or environment fallback
const getGenAIClient = () => {
  if (
    (typeof process !== 'undefined' && (process.env?.VITEST || process.env?.NODE_ENV === 'test')) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE === 'test')
  ) {
    return null;
  }
  const apiKey =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY) ||
    '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

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
 * Anonymizes applicant data before calling external Gemini API.
 * Validates and clamps AI JSON output with offline fallback.
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
  const ai = getGenAIClient();

  if (!ai) {
    return offlineResult;
  }

  try {
    // Anonymize: do NOT transmit customer name or personal identifiers to external API
    const itemPrice = Math.max(1, Number(params.itemPrice) || 0);
    const downPayment = Math.max(0, Number(params.requestedDownPayment) || 0);
    const downPercent = Math.round((downPayment / itemPrice) * 100);

    const prompt = `
Act as a senior Pakistani installment business risk auditor for electronics & motorcycle retail.
Evaluate this prospective applicant (data anonymized):
- Occupation/Profession: ${params.profession || 'Self-employed / Trader'}
- Monthly Income: PKR ${params.monthlyIncome}
- Item Cash/Installment Value: PKR ${itemPrice}
- Proposed Down Payment: PKR ${downPayment} (${downPercent}%)
- Proposed Plan Duration: ${params.requestedMonths} Months
- Verified Guarantors Provided: ${params.hasGuarantors ? 'Yes (2 Local Guarantors)' : 'No'}

Respond ONLY with valid JSON with this exact schema:
{
  "score": number (integer between 1 and 100, where 100 is safest),
  "tier": "Low Risk" | "Moderate Risk" | "High Risk",
  "recommendedDownPaymentPercent": number (e.g. 25),
  "maxRecommendedMonths": number (e.g. 12),
  "recommendations": ["string1", "string2", "string3"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Strict validation & clamping
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
    console.warn('Gemini API call failed, falling back to rule engine:', err);
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
 * Generate Customized WhatsApp/SMS Recovery Message
 * Supports Roman Urdu, Urdu, and English with offline templates.
 * Uses dynamic shop settings phone & name.
 */
export async function generateRecoveryMessage(params: RecoveryMessageParams): Promise<string> {
  const shop = params.shopName || 'Pakistan Trader Corporation';
  const phone = params.shopPhone || '+92 300 8472910';
  const lang = params.language || 'Roman Urdu';
  const amountStr = Math.round(params.overdueAmount).toLocaleString();

  // Deterministic Offline Templates
  const getOfflineMessage = () => {
    if (lang === 'Urdu') {
      return `السلام علیکم ${params.customerName} صاحب،\n${shop} کی طرف سے مودبانہ یاد دہانی: آپ کی سامان (${params.itemName}) کی ماہانہ قسط مبلغ -/${amountStr} روپے بتاریخ ${params.dueDate} واجب الادا تھی جو کہ ${params.daysLate} دن تاخیر کا شکار ہے۔\nبراہ کرم آج ہی دکان تشریف لا کر یا جاز کیش / ایزی پیسہ / بینک ٹرانسفر کے ذریعے ادائیگی فرمائیں تا کہ آپ کا کھاتہ باقاعدہ رہے۔ شکریہ!\nرابطہ نمبر: ${phone}`;
    }
    if (lang === 'English') {
      return `Dear ${params.customerName},\nThis is a courteous reminder from ${shop} regarding your pending installment payment of PKR ${amountStr} for ${params.itemName}, which was due on ${params.dueDate} (${params.daysLate} days overdue).\nPlease visit the counter or transfer via JazzCash / EasyPaisa / Bank Transfer today to maintain an uninterrupted credit standing. Thank you!\nShop Contact: ${phone}`;
    }
    // Default: Roman Urdu
    return `Assalam-o-Alaikum ${params.customerName} Sahib,\n${shop} ki taraf se yaad-dihani: Aap ki ${params.itemName} ki qist ba-mablagh Rs. ${amountStr} tareekh ${params.dueDate} ko wajib-ul-ada thi jo k ${params.daysLate} din se takheer ka shikar hai.\nBarah-e-karam shop par tashreef layein ya JazzCash / EasyPaisa / Bank Transfer k zariye aaj hi adaaigi farmaiye taake aap ka record theek rahe. Shukriya!\nRabta Shop: ${phone}`;
  };

  const ai = getGenAIClient();
  if (!ai) {
    return getOfflineMessage();
  }

  try {
    const prompt = `
Generate a respectful, professional, and clear payment reminder message for a retail installment customer in Pakistan.
Target Language: ${lang}
Shop Name: ${shop}
Shop Contact: ${phone}
Customer Name: ${params.customerName}
Item Purchased: ${params.itemName}
Overdue Amount: PKR ${amountStr}
Original Due Date: ${params.dueDate}
Days Overdue: ${params.daysLate}

Requirements:
- Professional, culturally respectful tone for Pakistan retail culture.
- State the overdue amount and days late clearly.
- Mention payment methods: Counter Cash, JazzCash, EasyPaisa, or Online Bank Transfer.
- Include shop contact number (${phone}) at the end.
- Return ONLY the final message ready to send via WhatsApp/SMS without commentary.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text?.trim();
    if (text && text.length > 20) {
      return text;
    }
  } catch (err) {
    console.warn('Gemini recovery message call failed, using offline template:', err);
  }

  return getOfflineMessage();
}
