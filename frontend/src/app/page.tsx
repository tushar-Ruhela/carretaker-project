"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const stats = [
  { value: '12,400+', label: 'Families Served' },
  { value: '3,200+', label: 'Verified Caregivers' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '28 States', label: 'Across India' },
];

const careTypes = [
  { icon: '🧠', title: 'Dementia & Memory Care', desc: 'Trained specialists in cognitive decline support and daily routines management.' },
  { icon: '🩺', title: 'Nursing Assistance', desc: 'Medication administration, wound care, vitals monitoring by certified nurses.' },
  { icon: '🚶', title: 'Mobility Support', desc: 'Physiotherapy assistance, fall prevention, and daily exercise routines.' },
  { icon: '🤝', title: 'Companion Care', desc: 'Social engagement, meal preparation, and emotional companionship.' },
  { icon: '🌙', title: '24-Hour Live-In', desc: 'Round-the-clock professional care and emergency response.' },
  { icon: '🌐', title: 'NRI Remote Monitoring', desc: 'Dashboard access, daily reports, and video calls — wherever you are.' },
];

const steps = [
  {
    title: 'Share your needs',
    desc: 'Tell us about your parent\'s health, location, and the level of care required. Takes 3 minutes.',
  },
  {
    title: 'Get matched',
    desc: 'Our system finds Aadhaar-verified, police-checked caregivers in your locality.',
  },
  {
    title: 'Book and monitor',
    desc: 'Approve shifts, track timesheets, and pay securely — all from your dashboard.',
  },
];

const testimonials = [
  {
    name: 'Radhika Menon',
    location: 'Sydney → Bangalore',
    text: 'My mother has Alzheimer\'s and I was terrified being abroad. CareConnect gave me real daily updates and a carer who truly understood dementia. It changed everything.',
    avatar: 'RM',
  },
  {
    name: 'Arjun Patel',
    location: 'London → Ahmedabad',
    text: 'The NRI dashboard is incredibly well thought out. I can approve my father\'s caregiver\'s hours and pay directly from the UK. No middlemen, full transparency.',
    avatar: 'AP',
  },
  {
    name: 'Priya & Suresh Iyer',
    location: 'Toronto → Chennai',
    text: 'We went through three agencies before finding CareConnect. The background verification process actually means something here — our caregiver has been with us 14 months.',
    avatar: 'PS',
  },
];

