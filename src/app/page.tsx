'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  BookOpen,
  Calendar,
  ShieldCheck,
  Award,
  ChevronRight,
  Headphones,
  Users,
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';

export default function HomePage() {
  const { user, simulateLoginAs } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5EE] border border-[#E7DBCA] text-xs font-semibold text-[#B45309] shadow-2xs">
          <span>🕉 ISKCON Sādhana Tracker — Version 3.0</span>
          <span>•</span>
          <span>Zero-Cost Spark Architecture (₹0 / mo)</span>
        </div>

        <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-6xl text-[#78350F] tracking-tight max-w-3xl mx-auto leading-tight">
          Strengthen your daily sādhana, <br className="hidden sm:inline" />
          <span className="text-[#B45309]">one day at a time.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#57534E] max-w-2xl mx-auto leading-relaxed">
          A devotional, mobile-first progressive web app designed for ISKCON devotees.
          Record japa rounds, scripture reading, lectures, and temple sevā with personal
          consistency streaks and 100% private realization journals.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Register as a Devotee</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 bg-white border border-[#E7DBCA] hover:bg-[#FAF5EE] text-[#78350F] text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            Sign In to Existing Account
          </Link>
        </div>

        {/* 1-Click Instant Preview for Evaluation */}
        <div className="pt-6">
          <span className="text-xs text-[#78716C] block mb-2">Instant Demo Mode (No Registration Needed):</span>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <button
              onClick={() => simulateLoginAs('devotee')}
              className="px-3 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E7DBCA] text-[#78350F] font-semibold hover:bg-[#F3EADA]"
            >
              Enter as Devotee
            </button>
            <button
              onClick={() => simulateLoginAs('group_admin')}
              className="px-3 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E7DBCA] text-[#4338CA] font-semibold hover:bg-[#F3EADA]"
            >
              Enter as Group Sevak
            </button>
            <button
              onClick={() => simulateLoginAs('super_admin', 'nandinigopikadevidasi@gmail.com')}
              className="px-3 py-1.5 rounded-lg bg-[#FAF5EE] border border-[#E7DBCA] text-[#065F46] font-semibold hover:bg-[#F3EADA]"
            >
              Enter as Temple Admin
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Pillars Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 text-[#B45309]" />
            </div>
            <h3 className="font-serif font-bold text-sm text-[#78350F]">
              Daily Sādhana
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Track japa rounds (0 allowed when unwell), scripture reading, classes, and morning programs with deterministic daily deduplication.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-[#B45309]" />
            </div>
            <h3 className="font-serif font-bold text-sm text-[#78350F]">
              Consistency Streaks
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Transparent streak calculations distinguishing unrecorded days from submitted zero-activity reports across month boundaries.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-[#B45309]" />
            </div>
            <h3 className="font-serif font-bold text-sm text-[#78350F]">
              Private Reflection
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              100% strictly owner-only spiritual realization journal. Protected by database rules; never exposed to administrators or temple reports.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7DBCA] shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-[#B45309]" />
            </div>
            <h3 className="font-serif font-bold text-sm text-[#78350F]">
              Temple Reporting
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Dynamic group management and reporting pack with formula-injection-safe CSV exports and no public spiritual rankings.
            </p>
          </div>
        </div>
      </div>

      {/* Devotional Quote Banner */}
      <div className="bg-[#FAF5EE] border-t border-[#E7DBCA] py-8 text-center px-4">
        <p className="font-serif italic text-sm text-[#78350F] max-w-xl mx-auto">
          &ldquo;Chanting the holy name is the primary process for spiritual elevation in this age of Kali.&rdquo;
        </p>
        <p className="text-xs text-[#B45309] font-medium mt-1">
          — His Divine Grace A.C. Bhaktivedanta Swami Prabhupāda
        </p>
      </div>
    </div>
  );
}
