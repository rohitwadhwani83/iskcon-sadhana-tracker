'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { getDevoteeSadhanaHistory } from '../../lib/services/sadhanaService';
import { DailySadhana } from '../../lib/types';
import { SadhanaCalendar } from '../../components/calendar/SadhanaCalendar';
import { RecordTodayModal } from '../../components/devotee/RecordTodayModal';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

export default function CalendarPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DailySadhana[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadHistory() {
      if (!user?.uid) return;
      try {
        const records = await getDevoteeSadhanaHistory(user.uid);
        setHistory(records);
      } catch (e) {
        console.error('Failed to load history for calendar:', e);
      }
    }
    loadHistory();
  }, [user?.uid, refreshKey]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#B45309]" /> Sādhana Calendar & History
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            View consistency records, past submissions, and submit permitted corrections
          </p>
        </div>
      </div>

      {/* Info notice about historical reporting */}
      <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#57534E]">
        <Info className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#78350F]">Historical Corrections:</span> You may click on any past unrecorded day to log historical sādhana. Unrecorded days are treated as missing submissions, whereas days recorded with 0 rounds are preserved as submitted records.
        </div>
      </div>

      {/* Interactive Calendar Component */}
      <SadhanaCalendar
        records={history}
        onSelectDate={handleSelectDate}
      />

      {/* Record Modal for selected date */}
      {selectedDate && (
        <RecordTodayModal
          isOpen={isModalOpen}
          initialDate={selectedDate}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
          }}
          onRecordSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
