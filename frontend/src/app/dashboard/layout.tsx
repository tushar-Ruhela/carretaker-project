"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  full_name?: string;
  name?: string;
  role: 'family' | 'caregiver' | 'admin';
  email: string;
  backgroundVerified?: boolean;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const familyNav = [
  { href: '/dashboard', icon: '▦', label: 'Overview' },
  { href: '/dashboard/caregivers', icon: '👥', label: 'Find Caregivers' },
  { href: '/dashboard/bookings', icon: '📅', label: 'Bookings' },
  { href: '/dashboard/timesheets', icon: '⏱', label: 'Timesheets' },
  { href: '/dashboard/payments', icon: '💳', label: 'Payments' },
  { href: '/dashboard/chatbot', icon: '🤖', label: 'AI Counsellor' },
  { href: '/dashboard/voice', icon: '🎙', label: 'Voice Call' },
];

const caregiverNav = [
  { href: '/dashboard', icon: '▦', label: 'Overview' },
  { href: '/dashboard/bookings', icon: '📅', label: 'My Bookings' },
  { href: '/dashboard/timesheets', icon: '⏱', label: 'Log Hours' },
  { href: '/dashboard/chatbot', icon: '🤖', label: 'AI Assistant' },
  { href: '/dashboard/voice', icon: '🎙', label: 'Voice Support' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(3);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userStr));
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    router.push('/');
  }, [router]);

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--forest-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--sp-4)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: 'var(--slate-500)' }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  const displayName = user.full_name || user.name || 'User';
  const navItems = user.role === 'family' ? familyNav : user.role === 'admin' ? familyNav : caregiverNav;

  return (
    <div className="dashboard-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--forest-500)"/>
            <path d="M14 6C10.5 6 8 8.5 8 11.5C8 16 14 22 14 22C14 22 20 16 20 11.5C20 8.5 17.5 6 14 6Z" fill="white"/>
            <circle cx="14" cy="11.5" r="2.5" fill="var(--forest-500)"/>
          </svg>
          CareConnect
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main</span>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {user.role === 'caregiver' && (
            <>
              <span className="sidebar-section-label" style={{ marginTop: 'var(--sp-4)' }}>Status</span>
              <div style={{ padding: '0.625rem var(--sp-3)' }}>
                {user.backgroundVerified ? (
                  <span className="badge badge-green">✓ Verified Caregiver</span>
                ) : (
                  <span className="badge badge-warn">⏳ Pending verification</span>
                )}
              </div>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <span className="sidebar-section-label" style={{ marginTop: 'var(--sp-4)' }}>Administration</span>
              <Link
                href="/admin"
                className="sidebar-item"
                style={{ textDecoration: 'none', background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              >
                <span style={{ fontSize: '1rem', width: 20, textAlign: 'center' }}>🛡️</span>
                <span>Admin Panel</span>
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--forest-600)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
              {getInitials(displayName)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'capitalize' }}>{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'rgba(255,255,255,0.5)', paddingLeft: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="dashboard-main">
        {/* TOPBAR */}
        <header className="topbar">
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span style={{ color: 'var(--forest-700)' }}>{displayName.split(' ')[0]}</span> 👋
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
            {/* SOS button */}
            {user.role === 'caregiver' && (
              <button
                className="btn btn-danger btn-sm"
                style={{ gap: 'var(--sp-2)' }}
                onClick={() => alert('SOS alert triggered — emergency response team notified.')}
              >
                🚨 SOS
              </button>
            )}

            {/* Notification bell */}
            <button style={{ position: 'relative', padding: 'var(--sp-2)', borderRadius: 'var(--r-md)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate-600)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifications > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, background: 'var(--error-500)', borderRadius: '50%', fontSize: '0.625rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{notifications}</span>
              )}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
