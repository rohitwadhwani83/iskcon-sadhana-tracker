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
  Plus,
  Lock,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  getAllProfiles,
  getGroups,
  updatePhoneVerification,
  approveDevoteeAccount,
  createAdminBySuperAdmin,
} from '../../../lib/services/sadhanaService';
import { DevoteeProfile, Group, PhoneVerificationStatus } from '../../../lib/types';

export default function AdminDevoteesPage() {
  const { user, isSuperAdmin, isGroupAdmin } = useAuth();

  const [devotees, setDevotees] = useState<DevoteeProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Phone Verification Modal
  const [selectedDevotee, setSelectedDevotee] = useState<DevoteeProfile | null>(null);
  const [newStatus, setNewStatus] = useState<PhoneVerificationStatus>('verified_by_admin');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Create Admin Modal (Super Admin Only)
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminGroupId, setAdminGroupId] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminCreateError, setAdminCreateError] = useState<string | null>(null);
  const [adminCreateSuccess, setAdminCreateSuccess] = useState<string | null>(null);

  // Approval notification state
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, gList] = await Promise.all([getAllProfiles(), getGroups()]);
      setDevotees(pList);
      setGroups(gList);
      if (gList.length > 0 && !adminGroupId) {
        setAdminGroupId(gList[0].id);
      }
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

  const handleApproveLogin = async (devotee: DevoteeProfile) => {
    if (!user?.uid) return;
    try {
      await approveDevoteeAccount(devotee.uid, user.uid);
      setActionSuccessMsg(`Devotee ${devotee.fullName} has been approved. They can now log in to the Devotee portal.`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      await loadData();
    } catch (e) {
      console.error('Failed to approve devotee account:', e);
    }
  };

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

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setAdminCreateError(null);
    setAdminCreateSuccess(null);
    setCreatingAdmin(true);

    try {
      const res = await createAdminBySuperAdmin({
        fullName: adminFullName,
        email: adminEmail,
        password: adminPassword || 'Admin@108',
        groupId: adminGroupId || 'general',
        superAdminUid: user.uid,
      });

      if (res.error) {
        setAdminCreateError(res.error);
      } else {
        setAdminCreateSuccess(`Admin account created successfully for ${adminFullName}! They can now log in under the Admin portal.`);
        setAdminFullName('');
        setAdminEmail('');
        setAdminPassword('');
        await loadData();
        setTimeout(() => {
          setShowCreateAdminModal(false);
          setAdminCreateSuccess(null);
        }, 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating admin';
      setAdminCreateError(msg);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const filteredDevotees = devotees.filter((d) => {
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phoneNumber.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending_approval'
        ? !d.approved
        : statusFilter === 'approved'
        ? d.approved
        : d.phoneVerificationStatus === statusFilter;

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'admin'
        ? d.role === 'group_admin' || d.role === 'super_admin'
        : d.role === 'devotee' || (!d.role && roleFilter === 'devotee');

    const matchesGroup = groupFilter === 'all' || d.groupId === groupFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesGroup;
  });

  const pendingApprovalsCount = devotees.filter((d) => !d.approved && d.role !== 'super_admin').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Header with Title and Create Admin Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#B45309]" /> Devotee & Admin Management
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Approve devotee registrations, monitor accounts, and manage group administrator credentials.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateAdminModal(true)}
            className="px-4 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Admin (Group Sevak)</span>
          </button>
        )}
      </div>

      {/* Action Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Pending Approvals Summary Banner */}
      {pendingApprovalsCount > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{pendingApprovalsCount} devotee {pendingApprovalsCount === 1 ? 'account is' : 'accounts are'}</strong> waiting for login approval.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold text-[11px]"
          >
            Show Pending
          </button>
        </div>
      )}

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
            <option value="all">All Approval States</option>
            <option value="pending_approval">⏳ Pending Login Approval</option>
            <option value="approved">✅ Approved Logins</option>
            <option value="verified_by_admin">Verified Phone</option>
            <option value="unverified">Unverified Phone</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E7DBCA] bg-[#FAF5EE] text-[#78350F]"
          >
            <option value="all">All Roles</option>
            <option value="devotee">Devotees</option>
            <option value="admin">Group Admins / Super Admins</option>
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
          <div className="p-12 text-center text-xs text-[#78716C]">No devotee accounts match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E7DBCA] text-[#78350F] font-semibold">
                <tr>
                  <th className="p-3.5">Devotee</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Group</th>
                  <th className="p-3.5">Login Status</th>
                  <th className="p-3.5">Registered</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EADA]">
                {filteredDevotees.map((d) => {
                  const isApproved = d.approved || d.role === 'super_admin' || d.role === 'group_admin';
                  const roleLabel =
                    d.role === 'super_admin'
                      ? 'Super Admin'
                      : d.role === 'group_admin'
                      ? 'Group Sevak'
                      : 'Devotee';

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
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            d.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : d.role === 'group_admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="text-[#292524]">{d.email}</div>
                        <div className="font-mono text-[11px] text-[#78716C]">{d.phoneNumber}</div>
                      </td>
                      <td className="p-3.5 text-[#57534E]">
                        {groupMap.get(d.groupId) || d.groupId || 'General'}
                      </td>
                      <td className="p-3.5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Pending Approval
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[#78716C] text-[11px]">
                        {d.createdAt ? d.createdAt.split('T')[0] : 'N/A'}
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {!isApproved && (
                          <button
                            onClick={() => handleApproveLogin(d)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-2xs"
                          >
                            Approve Login
                          </button>
                        )}
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

      {/* Super Admin Modal: Create Admin Account */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-[#F5EDE0] px-6 py-4 border-b border-[#E7DBCA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#B45309]" />
                <h3 className="font-serif font-bold text-base text-[#78350F]">
                  Create Group Admin Account
                </h3>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1.5 text-[#78716C] hover:bg-[#EAE0D0] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="p-6 space-y-4">
              {adminCreateError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminCreateError}</span>
                </div>
              )}

              {adminCreateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{adminCreateSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Full Name / Devotee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madhava Dasa"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#E7DBCA] text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin.sevak@iskcon.org"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#E7DBCA] text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Temporary Password *
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 bg-white rounded-xl border border-[#E7DBCA] text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2.5 top-2 text-[#78716C] hover:text-[#78350F]"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#78716C] mt-1">
                  Share this password securely with the new Group Admin. They will log in via the Admin portal.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Assigned Group Scope *
                </label>
                <select
                  value={adminGroupId}
                  onChange={(e) => setAdminGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {creatingAdmin ? 'Creating Account...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  placeholder="e.g. Verified in person during Bhakti Vriksha meeting"
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
