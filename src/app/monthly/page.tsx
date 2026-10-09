'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Flame,
  BookOpen,
  Headphones,
  Printer,
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Save,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getDevoteeSadhanaHistory,
  getMonthlyGoals,
  saveMonthlyGoal,
} from '../../lib/services/sadhanaService';
import { DailySadhana, MonthlyGoal, MonthlyReportSummary } from '../../lib/types';
import {
  calculateMonthlySummary,
  evaluateGoalProgress,
  getPreviousMonth,
} from '../../lib/utils/metrics';
import { DEFAULT_STREAK_RULE, MONTHLY_REFLECTION_PROMPTS } from '../../lib/constants';

export default function MonthlyProgressPage() {
  const { user, profile } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [history, setHistory] = useState<DailySadhana[]>([]);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);

  useEffect(() => {
    const now = new Date();
    const currentMonthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonthStr);
  }, []);

  // Reflection responses (stored locally for privacy)
  const [reflection1, setReflection1] = useState('');
  const [reflection2, setReflection2] = useState('');
  const [reflection3, setReflection3] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Goal edits
  const [targetRounds, setTargetRounds] = useState(16);
  const [targetQualifyingDays, setTargetQualifyingDays] = useState(25);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      setLoading(true);
      try {
        const [hist, gList] = await Promise.all([
          getDevoteeSadhanaHistory(user.uid),
          getMonthlyGoals(user.uid, selectedMonth),
        ]);
        setHistory(hist);
        setGoals(gList);

        const rGoal = gList.find((g) => g.goalType === 'rounds_daily');
        if (rGoal) setTargetRounds(rGoal.targetValue);

        const qGoal = gList.find((g) => g.goalType === 'qualifying_days_month');
        if (qGoal) setTargetQualifyingDays(qGoal.targetValue);

        // Load saved reflection if any
        if (typeof window !== 'undefined') {
          const key = `iskcon_reflection_${user.uid}_${selectedMonth}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            setReflection1(parsed.r1 || '');
            setReflection2(parsed.r2 || '');
            setReflection3(parsed.r3 || '');
          } else {
            setReflection1('');
            setReflection2('');
            setReflection3('');
          }
        }
      } catch (e) {
        console.error('Failed to load monthly data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid, selectedMonth]);

  // Compute current month and previous month summaries
  const prevMonthStr = getPreviousMonth(selectedMonth);
  const summary: MonthlyReportSummary = calculateMonthlySummary(history, selectedMonth, DEFAULT_STREAK_RULE);
  const prevSummary: MonthlyReportSummary = calculateMonthlySummary(history, prevMonthStr, DEFAULT_STREAK_RULE);

  const diffRounds = summary.totalRounds - prevSummary.totalRounds;
  const diffQualifying = summary.qualifyingDays - prevSummary.qualifyingDays;

  // Handle saving goals
  const handleSaveGoals = async () => {
    if (!user?.uid) return;
    try {
      await Promise.all([
        saveMonthlyGoal({
          uid: user.uid,
          goalType: 'rounds_daily',
          targetValue: targetRounds,
          effectiveMonth: selectedMonth,
        }),
        saveMonthlyGoal({
          uid: user.uid,
          goalType: 'qualifying_days_month',
          targetValue: targetQualifyingDays,
          effectiveMonth: selectedMonth,
        }),
      ]);
      alert('Monthly goals updated successfully!');
    } catch (e) {
      console.error('Failed to save goals:', e);
    }
  };

  // Handle saving private monthly reflection
  const handleSaveReflection = () => {
    if (!user?.uid || typeof window === 'undefined') return;
    const key = `iskcon_reflection_${user.uid}_${selectedMonth}`;
    localStorage.setItem(
      key,
      JSON.stringify({ r1: reflection1, r2: reflection2, r3: reflection3 })
    );
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 2000);
  };

  // Printable report trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#B45309]" /> Monthly Spiritual Progress
          </h1>
          <p className="text-xs text-[#78716C]">
            Review your consistency, spiritual hearing, reading, and personal goals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[#E7DBCA] bg-white text-xs font-semibold text-[#78350F] focus:ring-2 focus:ring-[#B45309]"
          />

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E7DBCA] hover:bg-[#F3EADA] text-xs font-semibold text-[#78350F] flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF Export</span>
          </button>
        </div>
      </div>

      {/* Print-only Banner */}
      <div className="hidden print:block text-center pb-4 border-b border-[#E7DBCA]">
        <h2 className="font-serif font-bold text-xl text-[#78350F]">ISKCON Sādhana Tracker</h2>
        <p className="text-xs text-[#78716C]">
          Devotee: {profile?.fullName || 'Devotee'} • Month: {selectedMonth}
        </p>
      </div>

      {/* Key KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Total Rounds</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#78350F]">{summary.totalRounds}</span>
            {diffRounds !== 0 && (
              <span className={`text-[10px] font-semibold flex items-center ${diffRounds > 0 ? 'text-emerald-700' : 'text-stone-500'}`}>
                {diffRounds > 0 ? `+${diffRounds}` : diffRounds} vs last mo
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Avg Rounds / Day</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#78350F]">{summary.averageRoundsPerRecordedDay}</span>
            <span className="text-[10px] text-[#78716C] block">rounds on recorded days</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Qualifying Days</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700">{summary.qualifyingDays}</span>
            {diffQualifying !== 0 && (
              <span className={`text-[10px] font-semibold flex items-center ${diffQualifying > 0 ? 'text-emerald-700' : 'text-stone-500'}`}>
                {diffQualifying > 0 ? `+${diffQualifying}` : diffQualifying}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#78716C] block">
            {summary.consistencyPercentage}% consistency rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Hearing & Reading</span>
          <div className="mt-1 space-y-0.5 text-xs text-[#78350F] font-semibold">
            <div>👂 {summary.hearingDays} days ({summary.totalHearingMinutes}m)</div>
            <div>📖 {summary.readingDays} days ({summary.totalReadingMinutes}m)</div>
          </div>
        </div>
      </div>

      {/* Personal Goals Evaluation */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#B45309]" /> Personal Spiritual Goals
          </h3>
          <span className="text-[11px] text-[#78716C] bg-[#FAF5EE] px-2.5 py-0.5 rounded-full border border-[#E7DBCA]">
            Self-Set & Confidential
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target 1: Daily Rounds */}
          <div className="p-3.5 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#78350F]">Daily Rounds Target</span>
              <span className="text-[#78716C]">{summary.averageRoundsPerRecordedDay} / {targetRounds} avg rds</span>
            </div>
            <div className="w-full bg-[#E7DBCA] rounded-full h-2">
              <div
                className="bg-[#B45309] h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((summary.averageRoundsPerRecordedDay / targetRounds) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-2 pt-1 no-print">
              <label className="text-[11px] text-[#78716C]">Edit Target:</label>
              <input
                type="number"
                min="1"
                max="192"
                value={targetRounds}
                onChange={(e) => setTargetRounds(Number(e.target.value))}
                className="w-16 px-2 py-0.5 bg-white border border-[#E7DBCA] text-xs rounded-md"
              />
            </div>
          </div>

          {/* Target 2: Qualifying Days per Month */}
          <div className="p-3.5 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#78350F]">Monthly Qualifying Days</span>
              <span className="text-[#78716C]">{summary.qualifyingDays} / {targetQualifyingDays} days</span>
            </div>
            <div className="w-full bg-[#E7DBCA] rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((summary.qualifyingDays / targetQualifyingDays) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-2 pt-1 no-print">
              <label className="text-[11px] text-[#78716C]">Edit Target:</label>
              <input
                type="number"
                min="1"
                max="31"
                value={targetQualifyingDays}
                onChange={(e) => setTargetQualifyingDays(Number(e.target.value))}
                className="w-16 px-2 py-0.5 bg-white border border-[#E7DBCA] text-xs rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="text-right no-print">
          <button
            onClick={handleSaveGoals}
            className="px-3.5 py-1.5 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Save Goal Targets
          </button>
        </div>
      </div>

      {/* Private Monthly Reflection Section */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#B45309]" /> Private Monthly Reflection
          </h3>
          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 font-medium">
            <Lock className="w-3 h-3" /> 100% Private (Never Shared in Reports)
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#78350F] mb-1">
              1. {MONTHLY_REFLECTION_PROMPTS[0]}
            </label>
            <textarea
              rows={2}
              value={reflection1}
              onChange={(e) => setReflection1(e.target.value)}
              placeholder="Reflect on schedule, association, or devotional practices that assisted you..."
              className="w-full p-2.5 bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78350F] mb-1">
              2. {MONTHLY_REFLECTION_PROMPTS[1]}
            </label>
            <textarea
              rows={2}
              value={reflection2}
              onChange={(e) => setReflection2(e.target.value)}
              placeholder="Key insights, shlokas, or realizations from hearing classes..."
              className="w-full p-2.5 bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78350F] mb-1">
              3. {MONTHLY_REFLECTION_PROMPTS[2]}
            </label>
            <textarea
              rows={2}
              value={reflection3}
              onChange={(e) => setReflection3(e.target.value)}
              placeholder="Devotional intentions and focus for next month..."
              className="w-full p-2.5 bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 no-print">
          {reflectionSaved && (
            <span className="text-xs text-emerald-700 font-semibold">
              ✓ Reflections safely saved to your private device storage!
            </span>
          )}
          <button
            onClick={handleSaveReflection}
            className="ml-auto px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Private Reflections</span>
          </button>
        </div>
      </div>
    </div>
  );
}
