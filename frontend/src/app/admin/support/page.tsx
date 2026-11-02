"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatSession {
  id: string;
  session_type: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  user: { full_name: string; email: string; role: string } | null;
  message_count?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export default function AdminSupport() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filtered, setFiltered] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_sessions')
      .select(`
        id, session_type, title, created_at, updated_at,
        user:user_id (full_name, email, role)
      `)
      .order('updated_at', { ascending: false });

    const mapped = (data ?? []).map((s: any) => ({
      ...s,
      user: Array.isArray(s.user) ? s.user[0] : s.user,
    }));
    setSessions(mapped);
    setFiltered(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    let list = sessions;
    if (typeFilter !== 'all') list = list.filter(s => s.session_type === typeFilter);
    if (search) list = list.filter(s =>
      (s.user?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.title ?? '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(list);
  }, [search, typeFilter, sessions]);

  const openSession = async (session: ChatSession) => {
    setSelected(session);
    setMessagesLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    setMessagesLoading(false);
  };

  const typeColor: Record<string, string> = {
    support: 'blue',
    counsellor: 'purple',
    onboarding: 'green',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--admin-text)', marginBottom: 4 }}>Support & Chat Queries</h1>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>Monitor all AI chat sessions and user queries across the platform.</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Sessions', count: sessions.length, color: '#6366f1' },
          { label: 'Support', count: sessions.filter(s => s.session_type === 'support').length, color: '#3b82f6' },
          { label: 'Counsellor', count: sessions.filter(s => s.session_type === 'counsellor').length, color: '#a855f7' },
          { label: 'Onboarding', count: sessions.filter(s => s.session_type === 'onboarding').length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--admin-card)', border: '1px solid var(--admin-border)', borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.count}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Session List */}
        <div className="admin-table-wrap">
          <div className="admin-table-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>Chat Sessions</p>
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              <div className="admin-search-bar" style={{ width: 200 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-dim)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input className="admin-input" style={{ border: 'none', background: 'none', padding: 0 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="admin-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="support">Support</option>
                <option value="counsellor">Counsellor</option>
                <option value="onboarding">Onboarding</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><div className="admin-spinner" /></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Last Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="admin-empty">No sessions found</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openSession(s)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'white' }}>
                          {(s.user?.full_name ?? '?')[0]}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--admin-text)' }}>{s.user?.full_name ?? 'Unknown'}</p>
                          <p style={{ fontSize: '0.6875rem', color: 'var(--admin-text-dim)' }}>{s.user?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`admin-badge admin-badge-${typeColor[s.session_type] ?? 'gray'}`}>{s.session_type}</span></td>
                    <td style={{ fontSize: '0.8125rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title ?? '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{new Date(s.updated_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <button className="admin-btn admin-btn-ghost" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Message Viewer */}
        {selected && (
          <div className="admin-table-wrap" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
            <div className="admin-table-header">
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--admin-text)' }}>
                  {selected.user?.full_name}'s Session
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginTop: 2 }}>{selected.session_type} · {new Date(selected.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-dim)', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messagesLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="admin-spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="admin-empty">No messages in this session</div>
              ) : messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role === 'user' ? 'rgba(99,102,241,0.2)' : m.role === 'system' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.06)',
                    border: m.role === 'user' ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.8125rem',
                    color: 'var(--admin-text)',
                    lineHeight: 1.5,
                  }}>
                    <p style={{ fontSize: '0.625rem', color: 'var(--admin-text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {m.role}
                    </p>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
