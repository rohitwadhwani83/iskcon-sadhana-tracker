'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { DailySadhana } from '../../lib/types';
import { formatIsoDate, parseIsoDate, isDayQualifying } from '../../lib/utils/streak';
import { DEFAULT_STREAK_RULE } from '../../lib/constants';

interface SadhanaCalendarProps {
  records: DailySadhana[];
  onSelectDate: (dateStr: string) => void;
}

export function SadhanaCalendar({ records, onSelectDate }: SadhanaCalendarProps) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed, default Oct (9)
  const [todayStr, setTodayStr] = useState('2026-10-09');

  useEffect(() => {
    const today = new Date();
    setCurrentYear(today.getUTCFullYear());
    setCurrentMonth(today.getUTCMonth());
    setTodayStr(formatIsoDate(today));
  }, []);

  // Map records by localDate
  const recordMap = new Map<string, DailySadhana>();
  records.forEach((r) => {
    if (r.localDate) recordMap.set(r.localDate, r);
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

  const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Padding days from previous month
  const prevMonthDays = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: d, isCurrentMonth: false });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: d, isCurrentMonth: true });
  }

  // Trailing padding days to fill 35 or 42 grid
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: d, isCurrentMonth: false });
  }

  return (
    <div className="bg-white border border-[#E7DBCA] rounded-2xl p-5 shadow-xs">
      {/* Month & Year Header Navigation */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#78350F]">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <p className="text-xs text-[#78716C]">
            Click any past or current day to view or record details
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-[#E7DBCA] hover:bg-[#FAF5EE] text-[#78350F]"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCurrentYear(now.getUTCFullYear());
              setCurrentMonth(now.getUTCMonth());
            }}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E7DBCA] hover:bg-[#FAF5EE] text-[#78350F]"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-[#E7DBCA] hover:bg-[#FAF5EE] text-[#78350F]"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
          <span key={wd} className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider py-1">
            {wd}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((item) => {
          const rec = recordMap.get(item.dateStr);
          const isToday = item.dateStr === todayStr;
          const isFuture = item.dateStr > todayStr;
          const qualifies = rec ? isDayQualifying(rec, DEFAULT_STREAK_RULE) : false;

          let badgeBg = 'bg-white text-[#44403C] hover:border-[#B45309]';
          if (!item.isCurrentMonth) {
            badgeBg = 'bg-stone-50 text-stone-300 cursor-not-allowed';
          } else if (isFuture) {
            badgeBg = 'bg-stone-50 text-stone-400 cursor-not-allowed';
          } else if (rec && qualifies) {
            badgeBg = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
          } else if (rec && !qualifies) {
            badgeBg = 'bg-amber-50 border-amber-300 text-amber-900 font-medium';
          } else if (isToday) {
            badgeBg = 'bg-[#FAF5EE] border-[#B45309] text-[#78350F] font-bold';
          }

          return (
            <button
              key={item.dateStr}
              type="button"
              disabled={isFuture || !item.isCurrentMonth}
              onClick={() => onSelectDate(item.dateStr)}
              className={`min-h-[64px] p-1.5 rounded-xl border border-[#E7DBCA] flex flex-col justify-between text-left transition-all relative ${badgeBg}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs ${isToday ? 'px-1.5 py-0.5 bg-[#B45309] text-white rounded-md' : ''}`}>
                  {item.dayNumber}
                </span>

                {rec && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      qualifies ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  />
                )}
              </div>

              {rec && item.isCurrentMonth && (
                <div className="mt-1 text-[10px] leading-tight space-y-0.5">
                  <div className="font-bold text-[#78350F]">
                    {rec.roundsChanted} rds
                  </div>
                  <div className="text-[9px] text-[#78716C] flex gap-1">
                    {rec.hearingCompleted && <span>👂</span>}
                    {rec.readingCompleted && <span>📖</span>}
                  </div>
                </div>
              )}

              {!rec && item.isCurrentMonth && !isFuture && (
                <div className="mt-auto text-[9px] text-stone-400 italic">
                  Unrecorded
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-3 border-t border-[#F3EADA] flex flex-wrap gap-4 text-xs text-[#57534E]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
          <span>Qualifying Day (≥16 rds + Hearing/Reading)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Recorded (Partial / Below Threshold)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-stone-300 bg-white inline-block" />
          <span>Unrecorded Day</span>
        </div>
      </div>
    </div>
  );
}
