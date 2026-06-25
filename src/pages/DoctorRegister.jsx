import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const INITIAL = {
  name: '', email: '', password: '', confirmPassword: '',
  specialization: '', licenseNo: '', hospital: '', phone: '', experience: '',
}

export default function DoctorRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const uid = cred.user.uid
      const doctorData = {
        id: uid,
        name: form.name,
        email: form.email,
        specialization: form.specialization,
        licenseNo: form.licenseNo,
        hospital: form.hospital,
        phone: form.phone,
        experience: form.experience,
        avatar: form.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        createdAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'doctors', uid), doctorData)
      localStorage.setItem('currentDoctor', JSON.stringify(doctorData))
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <Link to="/" className="auth-left-logo">
          <div className="logo-mark" style={{ width: 34, height: 34 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M4 11 Q11 4 18 11 Q11 18 4 11Z" stroke="#5dd8d8" strokeWidth="1.5" fill="none"/>
              <circle cx="11" cy="11" r="2.5" fill="#02c4c4"/>
            </svg>
          </div>
          <span className="logo-text">ENT<span style={{ color: 'var(--teal-400)' }}>scope</span></span>
        </Link>
        <div className="auth-left-content">
          <h2 className="auth-left-title">Start your<br /><em>clinical journey</em></h2>
          <p className="auth-left-sub">Register your ENT practice and get instant access to all consultation tools.</p>
          <div className="auth-left-features">
            {[
              'Live endoscopy viewer with controls',
              'Smart patient queue management',
              'Instant structured reports',
              'ENT-specific diagnosis templates',
            ].map(f => (
              <div key={f} className="auth-left-feature">
                <div className="auth-left-feature-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-left-bottom">© 2026 ENTscope. All rights reserved.</div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Fill in your details to register your practice</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-form-section">
              <div className="auth-form-section-title">Personal Information</div>
              <div className="auth-form-grid">
                <div className="form-group full">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Dr. First Last" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@hospital.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98400 00000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="min 6 chars" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="repeat password" required />
                </div>
              </div>
            </div>

            <div className="auth-form-section">
              <div className="auth-form-section-title">Professional Details</div>
              <div className="auth-form-grid">
                <div className="form-group full">
                  <label className="form-label">Specialization</label>
                  <select className="form-select" name="specialization" value={form.specialization} onChange={handleChange} required>
                    <option value="">Select specialization</option>
                    <option>ENT &amp; Head-Neck Surgery</option>
                    <option>Rhinology &amp; Sinus Surgery</option>
                    <option>Otology &amp; Neurotology</option>
                    <option>Laryngology</option>
                    <option>Paediatric ENT</option>
                    <option>General ENT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">License No.</label>
                  <input className="form-input" name="licenseNo" value={form.licenseNo} onChange={handleChange} placeholder="TN-MCI-XXXXX" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <input className="form-input" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 10 years" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Hospital / Clinic</label>
                  <input className="form-input" name="hospital" value={form.hospital} onChange={handleChange} placeholder="Hospital name, City" required />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--red-100)', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div className="auth-submit">
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account & Enter Dashboard'}
              </button>
            </div>
            <div className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
