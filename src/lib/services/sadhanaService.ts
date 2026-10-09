import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  DevoteeProfile,
  Group,
  DailySadhana,
  JournalEntry,
  MonthlyGoal,
  ReminderPreferences,
  UserRoles,
  PhoneVerificationStatus,
  ActivityCategory,
  StreakRuleDefinition,
} from '../types';
import { DEFAULT_ACTIVITY_CATEGORIES, DEFAULT_STREAK_RULE } from '../constants';
import { isDayQualifying, calculateStreaks } from '../utils/streak';

// Local storage keys for fallback/mock mode
const LS_GROUPS = 'iskcon_st_groups';
const LS_PROFILES = 'iskcon_st_profiles';
const LS_ROLES = 'iskcon_st_roles';
const LS_SADHANA = 'iskcon_st_sadhana';
const LS_JOURNALS = 'iskcon_st_journals';
const LS_GOALS = 'iskcon_st_goals';
const LS_REMINDERS = 'iskcon_st_reminders';

function getLs<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLs<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Initial mock data if empty
function initializeLocalFallback() {
  if (typeof window === 'undefined') return;
  const existingGroups = getLs<Group[]>(LS_GROUPS, []);
  if (existingGroups.length === 0) {
    // We do NOT hardcode fixed groups permanently, but if the local fallback is completely empty,
    // we provide a prompt or sample group for preview only if created by user.
  }
}

// ==========================================
// GROUPS SERVICE
// ==========================================
export async function getGroups(): Promise<Group[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Group));
    } catch (e) {
      console.warn('Firestore getGroups error, falling back to local store:', e);
    }
  }

  return getLs<Group[]>(LS_GROUPS, []);
}

export async function createGroup(groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
  const id = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newGroup: Group = {
    ...groupData,
    id,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'groups', id), newGroup);
      return newGroup;
    } catch (e) {
      console.warn('Firestore createGroup error, falling back to local store:', e);
    }
  }

  const groups = getLs<Group[]>(LS_GROUPS, []);
  groups.push(newGroup);
  setLs(LS_GROUPS, groups);
  return newGroup;
}

export async function updateGroup(groupId: string, updates: Partial<Group>): Promise<void> {
  const now = new Date().toISOString();
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'groups', groupId), { ...updates, updatedAt: now });
      return;
    } catch (e) {
      console.warn('Firestore updateGroup error, using local fallback:', e);
    }
  }

  const groups = getLs<Group[]>(LS_GROUPS, []);
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx !== -1) {
    groups[idx] = { ...groups[idx], ...updates, updatedAt: now };
    setLs(LS_GROUPS, groups);
  }
}

// ==========================================
// DEVOTEE PROFILES SERVICE
// ==========================================
export async function getDevoteeProfile(uid: string): Promise<DevoteeProfile | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', uid));
      if (docSnap.exists()) {
        return docSnap.data() as DevoteeProfile;
      }
    } catch (e) {
      console.warn('Firestore getDevoteeProfile error, falling back:', e);
    }
  }

  const profiles = getLs<Record<string, DevoteeProfile>>(LS_PROFILES, {});
  return profiles[uid] || null;
}

export async function saveDevoteeProfile(profile: DevoteeProfile): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'profiles', profile.uid), profile, { merge: true });
      return;
    } catch (e) {
      console.warn('Firestore saveDevoteeProfile error, using local fallback:', e);
    }
  }

  const profiles = getLs<Record<string, DevoteeProfile>>(LS_PROFILES, {});
  profiles[profile.uid] = profile;
  setLs(LS_PROFILES, profiles);
}

export async function getAllProfiles(): Promise<DevoteeProfile[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'profiles'), orderBy('fullName', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => d.data() as DevoteeProfile);
    } catch (e) {
      console.warn('Firestore getAllProfiles error, falling back:', e);
    }
  }

  const profiles = getLs<Record<string, DevoteeProfile>>(LS_PROFILES, {});
  return Object.values(profiles);
}

