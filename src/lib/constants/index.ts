import { ActivityCategory, StreakRuleDefinition } from '../types';

export const APP_NAME = 'ISKCON Sādhana Tracker';
export const APP_TAGLINE = 'Strengthen your daily sādhana, one day at a time.';

export const REGULATIVE_PRINCIPLES = [
  {
    number: 1,
    title: 'No Meat-Eating',
    description: 'Respect for all living beings, including abstinence from meat, fish, and eggs.',
  },
  {
    number: 2,
    title: 'No Intoxication',
    description: 'Purity of mind and clarity of consciousness, avoiding alcohol, drugs, and stimulants.',
  },
  {
    number: 3,
    title: 'No Illicit Sex',
    description: 'Chastity and disciplined sensory engagement, practiced within married spiritual life.',
  },
  {
    number: 4,
    title: 'No Gambling',
    description: 'Truthfulness and honest living, avoiding speculation and games of chance.',
  },
];

export const DEFAULT_ACTIVITY_CATEGORIES: ActivityCategory[] = [
  {
    id: 'mangala_arati',
    name: 'Morning Program / Maṅgala-ārati',
    description: 'Attendance or participation in morning devotional service.',
    active: true,
    sortOrder: 1,
    defaultDuration: 45,
  },
  {
    id: 'kirtan',
    name: 'Kīrtan & Harināma',
    description: 'Congregational chanting of the holy names.',
    active: true,
    sortOrder: 2,
    defaultDuration: 30,
  },
  {
    id: 'temple_seva',
    name: 'Temple Sevā',
    description: 'Practical devotional service rendered to the temple or community.',
    active: true,
    sortOrder: 3,
    defaultDuration: 60,
  },
  {
    id: 'bg_class',
    name: 'Bhagavad-gītā Study / Class',
    description: 'Formal class or study circle on Bhagavad-gītā As It Is.',
    active: true,
    sortOrder: 4,
    defaultDuration: 45,
  },
  {
    id: 'sb_class',
    name: 'Śrīmad-Bhāgavatam Class',
    description: 'Morning or evening Śrīmad-Bhāgavatam recitation and discourse.',
    active: true,
    sortOrder: 5,
    defaultDuration: 60,
  },
  {
    id: 'deity_worship',
    name: 'Deity Worship / Pūjā',
    description: 'Altar worship, offering food, or dressing deities.',
    active: true,
    sortOrder: 6,
    defaultDuration: 30,
  },
];

export const DEFAULT_STREAK_RULE: StreakRuleDefinition = {
  minRounds: 16,
  requireHearingOrReading: true,
  requireBothHearingAndReading: false,
};

export const JOURNAL_CONTEMPLATIVE_PROMPTS = [
  'What did I learn today from scripture or lecture?',
  'Which teaching resonated deeply with me today?',
  'What devotional quality would I like to improve?',
  'What am I grateful for in my spiritual journey?',
  'What intention would I like to carry forward tomorrow?',
];

export const MONTHLY_REFLECTION_PROMPTS = [
  'What helped me maintain consistency this month?',
  'What key realizations did I gain from my hearing and reading?',
  'What devotional focus or area of improvement do I commit to for next month?',
];

export const HEARING_TYPES = [
  'Bhagavad-gītā As It Is',
  'Śrīmad-Bhāgavatam Class',
  'Caitanya-caritāmṛta Class',
  'Srila Prabhupada Lecture',
  'Guru Mahārāja Lecture',
  'Devotional Kīrtan & Bhajans',
  'Other Discourses',
];

export const SCRIPTURE_READING_LIST = [
  'Bhagavad-gītā As It Is',
  'Śrīmad-Bhāgavatam',
  'Śrī Caitanya-caritāmṛta',
  'Nectar of Devotion (Bhakti-rasāmṛta-sindhu)',
  'Nectar of Instruction (Upadeśāmṛta)',
  'Śrī Īśopaniṣad',
  'KRSNA, The Supreme Personality of Godhead',
  'Teachings of Queen Kuntī',
  'Other BBT Literature',
];

export const METRIC_DEFINITIONS = {
  recordingParticipation:
    'Percentage of eligible active devotees in a group/temple who submitted a record for the specified date.',
  qualifyingParticipation:
    'Percentage of eligible active devotees whose submitted record met the configured qualifying-day threshold (e.g., minimum rounds + hearing/reading).',
  recordingStreak:
    'Consecutive chronological calendar days on which a devotee submitted a record, without interruption.',
  sadhanaConsistencyStreak:
    'Consecutive chronological calendar days on which the submitted record met the qualifying-day criteria.',
  activeDevotee:
    'A devotee whose accountStatus is "active", email is verified, and is associated with an active group.',
  denominatorRules:
    'The eligible denominator includes all active devotees assigned to the group on that date. Devotees registered mid-period are counted from their registration date.',
  missingRecordTreatment:
    'Missing records are tracked explicitly as unrecorded days; they are not assumed to represent zero activity.',
};
