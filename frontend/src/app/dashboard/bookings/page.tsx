"use client";

import React, { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const mockBookings = [
  { id: 'b-1', care_type: 'Dementia Care', start_date: '2026-10-01', status: 'confirmed', caregiver: { full_name: 'Ananya Verma' }, family: { full_name: 'Sharma Family' } },
  { id: 'b-2', care_type: 'Companion Care', start_date: '2026-10-03', status: 'completed', caregiver: { full_name: 'Rajan Nair' }, family: { full_name: 'Mehta Family' } },
  { id: 'b-3', care_type: 'Nursing Assistance', start_date: '2026-10-06', status: 'pending', caregiver: { full_name: 'Dr. Rekha Menon' }, family: { full_name: 'Joshi Family' } },
];

const statusColors: Record<string, string> = {
  confirmed: 'badge-green',
  completed: 'badge-slate',
  pending: 'badge-warn',
  cancelled: 'badge-red',
  in_progress: 'badge-blue',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState(mockBookings);
  const [tab, setTab] = useState<'all' | 'active' | 'completed'>('all');
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setUser(u);
    if (u) {
      fetch(`${API}/api/bookings/${u.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && d.length > 0) setBookings(d); })
        .catch(() => {});
    }
  }, []);

  const filtered = bookings.filter(b => {
    if (tab === 'active') return ['pending', 'confirmed', 'in_progress'].includes(b.status);
    if (tab === 'completed') return ['completed', 'cancelled'].includes(b.status);
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-6)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 'var(--sp-1)' }}>Bookings</h1>
          <p style={{ color: 'var(--slate-500)' }}>{bookings.length} total bookings</p>
        </div>
        {user?.role === 'family' && (
          <a href="/dashboard/caregivers" className="btn btn-primary">+ New booking</a>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--sp-6)', background: 'var(--slate-100)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content' }}>
        {(['all', 'active', 'completed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'calc(var(--r-md) - 2px)',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: tab === t ? 'var(--white)' : 'transparent',
              color: tab === t ? 'var(--slate-900)' : 'var(--slate-500)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
              cursor: 'pointer',
              border: 'none',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--sp-16)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-4)' }}>📅</div>
          <p style={{ fontWeight: 600, color: 'var(--slate-600)', marginBottom: 'var(--sp-4)' }}>No bookings in this view.</p>
          {user?.role === 'family' && <a href="/dashboard/caregivers" className="btn btn-primary">Find a caregiver</a>}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{user?.role === 'family' ? 'Caregiver' : 'Family'}</th>
                  <th>Care type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--forest-100)', color: 'var(--forest-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {(user?.role === 'family' ? b.caregiver?.full_name : b.family?.full_name)?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{user?.role === 'family' ? b.caregiver?.full_name : b.family?.full_name}</span>
                      </div>
                    </td>
                    <td>{b.care_type}</td>
                    <td>{new Date(b.start_date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`badge ${statusColors[b.status] || 'badge-slate'}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                        {b.status === 'pending' && user?.role === 'family' && (
                          <button className="btn btn-sm btn-primary">Confirm</button>
                        )}
                        {b.status === 'confirmed' && (
                          <button className="btn btn-sm btn-outline">View details</button>
                        )}
                        {b.status === 'completed' && (
                          <button className="btn btn-sm btn-gold">Leave review</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
