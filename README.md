# ISKCON Sādhana Tracker — Version 3.0
### Zero-Cost Architecture: GitHub + Vercel + Firebase (Spark Free Tier: ₹0/Month)

> *"Strengthen your daily sādhana, one day at a time."*

---

## 1. Executive Summary & Zero-Cost Policy

**ISKCON Sādhana Tracker** is a mobile-first Progressive Web App (PWA) built specifically for ISKCON devotees and temple administrations. It provides personal japa tracking, scripture hearing and reading logs, devotional streaks, monthly spiritual summaries, a 100% confidential reflection journal, and a reporting pack for authorized temple administrators.

### Strict ₹0 Budget Architecture
The application runs entirely on verified free-tier services and open-source software:
- **Hosting & Edge Delivery:** Vercel Hobby Tier (100 GB bandwidth, unlimited SSL, global CDN).
- **Authentication:** Firebase Authentication (Spark Plan: up to 50,000 monthly active users for Email/Password).
- **Database:** Cloud Firestore (Spark Plan: 50,000 reads/day, 20,000 writes/day, 1 GB storage).
- **Frontend Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Testing:** Vitest + React Testing Library (18 automated tests passing).
- **Reminders (Enhancement 1):** In-app dashboard notifications & browser Web Notification API (zero recurring cost; no paid WhatsApp, Twilio SMS, or metered cron schedulers).

---

## 2. Strict Isolation Verification

