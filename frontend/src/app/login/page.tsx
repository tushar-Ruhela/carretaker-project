"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'family' | 'caregiver'>('family');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = tab === 'login'
        ? { email, password }
        : { email, password, fullName: name, role };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      // Store user session
      localStorage.setItem('currentUser', JSON.stringify(data.user || data));
      if (data.session?.access_token) {
        localStorage.setItem('authToken', data.session.access_token);
      }

      const user = data.user || data;
      // Redirect admins to admin panel
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo mode: bypass API for quick demo
  const handleDemo = (demoRole: 'family' | 'caregiver' | 'admin') => {
    const demoUser = {
      id: demoRole === 'family' ? 'demo-family-001' : demoRole === 'caregiver' ? 'demo-caregiver-001' : 'demo-admin-001',
      email: demoRole === 'family' ? 'demo-family@careconnect.in' : demoRole === 'caregiver' ? 'demo-care@careconnect.in' : 'admin@careconnect.in',
      full_name: demoRole === 'family' ? 'The Sharma Family' : demoRole === 'caregiver' ? 'Ananya Verma' : 'Admin User',
      role: demoRole,
      backgroundVerified: true,
    };
    localStorage.setItem('currentUser', JSON.stringify(demoUser));
    if (demoRole === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--forest-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-6)' }}>

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', justifyContent: 'center', marginBottom: 'var(--sp-8)', textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="var(--forest-600)"/>
            <path d="M14 6C10.5 6 8 8.5 8 11.5C8 16 14 22 14 22C14 22 20 16 20 11.5C20 8.5 17.5 6 14 6Z" fill="white"/>
            <circle cx="14" cy="11.5" r="2.5" fill="var(--forest-600)"/>
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--forest-700)' }}>CareConnect</span>
        </Link>

        <div className="card card-elevated">
          {/* Tab switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--slate-100)', borderRadius: 'var(--r-md)', padding: 4, marginBottom: 'var(--sp-6)' }}>
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '0.625rem',
                  borderRadius: 'calc(var(--r-md) - 2px)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  background: tab === t ? 'var(--white)' : 'transparent',
                  color: tab === t ? 'var(--slate-900)' : 'var(--slate-500)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-1)' }}>
            {tab === 'login' ? 'Welcome back' : 'Join CareConnect'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: 'var(--sp-6)' }}>
            {tab === 'login' ? 'Sign in to manage your care dashboard.' : 'Create your account to get started.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {tab === 'register' && (
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input id="name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            {tab === 'register' && (
              <div className="form-group">
                <label>I am joining as</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                  {(['family', 'caregiver'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        padding: 'var(--sp-3)',
                        borderRadius: 'var(--r-md)',
                        border: `2px solid ${role === r ? 'var(--forest-500)' : 'var(--slate-200)'}`,
                        background: role === r ? 'var(--forest-50)' : 'var(--white)',
                        color: role === r ? 'var(--forest-700)' : 'var(--slate-600)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {r === 'family' ? '🏠 Family' : '👩‍⚕️ Caregiver'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ padding: 'var(--sp-3)', background: 'var(--error-100)', color: 'var(--error-500)', borderRadius: 'var(--r-md)', fontSize: '0.875rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--sp-2)' }} disabled={loading}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--sp-5)', borderTop: '1px solid var(--slate-200)', paddingTop: 'var(--sp-5)' }}>
            <p style={{ textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.8125rem', marginBottom: 'var(--sp-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick demo</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}>
              <button onClick={() => handleDemo('family')} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                🏠 Family
              </button>
              <button onClick={() => handleDemo('caregiver')} className="btn btn-outline btn-sm" style={{ justifyContent: 'center' }}>
                👩‍⚕️ Caregiver
              </button>
              <button onClick={() => handleDemo('admin')} className="btn btn-outline btn-sm" style={{ justifyContent: 'center', borderColor: 'var(--forest-500)', color: 'var(--forest-700)' }}>
                🛡️ Admin
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.8125rem', marginTop: 'var(--sp-5)' }}>
          By continuing, you agree to our{' '}
          <a href="#" style={{ color: 'var(--forest-600)', fontWeight: 600 }}>Terms</a>{' '}and{' '}
          <a href="#" style={{ color: 'var(--forest-600)', fontWeight: 600 }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