export async function updatePhoneVerification(
  uid: string,
  status: PhoneVerificationStatus,
  adminUid: string,
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Partial<DevoteeProfile> = {
    phoneVerificationStatus: status,
    phoneVerifiedAt: status === 'verified_by_admin' ? now : null,
    phoneVerifiedBy: adminUid,
    phoneVerificationNotes: notes || null,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'profiles', uid), updates);
      return;
    } catch (e) {
      console.warn('Firestore updatePhoneVerification error:', e);
    }
  }

  const profiles = getLs<Record<string, DevoteeProfile>>(LS_PROFILES, {});
  if (profiles[uid]) {
    profiles[uid] = { ...profiles[uid], ...updates };
    setLs(LS_PROFILES, profiles);
  }
}

export async function approveDevoteeAccount(
  uid: string,
  adminUid: string
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Partial<DevoteeProfile> = {
    approved: true,
    approvedBy: adminUid,
    approvedAt: now,
    accountStatus: 'active',
    phoneVerificationStatus: 'verified_by_admin',
    phoneVerifiedAt: now,
    phoneVerifiedBy: adminUid,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'profiles', uid), updates);
      return;
    } catch (e) {
      console.warn('Firestore approveDevoteeAccount error:', e);
    }
  }

  const profiles = getLs<Record<string, DevoteeProfile>>(LS_PROFILES, {});
  if (profiles[uid]) {
    profiles[uid] = { ...profiles[uid], ...updates };
    setLs(LS_PROFILES, profiles);
  }
}

export async function createAdminBySuperAdmin(data: {
  fullName: string;
  email: string;
  password?: string;
  groupId: string;
  superAdminUid: string;
}): Promise<{ uid: string; error?: string }> {
  const email = data.email.trim().toLowerCase();
  const password = data.password || 'Admin@108';
  let uid = '';

  const apiKey = 'AIzaSyBP5gnBXJrL2HRh66elVXz9c5mAcxXDHtc';
  try {
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const json = await signUpRes.json();
    if (json.error) {
      if (json.error.message?.includes('EMAIL_EXISTS')) {
        return { uid: '', error: 'An account with this email already exists.' };
      }
      return { uid: '', error: json.error.message || 'Failed to create admin in auth.' };
    }
    uid = json.localId;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating admin';
    console.warn('Auth REST signup error:', msg);
    return { uid: '', error: msg };
  }

  const now = new Date().toISOString();
  const adminProfile: DevoteeProfile = {
    uid,
    fullName: data.fullName.trim(),
    email,
    phoneNumber: '+919876543210',
    phoneVerificationStatus: 'verified_by_admin',
    phoneVerifiedAt: now,
    phoneVerifiedBy: data.superAdminUid,
    regulativePrinciplesDeclaration: 'yes',
    declarationUpdatedAt: now,
    groupId: data.groupId,
    profileComplete: true,
    accountStatus: 'active',
    role: 'group_admin',
    approved: true,
    approvedBy: data.superAdminUid,
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await saveDevoteeProfile(adminProfile);

  const rolesData: UserRoles = {
    uid,
    roles: ['group_admin', 'devotee'],
    groupScopes: [data.groupId],
    grantedBy: data.superAdminUid,
    createdAt: now,
    updatedAt: now,
  };
  await saveUserRoles(rolesData);

  return { uid };
}

// ==========================================
// USER ROLES SERVICE
// ==========================================
export async function getUserRoles(uid: string): Promise<UserRoles | null> {
  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'userRoles', uid));
      if (docSnap.exists()) {
        return docSnap.data() as UserRoles;
      }
    } catch (e) {
      console.warn('Firestore getUserRoles error:', e);
    }
  }

  const rolesMap = getLs<Record<string, UserRoles>>(LS_ROLES, {});
  return rolesMap[uid] || null;
}

export async function saveUserRoles(userRoles: UserRoles): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'userRoles', userRoles.uid), userRoles, { merge: true });
      return;
    } catch (e) {
      console.warn('Firestore saveUserRoles error:', e);
    }
  }

  const rolesMap = getLs<Record<string, UserRoles>>(LS_ROLES, {});
  rolesMap[userRoles.uid] = userRoles;
  setLs(LS_ROLES, rolesMap);
}

