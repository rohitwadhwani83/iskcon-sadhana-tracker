import { DailySadhana, MonthlyGoal, MonthlyReportSummary, StreakRuleDefinition } from '../types';
import { DEFAULT_STREAK_RULE } from '../constants';
import { calculateStreaks, isDayQualifying, parseIsoDate } from './streak';

/**
 * Calculates days in a given YYYY-MM month string.
 */
export function getDaysInMonth(yearMonthStr: string): number {
  const [year, month] = yearMonthStr.split('-').map(Number);
  // Passing 0 as day gets last day of previous month; month is 1-indexed here, so passing month directly works
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calculates a devotee's monthly progress summary from raw records.
 */
export function calculateMonthlySummary(
  records: DailySadhana[],
  yearMonthStr: string, // "YYYY-MM"
  rule: StreakRuleDefinition = DEFAULT_STREAK_RULE
): MonthlyReportSummary {
  // Filter records belonging to the selected month
  const monthRecords = records.filter(
    (r) => r.localDate && r.localDate.startsWith(yearMonthStr)
  );

  const daysInMonth = getDaysInMonth(yearMonthStr);
  const recordedDays = monthRecords.length;

  let qualifyingDays = 0;
  let totalRounds = 0;
  let hearingDays = 0;
  let totalHearingMinutes = 0;
  let readingDays = 0;
  let totalReadingMinutes = 0;
  let otherActivitiesCount = 0;

  for (const r of monthRecords) {
    if (isDayQualifying(r, rule)) {
      qualifyingDays++;
    }

    totalRounds += Number(r.roundsChanted) || 0;

    if (r.hearingCompleted) {
      hearingDays++;
      totalHearingMinutes += Number(r.hearingDuration) || 0;
    }

    if (r.readingCompleted) {
      readingDays++;
      totalReadingMinutes += Number(r.readingDuration) || 0;
    }

    if (r.otherActivities && r.otherActivities.length > 0) {
      const completedOthers = r.otherActivities.filter((a) => a.completed).length;
      otherActivitiesCount += completedOthers;
    }
  }

  const consistencyPercentage =
    daysInMonth > 0 ? Math.round((qualifyingDays / daysInMonth) * 100) : 0;
  const averageRoundsPerRecordedDay =
    recordedDays > 0 ? Number((totalRounds / recordedDays).toFixed(1)) : 0;

  const streaks = calculateStreaks(records, rule);

  return {
    month: yearMonthStr,
    recordedDays,
    qualifyingDays,
    consistencyPercentage,
    totalRounds,
    averageRoundsPerRecordedDay,
    hearingDays,
    totalHearingMinutes,
    readingDays,
    totalReadingMinutes,
    otherActivitiesCount,
    currentStreak: streaks.currentConsistencyStreak,
    longestStreak: streaks.longestStreak,
  };
}

/**
 * Evaluates progress against a devotee's personal goals for a month.
 */
export function evaluateGoalProgress(
  summary: MonthlyReportSummary,
  goal: MonthlyGoal
): { current: number; target: number; percentage: number; isAchieved: boolean } {
  let current = 0;
  const target = goal.targetValue;

  switch (goal.goalType) {
    case 'rounds_daily':
      current = summary.averageRoundsPerRecordedDay;
      break;
    case 'qualifying_days_month':
      current = summary.qualifyingDays;
      break;
    case 'reading_days_week': {
      // Estimated weekly rate: readingDays in month / ~4.3 weeks
      const weeks = getDaysInMonth(summary.month) / 7;
      current = Number((summary.readingDays / weeks).toFixed(1));
      break;
    }
    case 'hearing_days_week': {
      const weeks = getDaysInMonth(summary.month) / 7;
      current = Number((summary.hearingDays / weeks).toFixed(1));
      break;
    }
  }

  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const isAchieved = current >= target;

  return { current, target, percentage, isAchieved };
}

/**
 * Returns previous month in YYYY-MM format.
 */
export function getPreviousMonth(yearMonthStr: string): string {
  const [year, month] = yearMonthStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  const prevYear = d.getUTCFullYear();
  const prevMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
}
