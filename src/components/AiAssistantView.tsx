import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Send,
  Copy,
  Check,
  MessageSquare,
  DollarSign,
  UserCheck,
  Zap,
} from 'lucide-react';
import { assessCustomerRisk, generateRecoveryMessage, RiskAssessmentResult } from '../utils/geminiAi';
import { ShopSettings } from '../types';

interface AiAssistantViewProps {
  settings: ShopSettings;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<'risk' | 'reminder'>('risk');

  // Risk Assessor State
  const [fullName, setFullName] = useState('Tariq Qureshi');
  const [profession, setProfession] = useState('Grocery Store Shopkeeper');
  const [income, setIncome] = useState<number>(120000);
  const [itemPrice, setItemPrice] = useState<number>(342000);
  const [downPayment, setDownPayment] = useState<number>(60000);
  const [months, setMonths] = useState<number>(12);
  const [hasGuarantors, setHasGuarantors] = useState<boolean>(true);

  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskAssessmentResult | null>(null);

  // Reminder Generator State
  const [remCustomerName, setRemCustomerName] = useState('Kamran Hassan Raza');
  const [remItemName, setRemItemName] = useState('Haier 1.5 Ton AC');
  const [remOverdueAmt, setRemOverdueAmt] = useState<number>(27166);
  const [remDueDate, setRemDueDate] = useState('2026-09-10');
  const [remDaysLate, setRemDaysLate] = useState<number>(18);
  const [remLang, setRemLang] = useState<'Roman Urdu' | 'Urdu' | 'English'>('Roman Urdu');

  const [loadingRem, setLoadingRem] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRunRiskAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRisk(true);
    try {
      const res = await assessCustomerRisk({
        fullName,
        profession,
        monthlyIncome: income,
        itemPrice,
        requestedDownPayment: downPayment,
        requestedMonths: months,
        hasGuarantors,
      });
      setRiskResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleGenerateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRem(true);
    try {
      const txt = await generateRecoveryMessage({
        customerName: remCustomerName,
        itemName: remItemName,
        overdueAmount: remOverdueAmt,
        dueDate: remDueDate,
        daysLate: remDaysLate,
        language: remLang,
      });
      setReminderText(txt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRem(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="m3-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold font-heading flex items-center gap-2" style={{ color: 'var(--theme-text-primary)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
            AI Credit Risk & Recovery Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Smart customer risk scoring, defaulter prediction, and automated WhatsApp payment reminder composer.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--theme-surface-border)' }}>
        <button
          onClick={() => setActiveTab('risk')}
          className="px-4 py-2 text-xs font-bold rounded-full transition-all border flex items-center gap-2"
          style={{
            backgroundColor: activeTab === 'risk' ? 'var(--theme-tonal-bg)' : 'transparent',
            color: activeTab === 'risk' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            borderColor: activeTab === 'risk' ? 'var(--theme-primary)' : 'transparent',
          }}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Customer Risk Assessor</span>
        </button>

        <button
          onClick={() => setActiveTab('reminder')}
          className="px-4 py-2 text-xs font-bold rounded-full transition-all border flex items-center gap-2"
          style={{
            backgroundColor: activeTab === 'reminder' ? 'var(--theme-tonal-bg)' : 'transparent',
            color: activeTab === 'reminder' ? 'var(--theme-primary)' : 'var(--theme-text-secondary)',
            borderColor: activeTab === 'reminder' ? 'var(--theme-primary)' : 'transparent',
          }}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp Reminder Generator</span>
        </button>
      </div>

      {activeTab === 'risk' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleRunRiskAssessment} className="m3-card p-5 space-y-4">
            <h3 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Customer Financing Application</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="m3-input" />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Profession / Business</label>
                <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} className="m3-input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Monthly Income</label>
                  <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="m3-input" />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Item Price</label>
                  <input type="number" value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))} className="m3-input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Down Payment</label>
                  <input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="m3-input" />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Tenure (Months)</label>
                  <input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="m3-input" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loadingRisk} className="m3-btn-base m3-btn-filled w-full py-2.5">
              {loadingRisk ? 'Evaluating AI Risk Score...' : 'Run Credit Risk Analysis'}
            </button>
          </form>

          <div className="m3-card p-5 space-y-4">
            <h3 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>AI Risk Evaluation Scorecard</h3>

            {riskResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl border text-center space-y-1" style={{ backgroundColor: 'var(--theme-tonal-bg)', borderColor: 'var(--theme-tonal-border)' }}>
                  <div className="text-xs uppercase font-bold text-slate-400">Risk Score</div>
                  <div className="text-3xl font-extrabold font-mono-tabular" style={{ color: 'var(--theme-primary)' }}>
                    {riskResult.score} / 100
                  </div>
                  <div className="text-sm font-bold uppercase" style={{ color: 'var(--theme-primary)' }}>{riskResult.tier}</div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>AI Recommendations & Key Factors:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {riskResult.recommendations.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)' }}>
                  <strong style={{ color: 'var(--theme-primary)' }}>Recommended Down Payment: </strong>
                  <span className="text-slate-400 font-mono-tabular">{riskResult.recommendedDownPaymentPercent}%</span>
                  <br />
                  <strong style={{ color: 'var(--theme-primary)' }}>Max Recommended Term: </strong>
                  <span className="text-slate-400 font-mono-tabular">{riskResult.maxRecommendedMonths} Months</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Fill in the customer financial application details and click "Run Credit Risk Analysis" to view AI assessment.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleGenerateReminder} className="m3-card p-5 space-y-4">
            <h3 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Compose Recovery Message</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Customer Name</label>
                <input type="text" value={remCustomerName} onChange={(e) => setRemCustomerName(e.target.value)} className="m3-input" />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Item Description</label>
                <input type="text" value={remItemName} onChange={(e) => setRemItemName(e.target.value)} className="m3-input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Overdue Amount</label>
                  <input type="number" value={remOverdueAmt} onChange={(e) => setRemOverdueAmt(Number(e.target.value))} className="m3-input" />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: 'var(--theme-text-primary)' }}>Days Late</label>
                  <input type="number" value={remDaysLate} onChange={(e) => setRemDaysLate(Number(e.target.value))} className="m3-input" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loadingRem} className="m3-btn-base m3-btn-filled w-full py-2.5">
              {loadingRem ? 'Generating Message...' : 'Generate WhatsApp Reminder'}
            </button>
          </form>

          <div className="m3-card p-5 space-y-4">
            <h3 className="text-base font-bold font-heading" style={{ color: 'var(--theme-text-primary)' }}>Generated Message</h3>

            {reminderText ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl border whitespace-pre-wrap font-sans text-xs leading-relaxed" style={{ backgroundColor: 'var(--theme-surface-input)', borderColor: 'var(--theme-surface-border)', color: 'var(--theme-text-primary)' }}>
                  {reminderText}
                </div>
                <button onClick={handleCopyText} className="m3-btn-base m3-btn-tonal w-full">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Message Text'}</span>
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Fill in the details on the left and click "Generate WhatsApp Reminder" to compose a polite, effective recovery message.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
