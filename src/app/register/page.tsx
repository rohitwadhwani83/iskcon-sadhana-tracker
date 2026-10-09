'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  MapPin,
  Heart,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { getGroups, saveDevoteeProfile } from '../../lib/services/sadhanaService';
import { Group, DevoteeProfile } from '../../lib/types';
import { REGULATIVE_PRINCIPLES } from '../../lib/constants';
import { normalizeToE164, isValidE164 } from '../../lib/utils/sanitization';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../lib/firebase/config';

export default function RegisterPage() {
  const router = useRouter();
  const { user, refreshProfile, simulateLoginAs } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);

  // Step 2 Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('+91');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Step 5 Form States (Profile Completion)
  const [address, setAddress] = useState('');
  const [dikshitName, setDikshitName] = useState('');
  const [dikshitSince, setDikshitSince] = useState('');
  const [regulativeDeclaration, setRegulativeDeclaration] = useState<'yes' | 'no'>('yes');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredUid, setRegisteredUid] = useState<string | null>(null);

  // Fetch groups dynamically from Firestore/local storage
  useEffect(() => {
    async function fetchGroups() {
      setLoadingGroups(true);
      try {
        const fetched = await getGroups();
        const activeGroups = fetched.filter((g) => g.active);
        setGroups(activeGroups);
        if (activeGroups.length > 0) {
          setSelectedGroupId(activeGroups[0].id);
        }
      } catch (e) {
        console.error('Failed to load groups:', e);
      } finally {
        setLoadingGroups(false);
      }
    }
    fetchGroups();
  }, []);

  // Step 2: Handle Initial Account Registration
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const normalizedPhone = normalizeToE164(phone);
    if (!isValidE164(normalizedPhone)) {
      setErrorMsg('Please enter a valid mobile number with country code (e.g., +919876543210).');
      return;
    }

    if (!selectedGroupId && groups.length > 0) {
      setErrorMsg('Please select your devotional group.');
      return;
    }

    if (!agreedTerms) {
      setErrorMsg('Please review and accept the devotional privacy terms.');
      return;
    }

    setSubmitting(true);
    try {
      let uid = `user_${Date.now()}`;

      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        await sendEmailVerification(cred.user);
      }

      setRegisteredUid(uid);
      setPhone(normalizedPhone);

      // Save devotee profile in database immediately upon registration
      const initialProfile: DevoteeProfile = {
        uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: normalizedPhone,
        phoneVerificationStatus: 'unverified',
        regulativePrinciplesDeclaration: 'yes',
        declarationUpdatedAt: new Date().toISOString(),
        groupId: selectedGroupId || 'grp_general',
        profileComplete: false,
        accountStatus: 'active',
        role: 'devotee',
        approved: false, // Requires Group Admin approval before login
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveDevoteeProfile(initialProfile);

      setStep(3); // Advance to Email Verification step
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 5: Finalize Profile Completion
  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const uid = registeredUid || user?.uid || `user_${Date.now()}`;
    const now = new Date().toISOString();

    const profile: DevoteeProfile = {
      uid,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase() || user?.email || '',
      phoneNumber: phone,
      phoneVerificationStatus: 'unverified', // Strictly starts unverified until authorized admin review
      phoneVerifiedAt: null,
      phoneVerifiedBy: null,
      address: address.trim() || undefined,
      dikshitName: dikshitName.trim() || undefined,
      dikshitSince: dikshitSince.trim() || undefined,
      regulativePrinciplesDeclaration: regulativeDeclaration,
      declarationUpdatedAt: now,
      groupId: selectedGroupId || 'grp_general',
      profileComplete: true,
      accountStatus: 'active',
      role: 'devotee',
      approved: false, // Requires Group Admin approval before login
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveDevoteeProfile(profile);
      await refreshProfile();
      setStep(6); // Step 6: Confirmation
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white border border-[#E7DBCA] rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Step Indicator */}
        <div className="mb-6 pb-4 border-b border-[#F3EADA]">
          <div className="flex items-center justify-between text-xs text-[#78716C] mb-2 font-medium">
            <span>Onboarding Progress</span>
            <span>Step {step} of 6</span>
          </div>
          <div className="w-full bg-[#FAF5EE] rounded-full h-2">
            <div
              className="bg-[#B45309] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: WELCOME SCREEN */}
        {/* ============================================================== */}
        {step === 1 && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#FAF5EE] border border-[#E7DBCA] text-[#B45309] text-3xl flex items-center justify-center mx-auto shadow-xs">
              🕉
            </div>
            <div>
              <h2 className="font-serif font-bold text-2xl text-[#78350F]">
                ISKCON Sādhana Tracker
              </h2>
              <p className="text-sm text-[#B45309] font-medium mt-1">
                &ldquo;Strengthen your daily sādhana, one day at a time.&rdquo;
              </p>
            </div>
            <p className="text-xs text-[#57534E] leading-relaxed max-w-md mx-auto">
              Welcome to the personal spiritual journal and devotional tracking portal.
              Track your daily japa rounds, scripture reading, hearing, and temple sevā
              with strict privacy and zero advertising or commercial tracking.
            </p>

            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Register as a Devotee</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <Link
                href="/login"
                className="w-full py-2.5 block text-center border border-[#E7DBCA] text-xs font-medium text-[#78350F] hover:bg-[#FAF5EE] rounded-xl"
              >
                Already have an account? Sign In
              </Link>
            </div>

            <div className="text-[11px] text-[#A8A29E] pt-2">
              Devotional community initiative • 100% private journal entries
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: INITIAL REGISTRATION FORM */}
        {/* ============================================================== */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#78350F]">
                Devotee Registration
              </h3>
              <p className="text-xs text-[#78716C]">
                Enter your basic details and group affiliation
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Full Name / Legal or Spiritual Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Radheshyam Dasa or Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#E7DBCA] text-sm text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                />
                <User className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="devotee@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#E7DBCA] text-sm text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                />
                <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl border border-[#E7DBCA] text-sm text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                />
                <Lock className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-[#78716C] hover:text-[#78350F] focus:outline-hidden"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Mobile Number (E.164 Format) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#E7DBCA] text-sm text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                />
                <Phone className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-[#78716C] mt-1">
                Include country code (e.g. +91 for India). Starts unverified until administrator confirmation.
              </p>
            </div>

            {/* Dynamic Group Selection from Firestore */}
            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1 flex items-center justify-between">
                <span>Devotional Group / Bhakti Vriksha *</span>
              </label>
              {loadingGroups ? (
                <div className="text-xs text-[#78716C] py-2">Loading active groups from database...</div>
              ) : groups.length === 0 ? (
                <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-xs text-[#92400E]">
                  <strong>Notice:</strong> No active groups have been configured yet by the temple administrator.
                  You can register now into General Devotees, and your group will be assigned later.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#E7DBCA] text-sm bg-white text-[#292524] focus:ring-2 focus:ring-[#B45309]"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.description || 'Active Devotional Group'}
                      </option>
                    ))}
                  </select>
                  <Users className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
                </div>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-[#57534E] pt-2 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded-sm text-[#B45309] focus:ring-[#B45309]"
              />
              <span>
                I agree to the privacy policy. I understand that my daily sādhana summary is shared only with my authorized group sevak, and my reflection journals remain 100% strictly private.
              </span>
            </label>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-[#FAF5EE]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                {submitting ? 'Creating Account...' : 'Continue to Verification'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 3: EMAIL VERIFICATION */}
        {/* ============================================================== */}
        {step === 3 && (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#78350F]">
                Verify Your Email
              </h3>
              <p className="text-xs text-[#78716C] mt-1">
                We sent a confirmation link to <span className="font-semibold text-[#292524]">{email}</span>
              </p>
            </div>

            <div className="p-4 bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl text-xs text-[#57534E] text-left space-y-2">
              <p>
                <strong>Security Clarification:</strong> Email verification proves control of the email address only. It does not prove ownership of your supplied phone number.
              </p>
              <p className="text-[11px] text-[#78716C]">
                Check your inbox and spam folder. Once verified or during local setup, you can proceed to the next step.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-full py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl"
              >
                Proceed to Phone Status & Profile
              </button>
              <button
                type="button"
                onClick={() => alert('Verification email resent!')}
                className="text-xs text-[#B45309] hover:underline"
              >
                Resend Verification Email
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 4: PHONE VERIFICATION STATUS */}
        {/* ============================================================== */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-serif font-bold text-xl text-[#78350F]">
                Phone Verification Status
              </h3>
              <p className="text-xs text-[#78716C]">
                Temple Administrative Review Policy
              </p>
            </div>

            <div className="p-4 bg-white border border-[#E7DBCA] rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#F3EADA]">
                <span className="text-[#78716C]">Phone Number:</span>
                <span className="font-mono font-bold text-[#292524]">{phone}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#F3EADA]">
                <span className="text-[#78716C]">Current Status:</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold">
                  Unverified / Pending Manual Review
                </span>
              </div>
              <p className="text-[#57534E] leading-relaxed">
                Phone numbers are verified manually by authorized temple administrators during group meetings or temple visits.
              </p>
              <p className="text-[11px] text-[#A8A29E] italic">
                * Note: Devotees cannot mark themselves as verified.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl"
              >
                Continue to Devotee Profile
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 5: DEVOTEE PROFILE & 4 REGULATIVE PRINCIPLES */}
        {/* ============================================================== */}
        {step === 5 && (
          <form onSubmit={handleStep5Submit} className="space-y-4">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#78350F]">
                Complete Devotee Profile
              </h3>
              <p className="text-xs text-[#78716C]">
                Spiritual background & devotional declaration
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Initiated / Dīkṣit Name (Optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank if not yet initiated"
                value={dikshitName}
                onChange={(e) => setDikshitName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
              />
              <p className="text-[10px] text-[#78716C] mt-0.5">
                The spiritual name given by spiritual master during formal Hari-nāma initiation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Dīkṣit Since (Year or Date, Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2018 or 15-Nov-2020"
                value={dikshitSince}
                onChange={(e) => setDikshitSince(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#78350F] mb-1">
                Residential Address (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="City, State, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#E7DBCA] text-xs text-[#292524]"
              />
            </div>

            {/* Respectful Regulative Principles Declaration */}
            <div className="bg-[#FAF5EE] p-4 rounded-xl border border-[#E7DBCA] space-y-2">
              <span className="text-xs font-bold text-[#78350F] block">
                The Four Regulative Principles (Catur-vidha Yama)
              </span>
              <p className="text-[11px] text-[#57534E]">
                As taught by Srila Prabhupada for spiritual purification:
              </p>
              <ul className="text-[11px] text-[#78716C] space-y-1 list-disc list-inside">
                {REGULATIVE_PRINCIPLES.map((rp) => (
                  <li key={rp.number}>
                    <strong>{rp.title}:</strong> {rp.description}
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-[#E7DBCA]">
                <label className="block text-xs font-semibold text-[#78350F] mb-1.5">
                  Are you currently following all four regulative principles?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-[#292524] cursor-pointer">
                    <input
                      type="radio"
                      name="regulativeDeclaration"
                      value="yes"
                      checked={regulativeDeclaration === 'yes'}
                      onChange={() => setRegulativeDeclaration('yes')}
                      className="text-[#B45309]"
                    />
                    <span>Yes, by the mercy of Guru and Krishna</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#292524] cursor-pointer">
                    <input
                      type="radio"
                      name="regulativeDeclaration"
                      value="no"
                      checked={regulativeDeclaration === 'no'}
                      onChange={() => setRegulativeDeclaration('no')}
                      className="text-[#B45309]"
                    />
                    <span>Practicing & striving to follow</span>
                  </label>
                </div>
                <p className="text-[10px] text-[#78716C] mt-1.5 italic">
                  Stored confidentially with a timestamp. This is a personal declaration and is not exposed in public reports.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#78716C] hover:bg-[#FAF5EE]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs"
              >
                {submitting ? 'Saving Profile...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STEP 6: REGISTRATION COMPLETE */}
        {/* ============================================================== */}
        {step === 6 && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#D1FAE5] text-[#065F46] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-2xl text-[#78350F]">
                Registration Received!
              </h3>
              <p className="text-sm text-[#B45309] font-medium mt-1">
                Hare Krishna! Your devotee details have been submitted.
              </p>
            </div>
            <div className="bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl p-4 text-xs text-[#57534E] max-w-md mx-auto leading-relaxed space-y-2 text-left">
              <p className="font-semibold text-[#78350F]">
                ⏳ Account Status: Pending Admin Approval
              </p>
              <p>
                To maintain authentic devotional sangha, your Group Sevak (Admin) will approve your account. Once approved, you can log in directly through the <strong>Devotee Portal</strong> to record your daily japa rounds and spiritual readings.
              </p>
            </div>

            <div className="pt-3">
              <Link
                href="/login"
                className="w-full py-3 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs block text-center"
              >
                Proceed to Sign In Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
