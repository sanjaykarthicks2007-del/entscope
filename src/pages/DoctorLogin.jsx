import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password)
      const snap = await getDoc(doc(db, 'doctors', cred.user.uid))
      if (snap.exists()) {
        localStorage.setItem('currentDoctor', JSON.stringify({ id: cred.user.uid, ...snap.data() }))
      } else {
        localStorage.setItem('currentDoctor', JSON.stringify({ id: cred.user.uid, email: form.email, name: 'Doctor' }))
      }
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card fade-up">
        <div className="login-logo">
          <div className="logo-mark" style={{ width: 34, height: 34 }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M4 11 Q11 4 18 11 Q11 18 4 11Z" stroke="#5dd8d8" strokeWidth="1.5" fill="none"/>
              <circle cx="11" cy="11" r="2.5" fill="#02c4c4"/>
            </svg>
          </div>
          <span className="logo-text" style={{ color: 'var(--slate-900)' }}>
            ENT<span style={{ color: 'var(--teal-600)' }}>scope</span>
          </span>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Sign in to your clinical dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="doctor@hospital.com"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ background: 'var(--red-100)', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 20 }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: 20 }}>
          New to ENTscope? <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  )
}
