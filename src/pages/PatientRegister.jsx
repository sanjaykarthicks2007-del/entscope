import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'

const INITIAL = {
  name: '', age: '', gender: '', dob: '', phone: '', email: '',
  bloodGroup: '', complaints: '', history: '', allergies: '', medications: '',
}

export default function PatientRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const doctor = JSON.parse(localStorage.getItem('currentDoctor') || '{}')
    const q = query(collection(db, 'patients'), where('status', 'in', ['Waiting', 'In Consultation']))
    const snap = await getDocs(q)
    const nextQ = snap.size + 1
    const newPatient = {
      ...form,
      age: parseInt(form.age),
      status: 'Waiting',
      registeredAt: new Date().toISOString(),
      queueNo: nextQ,
      assignedDoctor: doctor.id || '',
    }
    await addDoc(collection(db, 'patients'), newPatient)
    setSuccess({ name: newPatient.name, queueNo: nextQ })
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-50)' }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 48, textAlign: 'center', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ width: 64, height: 64, background: 'var(--green-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 28 }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Patient Registered!</h2>
        <p style={{ color: 'var(--slate-500)', marginBottom: 24 }}><strong>{success.name}</strong> has been added to the queue.</p>
        <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--teal-700)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Queue Number</div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 56, color: 'var(--teal-700)', lineHeight: 1 }}>{success.queueNo}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={() => { setSuccess(null); setForm(INITIAL) }}>Register Another</button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-left-logo">
          <div className="logo-mark" style={{ width: 34, height: 34 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M4 11 Q11 4 18 11 Q11 18 4 11Z" stroke="#5dd8d8" strokeWidth="1.5" fill="none"/>
              <circle cx="11" cy="11" r="2.5" fill="#02c4c4"/>
            </svg>
          </div>
          <span className="logo-text">ENT<span>scope</span></span>
        </div>
        <div className="auth-left-content">
          <h2 className="auth-left-title">New<br /><em>Patient</em></h2>
          <p className="auth-left-sub">Register a new patient to add them to today's consultation queue.</p>
        </div>
        <div className="auth-left-bottom">© 2026 ENTscope</div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form" style={{ maxWidth: 520 }}>
          <div className="auth-form-header">
            <h2>Patient Registration</h2>
            <p>Fill in details to add the patient to the queue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-section">
              <div className="auth-form-section-title">Personal Details</div>
              <div className="auth-form-grid">
                <div className="form-group full">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Patient full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" name="age" type="number" value={form.age} onChange={handleChange} placeholder="Age" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" name="gender" value={form.gender} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" name="dob" type="date" value={form.dob} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                    <option value="">Unknown</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" required />
                </div>
                <div className="form-group full">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="patient@email.com" />
                </div>
              </div>
            </div>

            <div className="auth-form-section">
              <div className="auth-form-section-title">Clinical Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Chief Complaints</label>
                  <textarea className="form-textarea" name="complaints" value={form.complaints} onChange={handleChange} placeholder="e.g. Nasal congestion, ear pain…" style={{ minHeight: 80 }} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Medical History</label>
                  <textarea className="form-textarea" name="history" value={form.history} onChange={handleChange} placeholder="Past illnesses, surgeries, conditions…" style={{ minHeight: 70 }} />
                </div>
                <div className="auth-form-grid">
                  <div className="form-group">
                    <label className="form-label">Known Allergies</label>
                    <input className="form-input" name="allergies" value={form.allergies} onChange={handleChange} placeholder="Drug / food allergies" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Medications</label>
                    <input className="form-input" name="medications" value={form.medications} onChange={handleChange} placeholder="Drug name, dose" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 13 }} disabled={loading}>
              {loading ? 'Adding to queue…' : 'Add to Queue'}
            </button>
            <div className="auth-switch">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
