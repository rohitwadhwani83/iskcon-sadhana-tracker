import { describe, it, expect } from 'vitest';
import {
  isDayQualifying,
  calculateStreaks,
  areDatesConsecutive,
  getPreviousDay,
} from '../src/lib/utils/streak';
import { DailySadhana, StreakRuleDefinition } from '../src/lib/types';

describe('Streak & Qualifying Days Logic', () => {
  const defaultRule: StreakRuleDefinition = {
    minRounds: 16,
    requireHearingOrReading: true,
  };

  it('correctly determines qualifying day based on rounds and hearing/reading', () => {
    // 16 rounds + hearing = qualifies
    expect(
      isDayQualifying(
        { roundsChanted: 16, hearingCompleted: true, readingCompleted: false },
        defaultRule
      )
    ).toBe(true);

    // 16 rounds + reading = qualifies
    expect(
      isDayQualifying(
        { roundsChanted: 16, hearingCompleted: false, readingCompleted: true },
        defaultRule
      )
    ).toBe(true);

    // 16 rounds with NO hearing and NO reading = does NOT qualify under default rule
    expect(
      isDayQualifying(
        { roundsChanted: 16, hearingCompleted: false, readingCompleted: false },
        defaultRule
      )
    ).toBe(false);

    // 15 rounds with hearing & reading = does NOT qualify (min 16 required)
    expect(
      isDayQualifying(
        { roundsChanted: 15, hearingCompleted: true, readingCompleted: true },
        defaultRule
      )
    ).toBe(false);

    // 0 rounds = does NOT qualify, but zero must be handled cleanly without crash
    expect(
      isDayQualifying(
        { roundsChanted: 0, hearingCompleted: true, readingCompleted: true },
        defaultRule
      )
    ).toBe(false);
  });

  it('correctly calculates consecutive dates across month boundaries', () => {
    expect(areDatesConsecutive('2026-02-28', '2026-03-01')).toBe(true);
    expect(areDatesConsecutive('2026-12-31', '2027-01-01')).toBe(true);
    expect(areDatesConsecutive('2026-05-15', '2026-05-17')).toBe(false);
    expect(getPreviousDay('2026-03-01')).toBe('2026-02-28');
  });

  it('calculates continuous recording streak and consistency streak', () => {
    const today = '2026-10-09';

    const mockRecords: DailySadhana[] = [
      {
        id: 'user1_2026-10-07',
        uid: 'user1',
        localDate: '2026-10-07',
        roundsChanted: 16,
        hearingCompleted: true,
        readingCompleted: false,
        isQualifying: true,
        createdAt: '2026-10-07',
        updatedAt: '2026-10-07',
      },
      {
        id: 'user1_2026-10-08',
        uid: 'user1',
        localDate: '2026-10-08',
        roundsChanted: 16,
        hearingCompleted: false,
        readingCompleted: true,
        isQualifying: true,
        createdAt: '2026-10-08',
        updatedAt: '2026-10-08',
      },
      {
        id: 'user1_2026-10-09',
        uid: 'user1',
        localDate: '2026-10-09',
        roundsChanted: 16,
        hearingCompleted: true,
        readingCompleted: true,
        isQualifying: true,
        createdAt: '2026-10-09',
        updatedAt: '2026-10-09',
      },
    ];

    const result = calculateStreaks(mockRecords, defaultRule, today);
    expect(result.currentRecordingStreak).toBe(3);
    expect(result.currentConsistencyStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.activityStreaks.rounds).toBe(3);
  });

  it('distinguishes unrecorded day from 0-rounds day and breaks consistency streak accordingly', () => {
    const today = '2026-10-09';

    const recordsWithZeroRounds: DailySadhana[] = [
      {
        id: 'user1_2026-10-07',
        uid: 'user1',
        localDate: '2026-10-07',
        roundsChanted: 16,
        hearingCompleted: true,
        readingCompleted: true,
        isQualifying: true,
        createdAt: '2026-10-07',
        updatedAt: '2026-10-07',
      },
      {
        // Recorded day with 0 rounds (e.g., unwell)
        id: 'user1_2026-10-08',
        uid: 'user1',
        localDate: '2026-10-08',
        roundsChanted: 0,
        hearingCompleted: false,
        readingCompleted: false,
        isQualifying: false,
        createdAt: '2026-10-08',
        updatedAt: '2026-10-08',
      },
      {
        id: 'user1_2026-10-09',
        uid: 'user1',
        localDate: '2026-10-09',
        roundsChanted: 16,
        hearingCompleted: true,
        readingCompleted: false,
        isQualifying: true,
        createdAt: '2026-10-09',
        updatedAt: '2026-10-09',
      },
    ];

    const result = calculateStreaks(recordsWithZeroRounds, defaultRule, today);
    // Recording streak continues because 10-08 has a recorded submission
    expect(result.currentRecordingStreak).toBe(3);
    // Consistency streak resets to 1 because 10-08 had 0 rounds (did not qualify)
    expect(result.currentConsistencyStreak).toBe(1);
    // Historical longest streak was 1
    expect(result.longestStreak).toBeGreaterThanOrEqual(1);
  });

  it('handles empty records cleanly without throwing', () => {
    const result = calculateStreaks([], defaultRule, '2026-10-09');
    expect(result.currentRecordingStreak).toBe(0);
    expect(result.currentConsistencyStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });
});
