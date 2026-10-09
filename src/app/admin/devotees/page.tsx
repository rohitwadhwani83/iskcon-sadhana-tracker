'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Filter,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  getAllProfiles,
  getGroups,
  updatePhoneVerification,
} from '../../../lib/services/sadhanaService';
import { DevoteeProfile, Group, PhoneVerificationStatus } from '../../../lib/types';

export default function AdminDevoteesPage() {
  const { user, isSuperAdmin, isGroupAdmin } = useAuth();

  const [devotees, setDevotees] = useState<DevoteeProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Verification Modal
  const [selectedDevotee, setSelectedDevotee] = useState<DevoteeProfile | null>(null);
  const [newStatus, setNewStatus] = useState<PhoneVerificationStatus>('verified_by_admin');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, gList] = await Promise.all([getAllProfiles(), getGroups()]);
      setDevotees(pList);
      setGroups(gList);
    } catch (e) {
      console.error('Failed to load devotees:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const handleOpenVerifyModal = (devotee: DevoteeProfile) => {
    setSelectedDevotee(devotee);
    setNewStatus(
      devotee.phoneVerificationStatus === 'verified_by_admin'
        ? 'verified_by_admin'
        : 'verified_by_admin'
    );
    setNotes(devotee.phoneVerificationNotes || '');
  };

  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevotee || !user?.uid) return;
    setSaving(true);
    try {
      await updatePhoneVerification(
        selectedDevotee.uid,
        newStatus,
        user.uid,
        notes.trim()
      );
      setSelectedDevotee(null);
      await loadData();
    } catch (e) {
      console.error('Failed to update phone verification status:', e);
    } finally {
      setSaving(false);
    }
  };

  const filteredDevotees = devotees.filter((d) => {
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phoneNumber.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' || d.phoneVerificationStatus === statusFilter;

    const matchesGroup =
      groupFilter === 'all' || d.groupId === groupFilter;

    return matchesSearch && matchesStatus && matchesGroup;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
          <Users className="w-6 h-6 text-[#B45309]" /> Devotee Accounts & Verification
        </h1>
        <p className="text-xs text-[#78716C] mt-0.5">
          Review devotee profiles and execute manual phone verification workflows without paid APIs
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E7DBCA] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-[#E7DBCA] text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
          />
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E7DBCA] bg-[#FAF5EE] text-[#78350F]"
          >
            <option value="all">All Verification States</option>
            <option value="unverified">Unverified</option>
            <option value="pending_manual_review">Pending Review</option>
            <option value="verified_by_admin">Verified by Admin</option>
            <option value="rejected_correction_needed">Rejected / Correction Needed</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E7DBCA] bg-[#FAF5EE] text-[#78350F]"
          >
            <option value="all">All Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Devotees Table */}
      <div className="bg-white border border-[#E7DBCA] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#78716C]">Loading devotees...</div>
        ) : filteredDevotees.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#78716C]">No devotees match the selected filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E7DBCA] text-[#78350F] font-semibold">
                <tr>
                  <th className="p-3.5">Devotee</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Group</th>
                  <th className="p-3.5">Phone Status</th>
                  <th className="p-3.5">Registration</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EADA]">
                {filteredDevotees.map((d) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                      Unverified
                    </span>
                  );
                  if (d.phoneVerificationStatus === 'verified_by_admin') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        Verified by Admin
                      </span>
                    );
                  } else if (d.phoneVerificationStatus === 'pending_manual_review') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        Pending Review
                      </span>
                    );
                  } else if (d.phoneVerificationStatus === 'rejected_correction_needed') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-100 text-red-800">
                        Rejected
                      </span>
                    );
                  }

                  return (
                    <tr key={d.uid} className="hover:bg-[#FAF5EE] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#78350F]">{d.fullName}</div>
                        {d.dikshitName && (
                          <div className="text-[10px] text-[#78716C]">
                            Dīkṣit: {d.dikshitName}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="text-[#292524]">{d.email}</div>
                        <div className="font-mono text-[11px] text-[#78716C]">{d.phoneNumber}</div>
                      </td>
                      <td className="p-3.5 text-[#57534E]">
                        {groupMap.get(d.groupId) || 'Unassigned'}
                      </td>
                      <td className="p-3.5">{statusBadge}</td>
                      <td className="p-3.5 text-[#78716C] text-[11px]">
                        {d.createdAt ? d.createdAt.split('T')[0] : 'N/A'}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenVerifyModal(d)}
                          className="px-2.5 py-1 rounded-lg border border-[#E7DBCA] bg-white hover:bg-[#FAF5EE] text-[#78350F] font-semibold text-[11px]"
                        >
                          Verify Phone
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Phone Verification Modal */}
      {selectedDevotee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-[#F5EDE0] px-6 py-4 border-b border-[#E7DBCA] flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#78350F]">
                Phone Verification Workflow
              </h3>
              <button
                onClick={() => setSelectedDevotee(null)}
                className="p-1.5 text-[#78716C] hover:bg-[#EAE0D0] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVerification} className="p-6 space-y-4">
              <div className="p-3 bg-white rounded-xl border border-[#E7DBCA] space-y-1 text-xs">
                <div>
                  <span className="text-[#78716C]">Devotee: </span>
                  <span className="font-bold text-[#78350F]">{selectedDevotee.fullName}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">Phone: </span>
                  <span className="font-mono font-bold text-[#292524]">{selectedDevotee.phoneNumber}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Verification Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PhoneVerificationStatus)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
                >
                  <option value="verified_by_admin">Verified by Admin</option>
                  <option value="pending_manual_review">Pending Manual Review</option>
                  <option value="rejected_correction_needed">Rejected / Correction Needed</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Safe Administrative Verification Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified in person during Bhakti Vriksha meeting on Oct 9"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDevotee(null)}
                  className="px-4 py-2 text-xs font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
