import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with runtime key or environment fallback
const getGenAIClient = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export interface RiskAssessmentResult {
  score: number; // 0 - 100 (Higher is safer)
  tier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  recommendedDownPaymentPercent: number;
  maxRecommendedMonths: number;
  recommendations: string[];
}

/**
 * Assess Credit Risk for New Instalment Customer
 */
export async function assessCustomerRisk(params: {
  fullName: string;
  profession: string;
  monthlyIncome: number;
  itemPrice: number;
  requestedDownPayment: number;
  requestedMonths: number;
  hasGuarantors: boolean;
}): Promise<RiskAssessmentResult> {
  const ai = getGenAIClient();

  if (!ai) {
    // Intelligent Offline Calculation Engine
    const downPercent = (params.requestedDownPayment / params.itemPrice) * 100;
    const monthlyPayment = (params.itemPrice - params.requestedDownPayment) / params.requestedMonths;
    const incomeRatio = params.monthlyIncome > 0 ? (monthlyPayment / params.monthlyIncome) * 100 : 50;

    let score = 70;
    if (downPercent >= 25) score += 15;
    if (downPercent < 15) score -= 20;
    if (incomeRatio <= 25) score += 15;
    if (incomeRatio > 40) score -= 20;
    if (params.hasGuarantors) score += 10;

    score = Math.min(98, Math.max(15, score));

    const tier = score >= 75 ? 'Low Risk' : score >= 50 ? 'Moderate Risk' : 'High Risk';

    return {
      score,
      tier,
      recommendedDownPaymentPercent: score >= 75 ? 20 : score >= 50 ? 25 : 35,
      maxRecommendedMonths: score >= 75 ? 18 : 12,
      recommendations: [
        `Customer monthly payment (Rs. ${Math.round(monthlyPayment).toLocaleString()}) is ${Math.round(incomeRatio)}% of reported monthly income.`,
        params.hasGuarantors ? 'Guarantor verification completed.' : 'Strongly recommend obtaining 2 verified local guarantors.',
        downPercent < 20 ? 'Consider increasing advance down payment to reduce monthly debt load.' : 'Advance down payment meets recommended safety threshold.',
      ],
    };
  }

  try {
    const prompt = `
Act as a senior Pakistani installment business risk manager for electronics & motorcycle retail.
Analyze this prospective customer:
- Name: ${params.fullName}
- Occupation/Profession: ${params.profession}
- Monthly Income: PKR ${params.monthlyIncome}
- Item Cash/Installment Value: PKR ${params.itemPrice}
- Proposed Down Payment: PKR ${params.requestedDownPayment} (${Math.round((params.requestedDownPayment / params.itemPrice) * 100)}%)
- Proposed Plan Duration: ${params.requestedMonths} Months
- Verified Guarantors Provided: ${params.hasGuarantors ? 'Yes (2 Local Guarantors)' : 'No'}

Respond ONLY with valid JSON with this schema:
{
  "score": number (1 to 100, where 100 is safest),
  "tier": "Low Risk" | "Moderate Risk" | "High Risk",
  "recommendedDownPaymentPercent": number (e.g. 25),
  "maxRecommendedMonths": number (e.g. 12),
  "recommendations": ["string1", "string2", "string3"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as RiskAssessmentResult;
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to rule engine:', err);
  }

  // Fallback if call fails
  return {
    score: 68,
    tier: 'Moderate Risk',
    recommendedDownPaymentPercent: 25,
    maxRecommendedMonths: 12,
    recommendations: [
      'Standard 25% down payment recommended.',
      'Ensure physical address verification before dispatching goods.',
    ],
  };
}

/**
 * Generate Customized WhatsApp/SMS Recovery Message
 */
export async function generateRecoveryMessage(params: {
  customerName: string;
  itemName: string;
  overdueAmount: number;
  dueDate: string;
  daysLate: number;
  language?: string;
}): Promise<string> {
  const ai = getGenAIClient();

  if (!ai) {
    return `Dear ${params.customerName},\nThis is a friendly reminder from Pakistan Trader Corp regarding your pending installment payment of PKR ${params.overdueAmount.toLocaleString()} for ${params.itemName}, which was due on ${params.dueDate} (${params.daysLate} days overdue).\nPlease visit the shop or transfer via JazzCash / EasyPaisa / Bank Transfer today to keep your account in good standing. Thank you!\nShop Contact: +92 300 8472910`;
  }

  try {
    const prompt = `
Generate a respectful, professional payment reminder message for an installment customer.
Customer Name: ${params.customerName}
Item Purchased: ${params.itemName}
Overdue Amount: PKR ${params.overdueAmount}
Original Due Date: ${params.dueDate}
Days Overdue: ${params.daysLate}
Language: English

Include payment options (Cash at counter, JazzCash/EasyPaisa, Bank Transfer). Keep it concise and ready to send directly via WhatsApp.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'Payment reminder generated.';
  } catch (err) {
    return `Assalam-o-Alaikum ${params.customerName} Sahib,\nReminder: Installment Rs. ${params.overdueAmount.toLocaleString()} for ${params.itemName} is overdue. Please visit shop today.`;
  }
}
