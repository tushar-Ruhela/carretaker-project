"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Booking {
  id: string;
  care_type: string;
  status: string;
  payment_status: string;
  start_date: string;
  end_date: string | null;
  shift_time: string | null;
  total_hours: number | null;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  family: { full_name: string; email: string } | null;
  caregiver: { full_name: string; email: string } | null;
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    confirmed: 'green', in_progress: 'blue', completed: 'gray',
    pending: 'orange', cancelled: 'red', paid: 'green', refunded: 'orange',
  };
  return <span className={`admin-badge admin-badge-${map[status] ?? 'gray'}`}>{status.replace('_', ' ')}</span>;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, care_type, status, payment_status, start_date, end_date, shift_time,
        total_hours, total_amount, notes, created_at,
        family:family_id (full_name, email),
        caregiver:caregiver_id (full_name, email)
      `)
      .order('created_at', { ascending: false });

    const mapped = (data ?? []).map((b: any) => ({
      ...b,
      family: Array.isArray(b.family) ? b.family[0] : b.family,
      caregiver: Array.isArray(b.caregiver) ? b.caregiver[0] : b.caregiver,
    }));
    setBookings(mapped);
    setFiltered(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    let list = bookings;
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
    if (search) list = list.filter(b =>
      (b.family?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (b.caregiver?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      b.care_type.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [statusFilter, search, bookings]);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', bookingId);
    if (error) showToast('Error: ' + error.message);
    else { showToast(`Status updated to "${newStatus}" ✓`); fetchBookings(); setSelected(null); }
    setUpdating(false);
  };

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10b981', color: 'white', padding: '10px 18px', borderRadius: 8, zIndex: 200, fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>Bookings Management</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>View and manage all care bookings on the platform.</p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[{ key: 'all', label: 'All', count: bookings.length }, ...STATUS_OPTIONS.map(s => ({ key: s, label: s.replace('_', ' '), count: statusCounts[s] }))].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`admin-btn ${statusFilter === tab.key ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px', textTransform: 'capitalize' }}
          >
            {tab.label} <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>
            {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="admin-search-bar" style={{ marginLeft: 'auto', width: 260 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="admin-input"
              style={{ border: 'none', background: 'none', padding: 0 }}
              placeholder="Search family, caregiver, type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="admin-spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Family</th>
                  <th>Caregiver</th>
                  <th>Care Type</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="admin-empty">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{b.family?.full_name ?? '—'}</td>
                    <td>{b.caregiver?.full_name ?? '—'}</td>
                    <td><span className="admin-chip">{b.care_type}</span></td>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(b.start_date).toLocaleDateString('en-IN')}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>{statusBadge(b.payment_status)}</td>
                    <td style={{ color: '#34d399', fontWeight: 600 }}>₹{(b.total_amount ?? 0).toLocaleString('en-IN')}</td>
                    <td>
                      <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.75rem', padding: '3px 10px' }} onClick={() => setSelected(b)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selected && (
        <div className="admin-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--admin-text)' }}>Booking Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-dim)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Family', value: selected.family?.full_name ?? '—' },
                { label: 'Caregiver', value: selected.caregiver?.full_name ?? '—' },
                { label: 'Care Type', value: selected.care_type },
                { label: 'Shift Time', value: selected.shift_time ?? '—' },
                { label: 'Start Date', value: new Date(selected.start_date).toLocaleDateString('en-IN') },
                { label: 'End Date', value: selected.end_date ? new Date(selected.end_date).toLocaleDateString('en-IN') : '—' },
                { label: 'Total Hours', value: selected.total_hours ? `${selected.total_hours} hrs` : '—' },
                { label: 'Total Amount', value: `₹${(selected.total_amount ?? 0).toLocaleString('en-IN')}` },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--admin-text)', fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 4, textTransform: 'uppercase' }}>Notes</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>{selected.notes}</p>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`admin-btn ${selected.status === s ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '5px 12px', textTransform: 'capitalize' }}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={updating || selected.status === s}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
