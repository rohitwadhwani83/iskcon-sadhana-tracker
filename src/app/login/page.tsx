'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../lib/firebase/config';

export default function LoginPage() {
  const router = useRouter();
  const { simulateLoginAs } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);

    try {
      if (isFirebaseConfigured && auth) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
      } else {
        // Local mode fallback
        await simulateLoginAs('devotee', email);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      let msg = 'Invalid email or password.';
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          msg = 'Incorrect password or email. You can toggle the eye icon to view the characters you typed, or click "Forgot Password?" to reset it.';
        } else if (err.message.includes('auth/user-not-found')) {
          msg = 'No devotee account found with this email. Please register first.';
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
        await sendPasswordResetEmail(auth, email);
        setInfoMsg('Password reset link sent to your email.');
      } else {
        setInfoMsg('Password reset instructions generated for ' + email);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-[#E7DBCA] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FAF5EE] border border-[#E7DBCA] text-[#B45309] text-2xl flex items-center justify-center mx-auto shadow-xs">
            🕉
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#78350F]">
            Devotee Sign In
          </h2>
          <p className="text-xs text-[#78716C]">
            Access your personal sādhana tracker & spiritual journal
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#78350F] mb-1">
              Email Address
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-[#B45309] hover:bg-[#92400E] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#78716C]">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="text-[#B45309] font-semibold hover:underline">
              Register as Devotee
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
