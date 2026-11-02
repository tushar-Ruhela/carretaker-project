"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CaregiverToVerify {
  id: string;
  specialty: string;
  hourly_rate: number;
  experience_years: number;
  bio: string | null;
  languages: string[] | null;
  aadhaar_verified: boolean;
  police_checked: boolean;
  background_verified: boolean;
  rating: number;
  total_reviews: number;
  profile: { full_name: string; email: string; phone: string | null; city: string | null; state: string | null; created_at: string } | null;
}

export default function AdminVerification() {
  const [caregivers, setCaregivers] = useState<CaregiverToVerify[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [selected, setSelected] = useState<CaregiverToVerify | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchCaregivers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('caregiver_profiles')
      .select(`
        id, specialty, hourly_rate, experience_years, bio, languages,
        aadhaar_verified, police_checked, background_verified, rating, total_reviews,
        profile:id (full_name, email, phone, city, state, created_at)
      `)
      .order('id');

    const mapped = (data ?? []).map((c: any) => ({
      ...c,
      profile: Array.isArray(c.profile) ? c.profile[0] : c.profile,
    }));
    setCaregivers(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCaregivers(); }, [fetchCaregivers]);

  const updateVerification = async (id: string, field: string, value: boolean) => {
    setUpdating(true);
    const updates: Record<string, unknown> = { [field]: value };
    if (field === 'aadhaar_verified' && value && selected) {
      // If all three are true, mark background_verified too
    }
    const { error } = await supabase.from('caregiver_profiles').update(updates).eq('id', id);
    if (error) showToast('Error: ' + error.message);
    else {
      showToast(`${field.replace('_', ' ')} updated ✓`);
      fetchCaregivers();
      // Refresh selected
      if (selected && selected.id === id) {
        setSelected(prev => prev ? { ...prev, [field]: value } : null);
      }
    }
    setUpdating(false);
  };

  const fullyVerify = async (id: string) => {
    setUpdating(true);
    const { error } = await supabase.from('caregiver_profiles').update({
      aadhaar_verified: true,
      police_checked: true,
      background_verified: true,
    }).eq('id', id);
    if (error) showToast('Error: ' + error.message);
    else { showToast('Caregiver fully verified ✓'); fetchCaregivers(); setSelected(null); }
    setUpdating(false);
  };

  const getFiltered = () => {
    if (filter === 'pending') return caregivers.filter(c => !c.background_verified || !c.aadhaar_verified || !c.police_checked);
    if (filter === 'verified') return caregivers.filter(c => c.background_verified && c.aadhaar_verified && c.police_checked);
    return caregivers;
  };

  const filtered = getFiltered();
  const pendingCount = caregivers.filter(c => !c.background_verified || !c.aadhaar_verified || !c.police_checked).length;
  const verifiedCount = caregivers.filter(c => c.background_verified && c.aadhaar_verified && c.police_checked).length;

  return (
    <div>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#10b981', color: 'white', padding: '10px 18px', borderRadius: 8, zIndex: 200, fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>Caregiver Verification Queue</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Approve Aadhaar, police check, and background verification for caregivers.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{pendingCount}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>Pending Verification</span>
        </div>
        <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{verifiedCount}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>Fully Verified</span>
        </div>
        <div style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>{caregivers.length}</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>Total Caregivers</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'pending', label: `Pending (${pendingCount})` },
          { key: 'verified', label: `Verified (${verifiedCount})` },
          { key: 'all', label: `All (${caregivers.length})` },
        ].map(t => (
          <button
            key={t.key}
            className={`admin-btn ${filter === t.key ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            onClick={() => setFilter(t.key as 'pending' | 'verified' | 'all')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Caregiver Cards */}
      {loading ? (
        <div style={{ padding: 80, textAlign: 'center' }}><div className="admin-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--admin-text-muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>✅</p>
          <p style={{ fontWeight: 600 }}>No caregivers in this category</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(c => {
            const allVerified = c.aadhaar_verified && c.police_checked && c.background_verified;
            return (
              <div
                key={c.id}
                className="admin-stat-card"
                style={{ cursor: 'pointer', borderTop: `2px solid ${allVerified ? '#10b981' : '#f59e0b'}` }}
                onClick={() => setSelected(c)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
                      {(c.profile?.full_name ?? '?')[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--admin-text)', fontSize: '0.9375rem' }}>{c.profile?.full_name ?? '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{c.specialty}</p>
                    </div>
                  </div>
                  {allVerified ? (
                    <span className="admin-badge admin-badge-green">✓ Verified</span>
                  ) : (
                    <span className="admin-badge admin-badge-orange">⏳ Pending</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span className={`admin-badge ${c.aadhaar_verified ? 'admin-badge-green' : 'admin-badge-red'}`}>
                    {c.aadhaar_verified ? '✓' : '✗'} Aadhaar
                  </span>
                  <span className={`admin-badge ${c.police_checked ? 'admin-badge-green' : 'admin-badge-red'}`}>
                    {c.police_checked ? '✓' : '✗'} Police Check
                  </span>
                  <span className={`admin-badge ${c.background_verified ? 'admin-badge-green' : 'admin-badge-red'}`}>
                    {c.background_verified ? '✓' : '✗'} Background
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>
                  <span>📍 {c.profile?.city ?? '—'}</span>
                  <span>💼 {c.experience_years} yrs</span>
                  <span>💰 ₹{c.hourly_rate}/hr</span>
                  <span>⭐ {c.rating}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Modal */}
      {selected && (
        <div className="admin-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="admin-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="admin-avatar" style={{ width: 52, height: 52, fontSize: '1.125rem' }}>
                  {(selected.profile?.full_name ?? '?')[0]}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--admin-text)' }}>{selected.profile?.full_name}</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>{selected.specialty} · {selected.experience_years} years exp.</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-dim)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Email', value: selected.profile?.email ?? '—' },
                { label: 'Phone', value: selected.profile?.phone ?? '—' },
                { label: 'City', value: selected.profile?.city ?? '—' },
                { label: 'Hourly Rate', value: `₹${selected.hourly_rate}/hr` },
                { label: 'Rating', value: `⭐ ${selected.rating} (${selected.total_reviews} reviews)` },
                { label: 'Languages', value: selected.languages?.join(', ') ?? '—' },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--admin-text)', fontWeight: 500 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {selected.bio && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)', marginBottom: 4, textTransform: 'uppercase' }}>Bio</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', lineHeight: 1.6 }}>{selected.bio}</p>
              </div>
            )}

            {/* Verification Toggles */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Controls</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { field: 'aadhaar_verified', label: 'Aadhaar Verified', value: selected.aadhaar_verified, icon: '🪪' },
                  { field: 'police_checked', label: 'Police Check Cleared', value: selected.police_checked, icon: '🚔' },
                  { field: 'background_verified', label: 'Background Verified', value: selected.background_verified, icon: '✅' },
                ].map(v => (
                  <div key={v.field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: v.value ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${v.value ? 'rgba(16,185,129,0.2)' : 'var(--admin-border)'}` }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span>{v.icon}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text)' }}>{v.label}</span>
                    </div>
                    <button
                      className={`admin-btn ${v.value ? 'admin-btn-success' : 'admin-btn-ghost'}`}
                      style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                      onClick={() => updateVerification(selected.id, v.field, !v.value)}
                      disabled={updating}
                    >
                      {v.value ? '✓ Verified' : 'Approve'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {!(selected.aadhaar_verified && selected.police_checked && selected.background_verified) && (
                <button className="admin-btn admin-btn-primary" onClick={() => fullyVerify(selected.id)} disabled={updating}>
                  ✅ Approve All Verifications
                </button>
              )}
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
