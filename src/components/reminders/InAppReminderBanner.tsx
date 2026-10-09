'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { getDailySadhanaRecord, getReminderPreferences } from '../../lib/services/sadhanaService';
import { formatIsoDate } from '../../lib/utils/streak';

interface InAppReminderBannerProps {
  onOpenRecordModal: () => void;
  recordUpdatedKey?: number;
}

export function InAppReminderBanner({ onOpenRecordModal, recordUpdatedKey }: InAppReminderBannerProps) {
  const { user } = useAuth();
  const [hasRecordedToday, setHasRecordedToday] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [todayStr, setTodayStr] = useState('2026-10-09');

  useEffect(() => {
    setTodayStr(formatIsoDate(new Date()));
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    async function checkTodayRecord() {
      if (!user?.uid) return;
      try {
        const rec = await getDailySadhanaRecord(user.uid, todayStr);
        setHasRecordedToday(Boolean(rec));
      } catch (e) {
        console.error('Error checking today record:', e);
      }
    }
    checkTodayRecord();
  }, [user?.uid, todayStr, recordUpdatedKey]);

  const requestBrowserNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('ISKCON Sādhana Tracker', {
          body: 'Hare Krishna! Reminders are active. When convenient, record your daily sādhana.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  // If already recorded today or dismissed for this session, hide banner
  if (hasRecordedToday || dismissed || !user) {
    return null;
  }

  return (
    <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl p-4 shadow-xs mb-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-[#B45309] hover:text-[#78350F] p-1"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="p-2 bg-[#FDE68A] text-[#B45309] rounded-lg shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-[#92400E]">
            Daily Sādhana Reminder
          </h4>
          <p className="text-sm text-[#78350F]">
            Hare Krishna! When convenient, record today&apos;s sādhana and reflect on your progress.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenRecordModal}
              className="px-3 py-1.5 bg-[#B45309] text-white hover:bg-[#92400E] text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              Record Today&apos;s Sādhana
            </button>

            {notificationPermission === 'default' && (
              <button
                onClick={requestBrowserNotification}
                className="text-xs text-[#92400E] hover:underline font-medium"
              >
                Enable Browser Notifications (Free)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
