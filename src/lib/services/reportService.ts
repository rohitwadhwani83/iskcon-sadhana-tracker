import {
  getAllProfiles,
  getGroups,
  getDevoteeSadhanaHistory,
} from './sadhanaService';
import { DevoteeProfile, DailySadhana, Group } from '../types';
import { DEFAULT_STREAK_RULE } from '../constants';
import { isDayQualifying, calculateStreaks, getPreviousDay, parseIsoDate, formatIsoDate } from '../utils/streak';

export interface DailyTempleReportData {
  date: string;
  eligiblePopulation: number;
  recordSubmissions: number;
  qualifyingParticipation: number;
  submissionRatePercent: number;
  qualifyingRatePercent: number;
  totalRoundsChanted: number;
  avgRoundsPerSubmission: number;
  hearingCount: number;
  readingCount: number;
  otherActivitiesCount: number;
  groupBreakdown: {
    groupId: string;
    groupName: string;
    eligibleCount: number;
    submittedCount: number;
    qualifyingCount: number;
    roundsChanted: number;
  }[];
}

export interface WeeklyGroupReportData {
  groupId: string;
  groupName: string;
  startDate: string;
  endDate: string;
  eligiblePopulation: number;
  uniqueDevoteesSubmitted: number;
  totalSubmissions: number;
  totalQualifyingDays: number;
  totalRoundsChanted: number;
  hearingSessions: number;
  readingSessions: number;
  dailyTrends: {
    date: string;
    submissions: number;
    qualifying: number;
    rounds: number;
  }[];
}

export interface DevoteeConsistencyRow {
  uid: string;
  fullName: string;
  email: string;
  phoneStatus: string;
  groupName: string;
  recordingStreak: number;
  consistencyStreak: number;
  longestStreak: number;
  lastRecordedDate: string | null;
  totalRecordedDays30d: number;
  qualifyingDays30d: number;
  missingDays30d: number;
}

export interface RegistrationReportData {
  totalRegistered: number;
  emailVerifiedCount: number;
  phoneStatusCounts: {
    unverified: number;
    pending_manual_review: number;
    verified_by_admin: number;
    rejected_correction_needed: number;
  };
  profileCompletedCount: number;
  activeAccountsCount: number;
  devotees: {
    uid: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    phoneStatus: string;
    groupName: string;
    profileComplete: boolean;
    accountStatus: string;
    createdAt: string;
  }[];
}

