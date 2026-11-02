"use client";

import React, { useState, useRef, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  'What care does my mother need for dementia?',
  'How do I read the caregiver\'s timesheet?',
  'How does the payment process work?',
  'Can I change my caregiver booking?',
  'What is included in Specialized Care?',
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm CareBot, your personal care counsellor at CareConnect. I'm here to help you choose the right care plan, understand your dashboard, or simply talk through your caregiving concerns.\n\nHow can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('currentUser') || 'null')
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          sessionId,
          message: text.trim(),
        }),
      });

      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, I had trouble understanding that. Could you please rephrase?',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'m experiencing a connection issue. Please check your internet and try again. For urgent matters, please call our support line.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div>
      <h1 className="page-title">AI Counsellor</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--sp-6)', alignItems: 'start' }}>
        
        {/* Main chat */}
        <div className="chatbot-container">
          {/* Chat header */}
          <div className="chat-header">
            <div className="chat-avatar">🤖</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>Priya — AI Counsellor</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--forest-400)' }}/>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem' }}>Online · Powered by Gemini + LangGraph RAG</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages" id="chat-messages">
            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`chat-bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-assistant'}`}>
                  {m.content.split('\n').map((line, i) => (
                    <span key={i}>{line}{i < m.content.split('\n').length - 1 && <br/>}</span>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: 4, padding: '0 4px' }}>
                  {m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {loading && (
              <div className="chat-typing">
                <span/><span/><span/>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about care plans, payments, or your dashboard…"
              rows={2}
              className="input"
              style={{ resize: 'none', flex: 1, fontSize: '0.9375rem' }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ flexShrink: 0, padding: '0.75rem 1.25rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

        {/* Sidebar panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-4)' }}>Suggested questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    textAlign: 'left',
                    padding: 'var(--sp-3)',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--slate-200)',
                    background: 'var(--slate-50)',
                    color: 'var(--slate-700)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontWeight: 500,
                  }}
                  onMouseOver={e => { (e.target as HTMLElement).style.background = 'var(--forest-50)'; (e.target as HTMLElement).style.borderColor = 'var(--forest-300)'; }}
                  onMouseOut={e => { (e.target as HTMLElement).style.background = 'var(--slate-50)'; (e.target as HTMLElement).style.borderColor = 'var(--slate-200)'; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--forest-50)', border: '1px solid var(--forest-100)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--sp-3)' }}>🎙</div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--forest-800)', marginBottom: 'var(--sp-2)' }}>Prefer to talk?</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--forest-700)', marginBottom: 'var(--sp-4)', lineHeight: 1.55 }}>Start a live voice call with Priya — our AI counsellor who can answer all your questions in real time.</p>
            <a href="/dashboard/voice" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
              Start voice call
            </a>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-3)' }}>About CareBot</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', lineHeight: 1.65 }}>
              Powered by <strong>Google Gemini 1.5 Pro</strong> with <strong>LangGraph</strong> automation and a private <strong>RAG knowledge base</strong> of elderly caregiving guidelines, Indian regulations, and CareConnect's care protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
