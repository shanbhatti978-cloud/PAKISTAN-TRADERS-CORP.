import React, { useState } from 'react';
import {
  Sparkles,
  Menu,
  MoreHorizontal,
  Send,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react';
import { assessCustomerRisk, generateRecoveryMessage, RiskAssessmentResult } from '../utils/geminiAi';
import { ShopSettings } from '../types';
import { useAppActions } from '../context/AppActionsContext';

interface AiAssistantViewProps {
  settings: ShopSettings;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ settings }) => {
  const { runAction } = useAppActions();
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedChip, setSelectedChip] = useState('Sales report');
  const [showExtendedTools, setShowExtendedTools] = useState(false);

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

  // Reminder State
  const [remCustomerName, setRemCustomerName] = useState('Kamran Hassan Raza');
  const [remItemName, setRemItemName] = useState('Haier 1.5 Ton AC');
  const [remOverdueAmt, setRemOverdueAmt] = useState<number>(27166);
  const [remDueDate, setRemDueDate] = useState('2026-09-10');
  const [remDaysLate, setRemDaysLate] = useState<number>(18);
  const [remLang, setRemLang] = useState<'Roman Urdu' | 'Urdu' | 'English'>('Roman Urdu');
  const [loadingRem, setLoadingRem] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [copied, setCopied] = useState(false);

  const chips = [
    'Sales report',
    'Top sales',
    'Low-performing products',
    'Restock alert',
  ];

  // Heatmap 7x5 sample grid in 5 lavender shades
  const heatmapColors = [
    'bg-white dark:bg-slate-800',
    'bg-[#E9E5F9] dark:bg-[#25204A]',
    'bg-[#D4CEF5] dark:bg-[#3D3478]',
    'bg-[#BDB4F2] dark:bg-[#5B4BC4]',
    'bg-[#5B4BC4] text-white',
  ];

  const heatmapMatrix = [
    [0, 1, 2, 3, 2, 4, 3],
    [1, 3, 4, 2, 1, 3, 4],
    [2, 0, 1, 4, 3, 2, 1],
    [3, 4, 2, 1, 4, 3, 0],
    [1, 2, 3, 4, 2, 1, 3],
  ];

  const handleChipClick = (chip: string) => {
    setSelectedChip(chip);
    if (chip === 'Sales report') {
      runAction('business_report');
    } else {
      setAiPrompt(`Generate analysis for ${chip}`);
    }
  };

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

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-20 select-none">
      
      {/* 1. Screen B Top Bar: Hamburger circle, Centered Title, Three-dots circle */}
      <div className="flex items-center justify-between pt-2 px-1">
        <button
          onClick={() => runAction('business_report')}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Menu className="w-4 h-4 stroke-[2.2]" />
        </button>

        <h2 className="text-sm font-normal text-[#1A1A22] dark:text-white font-heading tracking-wide">
          Report sales
        </h2>

        <button
          onClick={() => setShowExtendedTools(!showExtendedTools)}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-[#1A1A22] dark:text-white shadow-xs border border-black/5 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* 2. Glass Card: "Can I help you?" + Pill Chips + "Ask something to AI" */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-[11px] font-semibold text-[#6B6B7B]">
            {settings.proprietorName || 'Brooklyn Simmons'}
          </div>
          <h1 className="text-xl sm:text-2xl font-light text-[#1A1A22] dark:text-white font-heading mt-0.5">
            Can I help you?
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-[#5B4BC4] dark:text-[#BDB4F2] border-[#BDB4F2] shadow-xs'
                    : 'bg-white/50 dark:bg-slate-800/50 text-[#6B6B7B] border-black/5 hover:text-[#1A1A22]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Pill Input: "Ask something to AI" with Sparkle Icon */}
        <div className="relative pt-1">
          <input
            type="text"
            placeholder="Ask something to AI"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full pl-4 pr-11 py-3 rounded-full bg-white dark:bg-slate-800 border border-black/5 dark:border-white/10 text-xs text-[#1A1A22] dark:text-white placeholder:text-[#6B6B7B] shadow-xs outline-none focus:ring-2 focus:ring-[#BDB4F2]"
          />
          <button
            onClick={() => {
              if (aiPrompt) runAction('business_report');
            }}
            className="w-8 h-8 rounded-full bg-[#BDB4F2] text-[#1A1A22] absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 3. Glass Card: "Recent Customer / Order time tracking" with Heatmap */}
      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-[#6B6B7B] uppercase tracking-wider">
              Recent Customer
            </div>
            <h3 className="text-sm font-normal text-[#1A1A22] dark:text-white font-heading">
              Order time tracking
            </h3>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-3xl font-light font-mono-tabular text-[#1A1A22] dark:text-white">
                +720
              </span>
              <span className="bg-[#BDF2C6] text-[#14532D] text-[10px] font-extrabold px-1.5 py-0.5 rounded-full font-mono">
                +2.5%
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#6B6B7B] text-right pt-2 font-medium">
            Grow since last month
          </div>
        </div>

        {/* Heatmap Grid of rounded squares in 5 shades of lavender */}
        <div className="pt-2">
          <div className="grid grid-cols-7 gap-2">
            {heatmapMatrix.flatMap((row, rIdx) =>
              row.map((level, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`h-8 rounded-xl ${heatmapColors[level]} border border-black/5 dark:border-white/5 transition-transform hover:scale-110 shadow-2xs`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Extended AI Tools (Defaulter & Risk Analytics) */}
      {showExtendedTools && (
        <div className="glass-card p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <h3 className="font-heading font-extrabold text-xs text-[#1A1A22] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5B4BC4]" />
              <span>Customer Credit Risk Intelligence</span>
            </h3>
          </div>

          <form onSubmit={handleRunRiskAssessment} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#6B6B7B] mb-1">Customer Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/5 text-xs text-[#1A1A22] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#6B6B7B] mb-1">Monthly Income (Rs.)</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6B6B7B] mb-1">Item Cash Price (Rs.)</label>
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/5 text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingRisk}
              className="w-full py-2.5 rounded-full bg-[#5B4BC4] text-white text-xs font-bold shadow-xs hover:bg-[#4E3FB0] active:scale-98 transition-all"
            >
              {loadingRisk ? 'Calculating Score...' : 'Run Defaulter Risk Evaluation'}
            </button>
          </form>

          {riskResult && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-black/5 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span>Recommendation ({riskResult.score}/100):</span>
                <span className="px-2 py-0.5 rounded-full bg-[#BDF2C6] text-[#14532D] uppercase text-[10px]">
                  {riskResult.tier}
                </span>
              </div>
              <ul className="text-[#6B6B7B] leading-relaxed text-[11px] list-disc pl-4 space-y-1">
                {riskResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
