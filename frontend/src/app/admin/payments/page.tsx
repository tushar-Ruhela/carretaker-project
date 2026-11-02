"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  family: { full_name: string; email: string } | null;
  caregiver: { full_name: string; email: string } | null;
}

function statusBadge(status: string) {
  const map: Record<string, string> = { captured: 'green', pending: 'orange', failed: 'red', refunded: 'blue' };
  return <span className={`admin-badge admin-badge-${map[status] ?? 'gray'}`}>{status}</span>;
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select(`
        id, amount, currency, status, razorpay_order_id, razorpay_payment_id, created_at,
        family:family_id (full_name, email),
        caregiver:caregiver_id (full_name, email)
      `)
      .order('created_at', { ascending: false });

    const mapped = (data ?? []).map((p: any) => ({
      ...p,
      family: Array.isArray(p.family) ? p.family[0] : p.family,
      caregiver: Array.isArray(p.caregiver) ? p.caregiver[0] : p.caregiver,
    }));
    setPayments(mapped);
    setFiltered(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    let list = payments;
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (search) list = list.filter(p =>
      (p.family?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.caregiver?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.razorpay_payment_id ?? '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [statusFilter, search, payments]);

  const totalRevenue = payments.filter(p => p.status === 'captured').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const refundedAmount = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>Payments & Revenue</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Track all payment transactions on the platform.</p>
      </div>

      {/* Revenue Cards */}
      <div className="admin-grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Revenue', amount: totalRevenue, count: payments.filter(p => p.status === 'captured').length, color: '#10b981', icon: '💰' },
          { label: 'Pending', amount: pendingAmount, count: payments.filter(p => p.status === 'pending').length, color: '#f59e0b', icon: '⏳' },
          { label: 'Refunded', amount: refundedAmount, count: payments.filter(p => p.status === 'refunded').length, color: '#3b82f6', icon: '↩️' },
        ].map(r => (
          <div key={r.label} className="admin-stat-card" style={{ borderTop: `2px solid ${r.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--admin-text)', lineHeight: 1 }}>₹{r.amount.toLocaleString('en-IN')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: 6 }}>{r.count} transaction{r.count !== 1 ? 's' : ''}</p>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{r.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>All Transactions</p>
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div className="admin-search-bar" style={{ width: 240 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="admin-input" style={{ border: 'none', background: 'none', padding: 0 }} placeholder="Search name or payment ID…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="admin-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
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
                  <th>Family</th>
                  <th>Caregiver</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Razorpay ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="admin-empty">No payments found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--admin-text)', fontWeight: 500 }}>{p.family?.full_name ?? '—'}</td>
                    <td>{p.caregiver?.full_name ?? '—'}</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td><span className="admin-chip">{p.currency}</span></td>
                    <td>{statusBadge(p.status)}</td>
                    <td style={{ fontSize: '0.6875rem', fontFamily: 'monospace', color: 'var(--admin-text-dim)' }}>
                      {p.razorpay_payment_id ? p.razorpay_payment_id.slice(0, 18) + '…' : '—'}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