export async function generateDailyTempleReport(dateStr: string): Promise<DailyTempleReportData> {
  const [profiles, groups] = await Promise.all([getAllProfiles(), getGroups()]);
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  // Active eligible devotees
  const activeProfiles = profiles.filter(
    (p) => p.accountStatus === 'active'
  );

  let recordSubmissions = 0;
  let qualifyingParticipation = 0;
  let totalRoundsChanted = 0;
  let hearingCount = 0;
  let readingCount = 0;
  let otherActivitiesCount = 0;

  const groupStats = new Map<string, { submitted: number; qualifying: number; rounds: number; eligible: number }>();

  for (const p of activeProfiles) {
    const cur = groupStats.get(p.groupId) || { submitted: 0, qualifying: 0, rounds: 0, eligible: 0 };
    cur.eligible++;
    groupStats.set(p.groupId, cur);
  }

  // Load records for the specific date
  for (const p of activeProfiles) {
    const history = await getDevoteeSadhanaHistory(p.uid, dateStr, dateStr);
    const rec = history.find((r) => r.localDate === dateStr);
    if (rec) {
      recordSubmissions++;
      totalRoundsChanted += rec.roundsChanted || 0;
      if (isDayQualifying(rec, DEFAULT_STREAK_RULE)) {
        qualifyingParticipation++;
      }
      if (rec.hearingCompleted) hearingCount++;
      if (rec.readingCompleted) readingCount++;
      if (rec.otherActivities) {
        otherActivitiesCount += rec.otherActivities.filter((a) => a.completed).length;
      }

      const cur = groupStats.get(p.groupId);
      if (cur) {
        cur.submitted++;
        if (isDayQualifying(rec, DEFAULT_STREAK_RULE)) cur.qualifying++;
        cur.rounds += rec.roundsChanted || 0;
      }
    }
  }

  const eligiblePopulation = activeProfiles.length;
  const submissionRatePercent =
    eligiblePopulation > 0 ? Math.round((recordSubmissions / eligiblePopulation) * 100) : 0;
  const qualifyingRatePercent =
    eligiblePopulation > 0 ? Math.round((qualifyingParticipation / eligiblePopulation) * 100) : 0;
  const avgRoundsPerSubmission =
    recordSubmissions > 0 ? Number((totalRoundsChanted / recordSubmissions).toFixed(1)) : 0;

  const groupBreakdown = groups.map((g) => {
    const stats = groupStats.get(g.id) || { submitted: 0, qualifying: 0, rounds: 0, eligible: 0 };
    return {
      groupId: g.id,
      groupName: g.name,
      eligibleCount: stats.eligible,
      submittedCount: stats.submitted,
      qualifyingCount: stats.qualifying,
      roundsChanted: stats.rounds,
    };
  });

  return {
    date: dateStr,
    eligiblePopulation,
    recordSubmissions,
    qualifyingParticipation,
    submissionRatePercent,
    qualifyingRatePercent,
    totalRoundsChanted,
    avgRoundsPerSubmission,
    hearingCount,
    readingCount,
    otherActivitiesCount,
    groupBreakdown,
  };
}

