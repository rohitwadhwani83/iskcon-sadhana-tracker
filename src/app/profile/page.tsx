'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { saveDevoteeProfile, getGroups } from '../../lib/services/sadhanaService';
import { DevoteeProfile, Group } from '../../lib/types';
import { REGULATIVE_PRINCIPLES } from '../../lib/constants';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [dikshitName, setDikshitName] = useState('');
  const [dikshitSince, setDikshitSince] = useState('');
  const [regulativeDeclaration, setRegulativeDeclaration] = useState<'yes' | 'no'>('yes');

  const [groupName, setGroupName] = useState('General Devotees');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setAddress(profile.address || '');
      setDikshitName(profile.dikshitName || '');
      setDikshitSince(profile.dikshitSince || '');
      setRegulativeDeclaration(profile.regulativePrinciplesDeclaration || 'yes');

      getGroups().then((groups) => {
        const found = groups.find((g) => g.id === profile.groupId);
        if (found) setGroupName(found.name);
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const updated: DevoteeProfile = {
        ...profile,
        fullName: fullName.trim(),
        address: address.trim(),
        dikshitName: dikshitName.trim(),
        dikshitSince: dikshitSince.trim(),
        regulativePrinciplesDeclaration: regulativeDeclaration,
        declarationUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveDevoteeProfile(updated);
      await refreshProfile();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (e) {
      console.error('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
          <User className="w-6 h-6 text-[#B45309]" /> Devotee Profile
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Maintain your personal spiritual information and devotional declarations
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-[#E7DBCA] rounded-2xl p-6 shadow-xs space-y-6">
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        {/* Read-Only Account Identity Info */}
        <div className="p-4 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#78716C] block">Email (Identity Key):</span>
            <span className="font-semibold text-[#292524]">{profile?.email || user?.email}</span>
          </div>
          <div>
            <span className="text-[#78716C] block">Assigned Group:</span>
            <span className="font-semibold text-[#78350F]">{groupName}</span>
          </div>
          <div>
            <span className="text-[#78716C] block">Mobile Phone:</span>
            <span className="font-mono font-semibold text-[#292524]">{profile?.phoneNumber || 'Not provided'}</span>
          </div>
          <div>
            <span className="text-[#78716C] block">Phone Verification Status:</span>
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mt-0.5 ${
                profile?.phoneVerificationStatus === 'verified_by_admin'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {profile?.phoneVerificationStatus || 'unverified'}
            </span>
          </div>
        </div>

        {/* Editable Devotee Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#78350F] mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Initiated / Dīkṣit Name
              </label>
              <input
                type="text"
                placeholder="Leave blank if aspiring"
                value={dikshitName}
                onChange={(e) => setDikshitName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Dīkṣit Since (Date / Year)
              </label>
              <input
                type="text"
                value={dikshitSince}
                onChange={(e) => setDikshitSince(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#78350F] mb-1">
              Residential Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
            />
          </div>

          {/* Regulative Principles Declaration */}
          <div className="p-4 bg-[#FAF5EE] rounded-xl border border-[#E7DBCA] space-y-2">
            <span className="text-xs font-bold text-[#78350F] block">
              Four Regulative Principles Declaration
            </span>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-[#292524] cursor-pointer">
                <input
                  type="radio"
                  name="regPrinciple"
                  value="yes"
                  checked={regulativeDeclaration === 'yes'}
                  onChange={() => setRegulativeDeclaration('yes')}
                  className="text-[#B45309]"
                />
                <span>Yes, following all four principles</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#292524] cursor-pointer">
                <input
                  type="radio"
                  name="regPrinciple"
                  value="no"
                  checked={regulativeDeclaration === 'no'}
                  onChange={() => setRegulativeDeclaration('no')}
                  className="text-[#B45309]"
                />
                <span>Practicing & striving to follow</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
