"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalFamilies: number;
  totalCaregivers: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  activeSOS: number;
  pendingVerification: number;
  chatSessions: number;
}

interface RecentBooking {
  id: string;
  care_type: string;
  status: string;
  total_amount: number;
  created_at: string;
  family: { full_name: string } | null;
  caregiver: { full_name: string } | null;
}

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="admin-stat-card" style={{ borderTop: `2px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{ width: 42, height: 42, background: `${color}18`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: 'green', in_progress: 'blue', completed: 'gray', pending: 'orange', cancelled: 'red',
    active: 'red', acknowledged: 'orange', resolved: 'green',
    captured: 'green', failed: 'red', refunded: 'orange',
  };
  const cls = map[status] ?? 'gray';
  return <span className={`admin-badge admin-badge-${cls}`}>{status.replace('_', ' ')}</span>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          { count: totalUsers },
          { count: totalFamilies },
          { count: totalCaregivers },
          { count: totalBookings },
          { count: activeBookings },
          { count: pendingBookings },
          { data: paymentsData },
          { count: activeSOS },
          { count: pendingVerification },
          { count: chatSessions },
          { data: bookings },
          { data: users },
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'family'),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'caregiver'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('payments').select('amount').eq('status', 'captured'),
          supabase.from('sos_alerts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('caregiver_profiles').select('id', { count: 'exact', head: true }).eq('background_verified', false),
          supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('id, care_type, status, total_amount, created_at, family:family_id(full_name), caregiver:caregiver_id(full_name)').order('created_at', { ascending: false }).limit(6),
          supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(6),
        ]);

        const totalRevenue = (paymentsData ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

        setStats({
          totalUsers: totalUsers ?? 0,
          totalFamilies: totalFamilies ?? 0,
          totalCaregivers: totalCaregivers ?? 0,
          totalBookings: totalBookings ?? 0,
          activeBookings: activeBookings ?? 0,
          pendingBookings: pendingBookings ?? 0,
          totalRevenue,
          activeSOS: activeSOS ?? 0,
          pendingVerification: pendingVerification ?? 0,
          chatSessions: chatSessions ?? 0,
        });

        setRecentBookings((bookings ?? []).map((b: any) => ({
          ...b,
          family: Array.isArray(b.family) ? b.family[0] : b.family,
          caregiver: Array.isArray(b.caregiver) ? b.caregiver[0] : b.caregiver,
        })));
        setRecentUsers(users ?? []);
      } catch (e) {
        console.error('Admin dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="admin-spinner" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Real-time overview of your CareConnect platform.</p>
      </div>

      {/* Alert Banner — SOS */}
      {stats && stats.activeSOS > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="admin-pulse" />
          <span style={{ fontSize: '0.875rem', color: '#f87171', fontWeight: 600 }}>
            {stats.activeSOS} active SOS alert{stats.activeSOS > 1 ? 's' : ''} require immediate attention!
          </span>
          <Link href="/admin/sos" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
            <button className="admin-btn admin-btn-danger" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>View Alerts →</button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <>
          <div className="admin-grid-4" style={{ marginBottom: 24 }}>
            <StatCard icon="👥" label="Total Users"       value={stats.totalUsers}                         sub={`${stats.totalFamilies} families · ${stats.totalCaregivers} caregivers`} color="#6366f1" />
            <StatCard icon="📅" label="Total Bookings"    value={stats.totalBookings}                      sub={`${stats.activeBookings} active · ${stats.pendingBookings} pending`}     color="#3b82f6" />
            <StatCard icon="💰" label="Total Revenue"     value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} sub="Captured payments"                                              color="#10b981" />
            <StatCard icon="🚨" label="Active SOS"        value={stats.activeSOS}                          sub="Requires action"                                                         color="#ef4444" />
          </div>
          <div className="admin-grid-4" style={{ marginBottom: 32 }}>
            <StatCard icon="✅" label="Pending Verif."  value={stats.pendingVerification}  sub="Caregivers to verify"   color="#f59e0b" />
            <StatCard icon="💬" label="Chat Sessions"   value={stats.chatSessions}         sub="AI counselling sessions" color="#a855f7" />
            <StatCard icon="🏥" label="In-Progress"     value={stats.activeBookings}       sub="Active bookings now"    color="#06b6d4" />
            <StatCard icon="⏳" label="Pending Actions" value={stats.pendingBookings}      sub="Awaiting confirmation"   color="#f97316" />
          </div>
        </>
      )}

      {/* Recent Data Grid */}
      <div className="admin-grid-2" style={{ alignItems: 'start' }}>
        {/* Recent Bookings */}
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>Recent Bookings</p>
            <Link href="/admin/bookings" style={{ textDecoration: 'none' }}>
              <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>View all</button>
            </Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Family</th>
                <th>Caregiver</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty">No bookings yet</td></tr>
              ) : recentBookings.map(b => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{b.family?.full_name ?? '—'}</td>
                  <td>{b.caregiver?.full_name ?? '—'}</td>
                  <td><span className="admin-chip">{b.care_type}</span></td>
                  <td>{statusBadge(b.status)}</td>
                  <td style={{ color: '#34d399' }}>₹{(b.total_amount ?? 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Users */}
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>New Users</p>
            <Link href="/admin/users" style={{ textDecoration: 'none' }}>
              <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>View all</button>
            </Link>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan={4} className="admin-empty">No users yet</td></tr>
              ) : recentUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{u.full_name}</td>
                  <td style={{ fontSize: '0.75rem' }}>{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-purple' : u.role === 'caregiver' ? 'admin-badge-blue' : 'admin-badge-green'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem' }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