export async function generateWeeklyGroupReport(
  groupId: string,
  startDateStr: string
): Promise<WeeklyGroupReportData> {
  const [profiles, groups] = await Promise.all([getAllProfiles(), getGroups()]);
  const group = groups.find((g) => g.id === groupId);
  const groupName = group ? group.name : 'Unknown Group';

  // Compute 7 days
  const dates: string[] = [];
  let d = parseIsoDate(startDateStr);
  for (let i = 0; i < 7; i++) {
    dates.push(formatIsoDate(d));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const endDateStr = dates[6];

  const groupDevotees = profiles.filter(
    (p) => p.groupId === groupId && p.accountStatus === 'active'
  );

  const uniqueDevoteeIds = new Set<string>();
  let totalSubmissions = 0;
  let totalQualifyingDays = 0;
  let totalRoundsChanted = 0;
  let hearingSessions = 0;
  let readingSessions = 0;

  const dailyTrendMap = new Map<string, { submissions: number; qualifying: number; rounds: number }>();
  for (const dt of dates) {
    dailyTrendMap.set(dt, { submissions: 0, qualifying: 0, rounds: 0 });
  }

  for (const dev of groupDevotees) {
    const history = await getDevoteeSadhanaHistory(dev.uid, startDateStr, endDateStr);
    for (const r of history) {
      if (dates.includes(r.localDate)) {
        uniqueDevoteeIds.add(dev.uid);
        totalSubmissions++;
        totalRoundsChanted += r.roundsChanted || 0;
        const qualifies = isDayQualifying(r, DEFAULT_STREAK_RULE);
        if (qualifies) totalQualifyingDays++;
        if (r.hearingCompleted) hearingSessions++;
        if (r.readingCompleted) readingSessions++;

        const trend = dailyTrendMap.get(r.localDate);
        if (trend) {
          trend.submissions++;
          if (qualifies) trend.qualifying++;
          trend.rounds += r.roundsChanted || 0;
        }
      }
    }
  }

  const dailyTrends = dates.map((dt) => ({
    date: dt,
    submissions: dailyTrendMap.get(dt)?.submissions || 0,
    qualifying: dailyTrendMap.get(dt)?.qualifying || 0,
    rounds: dailyTrendMap.get(dt)?.rounds || 0,
  }));

  return {
    groupId,
    groupName,
    startDate: startDateStr,
    endDate: endDateStr,
    eligiblePopulation: groupDevotees.length,
    uniqueDevoteesSubmitted: uniqueDevoteeIds.size,
    totalSubmissions,
    totalQualifyingDays,
    totalRoundsChanted,
    hearingSessions,
    readingSessions,
    dailyTrends,
  };
}

export async function generateDevoteeConsistencyReport(
  groupIdFilter?: string
): Promise<DevoteeConsistencyRow[]> {
  const [profiles, groups] = await Promise.all([getAllProfiles(), getGroups()]);
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const filteredProfiles = profiles.filter((p) => {
    if (p.accountStatus !== 'active') return false;
    if (groupIdFilter && groupIdFilter !== 'all' && p.groupId !== groupIdFilter) return false;
    return true;
  });

  const today = formatIsoDate(new Date());
  // 30 days back
  const thirtyDaysBackDate = parseIsoDate(today);
  thirtyDaysBackDate.setUTCDate(thirtyDaysBackDate.getUTCDate() - 30);
  const thirtyDaysBackStr = formatIsoDate(thirtyDaysBackDate);

  const rows: DevoteeConsistencyRow[] = [];

  for (const dev of filteredProfiles) {
    const history = await getDevoteeSadhanaHistory(dev.uid);
    const streaks = calculateStreaks(history, DEFAULT_STREAK_RULE, today);

    const historyLast30 = history.filter((r) => r.localDate >= thirtyDaysBackStr && r.localDate <= today);
    const recordedCount30 = historyLast30.length;
    const qualifyingCount30 = historyLast30.filter((r) => isDayQualifying(r, DEFAULT_STREAK_RULE)).length;
    const missingDays30 = Math.max(0, 30 - recordedCount30);

    const lastRecordedDate = history.length > 0 ? history[0].localDate : null;

    rows.push({
      uid: dev.uid,
      fullName: dev.fullName,
      email: dev.email,
      phoneStatus: dev.phoneVerificationStatus,
      groupName: groupMap.get(dev.groupId) || 'Unassigned',
      recordingStreak: streaks.currentRecordingStreak,
      consistencyStreak: streaks.currentConsistencyStreak,
      longestStreak: streaks.longestStreak,
      lastRecordedDate,
      totalRecordedDays30d: recordedCount30,
      qualifyingDays30d: qualifyingCount30,
      missingDays30d: missingDays30,
    });
  }

  return rows.sort((a, b) => b.consistencyStreak - a.consistencyStreak);
}

export async function generateRegistrationReport(): Promise<RegistrationReportData> {
  const [profiles, groups] = await Promise.all([getAllProfiles(), getGroups()]);
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const phoneStatusCounts = {
    unverified: 0,
    pending_manual_review: 0,
    verified_by_admin: 0,
    rejected_correction_needed: 0,
  };

  let profileCompletedCount = 0;
  let activeAccountsCount = 0;

  for (const p of profiles) {
    if (phoneStatusCounts[p.phoneVerificationStatus] !== undefined) {
      phoneStatusCounts[p.phoneVerificationStatus]++;
    }
    if (p.profileComplete) profileCompletedCount++;
    if (p.accountStatus === 'active') activeAccountsCount++;
  }

  const devotees = profiles.map((p) => ({
    uid: p.uid,
    fullName: p.fullName,
    email: p.email,
    phoneNumber: p.phoneNumber,
    phoneStatus: p.phoneVerificationStatus,
    groupName: groupMap.get(p.groupId) || 'Unassigned',
    profileComplete: p.profileComplete,
    accountStatus: p.accountStatus,
    createdAt: p.createdAt,
  }));

  return {
    totalRegistered: profiles.length,
    emailVerifiedCount: profiles.length, // Verified accounts
    phoneStatusCounts,
    profileCompletedCount,
    activeAccountsCount,
    devotees,
  };
}
