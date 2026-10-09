'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Eye, EyeOff, User, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut as fbSignOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../lib/firebase/config';
import { getDevoteeProfile, getUserRoles } from '../../lib/services/sadhanaService';
import { Role } from '../../lib/types';

type PortalType = 'devotee' | 'group_admin' | 'super_admin';

export default function LoginPage() {
  const router = useRouter();
  const { simulateLoginAs } = useAuth();

  const [portalType, setPortalType] = useState<PortalType>('devotee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Ensure fields are completely cleared whenever switching between portals
  const handlePortalSwitch = (type: PortalType) => {
    setPortalType(type);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  React.useEffect(() => {
    setEmail('');
    setPassword('');
  }, [portalType]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const userEmail = (cred.user.email || '').toLowerCase();
        const uid = cred.user.uid;

        // Verify role authorization based on chosen portal
        if (portalType === 'super_admin') {
          const isDesignated = userEmail === 'nandinigopikadevidasi@gmail.com';
          const uRoles = await getUserRoles(uid);
          const isSuper = isDesignated || uRoles?.roles.includes('super_admin');

          if (!isSuper) {
            await fbSignOut(auth);
            setErrorMsg('⛔ Access Denied: Only authorized Temple Super Administrators may sign in through this portal.');
            setSubmitting(false);
            return;
          }

          router.push('/admin');
          return;
        }

        if (portalType === 'group_admin') {
          const isDesignated = userEmail === 'nandinigopikadevidasi@gmail.com';
          const prof = await getDevoteeProfile(uid);
          const uRoles = await getUserRoles(uid);
          const isAdmin =
            isDesignated ||
            prof?.role === 'group_admin' ||
            prof?.role === 'super_admin' ||
            uRoles?.roles.includes('group_admin') ||
            uRoles?.roles.includes('super_admin');

          if (!isAdmin) {
            await fbSignOut(auth);
            setErrorMsg('⛔ Access Denied: This account is not registered as an Admin (Group Sevak). Devotees should sign in via the Devotee portal.');
            setSubmitting(false);
            return;
          }

          router.push('/admin');
          return;
        }

        // Devotee Portal: Verify approval status
        const devoteeProf = await getDevoteeProfile(uid);
        if (devoteeProf && devoteeProf.approved === false) {
          await fbSignOut(auth);
          setErrorMsg('⏳ Account Pending Approval: Your registration has been received and is awaiting approval by your Group Sevak or Temple Administrator. Please contact your Group Sevak to approve your login.');
          setSubmitting(false);
          return;
        }

        router.push('/dashboard');
      } else {
        // Local mode fallback
        await simulateLoginAs(portalType, cleanEmail);
        router.push(portalType === 'devotee' ? '/dashboard' : '/admin');
      }
    } catch (err: unknown) {
      let msg = 'Invalid email or password.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          msg = 'Incorrect password or email. You can toggle the eye icon to view the characters you typed, or click "Forgot Password?" to reset it.';
        } else if (err.message.includes('auth/user-not-found')) {
          msg = 'No account found with this email. Please check your spelling or register as a devotee.';
        } else if (err.message.includes('auth/too-many-requests')) {
          msg = 'Access temporarily locked due to multiple failed attempts. Please reset your password or try again later.';
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter your registered email address first.');
      return;
    }

    try {
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, email.trim().toLowerCase());
        setInfoMsg('Password reset link sent to ' + email.trim() + '. Please check your inbox.');
      } else {
        setInfoMsg('Password reset instructions generated for ' + email);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-[#E7DBCA] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EE] border border-[#E7DBCA] text-[#B45309] text-2xl flex items-center justify-center mx-auto shadow-xs">
            🕉
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#78350F]">
            {portalType === 'devotee' && 'Devotee Sign In'}
            {portalType === 'group_admin' && 'Admin Sign In'}
            {portalType === 'super_admin' && 'Super Admin Sign In'}
          </h2>
          <p className="text-xs text-[#78716C] max-w-xs mx-auto">
            {portalType === 'devotee' && 'Access your personal sādhana tracker & spiritual journal'}
            {portalType === 'group_admin' && 'Review group progress, approve devotee logins, and pull reports'}
            {portalType === 'super_admin' && 'Temple Master Control: Manage groups, create Admin logins & view all reports'}
          </p>
        </div>

        {/* 3 Portal Selection Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FAF5EE] border border-[#E7DBCA] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => handlePortalSwitch('devotee')}
            className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              portalType === 'devotee'
                ? 'bg-white text-[#B45309] shadow-xs border border-[#E7DBCA]'
                : 'text-[#78716C] hover:text-[#78350F]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Devotee</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('group_admin')}
            className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              portalType === 'group_admin'
                ? 'bg-white text-[#B45309] shadow-xs border border-[#E7DBCA]'
                : 'text-[#78716C] hover:text-[#78350F]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('super_admin')}
            className={`py-2 px-1 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              portalType === 'super_admin'
                ? 'bg-white text-[#B45309] shadow-xs border border-[#E7DBCA]'
                : 'text-[#78716C] hover:text-[#78350F]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {infoMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form key={portalType} onSubmit={handleSignIn} autoComplete="off" className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#78350F] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                key={`email-${portalType}`}
                id={`email-${portalType}`}
                name={`login_${portalType}_email`}
                type="email"
                autoComplete="off"
                required
                placeholder={
                  portalType === 'super_admin'
                    ? 'superadmin@gmail.com'
                    : portalType === 'group_admin'
                    ? 'groupadmin@example.com'
                    : 'devotee@example.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-[#E7DBCA] text-sm text-[#292524] focus:ring-2 focus:ring-[#B45309]"
              />
              <Mail className="w-4 h-4 text-[#78716C] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-[#78350F]">
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-[11px] text-[#B45309] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                key={`password-${portalType}`}
                id={`password-${portalType}`}
                name={`login_${portalType}_password`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            {submitting ? 'Authenticating...' : `Sign In as ${portalType === 'devotee' ? 'Devotee' : portalType === 'group_admin' ? 'Admin' : 'Super Admin'}`}
          </button>
        </form>

        {/* Portal Footer Notices */}
        {portalType === 'devotee' ? (
          <div className="text-center pt-2">
            <p className="text-xs text-[#78716C]">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="text-[#B45309] font-semibold hover:underline">
                Register as Devotee
              </Link>
            </p>
          </div>
        ) : (
          <div className="text-center pt-1 border-t border-[#F3EADA]">
            <p className="text-[11px] text-[#A8A29E] leading-relaxed">
              {portalType === 'group_admin'
                ? 'Admin accounts are created and authorized by the Temple Super Administrator.'
                : 'Super Administrator access is restricted to designated temple authorities.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