const plans = [
  {
    name: 'Companion',
    price: '₹300',
    unit: '/hr',
    desc: 'For families who need regular social support and light assistance.',
    features: ['General mobility assistance', 'Medication reminders', 'Meal preparation', 'Companionship & activities', 'Daily report to family'],
    cta: 'Start with Companion',
    highlight: false,
  },
  {
    name: 'Specialized Care',
    price: '₹500',
    unit: '/hr',
    desc: 'For complex medical and cognitive needs requiring trained professionals.',
    features: ['Everything in Companion', 'Dementia & memory care', 'Advanced nursing support', 'Vitals monitoring', 'Physiotherapy assistance', 'Emergency SOS response'],
    cta: 'Get Specialized Care',
    highlight: true,
  },
  {
    name: 'Live-In Care',
    price: '₹18,000',
    unit: '/mo',
    desc: 'Round-the-clock presence for families who need continuous care.',
    features: ['24-hour caregiver presence', 'Overnight monitoring', 'All Specialized features', 'Monthly family review calls', 'Substitute carer coverage'],
    cta: 'Enquire about Live-In',
    highlight: false,
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* NAV */}
      <nav className="nav" style={{ boxShadow: scrolled ? 'var(--shadow-sm)' : 'none' }}>
        <div className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--forest-600)"/>
            <path d="M14 6C10.5 6 8 8.5 8 11.5C8 16 14 22 14 22C14 22 20 16 20 11.5C20 8.5 17.5 6 14 6Z" fill="white"/>
            <circle cx="14" cy="11.5" r="2.5" fill="var(--forest-600)"/>
          </svg>
          CareConnect
        </div>
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#care-types">Care types</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#nri">For NRI families</a></li>
        </ul>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/login" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(160deg, var(--forest-50) 0%, #f8fafc 60%)' }}>
        <div className="hero">
          <div className="animate-fade-up">
            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
              <span className="badge badge-green">● Live across 28 states</span>
              <span className="badge badge-gold">⭐ 98% satisfaction</span>
            </div>

            <h1 className="hero-headline">
              Your parents deserve<br/>
              care that feels like{' '}
              <span className="hero-green">family.</span>
            </h1>

            <p className="hero-sub">
              India's most trusted network of Aadhaar-verified caregivers. 
              Purpose-built for NRI families who need real-time peace of mind from anywhere in the world.
            </p>

            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-8)' }}>
              <Link href="/login" className="btn btn-primary btn-lg">
                Find a caregiver
              </Link>
              <a href="#how-it-works" className="btn btn-outline btn-lg">
                See how it works
              </a>
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp-5)', flexWrap: 'wrap' }}>
              {['Aadhaar eKYC', 'Police checked', 'DPDP compliant', '24/7 SOS'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--forest-500)" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero image / visual */}
          <div className="animate-fade-up delay-2" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%', maxWidth: 440,
              background: 'linear-gradient(145deg, var(--forest-900) 0%, var(--forest-800) 100%)',
              borderRadius: 'var(--r-xl)',
              padding: 'var(--sp-8)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(74,222,128,0.15) 0%, transparent 60%)' }}/>
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Mock dashboard card */}
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-3)' }}>Today's Care</p>
                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-5)', marginBottom: 'var(--sp-4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                    <div>
                      <p style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1.1rem' }}>Ananya Sharma</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Dementia Specialist · 6 yrs exp</p>
                    </div>
                    <span className="badge badge-green">Active</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}>
                    {[['09:00', 'Clock-in'], ['8.5 hrs', 'Shift'], ['4.8 ★', 'Rating']].map(([v, l]) => (
                      <div key={l}>
                        <p style={{ color: 'var(--white)', fontWeight: 700, fontSize: '1rem' }}>{v}</p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 'var(--sp-4)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: 'var(--sp-2)' }}>Daily vitals — updated 11:30 AM</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                    {[['Blood Pressure', '118/76', 'green'], ['SpO2', '98%', 'green'], ['Heart Rate', '72 bpm', 'gold'], ['Mood', 'Calm', 'green']].map(([label, val, color]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{label}</span>
                        <span style={{ color: color === 'green' ? 'var(--forest-400)' : 'var(--gold-400)', fontWeight: 700, fontSize: '0.875rem' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button style={{ width: '100%', padding: '0.75rem', background: 'rgba(220,252,231,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 'var(--r-md)', color: 'var(--forest-400)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  🎙 Talk to Priya, AI Counsellor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ borderTop: '1px solid var(--slate-200)', borderBottom: '1px solid var(--slate-200)', background: 'var(--white)' }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: 'var(--sp-6) 0' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: 'var(--sp-3)', borderRight: i < 3 ? '1px solid var(--slate-200)' : 'none' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--forest-700)' }}>{s.value}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: 'var(--sp-24) 0', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto var(--sp-12)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--slate-900)', marginBottom: 'var(--sp-3)' }}>Three steps to trusted care</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '1.0625rem', lineHeight: 1.7 }}>From discovery to daily monitoring — the entire process is designed to be transparent and stress-free.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--sp-8)' }}>
            {steps.map((step, i) => (
              <div key={i} className="card" style={{ borderTop: '3px solid var(--forest-500)', paddingTop: 'var(--sp-6)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--forest-100)', color: 'var(--forest-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', marginBottom: 'var(--sp-4)' }}>{i + 1}</div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-2)' }}>{step.title}</h3>
                <p style={{ color: 'var(--slate-500)', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARE TYPES */}
      <section id="care-types" style={{ padding: 'var(--sp-24) 0', background: 'var(--forest-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto var(--sp-12)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--slate-900)', marginBottom: 'var(--sp-3)' }}>Every need, covered</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '1.0625rem' }}>Our caregivers are matched to your specific situation — not just their availability.</p>
          </div>
          <div className="grid-3">
            {careTypes.map((c, i) => (
              <div key={i} className="card" style={{ cursor: 'default' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: 'var(--sp-3)' }}>{c.icon}</div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-2)' }}>{c.title}</h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.9375rem', lineHeight: 1.65 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR NRI FAMILIES */}
      <section id="nri" style={{ padding: 'var(--sp-24) 0', background: 'var(--forest-900)', color: 'var(--white)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-16)', alignItems: 'center' }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: 'var(--sp-4)', display: 'inline-flex' }}>Built for NRI families</span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', marginBottom: 'var(--sp-5)', lineHeight: 1.2 }}>Living abroad shouldn't mean worrying at home.</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.0625rem', lineHeight: 1.75, marginBottom: 'var(--sp-6)' }}>
                Our NRI dashboard gives you full visibility into your parent's daily care. Approve timesheets, view health vitals, make payments in INR or USD, and connect directly with your caregiver — from Singapore, London, or Toronto.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-8)' }}>
                {['Live timesheet approvals', 'Daily vitals delivered to your inbox', 'Secure international payments via Razorpay', 'WhatsApp & video call access to your caregiver', 'Instant SOS alerts on your phone'].map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--forest-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9375rem' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/login" className="btn btn-primary">
                Open your NRI dashboard
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-8)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--sp-5)' }}>NRI Dashboard Preview</p>
              {[['Caregiver active', 'Ananya clocked in 09:00 AM', 'green'], ['Payment processed', '₹4,500 for Oct 1–5 approved', 'gold'], ['Vitals normal', 'BP 118/76 · SpO₂ 98%', 'green'], ['SOS system', 'All clear · 24/7 monitoring', 'green']].map(([title, detail, color]) => (
                <div key={title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color === 'green' ? 'var(--forest-400)' : 'var(--gold-400)', flexShrink: 0 }}/>
                  <div>
                    <p style={{ color: 'var(--white)', fontWeight: 600, fontSize: '0.9375rem' }}>{title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8125rem' }}>{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: 'var(--sp-24) 0', background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto var(--sp-12)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--slate-900)', marginBottom: 'var(--sp-3)' }}>Transparent, honest pricing</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: '1.0625rem' }}>No hidden agency fees. You pay for verified hours, nothing more.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--sp-6)', maxWidth: 1000, margin: '0 auto' }}>
            {plans.map((p, i) => (
              <div key={i} className="card" style={p.highlight ? { background: 'var(--forest-900)', color: 'var(--white)', borderColor: 'transparent', boxShadow: 'var(--shadow-xl)', transform: 'scale(1.04)' } : {}}>
                {p.highlight && (
                  <span className="badge badge-green" style={{ marginBottom: 'var(--sp-4)', display: 'inline-flex' }}>Most chosen</span>
                )}
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: p.highlight ? 'var(--white)' : 'var(--slate-900)', marginBottom: 'var(--sp-2)' }}>{p.name}</h3>
                <p style={{ fontSize: '0.875rem', color: p.highlight ? 'rgba(255,255,255,0.55)' : 'var(--slate-500)', marginBottom: 'var(--sp-5)', lineHeight: 1.5 }}>{p.desc}</p>
                <div style={{ marginBottom: 'var(--sp-6)' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 800, color: p.highlight ? 'var(--forest-400)' : 'var(--forest-700)' }}>{p.price}</span>
                  <span style={{ fontSize: '0.9375rem', color: p.highlight ? 'rgba(255,255,255,0.5)' : 'var(--slate-400)' }}>{p.unit}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)' }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.875rem', color: p.highlight ? 'rgba(255,255,255,0.75)' : 'var(--slate-600)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.highlight ? 'var(--forest-400)' : 'var(--forest-500)'} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`btn ${p.highlight ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: 'var(--sp-24) 0', background: 'var(--slate-50)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.25rem', color: 'var(--slate-900)', marginBottom: 'var(--sp-10)', textAlign: 'center' }}>What families say</h2>
          <div className="grid-3">
            {testimonials.map((t, i) => (
              <div key={i} className="card card-elevated">
                <p style={{ fontSize: '0.9375rem', color: 'var(--slate-600)', lineHeight: 1.75, marginBottom: 'var(--sp-5)', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--forest-700)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.9375rem' }}>{t.name}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ padding: 'var(--sp-20) 0', background: 'linear-gradient(135deg, var(--forest-700) 0%, var(--forest-900) 100%)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--white)', marginBottom: 'var(--sp-4)' }}>Start with a free consultation.</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.125rem', marginBottom: 'var(--sp-8)', maxWidth: 480, margin: '0 auto var(--sp-8)' }}>
            Talk to our AI counsellor Priya, or speak with a real care advisor — whichever you prefer.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary btn-lg" style={{ background: 'var(--white)', color: 'var(--forest-800)' }}>
              Get matched for free
            </Link>
            <Link href="/login" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'var(--white)' }}>
              🎙 Talk to Priya
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: 'var(--slate-900)', padding: 'var(--sp-10) 0 var(--sp-6)', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-8)', flexWrap: 'wrap', gap: 'var(--sp-6)' }}>
            <div>
              <div className="nav-logo" style={{ marginBottom: 'var(--sp-3)', color: 'var(--white)' }}>
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="8" fill="var(--forest-600)"/>
                  <path d="M14 6C10.5 6 8 8.5 8 11.5C8 16 14 22 14 22C14 22 20 16 20 11.5C20 8.5 17.5 6 14 6Z" fill="white"/>
                  <circle cx="14" cy="11.5" r="2.5" fill="var(--forest-600)"/>
                </svg>
                CareConnect
              </div>
              <p style={{ maxWidth: 280, lineHeight: 1.65 }}>India's most trusted elderly care platform for families who live abroad but care deeply at home.</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-12)', flexWrap: 'wrap' }}>
              {[
                { title: 'Platform', links: ['How it works', 'Care types', 'Pricing', 'NRI features'] },
                { title: 'Company', links: ['About us', 'Careers', 'Press', 'Contact'] },
                { title: 'Legal', links: ['Privacy policy', 'Terms of service', 'DPDP compliance', 'Refund policy'] },
              ].map((col) => (
                <div key={col.title}>
                  <p style={{ color: 'var(--white)', fontWeight: 600, marginBottom: 'var(--sp-3)', fontSize: '0.875rem' }}>{col.title}</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                    {col.links.map(l => <li key={l}><a href="#" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.15s' }}>{l}</a></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 'var(--sp-6)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
            <span>© 2026 CareConnect Technologies Pvt. Ltd. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 'var(--sp-5)' }}>
              <span>24/7 SOS Response</span>
              <span>·</span>
              <span>Aadhaar eKYC Verified</span>
              <span>·</span>
              <span>DPDP Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