// ==========================================
// DAILY SĀDHANA SERVICE
// ==========================================
export async function getDailySadhanaRecord(uid: string, localDate: string): Promise<DailySadhana | null> {
  const docId = `${uid}_${localDate}`;

  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'dailySadhana', docId));
      if (docSnap.exists()) {
        return docSnap.data() as DailySadhana;
      }
      return null;
    } catch (e) {
      console.warn('Firestore getDailySadhana error:', e);
    }
  }

  const sadhanaMap = getLs<Record<string, DailySadhana>>(LS_SADHANA, {});
  return sadhanaMap[docId] || null;
}

export async function saveDailySadhanaRecord(
  data: Omit<DailySadhana, 'id' | 'createdAt' | 'updatedAt' | 'isQualifying'>,
  rule: StreakRuleDefinition = DEFAULT_STREAK_RULE
): Promise<DailySadhana> {
  const docId = `${data.uid}_${data.localDate}`;
  const now = new Date().toISOString();
  const isQualifying = isDayQualifying(data, rule);

  const existing = await getDailySadhanaRecord(data.uid, data.localDate);
  const record: DailySadhana = {
    ...data,
    id: docId,
    isQualifying,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'dailySadhana', docId), record, { merge: true });
      return record;
    } catch (e) {
      console.warn('Firestore saveDailySadhana error, using local fallback:', e);
    }
  }

  const sadhanaMap = getLs<Record<string, DailySadhana>>(LS_SADHANA, {});
  sadhanaMap[docId] = record;
  setLs(LS_SADHANA, sadhanaMap);
  return record;
}

export async function getDevoteeSadhanaHistory(
  uid: string,
  startDate?: string,
  endDate?: string
): Promise<DailySadhana[]> {
  if (isFirebaseConfigured && db) {
    try {
      let q = query(
        collection(db, 'dailySadhana'),
        where('uid', '==', uid),
        orderBy('localDate', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((d) => d.data() as DailySadhana);
      return records.filter((r) => {
        if (startDate && r.localDate < startDate) return false;
        if (endDate && r.localDate > endDate) return false;
        return true;
      });
    } catch (e) {
      console.warn('Firestore getDevoteeSadhanaHistory error, using local fallback:', e);
    }
  }

  const sadhanaMap = getLs<Record<string, DailySadhana>>(LS_SADHANA, {});
  const userRecords = Object.values(sadhanaMap).filter((r) => r.uid === uid);

  return userRecords
    .filter((r) => {
      if (startDate && r.localDate < startDate) return false;
      if (endDate && r.localDate > endDate) return false;
      return true;
    })
    .sort((a, b) => b.localDate.localeCompare(a.localDate));
}

// ==========================================
// PRIVATE JOURNAL SERVICE (ENHANCEMENT 4)
// STRICT OWNER-ONLY ISOLATION
// ==========================================
export async function getJournalEntries(ownerUid: string): Promise<JournalEntry[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'journalEntries'),
        where('ownerUid', '==', ownerUid),
        orderBy('entryDate', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
    } catch (e) {
      console.warn('Firestore getJournalEntries error, fallback:', e);
    }
  }

  const allJournals = getLs<JournalEntry[]>(LS_JOURNALS, []);
  // Enforce owner-only filter strictly
  return allJournals
    .filter((j) => j.ownerUid === ownerUid)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
}

