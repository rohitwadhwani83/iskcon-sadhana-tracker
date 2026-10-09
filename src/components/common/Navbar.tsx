'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  Sparkles,
  Calendar,
  BarChart3,
  BookOpen,
  Bell,
  ShieldAlert,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, isGroupAdmin, isSuperAdmin, signOut, simulateLoginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Sparkles },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/monthly', label: 'Monthly', icon: BarChart3 },
    { href: '/journal', label: 'Journal', icon: BookOpen },
    { href: '/reminders', label: 'Reminders', icon: Bell },
  ];

  if (isGroupAdmin || isSuperAdmin) {
    navLinks.push({
      href: '/admin',
      label: 'Admin Portal',
      icon: ShieldAlert,
    });
  }

  return (
    <nav className="bg-[#FAF5EE] border-b border-[#E7DBCA] sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Devotional Title */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#B45309] text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              🕉
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#78350F] tracking-tight block">
                ISKCON Sādhana
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#B45309] tracking-wider block -mt-1">
                Tracker 3.0
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#B45309] text-white shadow-xs'
                        : 'text-[#44403C] hover:bg-[#EFE5D5] hover:text-[#78350F]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Controls & Role Quick Switch */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E7DBCA] bg-white text-xs text-[#57534E] hover:border-[#B45309]"
                >
                  <User className="w-3.5 h-3.5 text-[#B45309]" />
                  <span className="max-w-[120px] truncate font-medium">
                    {profile?.fullName || user.email?.split('@')[0]}
                  </span>
                </Link>

                <button
                  onClick={() => signOut()}
                  title="Sign Out"
                  className="p-1.5 text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-[#78350F] hover:bg-[#EFE5D5]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-[#B45309] text-white hover:bg-[#92400E] shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#78350F] hover:bg-[#EFE5D5]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7DBCA] bg-[#FAF5EE] px-4 pt-3 pb-4 space-y-2">
          {user ? (
            <>
              <div className="pb-2 border-b border-[#E7DBCA]">
                <p className="text-xs text-[#78716C]">Signed in as</p>
                <p className="text-sm font-semibold text-[#78350F]">
                  {profile?.fullName || user.email}
                </p>
              </div>

              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-[#B45309] text-white'
                        : 'text-[#44403C] hover:bg-[#EFE5D5]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-[#E7DBCA] flex justify-between items-center">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#B45309] font-medium"
                >
                  Profile & Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-medium flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg font-medium text-sm text-[#78350F] bg-white border border-[#E7DBCA]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-lg font-medium text-sm text-white bg-[#B45309]"
              >
                Register as a Devotee
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
