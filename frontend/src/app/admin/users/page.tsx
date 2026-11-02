"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'family' | 'caregiver' | 'admin';
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  caregiver_profiles?: {
    specialty: string;
    hourly_rate: number;
    experience_years: number;
    aadhaar_verified: boolean;
    police_checked: boolean;
    background_verified: boolean;
    rating: number;
  } | null;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email, role, phone, city, state, created_at,
        caregiver_profiles (specialty, hourly_rate, experience_years, aadhaar_verified, police_checked, background_verified, rating)
      `)
      .order('created_at', { ascending: false });
    setUsers((data ?? []) as any[]);
    setFiltered((data ?? []) as any[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (search) list = list.filter(u =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city ?? '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [search, roleFilter, users]);

  const makeAdmin = async (userId: string) => {
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
    if (error) showToast('Error: ' + error.message);
    else { showToast('User promoted to admin ✓'); fetchUsers(); setSelectedUser(null); }
    setActionLoading(false);
  };

  const demoteToFamily = async (userId: string) => {
    setActionLoading(true);
    const { error } = await supabase.from('profiles').update({ role: 'family' }).eq('id', userId);
    if (error) showToast('Error: ' + error.message);
    else { showToast('Role updated ✓'); fetchUsers(); setSelectedUser(null); }
    setActionLoading(false);
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { admin: 'purple', caregiver: 'blue', family: 'green' };
    return <span className={`admin-badge admin-badge-${map[role] ?? 'gray'}`}>{role}</span>;
  };

  const stats = {
    total: users.length,
    families: users.filter(u => u.role === 'family').length,
    caregivers: users.filter(u => u.role === 'caregiver').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10b981', color: 'white', padding: '10px 18px', borderRadius: 8, zIndex: 200, fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>User Management</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>View and manage all registered users on the platform.</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: stats.total, color: '#6366f1' },
          { label: 'Families', val: stats.families, color: '#10b981' },
          { label: 'Caregivers', val: stats.caregivers, color: '#3b82f6' },
          { label: 'Admins', val: stats.admins, color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header" style={{ gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>All Users</p>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div className="admin-search-bar" style={{ width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                className="admin-input"
                style={{ border: 'none', background: 'none', padding: 0 }}
                placeholder="Search by name, email, city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="admin-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="family">Families</option>
              <option value="caregiver">Caregivers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="admin-spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Location</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="admin-empty">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>{u.city ? `${u.city}, ${u.state}` : '—'}</td>
                    <td>{u.phone ?? '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                        onClick={() => setSelectedUser(u)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="admin-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>
                  {selectedUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--admin-text)' }}>{selectedUser.full_name}</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-dim)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Role', value: selectedUser.role },
                { label: 'Phone', value: selectedUser.phone ?? '—' },
                { label: 'City', value: selectedUser.city ?? '—' },
                { label: 'State', value: selectedUser.state ?? '—' },
                { label: 'User ID', value: selectedUser.id.slice(0, 8) + '…' },
                { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString('en-IN') },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--admin-text)', fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {selectedUser.caregiver_profiles && (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <p style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 12, fontSize: '0.8125rem' }}>Caregiver Profile</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><span style={{ color: 'var(--admin-text-dim)', fontSize: '0.75rem' }}>Specialty: </span><span style={{ fontSize: '0.8125rem', color: 'var(--admin-text)' }}>{selectedUser.caregiver_profiles.specialty}</span></div>
                  <div><span style={{ color: 'var(--admin-text-dim)', fontSize: '0.75rem' }}>Rate: </span><span style={{ fontSize: '0.8125rem', color: 'var(--admin-text)' }}>₹{selectedUser.caregiver_profiles.hourly_rate}/hr</span></div>
                  <div><span style={{ color: 'var(--admin-text-dim)', fontSize: '0.75rem' }}>Experience: </span><span style={{ fontSize: '0.8125rem', color: 'var(--admin-text)' }}>{selectedUser.caregiver_profiles.experience_years} yrs</span></div>
                  <div><span style={{ color: 'var(--admin-text-dim)', fontSize: '0.75rem' }}>Rating: </span><span style={{ fontSize: '0.8125rem', color: '#fbbf24' }}>⭐ {selectedUser.caregiver_profiles.rating}</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {selectedUser.caregiver_profiles.aadhaar_verified && <span className="admin-badge admin-badge-green">✓ Aadhaar</span>}
                  {selectedUser.caregiver_profiles.police_checked && <span className="admin-badge admin-badge-green">✓ Police</span>}
                  {selectedUser.caregiver_profiles.background_verified && <span className="admin-badge admin-badge-green">✓ Background</span>}
                  {!selectedUser.caregiver_profiles.background_verified && <span className="admin-badge admin-badge-orange">⏳ Pending Verification</span>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {selectedUser.role !== 'admin' && (
                <button className="admin-btn admin-btn-primary" onClick={() => makeAdmin(selectedUser.id)} disabled={actionLoading}>
                  {actionLoading ? '…' : '⬆ Make Admin'}
                </button>
              )}
              {selectedUser.role === 'admin' && (
                <button className="admin-btn admin-btn-ghost" onClick={() => demoteToFamily(selectedUser.id)} disabled={actionLoading}>
                  Demote to Family
                </button>
              )}
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelectedUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
