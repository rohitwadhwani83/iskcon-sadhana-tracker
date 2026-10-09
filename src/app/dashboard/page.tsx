'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  Flame,
  BookOpen,
  BarChart3,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  Headphones,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getDevoteeSadhanaHistory,
  getDailySadhanaRecord,
  getGroups,
} from '../../lib/services/sadhanaService';
import { DailySadhana, Group, StreakState } from '../../lib/types';
import { calculateStreaks, formatIsoDate, isDayQualifying } from '../../lib/utils/streak';
import { DEFAULT_STREAK_RULE } from '../../lib/constants';
import { StreakCard } from '../../components/devotee/StreakCard';
import { RecordTodayModal } from '../../components/devotee/RecordTodayModal';
import { InAppReminderBanner } from '../../components/reminders/InAppReminderBanner';

export default function DevoteeDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();

  const [history, setHistory] = useState<DailySadhana[]>([]);
  const [todayRecord, setTodayRecord] = useState<DailySadhana | null>(null);
  const [groupName, setGroupName] = useState<string>('General Devotees');
  const [streaks, setStreaks] = useState<StreakState>({
    currentRecordingStreak: 0,
    currentConsistencyStreak: 0,
    longestStreak: 0,
    activityStreaks: { rounds: 0, hearing: 0, reading: 0 },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordKey, setRecordKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const [todayStr, setTodayStr] = useState('2026-10-09');
  const [sevenDaysAgoStr, setSevenDaysAgoStr] = useState('2026-10-02');
  const [thirtyDaysAgoStr, setThirtyDaysAgoStr] = useState('2026-09-09');

  useEffect(() => {
    const now = new Date();
    const tStr = formatIsoDate(now);
    const sAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
    const thAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
    setTodayStr(tStr);
    setSevenDaysAgoStr(formatIsoDate(sAgo));
    setThirtyDaysAgoStr(formatIsoDate(thAgo));
  }, []);

  const loadData = async (curTodayStr: string) => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [hist, todayRec, groups] = await Promise.all([
        getDevoteeSadhanaHistory(user.uid),
        getDailySadhanaRecord(user.uid, curTodayStr),
        getGroups(),
      ]);

      setHistory(hist);
      setTodayRecord(todayRec);

      const calculated = calculateStreaks(hist, DEFAULT_STREAK_RULE, curTodayStr);
      setStreaks(calculated);

      if (profile?.groupId) {
        const found = groups.find((g) => g.id === profile.groupId);
        if (found) setGroupName(found.name);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadData(todayStr);
    }
  }, [user?.uid, profile?.groupId, recordKey, todayStr]);

  const records7d = history.filter((r) => r.localDate >= sevenDaysAgoStr);
  const records30d = history.filter((r) => r.localDate >= thirtyDaysAgoStr);

  const qualifying7d = records7d.filter((r) => isDayQualifying(r, DEFAULT_STREAK_RULE)).length;
  const totalRounds7d = records7d.reduce((sum, r) => sum + (r.roundsChanted || 0), 0);

  const qualifying30d = records30d.filter((r) => isDayQualifying(r, DEFAULT_STREAK_RULE)).length;
  const totalRounds30d = records30d.reduce((sum, r) => sum + (r.roundsChanted || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {profile && profile.approved === false && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center gap-3 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-700 shrink-0" />
          <div className="text-xs">
            <strong className="block font-semibold">Account Pending Group Admin Approval</strong>
            Your devotee registration has been received. Your Group Sevak (Admin) will approve your account.
          </div>
        </div>
      )}

      {/* Top Welcome & Record Hero Card */}
      <div className="bg-white border border-[#E7DBCA] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#B45309] bg-[#FAF5EE] px-2.5 py-0.5 rounded-full border border-[#E7DBCA]">
                {groupName}
              </span>
              <span className="text-xs text-[#78716C]">• {todayStr}</span>
            </div>
            <h1 className="font-serif font-bold text-2xl text-[#78350F]">
              Hare Krishna, {profile?.fullName || 'Devotee'}
            </h1>
            <p className="text-xs text-[#57534E]">
              &ldquo;One should chant the holy name of the Lord in a humble state of mind.&rdquo;
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {todayRecord ? (
              <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Recorded Today: {todayRecord.roundsChanted} rounds
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    {todayRecord.isQualifying ? 'Qualifying Sādhana Day' : 'Saved to history'}
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="ml-2 text-xs font-semibold text-emerald-800 hover:underline"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-3 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Record Today&apos;s Sādhana</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhancement 1: In-App Reminder Banner */}
      <InAppReminderBanner
        onOpenRecordModal={() => setIsModalOpen(true)}
        recordUpdatedKey={recordKey}
      />

      {/* Streaks Card */}
      <StreakCard streaks={streaks} />

      {/* 7-Day & 30-Day Summaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 7-Day Summary */}
        <div className="bg-white border border-[#E7DBCA] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-base text-[#78350F]">
              Past 7 Days
            </h3>
            <span className="text-xs text-[#78716C]">
              {records7d.length} / 7 recorded
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Total Rounds</span>
              <span className="text-xl font-bold text-[#78350F]">{totalRounds7d}</span>
            </div>
            <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Qualifying Days</span>
              <span className="text-xl font-bold text-emerald-700">{qualifying7d} / 7</span>
            </div>
          </div>
        </div>

        {/* 30-Day Summary */}
        <div className="bg-white border border-[#E7DBCA] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-base text-[#78350F]">
              Past 30 Days
            </h3>
            <span className="text-xs text-[#78716C]">
              {records30d.length} / 30 recorded
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Total Rounds</span>
              <span className="text-xl font-bold text-[#78350F]">{totalRounds30d}</span>
            </div>
            <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Qualifying Days</span>
              <span className="text-xl font-bold text-emerald-700">{qualifying30d} / 30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Shortcuts to Enhancements */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Link
          href="/calendar"
          className="p-4 bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-xl flex items-center justify-between group transition-colors shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FAF5EE] text-[#B45309] group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#78350F]">Calendar View</h4>
              <p className="text-[10px] text-[#78716C]">History & logs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/monthly"
          className="p-4 bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-xl flex items-center justify-between group transition-colors shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FAF5EE] text-[#B45309] group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#78350F]">Monthly Progress</h4>
              <p className="text-[10px] text-[#78716C]">Goals & PDF export</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/journal"
          className="p-4 bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-xl flex items-center justify-between group transition-colors shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FAF5EE] text-[#B45309] group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#78350F]">Private Journal</h4>
              <p className="text-[10px] text-[#78716C]">100% private notes</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/reminders"
          className="p-4 bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-xl flex items-center justify-between group transition-colors shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FAF5EE] text-[#B45309] group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#78350F]">Reminders</h4>
              <p className="text-[10px] text-[#78716C]">Schedule & quiet hours</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#78716C] group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Record Today Modal */}
      <RecordTodayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecordSaved={() => setRecordKey((prev) => prev + 1)}
      />
    </div>
  );
}