export async function createJournalEntry(
  data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JournalEntry> {
  const id = `jrn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'journalEntries', id), entry);
      return entry;
    } catch (e) {
      console.warn('Firestore createJournalEntry error, fallback:', e);
    }
  }

  const allJournals = getLs<JournalEntry[]>(LS_JOURNALS, []);
  allJournals.unshift(entry);
  setLs(LS_JOURNALS, allJournals);
  return entry;
}

export async function updateJournalEntry(
  id: string,
  ownerUid: string,
  updates: Partial<Pick<JournalEntry, 'title' | 'reflectionText' | 'entryDate' | 'optionalReference' | 'tags'>>
): Promise<void> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'journalEntries', id), { ...updates, updatedAt: now });
      return;
    } catch (e) {
      console.warn('Firestore updateJournalEntry error, fallback:', e);
    }
  }

  const allJournals = getLs<JournalEntry[]>(LS_JOURNALS, []);
  const idx = allJournals.findIndex((j) => j.id === id && j.ownerUid === ownerUid);
  if (idx !== -1) {
    allJournals[idx] = { ...allJournals[idx], ...updates, updatedAt: now };
    setLs(LS_JOURNALS, allJournals);
  }
}

export async function deleteJournalEntry(id: string, ownerUid: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'journalEntries', id));
      return;
    } catch (e) {
      console.warn('Firestore deleteJournalEntry error, fallback:', e);
    }
  }

  const allJournals = getLs<JournalEntry[]>(LS_JOURNALS, []);
  const filtered = allJournals.filter((j) => !(j.id === id && j.ownerUid === ownerUid));
  setLs(LS_JOURNALS, filtered);
}

// ==========================================
// MONTHLY GOALS SERVICE (ENHANCEMENT 2)
// ==========================================
export async function getMonthlyGoals(uid: string, monthStr: string): Promise<MonthlyGoal[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(
        collection(db, 'monthlyGoals'),
        where('uid', '==', uid),
        where('effectiveMonth', '==', monthStr)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlyGoal));
    } catch (e) {
      console.warn('Firestore getMonthlyGoals error, fallback:', e);
    }
  }

  const allGoals = getLs<MonthlyGoal[]>(LS_GOALS, []);
  return allGoals.filter((g) => g.uid === uid && g.effectiveMonth === monthStr);
}

export async function saveMonthlyGoal(
  data: Omit<MonthlyGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MonthlyGoal> {
  const id = `goal_${data.uid}_${data.effectiveMonth}_${data.goalType}`;
  const now = new Date().toISOString();
  const goal: MonthlyGoal = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'monthlyGoals', id), goal, { merge: true });
      return goal;
    } catch (e) {
      console.warn('Firestore saveMonthlyGoal error, fallback:', e);
    }
  }

  const allGoals = getLs<MonthlyGoal[]>(LS_GOALS, []);
  const idx = allGoals.findIndex((g) => g.id === id);
  if (idx !== -1) {
    allGoals[idx] = goal;
  } else {
    allGoals.push(goal);
  }
  setLs(LS_GOALS, allGoals);
  return goal;
}

// ==========================================
// REMINDER PREFERENCES SERVICE (ENHANCEMENT 1)
// ==========================================
export async function getReminderPreferences(uid: string): Promise<ReminderPreferences> {
  const defaultPrefs: ReminderPreferences = {
    uid,
    enabled: true,
    preferredTime: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    preferredDays: [0, 1, 2, 3, 4, 5, 6],
    quietHours: { start: '22:00', end: '05:00' },
    browserNotificationEnabled: false,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docSnap = await getDoc(doc(db, 'reminderPreferences', uid));
      if (docSnap.exists()) {
        return docSnap.data() as ReminderPreferences;
      }
    } catch (e) {
      console.warn('Firestore getReminderPreferences error, fallback:', e);
    }
  }

  const prefsMap = getLs<Record<string, ReminderPreferences>>(LS_REMINDERS, {});
  return prefsMap[uid] || defaultPrefs;
}

export async function saveReminderPreferences(prefs: ReminderPreferences): Promise<void> {
  const now = new Date().toISOString();
  const updated = { ...prefs, updatedAt: now };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'reminderPreferences', prefs.uid), updated, { merge: true });
      return;
    } catch (e) {
      console.warn('Firestore saveReminderPreferences error, fallback:', e);
    }
  }

  const prefsMap = getLs<Record<string, ReminderPreferences>>(LS_REMINDERS, {});
  prefsMap[prefs.uid] = updated;
  setLs(LS_REMINDERS, prefsMap);
}

// ==========================================
// ACTIVITY CATEGORIES
// ==========================================
export async function getActivityCategories(): Promise<ActivityCategory[]> {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'activityCategories'), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityCategory));
      }
    } catch (e) {
      console.warn('Firestore getActivityCategories error, fallback:', e);
    }
  }

  return DEFAULT_ACTIVITY_CATEGORIES;
}
