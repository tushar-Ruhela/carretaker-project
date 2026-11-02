"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SOSAlert {
  id: string;
  status: string;
  notes: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  resolved_at: string | null;
  caregiver: { full_name: string; email: string; phone: string } | null;
  family: { full_name: string; email: string; phone: string } | null;
}

export default function AdminSOS() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [filtered, setFiltered] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');
  const [selected, setSelected] = useState<SOSAlert | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sos_alerts')
      .select(`
        id, status, notes, location_lat, location_lng, created_at, resolved_at,
        caregiver:caregiver_id (full_name, email, phone),
        family:family_id (full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    const mapped = (data ?? []).map((a: any) => ({
      ...a,
      caregiver: Array.isArray(a.caregiver) ? a.caregiver[0] : a.caregiver,
      family: Array.isArray(a.family) ? a.family[0] : a.family,
    }));
    setAlerts(mapped);
    setFiltered(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    setFiltered(statusFilter === 'all' ? alerts : alerts.filter(a => a.status === statusFilter));
  }, [statusFilter, alerts]);

  const updateAlertStatus = async (id: string, newStatus: string) => {
    setUpdating(true);
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'resolved') updates.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('sos_alerts').update(updates).eq('id', id);
    if (error) showToast('Error: ' + error.message);
    else { showToast(`Alert marked as "${newStatus}" ✓`); fetchAlerts(); setSelected(null); }
    setUpdating(false);
  };

  const counts = {
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  const statusStyle: Record<string, { bg: string; border: string; color: string }> = {
    active:       { bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.25)',    color: '#f87171' },
    acknowledged: { bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.25)',   color: '#fbbf24' },
    resolved:     { bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.25)',   color: '#34d399' },
  };

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10b981', color: 'white', padding: '10px 18px', borderRadius: 8, zIndex: 200, fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>🚨 SOS Alerts</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Monitor and respond to emergency SOS alerts from caregivers on the platform.</p>
      </div>

      {/* Alert Summary Cards */}
      <div className="admin-grid-3" style={{ marginBottom: 24 }}>
        {[
          { key: 'active', label: 'Active Alerts', count: counts.active, icon: '🚨', note: 'Requires immediate action' },
          { key: 'acknowledged', label: 'Acknowledged', count: counts.acknowledged, icon: '👁️', note: 'Being handled' },
          { key: 'resolved', label: 'Resolved', count: counts.resolved, icon: '✅', note: 'Successfully closed' },
        ].map(c => (
          <div
            key={c.key}
            className="admin-stat-card"
            style={{ ...statusStyle[c.key], cursor: 'pointer', borderTop: `2px solid ${statusStyle[c.key].color}` }}
            onClick={() => setStatusFilter(c.key)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: c.key === 'active' && counts.active > 0 ? '#f87171' : 'var(--admin-text)', lineHeight: 1 }}>{c.count}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 6 }}>{c.note}</p>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Alert Banner */}
      {counts.active > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="admin-pulse" />
          <div>
            <p style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9375rem' }}>⚠️ {counts.active} Active SOS Alert{counts.active > 1 ? 's' : ''}!</p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(248,113,113,0.7)', marginTop: 2 }}>Emergency response required. Contact the caregiver immediately.</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'All', count: alerts.length },
          { key: 'active', label: 'Active', count: counts.active },
          { key: 'acknowledged', label: 'Acknowledged', count: counts.acknowledged },
          { key: 'resolved', label: 'Resolved', count: counts.resolved },
        ].map(tab => (
          <button
            key={tab.key}
            className={`admin-btn ${statusFilter === tab.key ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label} <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ padding: 80, textAlign: 'center' }}><div className="admin-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--admin-text-muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>✅</p>
          <p style={{ fontWeight: 600 }}>No {statusFilter !== 'all' ? statusFilter : ''} alerts</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-dim)', marginTop: 4 }}>All clear for now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(alert => {
            const ss = statusStyle[alert.status] ?? statusStyle.resolved;
            return (
              <div
                key={alert.id}
                style={{ background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'transform 0.15s' }}
                onClick={() => setSelected(alert)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: ss.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                      {alert.status === 'active' ? '🚨' : alert.status === 'acknowledged' ? '👁️' : '✅'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: '0.9375rem' }}>
                          {alert.caregiver?.full_name ?? 'Unknown Caregiver'}
                        </span>
                        <span className={`admin-badge admin-badge-${alert.status === 'active' ? 'red' : alert.status === 'acknowledged' ? 'orange' : 'green'}`}>
                          {alert.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                        📞 {alert.caregiver?.phone ?? 'N/A'} · Family: {alert.family?.full_name ?? '—'}
                      </p>
                      {alert.location_lat && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginTop: 4 }}>
                          📍 {alert.location_lat.toFixed(4)}, {alert.location_lng?.toFixed(4)}
                        </p>
                      )}
                      {alert.notes && <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', marginTop: 4 }}>{alert.notes}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>{new Date(alert.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)' }}>{new Date(alert.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(239,68,68,0.2)' }}
                    onClick={e => e.stopPropagation()}>
                    <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }} onClick={() => updateAlertStatus(alert.id, 'acknowledged')} disabled={updating}>
                      👁️ Acknowledge
                    </button>
                    <button className="admin-btn admin-btn-success" style={{ fontSize: '0.8125rem' }} onClick={() => updateAlertStatus(alert.id, 'resolved')} disabled={updating}>
                      ✅ Mark Resolved
                    </button>
                    {alert.caregiver?.phone && (
                      <a href={`tel:${alert.caregiver.phone}`} style={{ textDecoration: 'none' }}>
                        <button className="admin-btn admin-btn-danger" style={{ fontSize: '0.8125rem' }}>📞 Call Now</button>
                      </a>
                    )}
                  </div>
                )}
                {alert.status === 'acknowledged' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(245,158,11,0.2)' }}
                    onClick={e => e.stopPropagation()}>
                    <button className="admin-btn admin-btn-success" style={{ fontSize: '0.8125rem' }} onClick={() => updateAlertStatus(alert.id, 'resolved')} disabled={updating}>
                      ✅ Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
