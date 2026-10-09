'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  getGroups,
  createGroup,
  updateGroup,
  getAllProfiles,
} from '../../../lib/services/sadhanaService';
import { Group } from '../../../lib/types';

export default function AdminGroupsPage() {
  const router = useRouter();
  const { user, isSuperAdmin, isGroupAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || (!isGroupAdmin && !isSuperAdmin))) {
      router.push('/login');
    }
  }, [authLoading, user, isGroupAdmin, isSuperAdmin, router]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gList, profiles] = await Promise.all([getGroups(), getAllProfiles()]);
      setGroups(gList);

      const counts: Record<string, number> = {};
      profiles.forEach((p) => {
        if (p.groupId) {
          counts[p.groupId] = (counts[p.groupId] || 0) + 1;
        }
      });
      setMemberCounts(counts);
    } catch (e) {
      console.error('Failed to load groups:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingGroupId(null);
    setName('');
    setDescription('');
    setActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroupId(group.id);
    setName(group.name);
    setDescription(group.description);
    setActive(group.active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Group name is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      if (editingGroupId) {
        await updateGroup(editingGroupId, {
          name: name.trim(),
          description: description.trim(),
          active,
        });
      } else {
        await createGroup({
          name: name.trim(),
          description: description.trim(),
          active,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save group.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (group: Group) => {
    try {
      await updateGroup(group.id, { active: !group.active });
      await loadData();
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  if (authLoading || !user || (!isGroupAdmin && !isSuperAdmin)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-[#78716C] space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-[#B45309] border-t-transparent animate-spin" />
        <p>Verifying administrator credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#B45309]" /> Group Management
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Configure dynamic devotional groups, Bhakti Vrikshas, and youth forums after deployment.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#78716C]">Loading groups...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-[#E7DBCA] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EE] text-[#B45309] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#78350F]">No Groups Configured Yet</h3>
          <p className="text-xs text-[#78716C] max-w-md mx-auto leading-relaxed">
            Per the architecture requirements, group names are not hardcoded.
            Please create your temple&apos;s initial devotional groups (e.g., &ldquo;Bhakti Vriksha Alpha&rdquo;, &ldquo;Youth Sevaks&rdquo;, or &ldquo;Congregation North&rdquo;) so devotees can select them upon registration.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#B45309] text-white text-xs font-semibold rounded-xl"
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const count = memberCounts[group.id] || 0;
            return (
              <div
                key={group.id}
                className="bg-white border border-[#E7DBCA] rounded-2xl p-5 shadow-xs space-y-3 hover:border-[#B45309] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base text-[#78350F]">
                        {group.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          group.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {group.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
                      {group.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(group)}
                      className="p-1.5 text-[#78716C] hover:text-[#78350F] hover:bg-[#FAF5EE] rounded-lg"
                      title="Edit group"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F3EADA] flex items-center justify-between text-xs">
                  <span className="text-[#57534E] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#B45309]" />
                    <strong>{count}</strong> registered devotee{count === 1 ? '' : 's'}
                  </span>

                  <button
                    onClick={() => handleToggleActive(group)}
                    className={`text-[11px] font-medium hover:underline ${
                      group.active ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {group.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-[#F5EDE0] px-6 py-4 border-b border-[#E7DBCA] flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#78350F]">
                {editingGroupId ? 'Edit Devotional Group' : 'Create New Group'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#78716C] hover:bg-[#EAE0D0] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhakti Vriksha — Sector 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E7DBCA] text-xs text-[#292524]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Description / Location / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Weekly congregation group meeting on Saturday evenings"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E7DBCA] text-xs text-[#292524]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-[#B45309] rounded-sm focus:ring-[#B45309]"
                />
                <label htmlFor="activeToggle" className="text-xs font-medium text-[#78350F] cursor-pointer">
                  Group is Active (open for new devotee registrations)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
