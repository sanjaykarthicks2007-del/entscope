import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [patients, setPatients] = useState([])
  const [filter, setFilter] = useState('All')
  const [activeNav, setActiveNav] = useState('Queue')

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem('currentDoctor') || 'null')
    if (!d) { navigate('/login'); return }
    setDoctor(d)

    // Real-time listener from Firebase
    const unsub = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  async function handleLogout() {
    await signOut(auth)
    localStorage.removeItem('currentDoctor')
    navigate('/login')
  }

  async function startConsultation(patient) {
    await updateDoc(doc(db, 'patients', patient.id), { status: 'In Consultation' })
    navigate(`/consultation/${patient.id}`)
  }

  const filtered = filter === 'All'
    ? patients
    : patients.filter(p => p.status === filter)

  const waiting = patients.filter(p => p.status === 'Waiting').length
  const inConsult = patients.filter(p => p.status === 'In Consultation').length
  const completed = patients.filter(p => p.status === 'Completed').length

  const statusBadge = {
    'Waiting': <span className="badge badge-waiting">⏳ Waiting</span>,
    'In Consultation': <span className="badge badge-active">🟢 In Consultation</span>,
    'Completed': <span className="badge badge-completed">✓ Completed</span>,
  }

  if (!doctor) return null

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-mark" style={{ width: 32, height: 32 }}>
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <path d="M4 11 Q11 4 18 11 Q11 18 4 11Z" stroke="#5dd8d8" strokeWidth="1.5" fill="none"/>
                <circle cx="11" cy="11" r="2.5" fill="#02c4c4"/>
              </svg>
            </div>
            <span className="logo-text" style={{ fontSize: 18 }}>ENT<span>scope</span></span>
          </div>
          <div className="sidebar-doctor">
            <div className="doctor-avatar">{doctor.avatar || getInitials(doctor.name)}</div>
            <div className="doctor-info">
              <div className="name">{doctor.name}</div>
              <div className="spec">{doctor.specialization}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Clinic</div>
          {[
            { label: 'Queue', icon: '👥' },
            { label: 'Patients', icon: '📋' },
            { label: 'Reports', icon: '📄' },
          ].map(item => (
            <button
              key={item.label}
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.label === 'Queue' && waiting > 0 && (
                <span className="nav-item-badge">{waiting}</span>
              )}
            </button>
          ))}
          <div className="nav-section-label" style={{ marginTop: 8 }}>Actions</div>
          <button className="nav-item" onClick={() => navigate('/patient-register')}>
            <span>➕</span> Register Patient
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%' }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            {activeNav === 'Queue' ? "Today's Queue" : activeNav}
          </div>
          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient-register')}>
              + New Patient
            </button>
          </div>
        </div>

        <div className="content-area">
          <div className="stats-grid">
            {[
              { label: 'Total Today', value: patients.length, icon: '👥', bg: 'var(--teal-50)', color: 'var(--teal-700)', sub: 'registered' },
              { label: 'Waiting', value: waiting, icon: '⏳', bg: 'var(--amber-100)', color: '#92400e', sub: 'in queue' },
              { label: 'In Consultation', value: inConsult, icon: '🟢', bg: 'var(--green-100)', color: '#166534', sub: 'active now' },
              { label: 'Completed', value: completed, icon: '✓', bg: 'var(--slate-100)', color: 'var(--slate-700)', sub: 'seen today' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-header">
                  <span className="stat-card-label">{s.label}</span>
                  <div className="stat-card-icon" style={{ background: s.bg, color: s.color, fontSize: 16 }}>{s.icon}</div>
                </div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="queue-header">
            <h2 className="queue-title">Patient Queue</h2>
            <div className="queue-filters">
              {['All', 'Waiting', 'In Consultation', 'Completed'].map(f => (
                <button
                  key={f}
                  className={`queue-filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="patient-table-wrap">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Complaints</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: 40 }}>
                      No patients found
                    </td>
                  </tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="queue-no">
                        {p.queueNo > 0 ? `#${String(p.queueNo).padStart(2, '0')}` : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="patient-name-cell">
                        <div className="patient-avatar">{getInitials(p.name)}</div>
                        <div>
                          <div className="patient-name">{p.name}</div>
                          <div className="patient-id">{p.id.slice(0, 10)}…</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 14, color: 'var(--slate-600)' }}>
                      {p.age}y / {p.gender}
                    </td>
                    <td>
                      <span className="complaint-text" title={p.complaints}>{p.complaints}</span>
                    </td>
                    <td>{statusBadge[p.status]}</td>
                    <td style={{ fontSize: 13, color: 'var(--slate-400)' }}>
                      {new Date(p.registeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="action-btns">
                        {p.status === 'Waiting' && (
                          <button className="btn btn-primary btn-sm" onClick={() => startConsultation(p)}>Start</button>
                        )}
                        {p.status === 'In Consultation' && (
                          <button className="btn btn-amber btn-sm" onClick={() => startConsultation(p)}>Resume</button>
                        )}
                        {p.status === 'Completed' && (
                          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/report/${p.id}`)}>Report</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/report/${p.id}`)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="quick-register" style={{ marginTop: 28 }}>
            <div className="quick-register-title">Your Practice Info</div>
            <div className="quick-register-grid">
              {[
                { label: 'Doctor', value: doctor.name },
                { label: 'Specialization', value: doctor.specialization },
                { label: 'License', value: doctor.licenseNo },
                { label: 'Hospital', value: doctor.hospital },
                { label: 'Phone', value: doctor.phone },
                { label: 'Experience', value: doctor.experience },
              ].map(f => (
                <div key={f.label} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <div style={{ fontSize: 14, color: 'var(--slate-700)', fontWeight: 500, padding: '8px 0' }}>
                    {f.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
