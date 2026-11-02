"use client";

import React, { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended';

export default function VoicePage() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('currentUser') || 'null')
    : null;

  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      // Try to pick an Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India'));
      if (indianVoice) utterance.voice = indianVoice;
      setCurrentSpeech(text);
      window.speechSynthesis.speak(utterance);
    } else {
      setCurrentSpeech(text);
    }
  };

  const startCall = async () => {
    setStatus('connecting');
    setError('');
    setIsSimulated(false);

    try {
      const res = await fetch(`${API}/api/voice/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'demo-user',
          userName: user?.full_name || user?.name || 'Sharma Family',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.callId) {
        throw new Error(data.error || 'Ultravox API key unconfigured');
      }

      setCallId(data.callId);
      setSessionId(data.sessionId);
      setJoinUrl(data.joinUrl);
      setDuration(0);
      setStatus('active');
    } catch {
      // Graceful fallback to browser speech synthesis simulation
      setIsSimulated(true);
      setCallId('sim-' + Date.now());
      setSessionId('sess-' + Date.now());
      setDuration(0);
      setStatus('active');
      const intro = `Namaste! I am Priya, your CareConnect elderly care counsellor. How are your parents feeling today, and how can I help you choose the best verified care plan?`;
      speakText(intro);
    }
  };

  const endCall = async () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      if (callId && sessionId && !isSimulated) {
        await fetch(`${API}/api/voice/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId, sessionId, duration }),
        });
      }
    } catch { /* silent */ }
  };

  const resetCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
    setDuration(0);
    setCallId(null);
    setSessionId(null);
    setJoinUrl(null);
    setError('');
    setIsSimulated(false);
    setCurrentSpeech('');
  };

  return (
    <div>
      <h1 className="page-title">Voice Counsellor</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)', alignItems: 'start' }}>
        
        {/* Main voice panel */}
        <div className="voice-panel">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-8)' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                Ultravox AI · Voice Counsellor
              </p>
              {isSimulated && status === 'active' && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.25)', border: '1px solid #eab308', color: '#fef08a', padding: '2px 8px', borderRadius: '12px' }}>
                  Live Browser Voice Demo
                </span>
              )}
            </div>

            {/* Orb */}
            <div
              className={`voice-orb ${status === 'active' ? 'active' : ''}`}
              onClick={status === 'idle' ? startCall : status === 'active' ? endCall : undefined}
            >
              {status === 'idle' && (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
              {status === 'connecting' && (
                <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
              )}
              {status === 'active' && (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              )}
              {status === 'ended' && (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Status text */}
            <div style={{ marginTop: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
              {status === 'idle' && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-2)', color: 'white' }}>Priya, AI Counsellor</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem' }}>Tap the orb to start your live voice consultation.</p>
                </>
              )}
              {status === 'connecting' && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-2)', color: 'white' }}>Connecting…</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>Setting up your secure Ultravox AI voice session.</p>
                </>
              )}
              {status === 'active' && (
                <>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--forest-400)', marginBottom: 'var(--sp-2)' }}>
                    {formatDuration(duration)}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.85)' }}>Talking with Priya · Tap orb to finish</p>
                  {currentSpeech && (
                    <div style={{ marginTop: 'var(--sp-3)', padding: 'var(--sp-3)', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', fontStyle: 'italic', fontSize: '0.875rem', color: '#f0fdf4' }}>
                      &ldquo;{currentSpeech}&rdquo;
                    </div>
                  )}
                </>
              )}
              {status === 'ended' && (
                <>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--sp-2)', color: 'white' }}>Session complete</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>Call duration: {formatDuration(duration)}</p>
                </>
              )}
            </div>

            {/* Interactive prompts during active session */}
            {status === 'active' && (
              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>
                  Ask Priya a question:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    "How do we choose between Dementia Care and Nursing Support?",
                    "What are the hourly rates and Razorpay escrow options?",
                    "How do we verify timesheets and caregiver background checks?"
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        if (q.includes("Dementia")) {
                          speakText("For cognitive conditions, our dementia-certified caregivers focus on daily memory prompts, structured nutrition, and gentle redirection to prevent wandering. For clinical needs like IV or wound care, our nursing staff is best.");
                        } else if (q.includes("rates")) {
                          speakText("Rates start at 350 rupees per hour for companion care up to 700 rupees for specialized dementia nursing. All payments are secured in Razorpay escrow until you approve the daily timesheet.");
                        } else {
                          speakText("Every caregiver has 100 percent police verification and Aadhar background checks. Shift hours and vitals are logged digitally each day with photo verification.");
                        }
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--r-md)',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      🗣️ {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {status === 'idle' && (
                <button onClick={startCall} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                  🎙 Start Voice Call
                </button>
              )}
              {status === 'active' && (
                <button onClick={endCall} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                  End Call
                </button>
              )}
              {status === 'ended' && (
                <button onClick={resetCall} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
                  Start New Call
                </button>
              )}
            </div>

            {/* Join URL for direct Ultravox browser call if available */}
            {joinUrl && status === 'active' && (
              <div style={{ marginTop: 'var(--sp-5)', padding: 'var(--sp-3)', background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--r-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginBottom: 'var(--sp-2)' }}>Join via Ultravox WebRTC stream:</p>
                <a href={joinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--forest-400)', fontSize: '0.8125rem', wordBreak: 'break-all' }}>Open Live Stream →</a>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-3)', background: 'rgba(239,68,68,0.25)', borderRadius: 'var(--r-md)', border: '1px solid rgba(239,68,68,0.4)' }}>
                <p style={{ color: '#fca5a5', fontSize: '0.875rem' }}>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-4)' }}>About Priya</h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 'var(--sp-4)' }}>
              Priya is CareConnect&apos;s AI voice counsellor, powered by <strong>Ultravox AI</strong> — high-speed voice AI with native understanding of Indian English and Hindi context.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {[
                ['🧠', 'Dementia & memory care guidance'],
                ['💊', 'Medication and nursing advice'],
                ['📋', 'Help with bookings and timesheets'],
                ['💚', 'Emotional support for NRI families'],
                ['🚨', 'Emergency escalation protocol'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--forest-50)', border: '1px solid var(--forest-100)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--forest-800)', marginBottom: 'var(--sp-3)' }}>How it works</h3>
            {[
              ['1', 'Tap "Start Voice Call" — connects via Ultravox AI audio pipeline'],
              ['2', 'Priya introduces herself and assesses your care requirements'],
              ['3', 'Speak naturally — Priya understands Indian accents and clinical terms'],
              ['4', 'End the call — session transcript is archived automatically for your family record'],
            ].map(([n, t]) => (
              <div key={n} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--forest-200)', color: 'var(--forest-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{n}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--forest-700)', lineHeight: 1.55 }}>{t}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: 'var(--sp-3)' }}>Prefer text?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: 'var(--sp-4)' }}>Our LangGraph + RAG AI chatbot is also available for text-based counselling.</p>
            <a href="/dashboard/chatbot" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
              🤖 Open Chatbot Counsellor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
