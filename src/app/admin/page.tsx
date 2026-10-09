'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { getAllProfiles, getGroups } from '../../lib/services/sadhanaService';
import { DevoteeProfile, Group } from '../../lib/types';
import { formatIsoDate } from '../../lib/utils/streak';

export default function AdminOverviewPage() {
  const { user, isGroupAdmin, isSuperAdmin } = useAuth();

  const [profiles, setProfiles] = useState<DevoteeProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [pList, gList] = await Promise.all([getAllProfiles(), getGroups()]);
        setProfiles(pList);
        setGroups(gList);
      } catch (e) {
        console.error('Failed to load admin data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const totalDevotees = profiles.length;
  const activeDevotees = profiles.filter((p) => p.accountStatus === 'active').length;
  const pendingPhoneReviews = profiles.filter(
    (p) => p.phoneVerificationStatus === 'unverified' || p.phoneVerificationStatus === 'pending_manual_review'
  ).length;
  const activeGroupsCount = groups.filter((g) => g.active).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E7DBCA] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200">
              {isSuperAdmin ? 'Temple Super Administrator' : 'Group Administrator'}
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#78350F] mt-1">
            Administrator Management Portal
          </h1>
          <p className="text-xs text-[#78716C]">
            Configure groups, oversee devotee accounts, verify phone numbers, and generate temple reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/reports"
            className="px-4 py-2.5 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold shadow-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Reporting Pack</span>
          </Link>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Total Devotees</span>
          <span className="text-2xl font-bold text-[#78350F]">{totalDevotees}</span>
          <span className="text-[10px] text-[#78716C] block">{activeDevotees} active accounts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Active Groups</span>
          <span className="text-2xl font-bold text-[#78350F]">{activeGroupsCount}</span>
          <span className="text-[10px] text-[#78716C] block">configured in Firestore</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">Phone Verification Queue</span>
          <span className="text-2xl font-bold text-amber-700">{pendingPhoneReviews}</span>
          <span className="text-[10px] text-[#78716C] block">pending manual check</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DBCA] shadow-xs">
          <span className="text-[11px] text-[#78716C] block">System Status</span>
          <span className="text-2xl font-bold text-emerald-700">Active</span>
          <span className="text-[10px] text-emerald-800 block">Cloud Database Connected</span>
        </div>
      </div>

      {/* Admin Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Group Management */}
        <Link
          href="/admin/groups"
          className="bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#78350F]">
              Group Management
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Create, rename, activate, or deactivate devotional groups and Bhakti Vrikshas dynamically after deployment.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3EADA] flex items-center justify-between text-xs font-semibold text-[#B45309]">
            <span>Manage Groups</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 2: Devotee & Phone Verification */}
        <Link
          href="/admin/devotees"
          className="bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#78350F]">
              Devotees & Verification
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Review devotee rosters, verify phone numbers without paid SMS/WhatsApp, and record administrator verification notes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3EADA] flex items-center justify-between text-xs font-semibold text-[#B45309]">
            <span>Review Devotees</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Module 3: Temple Reporting Pack */}
        <Link
          href="/admin/reports"
          className="bg-white border border-[#E7DBCA] hover:border-[#B45309] rounded-2xl p-5 shadow-xs transition-colors flex flex-col justify-between group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EE] text-[#B45309] flex items-center justify-center group-hover:bg-[#B45309] group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#78350F]">
              Temple Reporting Pack
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Generate daily temple reports, weekly group reports, monthly summaries, and CSV exports protected from formula injection.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3EADA] flex items-center justify-between text-xs font-semibold text-[#B45309]">
            <span>Generate Reports</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
