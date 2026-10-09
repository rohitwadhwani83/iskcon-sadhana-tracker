'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Headphones,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getDailySadhanaRecord,
  saveDailySadhanaRecord,
  getActivityCategories,
} from '../../lib/services/sadhanaService';
import {
  HEARING_TYPES,
  SCRIPTURE_READING_LIST,
  DEFAULT_STREAK_RULE,
} from '../../lib/constants';
import { formatIsoDate } from '../../lib/utils/streak';
import { ActivityCategory, ActivityEntrySummary, DailySadhana } from '../../lib/types';

interface RecordTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordSaved: () => void;
  initialDate?: string;
}

export function RecordTodayModal({
  isOpen,
  onClose,
  onRecordSaved,
  initialDate,
}: RecordTodayModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || '2026-10-09'
  );

  const [rounds, setRounds] = useState<number>(16);
  const [roundsTarget, setRoundsTarget] = useState<number>(16);

  // Hearing
  const [hearingCompleted, setHearingCompleted] = useState<boolean>(false);
  const [hearingDuration, setHearingDuration] = useState<number>(30);
  const [hearingType, setHearingType] = useState<string>(HEARING_TYPES[0]);
  const [hearingNotes, setHearingNotes] = useState<string>('');

  // Reading
  const [readingCompleted, setReadingCompleted] = useState<boolean>(false);
  const [readingDuration, setReadingDuration] = useState<number>(30);
  const [readingBook, setReadingBook] = useState<string>(SCRIPTURE_READING_LIST[0]);
  const [readingNotes, setReadingNotes] = useState<string>('');

  // Other activities
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [otherActivitiesState, setOtherActivitiesState] = useState<Record<string, { completed: boolean; duration: number }>>({});

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const cats = await getActivityCategories();
      setCategories(cats);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    } else {
      setSelectedDate(formatIsoDate(new Date()));
    }
  }, [initialDate, isOpen]);

  // Load existing record if editing or visiting selected date
  useEffect(() => {
    if (!user?.uid || !isOpen) return;

    async function loadDateRecord() {
      setLoading(true);
      setErrorMessage(null);
      setSaveSuccess(false);
      try {
        const existing = await getDailySadhanaRecord(user!.uid, selectedDate);
        if (existing) {
          setRounds(existing.roundsChanted);
          setHearingCompleted(existing.hearingCompleted);
          setHearingDuration(existing.hearingDuration || 30);
          setHearingType(existing.hearingType || HEARING_TYPES[0]);
          setHearingNotes(existing.hearingNotes || '');

          setReadingCompleted(existing.readingCompleted);
          setReadingDuration(existing.readingDuration || 30);
          setReadingBook(existing.readingBook || SCRIPTURE_READING_LIST[0]);
          setReadingNotes(existing.readingNotes || '');

          if (existing.otherActivities) {
            const state: Record<string, { completed: boolean; duration: number }> = {};
            existing.otherActivities.forEach((a) => {
              state[a.categoryId] = { completed: a.completed, duration: a.duration || 30 };
            });
            setOtherActivitiesState(state);
          }
        } else {
          // Defaults for new entry
          setRounds(16);
          setHearingCompleted(false);
          setReadingCompleted(false);
          setHearingNotes('');
          setReadingNotes('');
          setOtherActivitiesState({});
        }
      } catch (e) {
        console.error('Failed to load record for date:', e);
      } finally {
        setLoading(false);
      }
    }

    loadDateRecord();
  }, [user?.uid, selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      setErrorMessage('Please sign in to save records.');
      return;
    }

    // Validation
    const parsedRounds = Number(rounds);
    if (isNaN(parsedRounds) || parsedRounds < 0 || !Number.isInteger(parsedRounds)) {
      setErrorMessage('Rounds chanted must be a non-negative integer (0 or greater).');
      return;
    }

    if (parsedRounds > 192) {
      setErrorMessage('Maximum reasonable rounds per day is 192.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const otherActivities: ActivityEntrySummary[] = categories.map((cat) => {
        const state = otherActivitiesState[cat.id];
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          completed: state?.completed || false,
          duration: state?.duration || cat.defaultDuration || 30,
        };
      });

      await saveDailySadhanaRecord(
        {
          uid: user.uid,
          localDate: selectedDate,
          roundsChanted: parsedRounds,
          hearingCompleted,
          hearingDuration: hearingCompleted ? Number(hearingDuration) : 0,
          hearingType: hearingCompleted ? hearingType : undefined,
          hearingNotes: hearingCompleted ? hearingNotes.trim() : undefined,
          readingCompleted,
          readingDuration: readingCompleted ? Number(readingDuration) : 0,
          readingBook: readingCompleted ? readingBook : undefined,
          readingNotes: readingCompleted ? readingNotes.trim() : undefined,
          otherActivities,
        },
        DEFAULT_STREAK_RULE
      );

      setSaveSuccess(true);
      setTimeout(() => {
        onRecordSaved();
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save sādhana record.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-[#F5EDE0] px-6 py-4 border-b border-[#E7DBCA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#B45309] text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#78350F]">
                Record Daily Sādhana
              </h3>
              <p className="text-xs text-[#78716C]">
                Save your spiritual practices and observations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#EAE0D0] hover:text-[#292524]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Record saved successfully to your devotional history!</span>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#78350F] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date of Sādhana
            </label>
            <input
              type="date"
              max={formatIsoDate(new Date())}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-white border border-[#E7DBCA] text-sm text-[#292524] focus:outline-hidden focus:ring-2 focus:ring-[#B45309]"
            />
          </div>

          {/* Section 1: Japa / Rounds Chanted */}
          <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#78350F] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#B45309]" /> Japa / Rounds Chanted
              </span>
              <span className="text-xs text-[#78716C]">
                Daily target: {roundsTarget} rounds
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="192"
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E7DBCA] text-lg font-bold text-[#78350F] focus:outline-hidden focus:ring-2 focus:ring-[#B45309]"
                />
                <span className="absolute right-3.5 top-3 text-xs text-[#78716C]">
                  rounds
                </span>
              </div>

              {/* Quick Increment Buttons */}
              <div className="flex gap-1.5">
                {[0, 4, 16, 25, 32, 64].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setRounds(cnt)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                      rounds === cnt
                        ? 'bg-[#B45309] text-white border-[#B45309]'
                        : 'bg-[#FAF5EE] text-[#78350F] border-[#E7DBCA] hover:bg-[#F3EADA]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#78716C]">
              Note: 0 rounds is permitted when sick or unable to chant.
            </div>
          </div>

          {/* Section 2: Hearing Activity (Śravaṇa) */}
          <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hearingCompleted}
                  onChange={(e) => setHearingCompleted(e.target.checked)}
                  className="w-4 h-4 text-[#B45309] rounded-sm focus:ring-[#B45309]"
                />
                <span className="text-sm font-bold text-[#78350F] flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-[#B45309]" /> Hearing (Śravaṇa)
                </span>
              </label>
              {hearingCompleted && (
                <span className="text-xs text-emerald-700 font-medium">Completed</span>
              )}
            </div>

            {hearingCompleted && (
              <div className="space-y-3 pt-2 border-t border-[#F3EADA]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#78716C] mb-1">
                      Type / Scripture
                    </label>
                    <select
                      value={hearingType}
                      onChange={(e) => setHearingType(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E7DBCA] bg-[#FAF5EE]"
                    >
                      {HEARING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#78716C] mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={hearingDuration}
                      onChange={(e) => setHearingDuration(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E7DBCA] bg-[#FAF5EE]"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Optional notes, lecture title, or speaker..."
                    value={hearingNotes}
                    onChange={(e) => setHearingNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E7DBCA] bg-[#FAF5EE]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Reading Activity (Paṭhana) */}
          <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readingCompleted}
                  onChange={(e) => setReadingCompleted(e.target.checked)}
                  className="w-4 h-4 text-[#B45309] rounded-sm focus:ring-[#B45309]"
                />
                <span className="text-sm font-bold text-[#78350F] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#B45309]" /> Reading (Paṭhana)
                </span>
              </label>
              {readingCompleted && (
                <span className="text-xs text-emerald-700 font-medium">Completed</span>
              )}
            </div>

            {readingCompleted && (
              <div className="space-y-3 pt-2 border-t border-[#F3EADA]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#78716C] mb-1">
                      Book / Scripture
                    </label>
                    <select
                      value={readingBook}
                      onChange={(e) => setReadingBook(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E7DBCA] bg-[#FAF5EE]"
                    >
                      {SCRIPTURE_READING_LIST.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#78716C] mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={readingDuration}
                      onChange={(e) => setReadingDuration(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E7DBCA] bg-[#FAF5EE]"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Chapters, verses or pages read..."
                    value={readingNotes}
                    onChange={(e) => setReadingNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E7DBCA] bg-[#FAF5EE]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Other Devotional Activities */}
          <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] space-y-3">
            <span className="text-sm font-bold text-[#78350F] block">
              Other Devotional Activities (Sevā & Programs)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const isChecked = otherActivitiesState[cat.id]?.completed || false;
                return (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                      isChecked
                        ? 'bg-[#FAF5EE] border-[#B45309] text-[#78350F]'
                        : 'bg-white border-[#E7DBCA] text-[#57534E] hover:bg-[#FAF5EE]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        setOtherActivitiesState({
                          ...otherActivitiesState,
                          [cat.id]: {
                            completed: e.target.checked,
                            duration: cat.defaultDuration || 30,
                          },
                        });
                      }}
                      className="mt-0.5 w-3.5 h-3.5 text-[#B45309] rounded-sm focus:ring-[#B45309]"
                    />
                    <div>
                      <span className="font-semibold block">{cat.name}</span>
                      <span className="text-[10px] text-[#78716C] block leading-tight">
                        {cat.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#EFE5D5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#B45309] text-white hover:bg-[#92400E] shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Sādhana Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
