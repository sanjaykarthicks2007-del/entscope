import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />

      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-mark">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11 Q11 4 18 11 Q11 18 4 11Z" stroke="#5dd8d8" strokeWidth="1.5" fill="none"/>
              <circle cx="11" cy="11" r="2.5" fill="#02c4c4"/>
            </svg>
          </div>
          <span className="logo-text">ENT<span>scope</span></span>
        </div>
        <div className="landing-nav-links">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Register Practice</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero fade-up">
        <div className="hero-eyebrow">
          <span className="hero-dot" />
          ENT Clinical Consultation Platform
        </div>
        <h1 className="hero-title">
          Precision care,<br /><em className="accent">clearly seen.</em>
        </h1>
        <p className="hero-subtitle">
          ENTscope brings endoscopy-grade consultation tools, smart patient queuing, and real-time clinical documentation into one seamless platform for ENT specialists.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Start Free Trial
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
            View Demo
          </button>
        </div>

        <div className="hero-stats">
          {[
            { value: '2,400+', label: 'Consultations daily' },
            { value: '340', label: 'ENT specialists' },
            { value: '98.2%', label: 'Uptime SLA' },
            { value: '<2s', label: 'Report generation' },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="landing-features">
        <div className="features-grid">
          {[
            {
              icon: '🔬',
              title: 'Live Endoscopy Viewer',
              desc: 'Stream and annotate endoscopy footage in real-time with brightness, contrast, and zoom controls — no extra software needed.',
            },
            {
              icon: '📋',
              title: 'Smart Patient Queue',
              desc: 'Auto-assign queue numbers, track consultation status, and register patients in under 60 seconds with prefilled ENT templates.',
            },
            {
              icon: '📄',
              title: 'Instant Clinical Reports',
              desc: 'Generate structured, printable consultation reports with findings, diagnosis, snapshots, and doctor signature in one click.',
            },
            {
              icon: '💊',
              title: 'ENT-Specific Templates',
              desc: 'Pre-loaded endoscopy findings and diagnosis lists curated for ENT — rhinology, otology, laryngology, and head-neck.',
            },
            {
              icon: '🔒',
              title: 'Secure & Compliant',
              desc: 'Patient data encrypted at rest and in transit. Designed for HIPAA-aligned clinical environments.',
            },
            {
              icon: '📱',
              title: 'Works Everywhere',
              desc: 'Fully responsive — use from your clinic desktop, tablet at bedside, or phone on the go. No app install needed.',
            },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ fontSize: 24 }}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="landing-cta">
        <div className="cta-text">
          <h2>Ready for your first scope?</h2>
          <p>Join 340+ ENT specialists already using ENTscope in their practice.</p>
        </div>
        <div className="cta-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Create Account</button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        © 2026 ENTscope. Built for ENT specialists, by clinicians.
      </footer>
    </div>
  )
}
