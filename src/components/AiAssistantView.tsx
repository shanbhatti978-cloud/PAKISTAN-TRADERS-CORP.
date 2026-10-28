import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Menu,
  MoreHorizontal,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
  Send,
  UserCheck,
  AlertTriangle,
  Flame,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { assessCustomerRisk, generateRecoveryMessage, RiskAssessmentResult } from '../utils/geminiAi';
import { Agreement, Customer, Payment, ShopSettings } from '../types';
import { useAppActions } from '../context/AppActionsContext';
import { todayLocal, parseLocalDate } from '../utils/dates';

interface AiAssistantViewProps {
  settings: ShopSettings;
  customers?: Customer[];
  agreements?: Agreement[];
  payments?: Payment[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  settings,
  customers = [],
  agreements = [],
  payments = [],
}) => {
  const { runAction } = useAppActions();
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedChip, setSelectedChip] = useState('Sales report');
  const [showExtendedTools, setShowExtendedTools] = useState(true);

  // Risk Assessor State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [profession, setProfession] = useState<string>('');
  const [income, setIncome] = useState<number>(85000);
  const [itemPrice, setItemPrice] = useState<number>(250000);
  const [downPayment, setDownPayment] = useState<number>(50000);
  const [months, setMonths] = useState<number>(12);
  const [hasGuarantors, setHasGuarantors] = useState<boolean>(true);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskAssessmentResult | null>(null);

  // Reminder State
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('');
  const [remCustomerName, setRemCustomerName] = useState<string>('');
  const [remCustomerPhone, setRemCustomerPhone] = useState<string>('');
  const [remItemName, setRemItemName] = useState<string>('');
  const [remOverdueAmt, setRemOverdueAmt] = useState<number>(0);
  const [remDueDate, setRemDueDate] = useState<string>(todayLocal());
  const [remDaysLate, setRemDaysLate] = useState<number>(0);
  const [remLang, setRemLang] = useState<'Roman Urdu' | 'Urdu' | 'English'>('Roman Urdu');
  const [loadingRem, setLoadingRem] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [copied, setCopied] = useState(false);

  // Real payment activity calculation for Heatmap & Order Tracking
  const todayStr = todayLocal();
  const todayDate = parseLocalDate(todayStr);

  const { recentPaymentCount, recentAmount, heatmapMatrix } = useMemo(() => {
    // 35 days (5 weeks x 7 days)
    const dayCounts = new Array(35).fill(0);
    let count30Days = 0;
    let sum30Days = 0;

    payments.forEach((p) => {
      if (p.isReversed) return;
      try {
        const pDate = parseLocalDate(p.date.split('T')[0]);
        const diffDays = Math.floor((todayDate.getTime() - pDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays < 35) {
          const slotIdx = 34 - diffDays;
          dayCounts[slotIdx] += 1;
        }
        if (diffDays >= 0 && diffDays < 30) {
          count30Days += 1;
          sum30Days += p.amountPaid;
        }
      } catch {
        // ignore date parse errors
      }
    });

    const maxCount = Math.max(1, ...dayCounts);
    const matrix: number[][] = [];
    for (let r = 0; r < 5; r++) {
      const row: number[] = [];
      for (let c = 0; c < 7; c++) {
        const val = dayCounts[r * 7 + c];
        // map to 0..4 intensity levels
        const level = val === 0 ? 0 : Math.min(4, Math.ceil((val / maxCount) * 4));
        row.push(level);
      }
      matrix.push(row);
    }

    return {
      recentPaymentCount: count30Days,
      recentAmount: sum30Days,
      heatmapMatrix: matrix,
    };
  }, [payments, todayDate]);

  // Heatmap palette in 5 shades
  const heatmapColors = [
    'bg-surface-2 border-border',
    'bg-primary/20 border-primary/30',
    'bg-primary/40 border-primary/50',
    'bg-primary/70 border-primary/80',
    'bg-primary text-white border-primary shadow-xs',
  ];

  const chips = [
    'Sales report',
    'Top sales',
    'Customer Risk',
    'Restock alert',
  ];

  // Auto-populate when selecting an existing customer for risk evaluation
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) {
      setFullName('');
      setProfession('');
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setFullName(found.fullName);
      setProfession(found.profession || 'Shopkeeper / Business');
      if (found.monthlyIncome && found.monthlyIncome > 0) {
        setIncome(found.monthlyIncome);
      }
    }
  };

  // Overdue agreements list for reminder generator
  const overdueAgreements = useMemo(() => {
    return agreements
      .filter((a) => a.status === 'active' || a.status === 'defaulter')
      .map((agr) => {
        const cust = customers.find((c) => c.id === agr.customerId);
        let maxDaysLate = 0;
        let pendingOverdueAmount = 0;
        let earliestDueDate = todayStr;

        agr.schedule.forEach((slot) => {
          if (slot.status === 'paid') return;
          const due = parseLocalDate(slot.dueDate);
          const diffDays = Math.floor((todayDate.getTime() - due.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0) {
            pendingOverdueAmount += slot.amount - slot.paidAmount;
            if (diffDays > maxDaysLate) {
              maxDaysLate = diffDays;
              earliestDueDate = slot.dueDate;
            }
          }
        });

        return {
          agr,
          cust,
          maxDaysLate,
          pendingOverdueAmount: pendingOverdueAmount > 0 ? pendingOverdueAmount : agr.monthlyInstalment,
          earliestDueDate,
        };
      })
      .filter((item) => item.maxDaysLate > 0 || item.pendingOverdueAmount > 0);
  }, [agreements, customers, todayDate, todayStr]);

  const handleSelectAgreement = (agrId: string) => {
    setSelectedAgreementId(agrId);
    if (!agrId) return;

    const item = overdueAgreements.find((x) => x.agr.id === agrId);
    if (item) {
      setRemCustomerName(item.cust?.fullName || 'Valued Customer');
      setRemCustomerPhone(item.cust?.phone || '');
      setRemItemName(item.agr.itemName);
      setRemOverdueAmt(item.pendingOverdueAmount);
      setRemDueDate(item.earliestDueDate);
      setRemDaysLate(item.maxDaysLate);
    }
  };

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    if (chip === 'Sales report') {
      runAction('business_report');
    } else if (chip === 'Restock alert') {
      runAction('receive_stock');
    } else if (chip === 'Customer Risk') {
      setShowExtendedTools(true);
      const el = document.getElementById('risk-assessor-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setAiPrompt(`Analyze business performance for ${chip}`);
    }
  };

  const handleRunRiskAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRisk(true);
    try {
      const res = await assessCustomerRisk({
        fullName: fullName.trim() || 'Prospective Applicant',
        profession: profession.trim() || 'Trader / Business',
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
        customerName: remCustomerName.trim() || 'Valued Customer',
        itemName: remItemName.trim() || 'Merchandise',
        overdueAmount: remOverdueAmt,
        dueDate: remDueDate,
        daysLate: remDaysLate,
        language: remLang,
        shopName: settings.shopName,
        shopPhone: settings.phone,
      });
      setReminderText(txt);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRem(false);
    }
  };

  const handleCopy = () => {
    if (!reminderText) return;
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!reminderText) return;
    const phoneClean = remCustomerPhone.replace(/[^0-9]/g, '');
    const url = phoneClean
      ? `https://wa.me/${phoneClean.startsWith('92') ? phoneClean : '92' + phoneClean.replace(/^0+/, '')}?text=${encodeURIComponent(reminderText)}`
      : `https://wa.me/?text=${encodeURIComponent(reminderText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 pb-24 select-none">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between pt-2 px-1">
        <button
          onClick={() => runAction('business_report')}
          className="w-10 h-10 rounded-full bg-surface text-text shadow-xs border border-border flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="Open Reports"
        >
          <Menu className="w-4 h-4 stroke-[2.2]" />
        </button>

        <h2 className="text-body font-bold text-text font-heading tracking-wide">
          Intelligence & Recovery Assistant
        </h2>

        <button
          onClick={() => setShowExtendedTools(!showExtendedTools)}
          className={`w-10 h-10 rounded-full text-text shadow-xs border border-border flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer ${
            showExtendedTools ? 'bg-primary text-white border-primary' : 'bg-surface'
          }`}
          title="Toggle Assistant Tools"
        >
          <MoreHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* 2. Glass Card: Shop Proprietor Welcome + AI Prompt Bar */}
      <div className="m3-card p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-caption font-bold text-text-muted">
            {settings.shopName} • {settings.proprietorName || 'Proprietor'}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text font-heading mt-0.5">
            Credit Intelligence & Recovery Terminal
          </h1>
        </div>

        {/* Pill Chips */}
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const isSelected = selectedChip === chip;
            return (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className={`px-3.5 py-1.5 rounded-full text-caption font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="relative pt-1">
          <input
            type="text"
            placeholder="Type query or click 'Customer Risk' / 'Sales report'..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                runAction('business_report');
              }
            }}
            className="m3-input rounded-full pr-12 text-body-sm"
          />
          <button
            onClick={() => runAction('business_report')}
            className="w-8 h-8 rounded-full bg-primary text-white absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            title="Execute Analysis"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 3. Real 35-Day Recovery Activity Heatmap & Order Tracking */}
      <div className="m3-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-caption font-bold text-text-muted uppercase tracking-wider">
              Store Cash Recovery Flow
            </div>
            <h3 className="text-title font-bold text-text font-heading">
              35-Day Payment Activity Heatmap
            </h3>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-2xl font-black font-mono-tabular text-text">
                {recentPaymentCount} Collections
              </span>
              <span className="bg-success/10 text-success text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                Rs. {recentAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-caption text-text-muted text-right pt-2 font-medium">
            Past 5 Weeks Activity
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-2">
            {heatmapMatrix.flatMap((row, rIdx) =>
              row.map((level, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`h-8 rounded-xl ${heatmapColors[level]} border transition-transform hover:scale-110 shadow-2xs`}
                  title={`Week ${rIdx + 1}, Day ${cIdx + 1}: Level ${level}`}
                />
              ))
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-2">
            <span>5 Weeks Ago</span>
            <span>Current Week ({todayStr})</span>
          </div>
        </div>
      </div>

      {/* 4. AI & Offline Customer Credit Risk Intelligence Tool */}
      <div id="risk-assessor-card" className="m3-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div className="flex items-center gap-2 text-text">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-heading font-black text-body">
                Applicant Credit Risk Intelligence
              </h3>
              <p className="text-caption text-text-muted font-medium">
                Evaluates debt-to-income ratio, guarantor strength, and down-payment safety.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRunRiskAssessment} className="space-y-3 text-body-sm">
          {/* Quick select from existing customer base */}
          {customers.length > 0 && (
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">
                Select Existing Customer (Or leave blank for new applicant)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="m3-input text-body-sm"
              >
                <option value="">-- New Walk-in Applicant (Enter Manually) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.phone} ({c.profession || 'Customer'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Applicant Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Applicant name..."
                className="m3-input text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Occupation / Profession</label>
              <input
                type="text"
                required
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Shopkeeper, Teacher, Driver"
                className="m3-input text-body-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Monthly Income (Rs.)</label>
              <input
                type="number"
                required
                min={0}
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="m3-input font-mono-tabular text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Item Value (Rs.)</label>
              <input
                type="number"
                required
                min={1}
                value={itemPrice}
                onChange={(e) => setItemPrice(Number(e.target.value))}
                className="m3-input font-mono-tabular text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Advance Down (Rs.)</label>
              <input
                type="number"
                required
                min={0}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="m3-input font-mono-tabular text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Plan (Months)</label>
              <input
                type="number"
                required
                min={1}
                max={36}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="m3-input font-mono-tabular text-body-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer text-caption font-bold text-text">
              <input
                type="checkbox"
                checked={hasGuarantors}
                onChange={(e) => setHasGuarantors(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span>Applicant has provided verified local guarantors (Zameen-dar)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loadingRisk}
            className="m3-btn-base m3-btn-filled w-full py-2.5 text-body-sm font-bold"
          >
            {loadingRisk ? 'Evaluating Applicant Credit Risk...' : 'Evaluate Applicant Credit Risk'}
          </button>
        </form>

        {riskResult && (
          <div className="p-4 rounded-2xl bg-surface-2 border border-border text-body-sm space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black font-mono-tabular text-text">
                  Score: {riskResult.score}/100
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-caption font-black uppercase ${
                    riskResult.tier === 'Low Risk'
                      ? 'bg-success/10 text-success border border-success/30'
                      : riskResult.tier === 'Moderate Risk'
                      ? 'bg-warning/10 text-warning border border-warning/30'
                      : 'bg-danger/10 text-danger border border-danger/30'
                  }`}
                >
                  {riskResult.tier}
                </span>
              </div>

              <span className="text-caption font-mono font-bold text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
                {riskResult.source === 'ai' ? '✨ Gemini AI' : '⚡ Offline Rule Engine'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-caption">
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <div className="text-text-muted font-bold">Recommended Advance</div>
                <div className="text-text font-black font-mono-tabular mt-0.5">
                  {riskResult.recommendedDownPaymentPercent}% (Rs.{' '}
                  {Math.round((itemPrice * riskResult.recommendedDownPaymentPercent) / 100).toLocaleString()})
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface border border-border">
                <div className="text-text-muted font-bold">Max Plan Duration</div>
                <div className="text-text font-black font-mono-tabular mt-0.5">
                  {riskResult.maxRecommendedMonths} Months
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-caption font-bold text-text-muted">Business Advice & Recommendations:</div>
              <ul className="text-text leading-relaxed text-caption list-disc pl-4 space-y-1">
                {riskResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 5. WhatsApp & SMS Recovery Message Generator */}
      <div className="m3-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--theme-surface-border)' }}>
          <div className="flex items-center gap-2 text-text">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-heading font-black text-body">
                Defaulter Recovery Message Generator
              </h3>
              <p className="text-caption text-text-muted font-medium">
                Generates culturally respectful Urdu, Roman Urdu, or English recovery reminders for overdue agreements.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerateReminder} className="space-y-3 text-body-sm">
          {/* Select Overdue Agreement */}
          {overdueAgreements.length > 0 && (
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">
                Select Overdue Agreement
              </label>
              <select
                value={selectedAgreementId}
                onChange={(e) => handleSelectAgreement(e.target.value)}
                className="m3-input text-body-sm"
              >
                <option value="">-- Choose Overdue Customer / Agreement --</option>
                {overdueAgreements.map(({ agr, cust, maxDaysLate, pendingOverdueAmount }) => (
                  <option key={agr.id} value={agr.id}>
                    {cust?.fullName || 'Customer'} - {agr.itemName} (Rs. {pendingOverdueAmount.toLocaleString()}, {maxDaysLate} days late)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Customer Full Name</label>
              <input
                type="text"
                required
                value={remCustomerName}
                onChange={(e) => setRemCustomerName(e.target.value)}
                placeholder="Customer name..."
                className="m3-input text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Purchased Item</label>
              <input
                type="text"
                required
                value={remItemName}
                onChange={(e) => setRemItemName(e.target.value)}
                placeholder="e.g. Honda CD 70, Haier Refrigerator"
                className="m3-input text-body-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Overdue (Rs.)</label>
              <input
                type="number"
                required
                min={1}
                value={remOverdueAmt}
                onChange={(e) => setRemOverdueAmt(Number(e.target.value))}
                className="m3-input font-mono-tabular text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Due Date</label>
              <input
                type="date"
                required
                value={remDueDate}
                onChange={(e) => setRemDueDate(e.target.value)}
                className="m3-input font-mono text-body-sm"
              />
            </div>
            <div>
              <label className="block text-caption font-bold text-text-muted mb-1">Days Overdue</label>
              <input
                type="number"
                required
                min={0}
                value={remDaysLate}
                onChange={(e) => setRemDaysLate(Number(e.target.value))}
                className="m3-input font-mono-tabular text-body-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-caption font-bold text-text-muted mb-1">Template Language</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Roman Urdu', 'Urdu', 'English'] as const).map((lang) => (
                <button
                  type="button"
                  key={lang}
                  onClick={() => setRemLang(lang)}
                  className={`py-2 px-3 rounded-xl border text-caption font-bold cursor-pointer transition-all ${
                    remLang === lang
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-2 text-text-muted border-border hover:text-text'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingRem}
            className="m3-btn-base m3-btn-filled w-full py-2.5 text-body-sm font-bold"
          >
            {loadingRem ? 'Generating Recovery Notice...' : 'Generate Respectful Recovery Reminder'}
          </button>
        </form>

        {reminderText && (
          <div className="p-4 rounded-2xl bg-surface-2 border border-border text-body-sm space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-caption font-bold text-text-muted uppercase">Ready Message Preview:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="m3-btn-base m3-btn-outlined py-1 px-3 text-caption font-bold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="m3-btn-base m3-btn-filled py-1 px-3 text-caption font-bold bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl bg-surface border border-border text-body-sm text-text whitespace-pre-wrap ${
                remLang === 'Urdu' ? 'text-right font-serif leading-loose' : 'font-sans leading-relaxed'
              }`}
            >
              {reminderText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
