"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

const adminNav = [
  { href: '/admin', icon: '▦', label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/bookings', icon: '📅', label: 'Bookings' },
  { href: '/admin/support', icon: '💬', label: 'Support Queries' },
  { href: '/admin/sos', icon: '🚨', label: 'SOS Alerts' },
  { href: '/admin/payments', icon: '💳', label: 'Payments' },
  { href: '/admin/verification', icon: '✅', label: 'Verification Queue' },
  { href: '/admin/timesheets', icon: '⏱', label: 'Timesheets' },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('id', user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setAdminUser(profile);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [router]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    router.push('/');
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="admin-spinner" />
        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 16, fontSize: '0.875rem' }}>Verifying admin access…</p>
      </div>
    </div>
  );

  if (!adminUser) return null;

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        :root {
          --admin-bg: #080d1a;
          --admin-sidebar: #0c1322;
          --admin-sidebar-border: rgba(255,255,255,0.06);
          --admin-card: #111827;
          --admin-card-hover: #161e2e;
          --admin-border: rgba(255,255,255,0.08);
          --admin-accent: #6366f1;
          --admin-accent-glow: rgba(99,102,241,0.35);
          --admin-accent-light: #818cf8;
          --admin-green: #10b981;
          --admin-red: #ef4444;
          --admin-orange: #f59e0b;
          --admin-blue: #3b82f6;
          --admin-purple: #a855f7;
          --admin-text: #f1f5f9;
          --admin-text-muted: rgba(241,245,249,0.45);
          --admin-text-dim: rgba(241,245,249,0.25);
          --r-md: 10px;
          --r-lg: 16px;
        }

        .admin-root {
          display: flex;
          min-height: 100vh;
          background: var(--admin-bg);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--admin-text);
        }

        /* ── SIDEBAR ── */
        .admin-sidebar {
          width: 256px;
          flex-shrink: 0;
          background: var(--admin-sidebar);
          border-right: 1px solid var(--admin-sidebar-border);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 50;
        }

        .admin-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--admin-sidebar-border);
          font-weight: 700;
          font-size: 1rem;
          color: var(--admin-text);
          letter-spacing: -0.02em;
        }

        .admin-logo-badge {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }

        .admin-badge-tag {
          font-size: 0.625rem;
          background: rgba(99,102,241,0.15);
          color: var(--admin-accent-light);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 4px;
          padding: 1px 5px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-left: 4px;
        }

        .admin-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-nav-label {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--admin-text-dim);
          padding: 8px 8px 4px;
          margin-top: 8px;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--admin-text-muted);
          text-decoration: none;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .admin-nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: var(--admin-text);
        }

        .admin-nav-item.active {
          background: rgba(99,102,241,0.12);
          color: var(--admin-accent-light);
          box-shadow: inset 2px 0 0 var(--admin-accent);
        }

        .admin-nav-icon {
          width: 18px;
          text-align: center;
          font-size: 0.875rem;
        }

        .admin-sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--admin-sidebar-border);
        }

        .admin-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
        }

        .admin-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        /* ── MAIN ── */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow-x: hidden;
        }

        .admin-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 60px;
          border-bottom: 1px solid var(--admin-border);
          background: var(--admin-bg);
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(12px);
        }

        .admin-topbar-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--admin-text);
        }

        .admin-topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-page {
          flex: 1;
          padding: 28px;
          overflow-y: auto;
        }

        /* ── STAT CARDS ── */
        .admin-stat-card {
          background: var(--admin-card);
          border: 1px solid var(--admin-border);
          border-radius: var(--r-lg);
          padding: 20px 24px;
          transition: border-color 0.2s, transform 0.2s;
          cursor: default;
        }

        .admin-stat-card:hover {
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }

        /* ── TABLES ── */
        .admin-table-wrap {
          background: var(--admin-card);
          border: 1px solid var(--admin-border);
          border-radius: var(--r-lg);
          overflow: hidden;
        }

        .admin-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--admin-border);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 10px 16px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--admin-text-dim);
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--admin-border);
        }

        .admin-table td {
          padding: 12px 16px;
          font-size: 0.8125rem;
          color: var(--admin-text-muted);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }

        .admin-table tr:last-child td {
          border-bottom: none;
        }

        .admin-table tr:hover td {
          background: rgba(255,255,255,0.025);
          color: var(--admin-text);
        }

        /* ── BADGES ── */
        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .admin-badge-green  { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .admin-badge-red    { background: rgba(239,68,68,0.12);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .admin-badge-orange { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .admin-badge-blue   { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .admin-badge-purple { background: rgba(168,85,247,0.12); color: #c084fc; border: 1px solid rgba(168,85,247,0.2); }
        .admin-badge-gray   { background: rgba(255,255,255,0.06); color: var(--admin-text-muted); border: 1px solid var(--admin-border); }

        /* ── BUTTONS ── */
        .admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .admin-btn-primary {
          background: var(--admin-accent);
          color: white;
          box-shadow: 0 4px 12px var(--admin-accent-glow);
        }

        .admin-btn-primary:hover { background: #5558ea; transform: translateY(-1px); }

        .admin-btn-ghost {
          background: rgba(255,255,255,0.06);
          color: var(--admin-text-muted);
          border: 1px solid var(--admin-border);
        }

        .admin-btn-ghost:hover { background: rgba(255,255,255,0.1); color: var(--admin-text); }

        .admin-btn-danger {
          background: rgba(239,68,68,0.15);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.25);
        }

        .admin-btn-danger:hover { background: rgba(239,68,68,0.25); }

        .admin-btn-success {
          background: rgba(16,185,129,0.15);
          color: #34d399;
          border: 1px solid rgba(16,185,129,0.25);
        }

        .admin-btn-success:hover { background: rgba(16,185,129,0.25); }

        /* ── INPUTS ── */
        .admin-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.875rem;
          color: var(--admin-text);
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }

        .admin-input:focus { border-color: var(--admin-accent); }
        .admin-input::placeholder { color: var(--admin-text-dim); }

        .admin-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          padding: 7px 12px;
          font-size: 0.8125rem;
          color: var(--admin-text);
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }

        /* ── GRID ── */
        .admin-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .admin-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .admin-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

        @media (max-width: 1200px) { .admin-grid-4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px)  { .admin-grid-4, .admin-grid-3, .admin-grid-2 { grid-template-columns: 1fr; } }

        /* ── MISC ── */
        .admin-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(99,102,241,0.2);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: admin-spin 0.7s linear infinite;
          margin: 0 auto;
        }

        @keyframes admin-spin { to { transform: rotate(360deg); } }

        .admin-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--admin-text);
          margin-bottom: 20px;
        }

        .admin-empty {
          text-align: center;
          padding: 48px 24px;
          color: var(--admin-text-dim);
          font-size: 0.875rem;
        }

        .admin-chip {
          display: inline-block;
          padding: 1px 7px;
          background: rgba(255,255,255,0.06);
          border-radius: 20px;
          font-size: 0.6875rem;
          color: var(--admin-text-muted);
        }

        .admin-search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          padding: 6px 12px;
        }

        .admin-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .admin-modal {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .admin-pulse {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--admin-red);
          animation: pulse-dot 1.5s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>

      <div className="admin-root">
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <div className="admin-logo-badge">🛡️</div>
            <div>
              CareConnect
              <span className="admin-badge-tag">Admin</span>
            </div>
          </div>

          <nav className="admin-nav">
            <span className="admin-nav-label">Control Panel</span>
            {adminNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive(item.href, item.exact) ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.label === 'SOS Alerts' && (
                  <span className="admin-pulse" style={{ marginLeft: 'auto' }} />
                )}
              </Link>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-user-card">
              <div className="admin-avatar">{getInitials(adminUser.full_name)}</div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminUser.full_name}</p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)' }}>Administrator</p>
              </div>
              <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-dim)', padding: 4 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-title">
              {adminNav.find(n => isActive(n.href, n.exact))?.label ?? 'Admin Panel'}
            </div>
            <div className="admin-topbar-actions">
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', background: 'rgba(255,255,255,0.04)', padding: '5px 10px', borderRadius: 20, border: '1px solid var(--admin-border)' }}>
                🕒 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                  ← User View
                </button>
              </Link>
            </div>
          </header>
          <main className="admin-page">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
