import { DailySadhana, StreakRuleDefinition, StreakState } from '../types';
import { DEFAULT_STREAK_RULE } from '../constants';

/**
 * Checks whether a single day's record meets the qualifying Sadhana criteria.
 */
export function isDayQualifying(
  record: Pick<DailySadhana, 'roundsChanted' | 'hearingCompleted' | 'readingCompleted'>,
  rule: StreakRuleDefinition = DEFAULT_STREAK_RULE
): boolean {
  if (record.roundsChanted < rule.minRounds) {
    return false;
  }

  if (rule.requireBothHearingAndReading) {
    return Boolean(record.hearingCompleted && record.readingCompleted);
  }

  if (rule.requireHearingOrReading) {
    return Boolean(record.hearingCompleted || record.readingCompleted);
  }

  return true;
}

/**
 * Normalizes YYYY-MM-DD string to date in UTC to prevent timezone jitter.
 */
export function parseIsoDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date object as YYYY-MM-DD.
 */
export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns previous day in YYYY-MM-DD format.
 */
export function getPreviousDay(dateStr: string): string {
  const d = parseIsoDate(dateStr);
  d.setUTCDate(d.getUTCDate() - 1);
  return formatIsoDate(d);
}

/**
 * Checks if two date strings are consecutive days.
 */
export function areDatesConsecutive(earlierDateStr: string, laterDateStr: string): boolean {
  const d1 = parseIsoDate(earlierDateStr);
  const d2 = parseIsoDate(laterDateStr);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Calculates current and historical streaks from a set of daily records.
 * Records do not need to be pre-sorted.
 *
 * @param records List of daily records for a devotee
 * @param rule Rule definition for qualifying days
 * @param referenceDateStr Reference local date (usually today, YYYY-MM-DD)
 */
export function calculateStreaks(
  records: DailySadhana[],
  rule: StreakRuleDefinition = DEFAULT_STREAK_RULE,
  referenceDateStr?: string
): StreakState {
  if (!records || records.length === 0) {
    return {
      currentRecordingStreak: 0,
      currentConsistencyStreak: 0,
      longestStreak: 0,
      activityStreaks: { rounds: 0, hearing: 0, reading: 0 },
    };
  }

  // Deduplicate and index by localDate
  const recordMap = new Map<string, DailySadhana>();
  for (const r of records) {
    if (r.localDate) {
      recordMap.set(r.localDate, r);
    }
  }

  // Sorted unique dates ascending
  const uniqueDates = Array.from(recordMap.keys()).sort();
  if (uniqueDates.length === 0) {
    return {
      currentRecordingStreak: 0,
      currentConsistencyStreak: 0,
      longestStreak: 0,
      activityStreaks: { rounds: 0, hearing: 0, reading: 0 },
    };
  }

  // Today reference
  const todayStr = referenceDateStr || formatIsoDate(new Date());
  const yesterdayStr = getPreviousDay(todayStr);

  // 1. Calculate Longest Streak in history (based on qualifying days or saved records)
  let longestStreak = 0;
  let currentRun = 0;
  let prevQualifyingDate: string | null = null;

  for (const date of uniqueDates) {
    const rec = recordMap.get(date)!;
    const qualifies = isDayQualifying(rec, rule);

    if (qualifies) {
      if (prevQualifyingDate === null) {
        currentRun = 1;
      } else if (areDatesConsecutive(prevQualifyingDate, date)) {
        currentRun++;
      } else {
        currentRun = 1;
      }
      prevQualifyingDate = date;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    } else {
      currentRun = 0;
      prevQualifyingDate = null;
    }
  }

  // 2. Current Recording Streak (counting back from today or yesterday)
  let currentRecordingStreak = 0;
  let checkDate = recordMap.has(todayStr) ? todayStr : yesterdayStr;

  while (recordMap.has(checkDate)) {
    currentRecordingStreak++;
    checkDate = getPreviousDay(checkDate);
  }

  // 3. Current Sādhana Consistency Streak
  let currentConsistencyStreak = 0;
  checkDate = todayStr;
  const todayRec = recordMap.get(todayStr);
  const todayQualifies = todayRec ? isDayQualifying(todayRec, rule) : false;

  // If today hasn't qualified yet or isn't recorded yet, check starting from yesterday
  if (todayQualifies) {
    checkDate = todayStr;
  } else {
    checkDate = yesterdayStr;
  }

  while (recordMap.has(checkDate)) {
    const rec = recordMap.get(checkDate)!;
    if (isDayQualifying(rec, rule)) {
      currentConsistencyStreak++;
      checkDate = getPreviousDay(checkDate);
    } else {
      break;
    }
  }

  // 4. Activity-specific streaks
  const calcActivityStreak = (predicate: (r: DailySadhana) => boolean): number => {
    let streak = 0;
    const startRec = recordMap.get(todayStr);
    let curr = startRec && predicate(startRec) ? todayStr : yesterdayStr;

    while (recordMap.has(curr)) {
      const r = recordMap.get(curr)!;
      if (predicate(r)) {
        streak++;
        curr = getPreviousDay(curr);
      } else {
        break;
      }
    }
    return streak;
  };

  const roundsStreak = calcActivityStreak((r) => r.roundsChanted >= (rule.minRounds || 1));
  const hearingStreak = calcActivityStreak((r) => Boolean(r.hearingCompleted));
  const readingStreak = calcActivityStreak((r) => Boolean(r.readingCompleted));

  return {
    currentRecordingStreak,
    currentConsistencyStreak,
    longestStreak: Math.max(longestStreak, currentConsistencyStreak),
    activityStreaks: {
      rounds: roundsStreak,
      hearing: hearingStreak,
      reading: readingStreak,
    },
  };
}
