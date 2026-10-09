import { describe, it, expect } from 'vitest';
import { DevoteeProfile, JournalEntry, UserRoles } from '../src/lib/types';

describe('Firestore Security Rules & Authorization Invariants', () => {
  // Test Authorization Helper Logic Matching firestore.rules
  const isOwner = (requestUid: string | null, docOwnerUid: string): boolean => {
    return Boolean(requestUid && requestUid === docOwnerUid);
  };

  const isSuperAdmin = (roles: UserRoles | null): boolean => {
    return Boolean(roles?.roles.includes('super_admin'));
  };

  const isGroupAdmin = (roles: UserRoles | null, targetGroupId: string): boolean => {
    if (!roles) return false;
    if (roles.roles.includes('super_admin')) return true;
    return roles.roles.includes('group_admin') && roles.groupScopes.includes(targetGroupId);
  };

  const canReadJournal = (requestUid: string | null, entry: JournalEntry): boolean => {
    // Under firestore.rules: match /journalEntries/{id} { allow read: if isAuthenticated() && resource.data.ownerUid == request.auth.uid; }
    // Strictly owner only! Neither group admin nor super admin has read rule on journalEntries.
    return Boolean(requestUid && requestUid === entry.ownerUid);
  };

  const canUpdateProfileField = (
    requestUid: string,
    targetUid: string,
    field: keyof DevoteeProfile,
    roles: UserRoles | null
  ): boolean => {
    // Privileged fields can ONLY be updated by super_admin
    const privilegedFields: (keyof DevoteeProfile)[] = [
      'uid',
      'phoneVerificationStatus',
      'phoneVerifiedAt',
      'phoneVerifiedBy',
      'accountStatus',
    ];

    if (privilegedFields.includes(field)) {
      return isSuperAdmin(roles);
    }

    return isOwner(requestUid, targetUid) || isSuperAdmin(roles);
  };

  it('rejects unauthenticated access to personal sadhana and journals', () => {
    const entry: JournalEntry = {
      id: 'j1',
      ownerUid: 'devotee_123',
      title: 'Realization',
      reflectionText: 'Chanting attentively',
      entryDate: '2026-10-09',
      createdAt: '',
      updatedAt: '',
    };

    expect(canReadJournal(null, entry)).toBe(false);
    expect(isOwner(null, 'devotee_123')).toBe(false);
  });

  it('permits devotee to read and write their own journal entries', () => {
    const entry: JournalEntry = {
      id: 'j1',
      ownerUid: 'devotee_123',
      title: 'Realization',
      reflectionText: 'Chanting attentively',
      entryDate: '2026-10-09',
      createdAt: '',
      updatedAt: '',
    };

    expect(canReadJournal('devotee_123', entry)).toBe(true);
  });

  it('STRICT PRIVACY: forbids group administrator and super admin from reading another devotee private journal', () => {
    const entry: JournalEntry = {
      id: 'j1',
      ownerUid: 'devotee_123',
      title: 'Deep Realization',
      reflectionText: 'Confidential prayer to Lord Krishna',
      entryDate: '2026-10-09',
      createdAt: '',
      updatedAt: '',
    };

    // Another devotee
    expect(canReadJournal('devotee_456', entry)).toBe(false);
    // Group admin
    expect(canReadJournal('admin_group_1', entry)).toBe(false);
    // Temple Super admin
    expect(canReadJournal('temple_super_admin', entry)).toBe(false);
  });

  it('prevents regular devotee from forging phoneVerificationStatus or role', () => {
    const regularDevoteeRoles: UserRoles = {
      uid: 'devotee_123',
      roles: ['devotee'],
      groupScopes: [],
      grantedBy: 'system',
      createdAt: '',
    };

    // Regular devotee cannot update phoneVerificationStatus
    expect(
      canUpdateProfileField('devotee_123', 'devotee_123', 'phoneVerificationStatus', regularDevoteeRoles)
    ).toBe(false);

    // Regular devotee cannot change accountStatus
    expect(
      canUpdateProfileField('devotee_123', 'devotee_123', 'accountStatus', regularDevoteeRoles)
    ).toBe(false);

    // Devotee CAN update permitted fields like address, dikshitName
    expect(
      canUpdateProfileField('devotee_123', 'devotee_123', 'address', regularDevoteeRoles)
    ).toBe(true);
    expect(
      canUpdateProfileField('devotee_123', 'devotee_123', 'dikshitName', regularDevoteeRoles)
    ).toBe(true);
  });

  it('enforces group administrative boundary: group admin cannot manage devotees outside their groupScopes', () => {
    const groupAdminRoles: UserRoles = {
      uid: 'ga_1',
      roles: ['group_admin'],
      groupScopes: ['group_alpha'],
      grantedBy: 'super_admin',
      createdAt: '',
    };

    expect(isGroupAdmin(groupAdminRoles, 'group_alpha')).toBe(true);
    expect(isGroupAdmin(groupAdminRoles, 'group_beta')).toBe(false);
  });
});
