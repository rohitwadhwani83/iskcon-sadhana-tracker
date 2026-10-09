'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { DevoteeProfile, Role, UserRoles } from '../types';
import {
  getDevoteeProfile,
  saveDevoteeProfile,
  getUserRoles,
  saveUserRoles,
} from '../services/sadhanaService';
import { normalizeToE164 } from '../utils/sanitization';

interface AuthContextType {
  user: { uid: string; email: string | null; emailVerified: boolean } | null;
  profile: DevoteeProfile | null;
  roles: Role[];
  groupScopes: string[];
  isDevotee: boolean;
  isGroupAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  simulateLoginAs: (role: Role, customEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: ['devotee'],
  groupScopes: [],
  isDevotee: true,
  isGroupAdmin: false,
  isSuperAdmin: false,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
  simulateLoginAs: async () => {},
});

const DEMO_USER_KEY = 'iskcon_st_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ uid: string; email: string | null; emailVerified: boolean } | null>(null);
  const [profile, setProfile] = useState<DevoteeProfile | null>(null);
  const [roles, setRoles] = useState<Role[]>(['devotee']);
  const [groupScopes, setGroupScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (uid: string) => {
    try {
      const prof = await getDevoteeProfile(uid);
      setProfile(prof);

      const userRoles = await getUserRoles(uid);
      if (userRoles) {
        setRoles(userRoles.roles);
        setGroupScopes(userRoles.groupScopes || []);
      } else {
        setRoles(['devotee']);
        setGroupScopes([]);
      }
    } catch (e) {
      console.error('Failed to load user profile/roles:', e);
    }
  };

  const refreshProfile = async () => {
    if (user?.uid) {
      await loadUserData(user.uid);
    }
  };

  useEffect(() => {
    // If Firebase Auth is configured and available
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            emailVerified: fbUser.emailVerified,
          });
          await loadUserData(fbUser.uid);
        } else {
          setUser(null);
          setProfile(null);
          setRoles(['devotee']);
          setGroupScopes([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local demo / development mode
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(DEMO_USER_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            loadUserData(parsed.uid).finally(() => setLoading(false));
            return;
          } catch (e) {
            console.error(e);
          }
        }
      }
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_USER_KEY);
    }
    setUser(null);
    setProfile(null);
    setRoles(['devotee']);
    setGroupScopes([]);
  };

  // Helper for quick testing and local verification without requiring an external Firebase Auth project
  const simulateLoginAs = async (targetRole: Role, customEmail?: string) => {
    setLoading(true);
    const uid = `devotee_${targetRole}_${Date.now().toString(36)}`;
    const email = customEmail || `${targetRole}@sadhana.iskcon.org`;

    const simUser = {
      uid,
      email,
      emailVerified: true,
    };

    const dummyProfile: DevoteeProfile = {
      uid,
      fullName:
        targetRole === 'super_admin'
          ? 'Temple Administrator'
          : targetRole === 'group_admin'
          ? 'Group Sevak'
          : 'Gauranga Dasa',
      email,
      phoneNumber: '+919876543210',
      phoneVerificationStatus: targetRole === 'super_admin' ? 'verified_by_admin' : 'unverified',
      regulativePrinciplesDeclaration: 'yes',
      declarationUpdatedAt: new Date().toISOString(),
      groupId: 'grp_default',
      profileComplete: true,
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const assignedRoles: Role[] =
      targetRole === 'super_admin'
        ? ['super_admin', 'group_admin', 'devotee']
        : targetRole === 'group_admin'
        ? ['group_admin', 'devotee']
        : ['devotee'];

    const userRolesRecord: UserRoles = {
      uid,
      roles: assignedRoles,
      groupScopes: ['grp_default'],
      grantedBy: 'system-init',
      createdAt: new Date().toISOString(),
    };

    await saveDevoteeProfile(dummyProfile);
    await saveUserRoles(userRolesRecord);

    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(simUser));
    }

    setUser(simUser);
    setProfile(dummyProfile);
    setRoles(assignedRoles);
    setGroupScopes(userRolesRecord.groupScopes);
    setLoading(false);
  };

  const isSuperAdmin = roles.includes('super_admin');
  const isGroupAdmin = isSuperAdmin || roles.includes('group_admin');
  const isDevotee = roles.includes('devotee') || (!isSuperAdmin && !isGroupAdmin);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        groupScopes,
        isDevotee,
        isGroupAdmin,
        isSuperAdmin,
        loading,
        refreshProfile,
        signOut,
        simulateLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
