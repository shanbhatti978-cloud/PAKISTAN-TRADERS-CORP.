import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with server-side environment variable only
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// POST /api/ai/risk: Evaluate applicant credit risk
app.post('/api/ai/risk', async (req, res) => {
  const ai = getGenAIClient();
  if (!ai) {
    return res.status(503).json({ error: 'Server Gemini API key not configured.' });
  }

  try {
    const { profession, monthlyIncome, itemPrice, requestedDownPayment, requestedMonths, hasGuarantors } = req.body;

    const price = Math.max(1, Number(itemPrice) || 0);
    const down = Math.max(0, Number(requestedDownPayment) || 0);
    const downPct = Math.round((down / price) * 100);

    const prompt = `
Act as a senior Pakistani installment business risk auditor for electronics & motorcycle retail.
Evaluate this prospective applicant (data anonymized for privacy):
- Applicant Profession: ${profession || 'Self-employed / Trader'}
- Reported Monthly Income: PKR ${monthlyIncome}
- Item Cash/Installment Value: PKR ${price}
- Proposed Advance Down Payment: PKR ${down} (${downPct}%)
- Proposed Plan Duration: ${requestedMonths} Months
- Verified Guarantors Provided: ${hasGuarantors ? 'Yes (2 Local Guarantors)' : 'No'}

Respond ONLY with valid JSON matching this schema:
{
  "score": number (1 to 100, where 100 is safest),
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
      return res.json(parsed);
    }

    return res.status(500).json({ error: 'Failed to parse AI JSON output' });
  } catch (err: any) {
    console.error('Server AI Risk evaluation error:', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// POST /api/ai/reminder: Generate recovery reminder message
app.post('/api/ai/reminder', async (req, res) => {
  const ai = getGenAIClient();
  if (!ai) {
    return res.status(503).json({ error: 'Server Gemini API key not configured.' });
  }

  try {
    const { itemName, overdueAmount, dueDate, daysLate, language, shopName, shopPhone } = req.body;

    const shop = shopName || 'Pakistan Trader Corporation';
    const phoneLine = shopPhone ? `Shop Contact: ${shopPhone}` : '';
    const lang = language || 'Roman Urdu';
    const amountStr = Math.round(Number(overdueAmount) || 0).toLocaleString();

    const prompt = `
Generate a respectful, professional payment reminder message for an installment customer in Pakistan.
Target Language: ${lang}
Shop Name: ${shop}
${phoneLine}
Customer: the customer
Item Purchased: ${itemName}
Overdue Amount: PKR ${amountStr}
Original Due Date: ${dueDate}
Days Overdue: ${daysLate}

Requirements:
- Culturally respectful, clear tone.
- State overdue amount and days late.
- Refer to the customer as "the customer" or generic respectful address (e.g. "Dear Customer" or "Mohtaram Customer").
- Mention counter cash, JazzCash, EasyPaisa, or Bank Transfer payment options.
- ${phoneLine ? `Include ${phoneLine} at the end.` : 'Do not include any phone number if not provided.'}
- Return ONLY the message content.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    return res.json({ text });
  } catch (err: any) {
    console.error('Server AI Reminder error:', err);
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// Mount Vite middleware in development mode
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const fs = await import('fs');
      let template = fs.readFileSync('index.html', 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  app.use(express.static('dist'));
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Express server running on http://0.0.0.0:${PORT}`);
});
