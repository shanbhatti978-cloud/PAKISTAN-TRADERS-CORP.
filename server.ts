import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10kb' }));

// In-memory sliding window rate limiter (30 requests / 60 seconds per IP)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}

function clientAuthCheck(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientHeader = req.headers['x-qist-client'];
  if (clientHeader !== 'ptc-app') {
    return res.status(403).json({ error: 'Forbidden: Missing or invalid client authorization header.' });
  }
  next();
}

app.use('/api/ai', rateLimiter, clientAuthCheck);

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
    const { profession, monthlyIncome, itemPrice, requestedDownPayment, requestedMonths, hasGuarantors } = req.body || {};

    if (
      (profession !== undefined && (typeof profession !== 'string' || profession.length > 100)) ||
      typeof monthlyIncome !== 'number' || !Number.isFinite(monthlyIncome) || monthlyIncome < 0 ||
      typeof itemPrice !== 'number' || !Number.isFinite(itemPrice) || itemPrice <= 0 ||
      typeof requestedDownPayment !== 'number' || !Number.isFinite(requestedDownPayment) || requestedDownPayment < 0 ||
      typeof requestedMonths !== 'number' || !Number.isInteger(requestedMonths) || requestedMonths <= 0 || requestedMonths > 120 ||
      typeof hasGuarantors !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Invalid input parameters for credit risk assessment.' });
    }

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
    const { itemName, overdueAmount, dueDate, daysLate, language, shopName, shopPhone } = req.body || {};

    const validLangs = ['Roman Urdu', 'Urdu', 'English'];
    if (
      typeof itemName !== 'string' || itemName.length > 200 || !itemName.trim() ||
      typeof overdueAmount !== 'number' || !Number.isFinite(overdueAmount) || overdueAmount < 0 ||
      typeof dueDate !== 'string' || dueDate.length > 30 ||
      typeof daysLate !== 'number' || !Number.isInteger(daysLate) || daysLate < 0 ||
      (language && (!validLangs.includes(language) || typeof language !== 'string')) ||
      (shopName && (typeof shopName !== 'string' || shopName.length > 100)) ||
      (shopPhone && (typeof shopPhone !== 'string' || shopPhone.length > 30))
    ) {
      return res.status(400).json({ error: 'Invalid input parameters for reminder message generation.' });
    }

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