This repository is **completely independent** from any other existing application (including the existing Yatra Management App):
1. **Isolated Directory:** Located independently at `C:\Users\Abcom\.gemini\antigravity\scratch\iskcon-sadhana-tracker`.
2. **Dedicated Git Repository:** Independent Git history; no shared branches, commits, or remotes.
3. **Dedicated Firebase Project:** Uses its own Firebase project ID (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`), independent Firestore collections, and user UIDs.
4. **Independent Vercel Deployment:** Configured to deploy as a distinct Vercel project with independent environment variables.
5. **Zero Shared Runtime/Dependencies:** No shared modules, database tables, or cross-application imports.

---

## 3. Core Features & Enhancements

### 3.1. Guided 6-Step Devotee Registration & Onboarding
- **Step 1: Welcome Screen:** Devotional branding, mission statement, privacy terms.
- **Step 2: Initial Registration:** Full name, email, password, E.164 phone number, dynamic group selection fetched from Firestore.
- **Step 3: Email Verification:** Firebase Auth verification link with resend handling.
- **Step 4: Phone Verification Status:** Clear transparency: phone starts as `unverified` / `pending_manual_review`. Manual verification workflow for authorized administrators (no paid SMS or misleading WhatsApp verification).
- **Step 5: Complete Devotee Profile:** Address, Dīkṣit name, Dīkṣit date, and respectful Four Regulative Principles declaration.
- **Step 6: Completion & Direct to Dashboard:** Instant activation associated with the selected group.

### 3.2. Devotee Sādhana Tracking & Streaks
- **Japa Rounds:** Non-negative integer validation; supports 0 rounds without penalty when unwell; daily targets.
- **Hearing (Śravaṇa):** Duration (min), category (Gītā, Bhāgavatam, Lectures, Kīrtan), speaker, and notes.
- **Reading (Paṭhana):** Duration (min), scripture (Gītā, Bhāgavatam, CC, NOD, etc.), chapters/verses, and notes.
- **Other Devotional Activities:** Morning program / Maṅgala-ārati, Kīrtan, Temple Sevā, BG/SB classes, Deity worship.
- **Deterministic Deduplication:** Database ID is formatted as `${uid}_${localDate}` to guarantee no duplicate records for the same day.
- **Streaks Engine:**
  - *Recording Streak:* Consecutive calendar days with submitted records.
  - *Sādhana Consistency Streak:* Consecutive calendar days meeting the qualifying threshold (e.g., ≥16 rounds + hearing/reading).
  - *Personal Best (Longest Streak):* Historical record across month/year boundaries.

### 3.3. Enhancement 1: Free Daily Reminders
- Zero-cost in-app banner alert when today has not yet been recorded:
  *"Hare Krishna! When convenient, record today's sādhana and reflect on your progress."*
- Devotee preferences: Preferred time, timezone, active days, and quiet hours.
- Browser Web Notification API integration triggered locally on device (no paid push server required).

### 3.4. Enhancement 2: Monthly Spiritual Progress Summaries
- Month & year selector.
- KPIs: Total rounds chanted, average rounds/day, qualifying days percentage, hearing/reading hours.
- Personal spiritual goals tracking (daily rounds, monthly qualifying days).
- Month-over-month comparison trends.
- Private monthly reflection notes.
- Print-friendly layout and PDF export.

### 3.5. Enhancement 3: Temple Reporting Pack
- **Daily Temple Report:** Eligible population, record submissions, qualifying participation %, total rounds chanted, group breakdown.
- **Weekly Group Report:** 7-day trend analysis, unique devotees active, hearing/reading totals.
- **Devotee Consistency Report:** Confidential roster of devotees with consistency streaks, last recorded date, and missing day indicators.
- **Registration Report:** Verification breakdown, group distribution, profile completeness.
- **CWE-1236 Formula Injection Defense:** CSV exports automatically sanitize cells beginning with `=`, `+`, `-`, `@`, `\t`, or `\r`.

### 3.6. Enhancement 4: Private Reflection Journal
- Private journal entries (title, reflection, date, scripture reference, tags).
- Built-in contemplative prompts (*"What did I learn today?", "Which teaching resonated deeply?"*).
- Personal search and tag filters.
- **Strict Least-Privilege Firestore Rules:** Only the owning devotee can read or write their journal entries. Group administrators and temple super administrators cannot view devotees' private journals.

### 3.7. Group Management
- Dynamic group creation and management by authorized temple administrators.
- No hardcoded group names; full support for Bhakti Vrikshas, Youth Forums, and Congregations.
- Clean empty states with administrative setup guidance.

---

## 4. Local Development & Testing

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Setup Instructions
```bash
# 1. Navigate to the project directory
cd iskcon-sadhana-tracker

# 2. Install dependencies (already resolved with npm)
npm install

# 3. Run the automated test suite
npm test

# 4. Start local development server
npm run dev

# 5. Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app includes an **Instant Demo Mode** on the homepage and login page to preview Devotee, Group Sevak, and Super Administrator views without needing active Firebase keys.

---

## 5. Firebase Setup Guide (Free Spark Tier)

### Step 1: Create a Dedicated Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `iskcon-sadhana-tracker`.
3. **DO NOT** attach a billing account; ensure the project is on the free **Spark Plan**.
4. Disable Google Analytics (optional, to keep zero telemetry).

### Step 2: Enable Firebase Authentication
1. Go to **Build > Authentication > Sign-in method**.
2. Enable **Email/Password**.
3. Under **Templates**, configure your customized email verification message.

### Step 3: Create Cloud Firestore Database
1. Go to **Build > Firestore Database > Create Database**.
2. Select your closest region (e.g., `asia-south1` for Mumbai).
3. Start in **Production mode** (Security rules are provided below).

### Step 4: Deploy Firestore Security Rules & Indexes
Install Firebase CLI and deploy the included configuration:
```bash
npm install -g firebase-tools
firebase login
firebase use iskcon-sadhana-tracker
firebase deploy --only firestore:rules,firestore:indexes
```

### Step 5: Provision Initial Super Administrator
Run the secure server-side provisioning script:
```bash
# Set your Firebase Admin credentials or service account path
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Execute provisioning
node scripts/provision-superadmin.mjs temple.admin@iskcon.org
```

---

## 6. Vercel Production Deployment

1. Create a new repository on GitHub: `https://github.com/your-org/iskcon-sadhana-tracker`.
2. Push the code:
   ```bash
   git remote add origin https://github.com/your-org/iskcon-sadhana-tracker.git
   git branch -M main
   git push -u origin main
   ```
3. In [Vercel Dashboard](https://vercel.com/):
   - Click **Add New > Project** and select `iskcon-sadhana-tracker`.
   - Ensure the Framework Preset is set to **Next.js**.
   - Add environment variables from your `.env.example`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - Click **Deploy**.

---

## 7. Automated Test Results

The test suite runs 18 unit and integration tests across 4 categories:
```
✓ tests/rules.test.ts (5 tests)
  - Rejects unauthenticated access
  - Permits devotee read/write on own journal
  - Enforces strict journal privacy from admins
  - Prevents role/phone verification forgery
  - Enforces group administrative boundaries

✓ tests/sanitization.test.ts (5 tests)
  - Prevents CSV formula injection (=, +, -, @, \t, \r)
  - Escapes RFC-4180 internal quotes
  - Generates sanitized export strings
  - Normalizes numbers to E.164 format
  - Validates E.164 phone formats

✓ tests/streak.test.ts (5 tests)
  - Determines qualifying day criteria
  - Calculates streaks across month boundaries
  - Continuous recording and consistency runs
  - Distinguishes unrecorded days from 0-rounds days
  - Handles empty record states

✓ tests/metrics.test.ts (3 tests)
  - Days in month including leap years
  - Monthly rounds, qualifying days, and totals
  - Personal spiritual goal evaluation
```
**Total:** 18 passed / 18 tests (100% pass rate).

---

## 8. License & Attribution

- Open-source MIT License.
- Dedicated to His Divine Grace A.C. Bhaktivedanta Swami Prabhupāda and the worldwide devotee community.
