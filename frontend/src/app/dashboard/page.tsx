"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const mockVitals = [
  { label: 'Blood Pressure', value: '118/76', status: 'normal', icon: '❤️' },
  { label: 'SpO₂', value: '98%', status: 'normal', icon: '🫁' },
  { label: 'Heart Rate', value: '72 bpm', status: 'normal', icon: '💓' },
  { label: 'Temperature', value: '98.4°F', status: 'normal', icon: '🌡️' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; role: string; full_name?: string; name?: string } | null>(null);
  const [bookings, setBookings] = useState<{ id: string; care_type?: string; start_date?: string; status?: string; caregiver?: { full_name: string }; family?: { full_name: string } }[]>([]);
  const [caregivers, setCaregivers] = useState<{ id: string; full_name?: string; caregiver_profiles?: { specialty?: string; rating?: number }[] }[]>([]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (u) {
      setUser(u);
      // Fetch data
      fetch(`${API}/api/bookings/${u.id}`)
        .then(r => r.ok ? r.json() : []).then(setBookings).catch(() => {});
      fetch(`${API}/api/caregivers`)
        .then(r => r.ok ? r.json() : []).then(setCaregivers).catch(() => {});
    }
  }, []);

  if (!user) return null;
  const displayName = user.full_name || user.name || 'User';
  const isFamily = user.role === 'family';

  const activeBookings = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status || ''));
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-8)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 'var(--sp-1)' }}>Overview</h1>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9375rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {isFamily && (
          <Link href="/dashboard/chatbot" className="btn btn-primary">
            🤖 Ask AI Counsellor
          </Link>
        )}
      </div>

      {/* STATS */}
      <div className="stat-grid">
        {isFamily ? (
          <>
            <div className="stat-card animate-fade-up">
              <div className="stat-icon stat-icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div className="stat-value">{caregivers.length || 3}</div>
                <div className="stat-label">Available caregivers</div>
                <div className="stat-change">↑ 2 new this week</div>
              </div>
            </div>
            <div className="stat-card animate-fade-up delay-1">
              <div className="stat-icon stat-icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div className="stat-value">{activeBookings.length}</div>
                <div className="stat-label">Active bookings</div>
                {pendingCount > 0 && <div className="stat-change" style={{ color: 'var(--warn-500)' }}>{pendingCount} pending approval</div>}
              </div>
            </div>
            <div className="stat-card animate-fade-up delay-2">
              <div className="stat-icon stat-icon-gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <div className="stat-value">₹4.5k</div>
                <div className="stat-label">Monthly spend</div>
                <div className="stat-change">Sep 2026</div>
              </div>
            </div>
            <div className="stat-card animate-fade-up delay-3">
              <div className="stat-icon stat-icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <div className="stat-value">4.8</div>
                <div className="stat-label">Avg caregiver rating</div>
                <div className="stat-change">⭐ Excellent</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card animate-fade-up">
              <div className="stat-icon stat-icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <div className="stat-value">{bookings.length}</div>
                <div className="stat-label">Total bookings</div>
              </div>
            </div>
            <div className="stat-card animate-fade-up delay-1">
              <div className="stat-icon stat-icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div className="stat-value">142</div>
                <div className="stat-label">Hours logged this month</div>
                <div className="stat-change">↑ 18% vs last month</div>
              </div>
            </div>
            <div className="stat-card animate-fade-up delay-2">
              <div className="stat-icon stat-icon-gold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <div className="stat-value">₹71k</div>
                <div className="stat-label">Earned this month</div>
                <div className="stat-change">3 timesheets pending</div>
              </div>
            </div>
            <div className="stat-card animate-fade-up delay-3">
              <div className="stat-icon stat-icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div>
                <div className="stat-value">4.9</div>
                <div className="stat-label">Your rating</div>
                <div className="stat-change">⭐ Top performer</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isFamily ? '1fr 1fr' : '1fr', gap: 'var(--sp-6)' }}>

        {/* Active Bookings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              {isFamily ? 'Your active care' : 'Client bookings'}
            </h2>
            <Link href="/dashboard/bookings" style={{ fontSize: '0.875rem', color: 'var(--forest-600)', fontWeight: 600 }}>View all</Link>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--sp-8) 0', color: 'var(--slate-400)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--sp-3)' }}>📅</div>
              <p style={{ fontWeight: 500 }}>No bookings yet.</p>
              {isFamily && <Link href="/dashboard/caregivers" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--sp-4)', display: 'inline-flex' }}>Find a caregiver</Link>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-3)', background: 'var(--slate-50)', borderRadius: 'var(--r-md)' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: '0.9375rem' }}>
                      {isFamily ? b.caregiver?.full_name : b.family?.full_name}
                    </p>
                    <p style={{ color: 'var(--slate-500)', fontSize: '0.8125rem' }}>{b.care_type} · {b.start_date}</p>
                  </div>
                  <span className={`badge ${b.status === 'confirmed' ? 'badge-green' : b.status === 'pending' ? 'badge-warn' : 'badge-slate'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Family: Vitals Panel | Caregiver: Quick actions */}
        {isFamily ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-5)' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)' }}>Parent's vitals today</h2>
              <span className="badge badge-green">● Live</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
              {mockVitals.map((v) => (
                <div key={v.label} style={{ background: 'var(--forest-50)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4)', border: '1px solid var(--forest-100)' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-2)' }}>{v.icon}</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--forest-700)' }}>{v.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 500 }}>{v.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 'var(--sp-3)', background: 'var(--forest-100)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--forest-700)', fontWeight: 500 }}>All vitals are within normal range. Last updated 11:30 AM.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-5)' }}>Quick actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <Link href="/dashboard/timesheets" className="btn btn-primary" style={{ justifyContent: 'flex-start', gap: 'var(--sp-3)' }}>
                ⏱ Log today's hours
              </Link>
              <Link href="/dashboard/chatbot" className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 'var(--sp-3)' }}>
                🤖 Ask the AI assistant
              </Link>
              <Link href="/dashboard/voice" className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 'var(--sp-3)' }}>
                🎙 Voice support call
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* AI Counsellor promo strip */}
      <div style={{ marginTop: 'var(--sp-6)', background: 'linear-gradient(135deg, var(--forest-900) 0%, var(--forest-700) 100%)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-6) var(--sp-8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-6)', flexWrap: 'wrap' }}>
        <div>
          <p style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1.0625rem', marginBottom: 'var(--sp-1)' }}>🎙 Talk to Priya — AI Counsellor</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Get advice on care plans, dementia support, or emotional guidance — via chat or live voice call.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <Link href="/dashboard/chatbot" className="btn btn-outline btn-sm" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'var(--white)' }}>Chat</Link>
          <Link href="/dashboard/voice" className="btn btn-primary btn-sm" style={{ background: 'var(--white)', color: 'var(--forest-900)' }}>Call now</Link>
        </div>
      </div>
    </div>
  );
}
