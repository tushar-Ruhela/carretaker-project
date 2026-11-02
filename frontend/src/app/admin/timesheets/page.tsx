"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Timesheet {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number;
  tasks_completed: string[] | null;
  notes: string | null;
  status: string;
  created_at: string;
  caregiver: { full_name: string; email: string } | null;
  family: { full_name: string } | null;
}

function statusBadge(status: string) {
  const map: Record<string, string> = { approved: 'green', pending: 'orange', disputed: 'red' };
  return <span className={`admin-badge admin-badge-${map[status] ?? 'gray'}`}>{status}</span>;
}

export default function AdminTimesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filtered, setFiltered] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Timesheet | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('timesheets')
      .select(`
        id, date, clock_in, clock_out, hours_worked, tasks_completed, notes, status, created_at,
        caregiver:caregiver_id (full_name, email),
        family:family_id (full_name)
      `)
      .order('date', { ascending: false });

    const mapped = (data ?? []).map((t: any) => ({
      ...t,
      caregiver: Array.isArray(t.caregiver) ? t.caregiver[0] : t.caregiver,
      family: Array.isArray(t.family) ? t.family[0] : t.family,
    }));
    setTimesheets(mapped);
    setFiltered(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

  useEffect(() => {
    let list = timesheets;
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (search) list = list.filter(t =>
      (t.caregiver?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.family?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [statusFilter, search, timesheets]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase.from('timesheets').update({ status: newStatus }).eq('id', id);
    if (error) showToast('Error: ' + error.message);
    else { showToast(`Timesheet ${newStatus} ✓`); fetchTimesheets(); setSelected(null); }
    setUpdating(false);
  };

  const counts = {
    pending: timesheets.filter(t => t.status === 'pending').length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    disputed: timesheets.filter(t => t.status === 'disputed').length,
  };
  const totalHours = filtered.filter(t => t.status === 'approved').reduce((s, t) => s + t.hours_worked, 0);

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10b981', color: 'white', padding: '10px 18px', borderRadius: 8, zIndex: 200, fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>Timesheets</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Review and approve caregiver hour logs submitted for family approval.</p>
      </div>

      {/* Stats */}
      <div className="admin-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Pending Review', value: counts.pending, color: '#f59e0b', icon: '⏳' },
          { label: 'Approved', value: counts.approved, color: '#10b981', icon: '✅' },
          { label: 'Disputed', value: counts.disputed, color: '#ef4444', icon: '⚠️' },
          { label: 'Total Approved Hours', value: `${totalHours.toFixed(1)}h`, color: '#6366f1', icon: '⏱' },
        ].map(s => (
          <div key={s.label} className="admin-stat-card" style={{ borderTop: `2px solid ${s.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--admin-text)' }}>{s.value}</p>
              </div>
              <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', count: timesheets.length },
          { key: 'pending', label: 'Pending', count: counts.pending },
          { key: 'approved', label: 'Approved', count: counts.approved },
          { key: 'disputed', label: 'Disputed', count: counts.disputed },
        ].map(t => (
          <button
            key={t.key}
            className={`admin-btn ${statusFilter === t.key ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label} <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({t.count})</span>
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>{filtered.length} entry{filtered.length !== 1 ? 's' : ''}</p>
          <div className="admin-search-bar" style={{ marginLeft: 'auto', width: 240 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="admin-input" style={{ border: 'none', background: 'none', padding: 0 }} placeholder="Search caregiver or family…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><div className="admin-spinner" /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Caregiver</th>
                  <th>Family</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="admin-empty">No timesheets found</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{t.caregiver?.full_name ?? '—'}</td>
                    <td>{t.family?.full_name ?? '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '0.75rem' }}>{t.clock_in ?? '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{t.clock_out ?? '—'}</td>
                    <td style={{ fontWeight: 700, color: '#34d399' }}>{t.hours_worked}h</td>
                    <td>{statusBadge(t.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {t.status === 'pending' && (
                          <>
                            <button className="admin-btn admin-btn-success" style={{ fontSize: '0.6875rem', padding: '2px 8px' }} onClick={() => updateStatus(t.id, 'approved')} disabled={updating}>Approve</button>
                            <button className="admin-btn admin-btn-danger" style={{ fontSize: '0.6875rem', padding: '2px 8px' }} onClick={() => updateStatus(t.id, 'disputed')} disabled={updating}>Dispute</button>
                          </>
                        )}
                        <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.6875rem', padding: '2px 8px' }} onClick={() => setSelected(t)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="admin-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--admin-text)' }}>Timesheet Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-dim)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Caregiver', value: selected.caregiver?.full_name ?? '—' },
                { label: 'Family', value: selected.family?.full_name ?? '—' },
                { label: 'Date', value: new Date(selected.date).toLocaleDateString('en-IN') },
                { label: 'Hours Worked', value: `${selected.hours_worked} hrs` },
                { label: 'Clock In', value: selected.clock_in ?? '—' },
                { label: 'Clock Out', value: selected.clock_out ?? '—' },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 3, textTransform: 'uppercase' }}>{f.label}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--admin-text)', fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {selected.tasks_completed && selected.tasks_completed.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>Tasks Completed</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.tasks_completed.map((task, i) => <span key={i} className="admin-chip">{task}</span>)}
                </div>
              </div>
            )}

            {selected.notes && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 4, textTransform: 'uppercase' }}>Notes</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>{selected.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {selected.status === 'pending' && (
                <>
                  <button className="admin-btn admin-btn-success" onClick={() => updateStatus(selected.id, 'approved')} disabled={updating}>✅ Approve</button>
                  <button className="admin-btn admin-btn-danger" onClick={() => updateStatus(selected.id, 'disputed')} disabled={updating}>⚠️ Dispute</button>
                </>
              )}
              {selected.status === 'disputed' && (
                <button className="admin-btn admin-btn-success" onClick={() => updateStatus(selected.id, 'approved')} disabled={updating}>✅ Approve Anyway</button>
              )}
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
