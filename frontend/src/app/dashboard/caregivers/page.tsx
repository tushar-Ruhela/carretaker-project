"use client";

import React, { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const mockCaregivers = [
  { id: 'cg-1', full_name: 'Ananya Verma', caregiver_profiles: [{ specialty: 'Dementia & Memory Care', hourly_rate: 500, experience_years: 6, rating: 4.9, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Hindi', 'English'] }] },
  { id: 'cg-2', full_name: 'Rajan Nair', caregiver_profiles: [{ specialty: 'Certified Nursing Assistant', hourly_rate: 400, experience_years: 4, rating: 4.7, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Malayalam', 'Hindi', 'English'] }] },
  { id: 'cg-3', full_name: 'Preethi Subramaniam', caregiver_profiles: [{ specialty: 'Mobility & Physiotherapy Support', hourly_rate: 450, experience_years: 8, rating: 4.8, background_verified: true, aadhaar_verified: true, police_checked: false, languages: ['Tamil', 'English'] }] },
  { id: 'cg-4', full_name: 'Mohammad Iqbal', caregiver_profiles: [{ specialty: 'Live-In Care Specialist', hourly_rate: 350, experience_years: 3, rating: 4.5, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Urdu', 'Hindi', 'English'] }] },
  { id: 'cg-5', full_name: 'Sunita Kumari', caregiver_profiles: [{ specialty: 'Companion & General Care', hourly_rate: 300, experience_years: 5, rating: 4.6, background_verified: false, aadhaar_verified: true, police_checked: false, languages: ['Hindi', 'Bhojpuri'] }] },
  { id: 'cg-6', full_name: 'Dr. Rekha Menon', caregiver_profiles: [{ specialty: 'Advanced Nursing (RN)', hourly_rate: 600, experience_years: 12, rating: 5.0, background_verified: true, aadhaar_verified: true, police_checked: true, languages: ['Malayalam', 'English'] }] },
];

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState(mockCaregivers);
  const [filter, setFilter] = useState('all');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/caregivers`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.length > 0) setCaregivers(d); })
      .catch(() => {});
  }, []);

  const handleBook = async (cg: typeof mockCaregivers[0]) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) return;

    try {
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: user.id,
          caregiverId: cg.id,
          careType: cg.caregiver_profiles[0].specialty,
          startDate: new Date().toISOString().split('T')[0],
          shiftTime: 'morning',
        }),
      });
      if (res.ok) {
        setBookingId(cg.id);
        setShowModal(cg.id);
        setTimeout(() => setShowModal(null), 3000);
      }
    } catch { /* demo mode */ setShowModal(cg.id); setTimeout(() => setShowModal(null), 3000); }
  };

  const specialties = ['all', 'Dementia', 'Nursing', 'Mobility', 'Live-In', 'Companion'];
  const filtered = filter === 'all' ? caregivers : caregivers.filter(c => c.caregiver_profiles[0]?.specialty?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-6)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 'var(--sp-1)' }}>Find a Caregiver</h1>
          <p style={{ color: 'var(--slate-500)' }}>{filtered.length} verified caregivers available near you</p>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
        {specialties.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
          >
            {s === 'all' ? 'All caregivers' : s}
          </button>
        ))}
      </div>

      {/* Caregiver grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 'var(--sp-5)' }}>
        {filtered.map((cg) => {
          const profile = cg.caregiver_profiles?.[0];
          const isBooked = bookingId === cg.id;

          return (
            <div key={cg.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              {showModal === cg.id && (
                <div style={{ position: 'absolute', inset: 0, background: 'var(--forest-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 'var(--r-lg)' }}>
                  <div style={{ textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--sp-2)' }}>✅</div>
                    <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>Booking requested!</p>
                    <p style={{ opacity: 0.8, fontSize: '0.875rem' }}>You'll be notified when confirmed.</p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--forest-600), var(--forest-800))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                    {cg.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 2 }}>{cg.full_name}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>{profile?.specialty}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--forest-700)', fontSize: '1.0625rem' }}>₹{profile?.hourly_rate}<span style={{ color: 'var(--slate-400)', fontWeight: 400, fontSize: '0.8125rem' }}>/hr</span></div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gold-500)', fontWeight: 600 }}>⭐ {profile?.rating?.toFixed(1)}</div>
                </div>
              </div>

              {/* Verification badges */}
              <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
                {profile?.aadhaar_verified && <span className="badge badge-green">Aadhaar ✓</span>}
                {profile?.police_checked && <span className="badge badge-green">Police ✓</span>}
                {profile?.background_verified && <span className="badge badge-green">Verified ✓</span>}
                {!profile?.background_verified && <span className="badge badge-warn">Verification pending</span>}
              </div>

              {/* Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
                <div style={{ padding: 'var(--sp-3)', background: 'var(--slate-50)', borderRadius: 'var(--r-md)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 500 }}>Experience</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)' }}>{profile?.experience_years} years</p>
                </div>
                <div style={{ padding: 'var(--sp-3)', background: 'var(--slate-50)', borderRadius: 'var(--r-md)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 500 }}>Languages</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)' }}>{profile?.languages?.slice(0, 2).join(', ')}</p>
                </div>
              </div>

              <button
                onClick={() => handleBook(cg)}
                className={`btn ${isBooked ? 'btn-outline' : 'btn-primary'}`}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isBooked ? '✓ Booking sent' : 'Request booking'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
