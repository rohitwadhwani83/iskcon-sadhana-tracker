export type Role = 'devotee' | 'group_admin' | 'super_admin';

export type PhoneVerificationStatus =
  | 'unverified'
  | 'pending_manual_review'
  | 'verified_by_admin'
  | 'rejected_correction_needed';

export type RegulativePrinciplesDeclaration = 'yes' | 'no';

export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export interface DevoteeProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  phoneVerificationStatus: PhoneVerificationStatus;
  phoneVerifiedAt?: string | null;
  phoneVerifiedBy?: string | null;
  phoneVerificationNotes?: string | null;
  address?: string;
  dikshitName?: string;
  dikshitSince?: string;
  regulativePrinciplesDeclaration: RegulativePrinciplesDeclaration;
  declarationUpdatedAt: string;
  groupId: string;
  profileComplete: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface GroupMembership {
  id: string;
  uid: string;
  groupId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: 'active' | 'transferred' | 'inactive';
}

export interface UserRoles {
  uid: string;
  roles: Role[];
  groupScopes: string[]; // Group IDs this user is authorized to administer (for group_admin)
  grantedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityEntrySummary {
  categoryId: string;
  categoryName: string;
  completed: boolean;
  duration?: number;
  notes?: string;
}

export interface DailySadhana {
  id: string; // Deterministic format: `${uid}_${localDate}`
  uid: string;
  localDate: string; // YYYY-MM-DD
  roundsChanted: number;
  hearingCompleted: boolean;
  hearingDuration?: number; // in minutes
  hearingType?: string; // Gita, Bhagavatam, Kirtan, Lecture, etc.
  hearingNotes?: string;
  readingCompleted: boolean;
  readingDuration?: number; // in minutes
  readingBook?: string; // scripture/book title
  readingNotes?: string;
  isQualifying: boolean;
  otherActivities?: ActivityEntrySummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
  defaultDuration?: number;
}

export interface ReminderPreferences {
  uid: string;
  enabled: boolean;
  preferredTime: string; // "HH:MM" e.g., "08:00"
  timezone: string;
  preferredDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  quietHours: {
    start: string; // "22:00"
    end: string;   // "05:00"
  };
  browserNotificationEnabled: boolean;
  updatedAt: string;
}

export interface NotificationConsent {
  uid: string;
  consentStatus: 'opted_in' | 'opted_out';
  consentTimestamp: string;
  consentSource: string;
  unsubscribedAt?: string | null;
}

export type GoalType =
  | 'rounds_daily'
  | 'reading_days_week'
  | 'hearing_days_week'
  | 'qualifying_days_month';

export interface MonthlyGoal {
  id: string;
  uid: string;
  goalType: GoalType;
  targetValue: number;
  effectiveMonth: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  ownerUid: string;
  title: string;
  reflectionText: string;
  entryDate: string; // YYYY-MM-DD
  optionalReference?: string; // scripture, lecture or class reference
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StreakRuleDefinition {
  minRounds: number;
  requireHearingOrReading: boolean;
  requireBothHearingAndReading?: boolean;
}

export interface StreakRuleVersion {
  id: string;
  ruleDefinition: StreakRuleDefinition;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface StreakState {
  currentRecordingStreak: number;
  currentConsistencyStreak: number;
  longestStreak: number;
  activityStreaks: {
    rounds: number;
    hearing: number;
    reading: number;
  };
}

export interface AdminAuditLog {
  id: string;
  actorUid: string;
  actorEmail?: string;
  actionType: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  safeMetadata: Record<string, unknown>;
}

export interface MonthlyReportSummary {
  month: string; // YYYY-MM
  recordedDays: number;
  qualifyingDays: number;
  consistencyPercentage: number;
  totalRounds: number;
  averageRoundsPerRecordedDay: number;
  hearingDays: number;
  totalHearingMinutes: number;
  readingDays: number;
  totalReadingMinutes: number;
  otherActivitiesCount: number;
  currentStreak: number;
  longestStreak: number;
}
