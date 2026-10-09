'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Moon,
  Globe,
  CheckCircle2,
  Save,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getReminderPreferences,
  saveReminderPreferences,
} from '../../lib/services/sadhanaService';
import { ReminderPreferences } from '../../lib/types';

export default function RemindersPage() {
  const { user } = useAuth();

  const [enabled, setEnabled] = useState(true);
  const [preferredTime, setPreferredTime] = useState('08:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [preferredDays, setPreferredDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('05:00');
  const [browserNotificationEnabled, setBrowserNotificationEnabled] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      if (!user?.uid) return;
      try {
        const prefs = await getReminderPreferences(user.uid);
        setEnabled(prefs.enabled);
        setPreferredTime(prefs.preferredTime);
        setTimezone(prefs.timezone);
        setPreferredDays(prefs.preferredDays || [0, 1, 2, 3, 4, 5, 6]);
        setQuietStart(prefs.quietHours?.start || '22:00');
        setQuietEnd(prefs.quietHours?.end || '05:00');
        setBrowserNotificationEnabled(prefs.browserNotificationEnabled);
      } catch (e) {
        console.error('Failed to load reminder preferences:', e);
      }
    }
    loadPrefs();
  }, [user?.uid]);

  const handleToggleDay = (dayIndex: number) => {
    if (preferredDays.includes(dayIndex)) {
      if (preferredDays.length > 1) {
        setPreferredDays(preferredDays.filter((d) => d !== dayIndex));
      }
    } else {
      setPreferredDays([...preferredDays, dayIndex].sort());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const prefs: ReminderPreferences = {
        uid: user.uid,
        enabled,
        preferredTime,
        timezone,
        preferredDays,
        quietHours: {
          start: quietStart,
          end: quietEnd,
        },
        browserNotificationEnabled,
        updatedAt: new Date().toISOString(),
      };
      await saveReminderPreferences(prefs);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save reminder preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('ISKCON Sādhana Tracker', {
          body: 'Hare Krishna! When convenient, record today’s sādhana and reflect on your progress.',
          icon: '/favicon.ico',
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } else {
        alert('Browser notification permission was not granted.');
      }
    }
  };

  const weekDays = [
    { label: 'Sun', val: 0 },
    { label: 'Mon', val: 1 },
    { label: 'Tue', val: 2 },
    { label: 'Wed', val: 3 },
    { label: 'Thu', val: 4 },
    { label: 'Fri', val: 5 },
    { label: 'Sat', val: 6 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#B45309]" /> Reminder Preferences
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Configure gentle in-app prompts and browser notifications at ₹0 cost
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E7DBCA] rounded-2xl p-6 shadow-xs space-y-6">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Reminder preferences saved successfully!</span>
          </div>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F3EADA]">
          <div>
            <span className="text-sm font-bold text-[#78350F] block">Enable Reminders</span>
            <span className="text-xs text-[#78716C]">
              Receive in-app alerts and prompts when today is unrecorded
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#B45309]" />
          </label>
        </div>

        {/* Preferred Time & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#78350F] mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Preferred Daily Time
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs bg-[#FAF5EE]"
            />
            <span className="text-[10px] text-[#78716C] mt-1 block">
              Suggested: Early morning or post-mangala-arati
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#78350F] mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Devotee Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs bg-[#FAF5EE]"
            />
          </div>
        </div>

        {/* Days of the Week */}
        <div>
          <label className="block text-xs font-semibold text-[#78350F] mb-2">
            Active Reminder Days
          </label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((d) => {
              const isSelected = preferredDays.includes(d.val);
              return (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => handleToggleDay(d.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    isSelected
                      ? 'bg-[#B45309] text-white border-[#B45309]'
                      : 'bg-[#FAF5EE] text-[#78716C] border-[#E7DBCA] hover:bg-[#F3EADA]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="p-4 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA] space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-[#B45309]" />
            <span className="text-xs font-bold text-[#78350F]">
              Quiet Hours (No Notifications During Sleep / Rest)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">Start Time</label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E7DBCA] rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#78716C] mb-1">End Time</label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-[#E7DBCA] rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Free Web Notifications Section */}
        <div className="pt-2 border-t border-[#F3EADA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#78350F] block">
              Browser Web Notifications (Free)
            </span>
            <span className="text-[11px] text-[#78716C]">
              Operates locally in your browser. No paid SMS or WhatsApp fees incurred.
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestNotification}
            className="px-3.5 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E7DBCA] hover:bg-[#F3EADA] text-xs font-semibold text-[#78350F] self-start sm:self-auto"
          >
            {testNotificationSent ? '✓ Sent Test Alert' : 'Send Test Notification'}
          </button>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#F3EADA] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
