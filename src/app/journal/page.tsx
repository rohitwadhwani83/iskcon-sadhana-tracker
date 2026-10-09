'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Lock,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Download,
  Sparkles,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from '../../lib/services/sadhanaService';
import { JournalEntry } from '../../lib/types';
import { JOURNAL_CONTEMPLATIVE_PROMPTS } from '../../lib/constants';
import { formatIsoDate } from '../../lib/utils/streak';

export default function JournalPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [entryDate, setEntryDate] = useState('2026-10-09');
  const [optionalReference, setOptionalReference] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEntryDate(formatIsoDate(new Date()));
  }, []);

  const loadJournals = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await getJournalEntries(user.uid);
      setEntries(data);
    } catch (e) {
      console.error('Failed to load journal entries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadJournals();
    }
  }, [user?.uid]);

  const handleOpenCreate = (promptText?: string) => {
    setEditingId(null);
    setTitle(promptText ? promptText.slice(0, 40) + '...' : '');
    setReflectionText(promptText ? `${promptText}\n\n` : '');
    setEntryDate(formatIsoDate(new Date()));
    setOptionalReference('');
    setTagInput('');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setReflectionText(entry.reflectionText);
    setEntryDate(entry.entryDate);
    setOptionalReference(entry.optionalReference || '');
    setTagInput(entry.tags ? entry.tags.join(', ') : '');
    setIsEditorOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !reflectionText.trim()) return;

    setSaving(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      if (editingId) {
        await updateJournalEntry(editingId, user.uid, {
          title: title.trim() || 'Spiritual Realization',
          reflectionText: reflectionText.trim(),
          entryDate,
          optionalReference: optionalReference.trim() || undefined,
          tags,
        });
      } else {
        await createJournalEntry({
          ownerUid: user.uid,
          title: title.trim() || 'Spiritual Realization',
          reflectionText: reflectionText.trim(),
          entryDate,
          optionalReference: optionalReference.trim() || undefined,
          tags,
        });
      }

      setIsEditorOpen(false);
      await loadJournals();
    } catch (e) {
      console.error('Failed to save entry:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.uid) return;
    if (confirm('Are you sure you want to permanently delete this private journal entry?')) {
      await deleteJournalEntry(id, user.uid);
      await loadJournals();
    }
  };

  // Export own journals
  const handleExportJournal = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `iskcon_journal_export_${formatIsoDate(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.reflectionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.optionalReference && entry.optionalReference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag =
      selectedTag === 'all' || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags || [])));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner & Privacy Assurance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-2xl text-[#78350F] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#B45309]" /> Private Reflection Journal
            </h1>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" /> Strictly Confidential
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Record your personal realizations, lecture reflections, and prayers. Visible only to you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={handleExportJournal}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E7DBCA] hover:bg-[#FAF5EE] text-xs font-semibold text-[#78350F] flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Journal</span>
            </button>
          )}

          <button
            onClick={() => handleOpenCreate()}
            className="px-4 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>
        </div>
      </div>

      {/* Contemplative Prompts Carousel */}
      <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl p-4 space-y-2">
        <span className="text-xs font-bold text-[#78350F] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#B45309]" /> Contemplative Prompts for Today:
        </span>
        <div className="flex flex-wrap gap-2 pt-1">
          {JOURNAL_CONTEMPLATIVE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleOpenCreate(prompt)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[#E7DBCA] hover:border-[#B45309] text-[#78350F] text-left transition-colors"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search reflections, teachings, or scriptures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-[#E7DBCA] bg-white text-xs text-[#292524] focus:ring-2 focus:ring-[#B45309]"
          />
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg border ${
                selectedTag === 'all'
                  ? 'bg-[#B45309] text-white border-[#B45309]'
                  : 'bg-white border-[#E7DBCA] text-[#78350F]'
              }`}
            >
              All Tags
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg border ${
                  selectedTag === tag
                    ? 'bg-[#B45309] text-white border-[#B45309]'
                    : 'bg-white border-[#E7DBCA] text-[#78350F]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#78716C]">Loading private entries...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white border border-[#E7DBCA] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EE] text-[#B45309] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#78350F]">No Journal Entries Yet</h3>
          <p className="text-xs text-[#78716C] max-w-sm mx-auto">
            Start writing your spiritual realizations, verses that touched your heart, or prayers.
            Your entries are protected by strict Firestore rules and never shared.
          </p>
          <button
            onClick={() => handleOpenCreate()}
            className="px-4 py-2 bg-[#B45309] text-white text-xs font-semibold rounded-xl"
          >
            Write Your First Realization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-[#E7DBCA] rounded-2xl p-5 shadow-xs space-y-3 hover:border-[#B45309] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#78350F]">
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#78716C] mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {entry.entryDate}
                    </span>
                    {entry.optionalReference && (
                      <span>• Ref: <strong className="text-[#57534E]">{entry.optionalReference}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(entry)}
                    className="p-1.5 text-[#78716C] hover:text-[#78350F] hover:bg-[#FAF5EE] rounded-lg"
                    aria-label="Edit entry"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 text-[#78716C] hover:text-red-700 hover:bg-red-50 rounded-lg"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#292524] whitespace-pre-wrap leading-relaxed">
                {entry.reflectionText}
              </p>

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entry.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-[#FAF5EE] text-[#78350F] border border-[#E7DBCA] rounded-md text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Journal Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="bg-[#F5EDE0] px-6 py-4 border-b border-[#E7DBCA] flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#78350F]">
                {editingId ? 'Edit Private Reflection' : 'New Spiritual Reflection'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-[#78716C] hover:bg-[#EAE0D0] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Title / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Srimad Bhagavatam 1.2.6 Realization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E7DBCA] rounded-xl text-xs text-[#292524]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#78350F] mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E7DBCA] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#78350F] mb-1">
                    Scripture / Class Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BG 9.22"
                    value={optionalReference}
                    onChange={(e) => setOptionalReference(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E7DBCA] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Your Reflection & Contemplation *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Pour your heart and realizations here..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full p-3 bg-white border border-[#E7DBCA] rounded-xl text-xs text-[#292524] leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#78350F] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="japa, surrender, bhagavatam, gratitude"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3.5 py-1.5 bg-white border border-[#E7DBCA] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#78716C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Private Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
