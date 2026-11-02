"use client";

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, Plus, Calendar, UserCheck, FileText } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Timesheet {
  id: string;
  booking_id?: string;
  caregiver_id?: string;
  family_id?: string;
  date: string;
  clock_in: string;
  clock_out: string;
  hours_worked: number;
  tasks_completed?: string[] | string;
  notes?: string;
  status: 'pending' | 'approved' | 'disputed';
  caregiver?: { full_name: string };
  family?: { full_name: string };
}

const mockTimesheets: Timesheet[] = [
  {
    id: 'ts-1',
    date: '2026-10-06',
    clock_in: '09:00 AM',
    clock_out: '05:00 PM',
    hours_worked: 8,
    tasks_completed: ['Morning Blood Pressure & Pulse Check', 'Dementia Memory Exercises', 'Assisted Walk in Garden', 'Lunch & Medication Admin'],
    notes: 'Patient was in good spirits today. Blood pressure stable at 124/82.',
    status: 'pending',
    caregiver: { full_name: 'Ananya Verma' },
    family: { full_name: 'Sharma Family' }
  },
  {
    id: 'ts-2',
    date: '2026-10-05',
    clock_in: '09:00 AM',
    clock_out: '05:00 PM',
    hours_worked: 8,
    tasks_completed: ['Medication Dispensation', 'Mobility & Physical Therapy', 'Prepared Light Diet (Khichdi)', 'Evening Vitals Recording'],
    notes: 'Completed afternoon cognitive exercises. Patient slept well between 2-3 PM.',
    status: 'approved',
    caregiver: { full_name: 'Ananya Verma' },
    family: { full_name: 'Sharma Family' }
  },
  {
    id: 'ts-3',
    date: '2026-10-04',
    clock_in: '10:00 AM',
    clock_out: '02:00 PM',
    hours_worked: 4,
    tasks_completed: ['Companion Reading', 'Doctor Appointment Tele-Consult Support', 'Evening Tea & Walk'],
    notes: 'Dr. Rekha prescribed updated multivitamin schedule.',
    status: 'approved',
    caregiver: { full_name: 'Rajan Nair' },
    family: { full_name: 'Mehta Family' }
  },
  {
    id: 'ts-4',
    date: '2026-10-03',
    clock_in: '08:30 AM',
    clock_out: '04:30 PM',
    hours_worked: 8,
    tasks_completed: ['Post-Operative Dressing Change', 'IV Line Monitoring', 'Physiotherapy Support'],
    notes: 'Wound healing on schedule. No sign of infection or elevated temperature.',
    status: 'approved',
    caregiver: { full_name: 'Dr. Rekha Menon' },
    family: { full_name: 'Joshi Family' }
  }
];

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(mockTimesheets);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [user, setUser] = useState<{ id: string; role: string; full_name?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // New timesheet form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formClockIn, setFormClockIn] = useState('09:00');
  const [formClockOut, setFormClockOut] = useState('17:00');
  const [formHours, setFormHours] = useState(8);
  const [formNotes, setFormNotes] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([
    'Vitals Checked',
    'Medication Administered'
  ]);

  const availableTasks = [
    'Vitals Checked',
    'Medication Administered',
    'Mobility / Walking Assist',
    'Cognitive & Memory Care',
    'Meal Preparation & Feeding',
    'Bathing & Personal Hygiene',
    'Doctor Consultation Assist'
  ];

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setUser(u);
    if (u?.id) {
      fetch(`${API}/api/timesheets/${u.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setTimesheets(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await fetch(`${API}/api/timesheets/${id}/approve`, { method: 'PATCH' });
    } catch {
      // offline / mock fallback
    }
    setTimesheets(prev =>
      prev.map(t => (t.id === id ? { ...t, status: 'approved' } : t))
    );
    setApprovingId(null);
  };

  const handleCreateTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: Timesheet = {
      id: `ts-${Date.now()}`,
      date: formDate,
      clock_in: `${formClockIn} hrs`,
      clock_out: `${formClockOut} hrs`,
      hours_worked: Number(formHours) || 8,
      tasks_completed: selectedTasks,
      notes: formNotes || 'Shift completed smoothly according to family care plan.',
      status: 'pending',
      caregiver: { full_name: user?.full_name || 'Caregiver User' },
      family: { full_name: 'Sharma Family' }
    };

    setTimesheets(prev => [newEntry, ...prev]);
    setIsModalOpen(false);
    setFormNotes('');

    // Persist to backend if reachable
    fetch(`${API}/api/timesheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caregiverId: user?.id,
        date: formDate,
        clockIn: `${formClockIn} hrs`,
        clockOut: `${formClockOut} hrs`,
        hoursWorked: Number(formHours),
        tasks: selectedTasks,
        notes: formNotes
      })
    }).catch(() => {});
  };

  const toggleTask = (task: string) => {
    setSelectedTasks(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const filteredTimesheets = timesheets.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'approved') return t.status === 'approved';
    return true;
  });

  const totalHours = timesheets.reduce((acc, curr) => acc + (Number(curr.hours_worked) || 0), 0);
  const approvedHours = timesheets
    .filter(t => t.status === 'approved')
    .reduce((acc, curr) => acc + (Number(curr.hours_worked) || 0), 0);
  const pendingCount = timesheets.filter(t => t.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-6)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 'var(--sp-1)' }}>Timesheets & Shift Logs</h1>
          <p style={{ color: 'var(--slate-500)' }}>
            Transparent shift verification and digital approvals for NRI families and caregivers.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          Log Daily Shift
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <div className="card" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--forest-50)', color: 'var(--forest-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 500 }}>Total Hours Logged</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>{totalHours} hrs</div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 500 }}>Approved Hours</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>{approvedHours} hrs</div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 500 }}>Pending Family Approval</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>{pendingCount} shifts</div>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 500 }}>Verified Caregivers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>100% Police Verified</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 'var(--sp-6)', background: 'var(--slate-100)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content' }}>
        {(['all', 'pending', 'approved'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'calc(var(--r-md) - 2px)',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: filter === t ? 'var(--white)' : 'transparent',
              color: filter === t ? 'var(--slate-900)' : 'var(--slate-500)',
              boxShadow: filter === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
              cursor: 'pointer',
              border: 'none',
              textTransform: 'capitalize'
            }}
          >
            {t} {t === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {/* Timesheet List / Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Date & Shift</th>
                <th>Caregiver</th>
                <th>Family / Elder</th>
                <th>Hours</th>
                <th>Daily Activities Logged</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--slate-400)' }}>
                    No timesheet logs found for this filter.
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map(ts => {
                  const tasks = Array.isArray(ts.tasks_completed)
                    ? ts.tasks_completed
                    : typeof ts.tasks_completed === 'string'
                    ? [ts.tasks_completed]
                    : [];

                  return (
                    <tr key={ts.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={14} color="var(--forest-600)" />
                          {ts.date}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', marginTop: 2 }}>
                          {ts.clock_in} - {ts.clock_out}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--slate-800)' }}>
                          {ts.caregiver?.full_name || 'Caregiver'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--slate-600)' }}>
                          {ts.family?.full_name || 'Family'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {ts.hours_worked} hrs
                        </span>
                      </td>
                      <td style={{ maxWidth: 320 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                          {tasks.slice(0, 2).map((task, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.75rem',
                                background: 'var(--slate-100)',
                                color: 'var(--slate-700)',
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}
                            >
                              {task}
                            </span>
                          ))}
                          {tasks.length > 2 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                              +{tasks.length - 2} more
                            </span>
                          )}
                        </div>
                        {ts.notes && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            &ldquo;{ts.notes}&rdquo;
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${ts.status === 'approved' ? 'badge-green' : ts.status === 'pending' ? 'badge-warn' : 'badge-red'}`}>
                          {ts.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {ts.status === 'pending' ? (
                          <button
                            onClick={() => handleApprove(ts.id)}
                            disabled={approvingId === ts.id}
                            className="btn btn-primary"
                            style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
                          >
                            {approvingId === ts.id ? 'Approving...' : 'Approve Shift'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                            <CheckCircle2 size={15} /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log New Shift */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              padding: 'var(--sp-6)',
              background: 'var(--white)',
              borderRadius: 'var(--r-xl)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Log Care Shift
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--slate-400)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTimesheet}>
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                  Date of Shift
                </label>
                <input
                  type="date"
                  className="input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                    Clock In
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={formClockIn}
                    onChange={(e) => setFormClockIn(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                    Clock Out
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={formClockOut}
                    onChange={(e) => setFormClockOut(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                    Total Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="24"
                    className="input"
                    value={formHours}
                    onChange={(e) => setFormHours(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                  Tasks Completed (Select all that apply)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {availableTasks.map(task => {
                    const active = selectedTasks.includes(task);
                    return (
                      <button
                        type="button"
                        key={task}
                        onClick={() => toggleTask(task)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '16px',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: active ? '1px solid var(--forest-600)' : '1px solid var(--slate-200)',
                          background: active ? 'var(--forest-50)' : 'var(--white)',
                          color: active ? 'var(--forest-800)' : 'var(--slate-700)',
                          transition: 'all 0.15s'
                        }}
                      >
                        {active ? '✓ ' : '+ '} {task}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}>
                  Care Notes / Observations for Family
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Note vitals, mood, diet intake, or medications given..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Shift Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
