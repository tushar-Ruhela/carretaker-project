"use client";

import React, { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

declare global {
  interface Window { Razorpay: new (opts: object) => { open: () => void }; }
}

const mockPayments = [
  { id: 'pay-1', amount: 4500, currency: 'INR', status: 'captured', created_at: '2026-10-01', razorpay_payment_id: 'pay_DEMO001' },
  { id: 'pay-2', amount: 3200, currency: 'INR', status: 'captured', created_at: '2026-09-15', razorpay_payment_id: 'pay_DEMO002' },
  { id: 'pay-3', amount: 5000, currency: 'INR', status: 'pending', created_at: '2026-10-06', razorpay_payment_id: null },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState(mockPayments);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('currentUser') || 'null') : null;

  useEffect(() => {
    if (user) {
      fetch(`${API}/api/payments/${user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d && d.length > 0) setPayments(d); })
        .catch(() => {});
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) < 1) return;
    setLoading(true);

    try {
      // Create order on backend
      const orderRes = await fetch(`${API}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), familyId: user?.id }),
      });
      const { orderId, amount: orderAmount, currency } = await orderRes.json();

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_DEMO',
        amount: orderAmount,
        currency: currency || 'INR',
        order_id: orderId,
        name: 'CareConnect',
        description: 'Caregiver Services Payment',
        theme: { color: '#166534' },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Verify payment
          const verifyRes = await fetch(`${API}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setSuccess(`Payment of ₹${amount} successful! ID: ${result.paymentId}`);
            setAmount('');
            // Refresh payments
            fetch(`${API}/api/payments/${user?.id}`)
              .then(r => r.json()).then(setPayments).catch(() => {});
          }
        },
        prefill: { name: user?.full_name, email: user?.email },
      });
      rzp.open();
    } catch {
      // Demo mode - show success without API
      setSuccess(`Demo: Payment of ₹${amount} would be processed via Razorpay. Add your API key to go live.`);
      setAmount('');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = payments.filter(p => p.status === 'captured').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 className="page-title">Payments</h1>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--sp-5)', marginBottom: 'var(--sp-8)' }}>
        <div className="stat-card">
          <div className="stat-icon stat-icon-green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div><div className="stat-value">₹{totalPaid.toLocaleString('en-IN')}</div><div className="stat-label">Total paid</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-gold"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div><div className="stat-value">₹{totalPending.toLocaleString('en-IN')}</div><div className="stat-label">Pending</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div><div className="stat-value">{payments.length}</div><div className="stat-label">Total transactions</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--sp-6)', alignItems: 'start' }}>
        
        {/* Transaction history */}
        <div className="card">
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-5)' }}>Transaction history</h2>
          {payments.length === 0 ? (
            <p style={{ color: 'var(--slate-400)', textAlign: 'center', padding: 'var(--sp-8) 0' }}>No transactions yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--slate-400)', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {p.razorpay_payment_id || '—'}
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'captured' ? 'badge-green' : p.status === 'pending' ? 'badge-warn' : 'badge-red'}`}>
                          {p.status === 'captured' ? 'Paid' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Make payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-2)' }}>Make a payment</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: 'var(--sp-5)' }}>Securely pay your caregiver via Razorpay. UPI, cards, and net banking accepted.</p>

            {success && (
              <div style={{ padding: 'var(--sp-3)', background: 'var(--forest-100)', color: 'var(--forest-700)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)', fontSize: '0.875rem', fontWeight: 500 }}>
                {success}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 'var(--sp-4)' }}>
              <label htmlFor="payment-amount">Amount (INR)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-500)', fontWeight: 600 }}>₹</span>
                <input
                  id="payment-amount"
                  type="number"
                  className="input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  style={{ paddingLeft: '2rem' }}
                />
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={!amount || loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Opening payment…' : '💳 Pay via Razorpay'}
            </button>
          </div>

          <div className="card" style={{ background: 'var(--slate-50)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: 'var(--sp-3)' }}>Payment methods</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {['UPI (GPay, PhonePe, Paytm)', 'Credit / Debit cards', 'Net banking', 'International cards (Visa, Mastercard)', 'EMI available'].map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--forest-500)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
