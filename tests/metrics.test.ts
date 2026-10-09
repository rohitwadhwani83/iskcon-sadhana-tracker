import { describe, it, expect } from 'vitest';
import {
  calculateMonthlySummary,
  evaluateGoalProgress,
  getDaysInMonth,
  getPreviousMonth,
} from '../src/lib/utils/metrics';
import { DailySadhana, MonthlyGoal } from '../src/lib/types';

describe('Monthly Metrics & Progress Calculations', () => {
  it('correctly calculates days in months, including leap years', () => {
    expect(getDaysInMonth('2026-02')).toBe(28);
    expect(getDaysInMonth('2024-02')).toBe(29); // Leap year
    expect(getDaysInMonth('2026-10')).toBe(31);
    expect(getDaysInMonth('2026-04')).toBe(30);
    expect(getPreviousMonth('2026-01')).toBe('2025-12');
    expect(getPreviousMonth('2026-10')).toBe('2026-09');
  });

  it('aggregates monthly rounds, qualifying days, hearing and reading totals', () => {
    const mockRecords: DailySadhana[] = [
      {
        id: 'u1_2026-10-01',
        uid: 'u1',
        localDate: '2026-10-01',
        roundsChanted: 16,
        hearingCompleted: true,
        hearingDuration: 45,
        readingCompleted: true,
        readingDuration: 30,
        isQualifying: true,
        createdAt: '2026-10-01',
        updatedAt: '2026-10-01',
      },
      {
        id: 'u1_2026-10-02',
        uid: 'u1',
        localDate: '2026-10-02',
        roundsChanted: 20,
        hearingCompleted: false,
        readingCompleted: true,
        readingDuration: 25,
        isQualifying: true,
        createdAt: '2026-10-02',
        updatedAt: '2026-10-02',
      },
      {
        id: 'u1_2026-10-03',
        uid: 'u1',
        localDate: '2026-10-03',
        roundsChanted: 8,
        hearingCompleted: false,
        readingCompleted: false,
        isQualifying: false,
        createdAt: '2026-10-03',
        updatedAt: '2026-10-03',
      },
    ];

    const summary = calculateMonthlySummary(mockRecords, '2026-10');
    expect(summary.recordedDays).toBe(3);
    expect(summary.qualifyingDays).toBe(2);
    expect(summary.totalRounds).toBe(44); // 16 + 20 + 8
    expect(summary.averageRoundsPerRecordedDay).toBe(14.7); // 44 / 3 = 14.667 -> 14.7
    expect(summary.hearingDays).toBe(1);
    expect(summary.totalHearingMinutes).toBe(45);
    expect(summary.readingDays).toBe(2);
    expect(summary.totalReadingMinutes).toBe(55); // 30 + 25
  });

  it('evaluates personal goal achievements accurately', () => {
    const summary = calculateMonthlySummary(
      [
        {
          id: 'u1_2026-10-01',
          uid: 'u1',
          localDate: '2026-10-01',
          roundsChanted: 16,
          hearingCompleted: true,
          readingCompleted: true,
          isQualifying: true,
          createdAt: '',
          updatedAt: '',
        },
      ],
      '2026-10'
    );

    const goalRounds: MonthlyGoal = {
      id: 'g1',
      uid: 'u1',
      goalType: 'rounds_daily',
      targetValue: 16,
      effectiveMonth: '2026-10',
      createdAt: '',
      updatedAt: '',
    };

    const progress = evaluateGoalProgress(summary, goalRounds);
    expect(progress.target).toBe(16);
    expect(progress.current).toBe(16);
    expect(progress.isAchieved).toBe(true);
    expect(progress.percentage).toBe(100);
  });
});
