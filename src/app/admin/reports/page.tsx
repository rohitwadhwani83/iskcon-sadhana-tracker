'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Printer,
  ChevronDown,
  Info,
  CheckCircle2,
  Users,
  Flame,
  Award,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  generateDailyTempleReport,
  generateWeeklyGroupReport,
  generateDevoteeConsistencyReport,
  generateRegistrationReport,
  DailyTempleReportData,
  WeeklyGroupReportData,
  DevoteeConsistencyRow,
  RegistrationReportData,
} from '../../../lib/services/reportService';
import { getGroups } from '../../../lib/services/sadhanaService';
import { Group } from '../../../lib/types';
import { formatIsoDate } from '../../../lib/utils/streak';
import { generateCsv } from '../../../lib/utils/sanitization';
import { METRIC_DEFINITIONS } from '../../../lib/constants';

type ReportTab = 'daily' | 'weekly' | 'consistency' | 'registration';

export default function TempleReportingPage() {
  const { isSuperAdmin, isGroupAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-09');

  useEffect(() => {
    setSelectedDate(formatIsoDate(new Date()));
  }, []);

  // Report Data States
  const [dailyReport, setDailyReport] = useState<DailyTempleReportData | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyGroupReportData | null>(null);
  const [consistencyRows, setConsistencyRows] = useState<DevoteeConsistencyRow[]>([]);
  const [regReport, setRegReport] = useState<RegistrationReportData | null>(null);

  const [loading, setLoading] = useState(true);
  const [showMetricDefinitions, setShowMetricDefinitions] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      const gList = await getGroups();
      setGroups(gList);
      if (gList.length > 0 && selectedGroupId === 'all') {
        // keep 'all' or set first group
      }
    }
    loadInitial();
  }, []);

  const fetchCurrentReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'daily') {
        const data = await generateDailyTempleReport(selectedDate);
        setDailyReport(data);
      } else if (activeTab === 'weekly') {
        const grp = selectedGroupId === 'all' && groups.length > 0 ? groups[0].id : selectedGroupId;
        if (grp && grp !== 'all') {
          const data = await generateWeeklyGroupReport(grp, selectedDate);
          setWeeklyReport(data);
        }
      } else if (activeTab === 'consistency') {
        const rows = await generateDevoteeConsistencyReport(selectedGroupId);
        setConsistencyRows(rows);
      } else if (activeTab === 'registration') {
        const reg = await generateRegistrationReport();
        setRegReport(reg);
      }
    } catch (e) {
      console.error('Failed to generate report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentReport();
  }, [activeTab, selectedDate, selectedGroupId]);

  // Export handlers with formula-injection defense
  const handleExportCsv = () => {
    let filename = `iskcon_report_${activeTab}_${selectedDate}.csv`;
    let csvContent = '';

    if (activeTab === 'daily' && dailyReport) {
      const headers = ['Group Name', 'Eligible Devotees', 'Submissions', 'Qualifying Count', 'Rounds Chanted'];
      const rows = dailyReport.groupBreakdown.map((b) => [
        b.groupName,
        b.eligibleCount,
        b.submittedCount,
        b.qualifyingCount,
        b.roundsChanted,
      ]);
      csvContent = generateCsv(headers, rows);
    } else if (activeTab === 'consistency') {
      const headers = [
        'Devotee Name',
        'Email',
        'Group',
        'Phone Status',
        'Consistency Streak',
        'Recording Streak',
        'Longest Streak',
        'Recorded (30d)',
        'Qualifying (30d)',
        'Missing Days (30d)',
      ];
      const rows = consistencyRows.map((r) => [
        r.fullName,
        r.email,
        r.groupName,
        r.phoneStatus,
        r.consistencyStreak,
        r.recordingStreak,
        r.longestStreak,
        r.totalRecordedDays30d,
        r.qualifyingDays30d,
        r.missingDays30d,
      ]);
      csvContent = generateCsv(headers, rows);
    } else if (activeTab === 'registration' && regReport) {
      const headers = ['Devotee Name', 'Email', 'Phone', 'Phone Verification', 'Group', 'Profile Complete', 'Created At'];
      const rows = regReport.devotees.map((d) => [
        d.fullName,
        d.email,
        d.phoneNumber,
        d.phoneStatus,
        d.groupName,
        d.profileComplete ? 'Yes' : 'No',
        d.createdAt ? d.createdAt.split('T')[0] : '',
      ]);
      csvContent = generateCsv(headers, rows);
    } else if (activeTab === 'weekly' && weeklyReport) {
      const headers = ['Date', 'Submissions', 'Qualifying Days', 'Rounds Chanted'];
      const rows = weeklyReport.dailyTrends.map((t) => [t.date, t.submissions, t.qualifying, t.rounds]);
      csvContent = generateCsv(headers, rows);
    }

    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#B45309]" /> Temple Reporting Pack
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Daily, weekly, and consistency reporting with protected CSV exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMetricDefinitions(!showMetricDefinitions)}
            className="px-3 py-1.5 rounded-lg border border-[#E7DBCA] bg-white hover:bg-[#FAF5EE] text-xs font-medium text-[#78350F] flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Metric Definitions</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-[#E7DBCA] bg-white hover:bg-[#FAF5EE] text-xs font-medium text-[#78350F] flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Definitions Accordion */}
      {showMetricDefinitions && (
        <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl p-5 space-y-3 text-xs text-[#57534E] no-print">
          <h3 className="font-serif font-bold text-sm text-[#78350F]">
            Temple Sādhana Metric Standards & Formula Safeguards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <strong className="text-[#78350F]">Daily Recording Participation:</strong> {METRIC_DEFINITIONS.recordingParticipation}
            </div>
            <div>
              <strong className="text-[#78350F]">Daily Qualifying Participation:</strong> {METRIC_DEFINITIONS.qualifyingParticipation}
            </div>
            <div>
              <strong className="text-[#78350F]">Active Devotee:</strong> {METRIC_DEFINITIONS.activeDevotee}
            </div>
            <div>
              <strong className="text-[#78350F]">Treatment of Missing Records:</strong> {METRIC_DEFINITIONS.missingRecordTreatment}
            </div>
          </div>
          <p className="text-[11px] text-[#A8A29E] pt-1">
            * Note: CSV exports are sanitized against spreadsheet formula injection (CWE-1236) by escaping leading formula operators.
          </p>
        </div>
      )}

      {/* Filter & Date Bar */}
      <div className="bg-white border border-[#E7DBCA] rounded-2xl p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between no-print">
        {/* Tabs */}
        <div className="flex rounded-xl bg-[#FAF5EE] p-1 border border-[#E7DBCA] text-xs">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'daily'
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'text-[#78350F] hover:bg-[#F3EADA]'
            }`}
          >
            Daily Temple Report
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'weekly'
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'text-[#78350F] hover:bg-[#F3EADA]'
            }`}
          >
            Weekly Group Report
          </button>
          <button
            onClick={() => setActiveTab('consistency')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'consistency'
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'text-[#78350F] hover:bg-[#F3EADA]'
            }`}
          >
            Devotee Consistency
          </button>
          <button
            onClick={() => setActiveTab('registration')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === 'registration'
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'text-[#78350F] hover:bg-[#F3EADA]'
            }`}
          >
            Registrations
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E7DBCA] bg-white text-[#292524]"
          />

          {(activeTab === 'consistency' || activeTab === 'weekly') && (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#E7DBCA] bg-white text-[#292524]"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DAILY TEMPLE REPORT */}
      {/* ============================================================== */}
      {activeTab === 'daily' && dailyReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Eligible Devotees</span>
              <span className="text-xl font-bold text-[#78350F]">{dailyReport.eligiblePopulation}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Submissions</span>
              <span className="text-xl font-bold text-[#78350F]">{dailyReport.recordSubmissions}</span>
              <span className="text-[10px] text-[#78716C] block">{dailyReport.submissionRatePercent}% submitted</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Qualifying Participation</span>
              <span className="text-xl font-bold text-emerald-700">{dailyReport.qualifyingParticipation}</span>
              <span className="text-[10px] text-emerald-800 block">{dailyReport.qualifyingRatePercent}% qualifying</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Total Rounds</span>
              <span className="text-xl font-bold text-[#78350F]">{dailyReport.totalRoundsChanted}</span>
              <span className="text-[10px] text-[#78716C] block">{dailyReport.avgRoundsPerSubmission} avg / submit</span>
            </div>
          </div>

          {/* Group Breakdown Table */}
          <div className="bg-white border border-[#E7DBCA] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF5EE] border-b border-[#E7DBCA] flex justify-between items-center">
              <h3 className="font-serif font-bold text-sm text-[#78350F]">
                Group Participation Breakdown for {selectedDate}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] text-[#78350F] font-semibold border-b border-[#E7DBCA]">
                  <tr>
                    <th className="p-3">Group Name</th>
                    <th className="p-3">Eligible Devotees</th>
                    <th className="p-3">Submissions</th>
                    <th className="p-3">Qualifying Days</th>
                    <th className="p-3">Total Rounds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EADA]">
                  {dailyReport.groupBreakdown.map((row) => (
                    <tr key={row.groupId} className="hover:bg-[#FAF5EE]">
                      <td className="p-3 font-semibold text-[#78350F]">{row.groupName}</td>
                      <td className="p-3 text-[#57534E]">{row.eligibleCount}</td>
                      <td className="p-3 font-bold text-[#292524]">{row.submittedCount}</td>
                      <td className="p-3 text-emerald-700 font-bold">{row.qualifyingCount}</td>
                      <td className="p-3 text-[#78350F] font-bold">{row.roundsChanted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: WEEKLY GROUP REPORT */}
      {/* ============================================================== */}
      {activeTab === 'weekly' && weeklyReport && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs">
            <h3 className="font-serif font-bold text-base text-[#78350F] mb-1">
              {weeklyReport.groupName} — 7-Day Performance
            </h3>
            <p className="text-xs text-[#78716C]">
              Period: {weeklyReport.startDate} to {weeklyReport.endDate} • {weeklyReport.eligiblePopulation} active members
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
                <span className="text-[10px] text-[#78716C] block">Active Devotees Submitted</span>
                <span className="text-lg font-bold text-[#78350F]">{weeklyReport.uniqueDevoteesSubmitted} / {weeklyReport.eligiblePopulation}</span>
              </div>
              <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
                <span className="text-[10px] text-[#78716C] block">Total Qualifying Records</span>
                <span className="text-lg font-bold text-emerald-700">{weeklyReport.totalQualifyingDays}</span>
              </div>
              <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
                <span className="text-[10px] text-[#78716C] block">Total Rounds Chanted</span>
                <span className="text-lg font-bold text-[#78350F]">{weeklyReport.totalRoundsChanted}</span>
              </div>
              <div className="p-3 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA]">
                <span className="text-[10px] text-[#78716C] block">Hearing & Reading</span>
                <span className="text-xs font-semibold text-[#78350F] mt-1 block">
                  👂 {weeklyReport.hearingSessions} | 📖 {weeklyReport.readingSessions}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div className="bg-white border border-[#E7DBCA] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] text-[#78350F] font-semibold border-b border-[#E7DBCA]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Submissions</th>
                    <th className="p-3">Qualifying</th>
                    <th className="p-3">Rounds</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EADA]">
                  {weeklyReport.dailyTrends.map((t) => (
                    <tr key={t.date} className="hover:bg-[#FAF5EE]">
                      <td className="p-3 font-semibold text-[#292524]">{t.date}</td>
                      <td className="p-3">{t.submissions}</td>
                      <td className="p-3 text-emerald-700 font-bold">{t.qualifying}</td>
                      <td className="p-3 font-bold text-[#78350F]">{t.rounds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: DEVOTEE CONSISTENCY REPORT */}
      {/* ============================================================== */}
      {activeTab === 'consistency' && (
        <div className="bg-white border border-[#E7DBCA] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF5EE] border-b border-[#E7DBCA]">
            <h3 className="font-serif font-bold text-sm text-[#78350F]">
              Devotee Consistency Roster (Confidential Admin View)
            </h3>
            <p className="text-[11px] text-[#78716C]">
              Distinguishes unrecorded missing days from submitted entries.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] text-[#78350F] font-semibold border-b border-[#E7DBCA]">
                <tr>
                  <th className="p-3">Devotee</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Consistency Streak</th>
                  <th className="p-3">Recording Streak</th>
                  <th className="p-3">Best Streak</th>
                  <th className="p-3">Last Recorded</th>
                  <th className="p-3">Past 30d (Qual / Rec)</th>
                  <th className="p-3">Missing 30d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EADA]">
                {consistencyRows.map((r) => (
                  <tr key={r.uid} className="hover:bg-[#FAF5EE]">
                    <td className="p-3 font-semibold text-[#78350F]">
                      {r.fullName}
                      <span className="block text-[10px] text-[#78716C] font-normal">{r.email}</span>
                    </td>
                    <td className="p-3 text-[#57534E]">{r.groupName}</td>
                    <td className="p-3 font-bold text-emerald-700">{r.consistencyStreak}d</td>
                    <td className="p-3 font-bold text-[#4338CA]">{r.recordingStreak}d</td>
                    <td className="p-3 text-[#78716C]">{r.longestStreak}d</td>
                    <td className="p-3 text-[#292524]">{r.lastRecordedDate || 'None'}</td>
                    <td className="p-3 text-[#57534E] font-medium">
                      {r.qualifyingDays30d} qual / {r.totalRecordedDays30d} rec
                    </td>
                    <td className="p-3 text-stone-500 font-semibold">{r.missingDays30d}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: REGISTRATION REPORT */}
      {/* ============================================================== */}
      {activeTab === 'registration' && regReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Total Registered</span>
              <span className="text-xl font-bold text-[#78350F]">{regReport.totalRegistered}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Verified Phone by Admin</span>
              <span className="text-xl font-bold text-emerald-700">{regReport.phoneStatusCounts.verified_by_admin}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Pending Phone Review</span>
              <span className="text-xl font-bold text-amber-700">{regReport.phoneStatusCounts.pending_manual_review + regReport.phoneStatusCounts.unverified}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#E7DBCA]">
              <span className="text-[11px] text-[#78716C] block">Profiles Completed</span>
              <span className="text-xl font-bold text-[#78350F]">{regReport.profileCompletedCount}</span>
            </div>
          </div>

          <div className="bg-white border border-[#E7DBCA] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5EE] text-[#78350F] font-semibold border-b border-[#E7DBCA]">
                  <tr>
                    <th className="p-3">Devotee</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Phone Status</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Profile Complete</th>
                    <th className="p-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EADA]">
                  {regReport.devotees.map((d) => (
                    <tr key={d.uid} className="hover:bg-[#FAF5EE]">
                      <td className="p-3 font-bold text-[#78350F]">{d.fullName}</td>
                      <td className="p-3 text-[#292524]">{d.email}</td>
                      <td className="p-3 font-mono text-[11px]">{d.phoneNumber}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#FAF5EE] border border-[#E7DBCA]">
                          {d.phoneStatus}
                        </span>
                      </td>
                      <td className="p-3 text-[#57534E]">{d.groupName}</td>
                      <td className="p-3">{d.profileComplete ? '✓ Yes' : 'No'}</td>
                      <td className="p-3 text-[#78716C]">{d.createdAt ? d.createdAt.split('T')[0] : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
