import React from 'react';
import { Flame, Award, CheckCircle, Headphones, BookOpen } from 'lucide-react';
import { StreakState } from '../../lib/types';

interface StreakCardProps {
  streaks: StreakState;
}

export function StreakCard({ streaks }: StreakCardProps) {
  return (
    <div className="bg-white border border-[#E7DBCA] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-bold text-base text-[#78350F] flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#B45309]" /> Sādhana Streaks & Consistency
        </h3>
        <span className="text-xs text-[#78716C] bg-[#FAF5EE] px-2.5 py-1 rounded-full border border-[#E7DBCA]">
          Personal Milestones
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Consistency Streak */}
        <div className="bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DBCA] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FDE68A] text-[#B45309] flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#78350F]">
              {streaks.currentConsistencyStreak} <span className="text-xs font-normal text-[#78716C]">days</span>
            </div>
            <div className="text-xs font-semibold text-[#B45309]">
              Consistency Streak
            </div>
            <div className="text-[10px] text-[#78716C]">
              Meeting daily criteria
            </div>
          </div>
        </div>

        {/* Recording Streak */}
        <div className="bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DBCA] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#78350F]">
              {streaks.currentRecordingStreak} <span className="text-xs font-normal text-[#78716C]">days</span>
            </div>
            <div className="text-xs font-semibold text-[#4338CA]">
              Recording Streak
            </div>
            <div className="text-[10px] text-[#78716C]">
              Consecutive entries
            </div>
          </div>
        </div>

        {/* Longest Ever Streak */}
        <div className="bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DBCA] flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#D1FAE5] text-[#065F46] flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#78350F]">
              {streaks.longestStreak} <span className="text-xs font-normal text-[#78716C]">days</span>
            </div>
            <div className="text-xs font-semibold text-[#065F46]">
              Personal Best
            </div>
            <div className="text-[10px] text-[#78716C]">
              Longest qualifying run
            </div>
          </div>
        </div>
      </div>

      {/* Activity Specific Streak Pills */}
      <div className="mt-4 pt-4 border-t border-[#F3EADA] flex flex-wrap gap-2 text-xs">
        <span className="text-[#78716C] self-center mr-1">Activity streaks:</span>
        <span className="px-2.5 py-1 bg-[#FAF5EE] border border-[#E7DBCA] rounded-md text-[#78350F] flex items-center gap-1 font-medium">
          <Flame className="w-3.5 h-3.5 text-[#B45309]" /> Japa: {streaks.activityStreaks.rounds}d
        </span>
        <span className="px-2.5 py-1 bg-[#FAF5EE] border border-[#E7DBCA] rounded-md text-[#78350F] flex items-center gap-1 font-medium">
          <Headphones className="w-3.5 h-3.5 text-[#B45309]" /> Hearing: {streaks.activityStreaks.hearing}d
        </span>
        <span className="px-2.5 py-1 bg-[#FAF5EE] border border-[#E7DBCA] rounded-md text-[#78350F] flex items-center gap-1 font-medium">
          <BookOpen className="w-3.5 h-3.5 text-[#B45309]" /> Reading: {streaks.activityStreaks.reading}d
        </span>
      </div>
    </div>
  );
}
