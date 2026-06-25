import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function ConsultationReport() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem('currentDoctor') || 'null')
    setDoctor(d)

    async function fetchData() {
      try {
        // Get patient from Firebase
        const patientSnap = await getDoc(doc(db, 'patients', patientId))
        if (patientSnap.exists()) {
          setPatient({ id: patientSnap.id, ...patientSnap.data() })
        }

        // Get consultation from Firebase
        const q = query(collection(db, 'consultations'), where('patientId', '==', patientId))
        const consultSnap = await getDocs(q)
        if (!consultSnap.empty) {
          setConsultation(consultSnap.docs[0].data())
        } else if (patientSnap.exists()) {
          // Fallback to patient-embedded data
          const p = patientSnap.data()
          setConsultation({
            notes: p.consultationNotes || '',
            findings: p.findings || [],
            diagnosis: p.diagnosis || [],
            prescription: p.prescription || '',
            snapshots: p.snapshots || [],
            completedAt: p.completedAt || p.registeredAt,
          })
        }
      } catch (err) {
        console.error('Error loading report:', err)
      }
      setLoading(false)
    }

    fetchData()
  }, [patientId])

  function handlePrint() { window.print() }

  const reportId = `ENT-${patientId?.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`
  const reportDate = consultation?.completedAt
    ? new Date(consultation.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--slate-100)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--teal-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--slate-500)', fontSize: 14 }}>Loading report…</p>
    </div>
  )

  if (!patient) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--slate-100)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--slate-500)', marginBottom: 16 }}>Patient not found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  )

  return (
    <div className="report-page">
      <div className="report-topbar">
        <div className="report-topbar-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <span style={{ color: 'var(--slate-300)' }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--slate-700)' }}>Consultation Report</span>
        </div>
        <div className="report-topbar-right">
          <button className="btn btn-outline btn-sm" onClick={handlePrint}>🖨 Print / PDF</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>Done</button>
        </div>
      </div>

      <div className="report-container">
        <div className="report-document">
          <div className="report-header">
            <div className="report-header-left">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div className="logo-mark" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <path d="M4 11 Q11 4 18 11 Q11 18 4 11Z" stroke="#5dd8d8" strokeWidth="1.5" fill="none"/>
                    <circle cx="11" cy="11" r="2.5" fill="#5dd8d8"/>
                  </svg>
                </div>
                <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, letterSpacing: '-0.02em' }}>
                  ENT<span style={{ color: 'var(--teal-300)' }}>scope</span>
                </span>
              </div>
              <h1>Consultation Report</h1>
              <p>{doctor?.hospital || 'ENT Speciality Clinic'}</p>
            </div>
            <div className="report-id-block">
              <div className="report-id">{reportId}</div>
              <div className="report-date">{reportDate}</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-completed" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                  ✓ Completed
                </span>
              </div>
            </div>
          </div>

          <div className="report-body">
            <div className="report-section">
              <div className="report-section-title">👤 Patient Details</div>
              <div className="report-2col">
                {[
                  { label: 'Full Name', value: patient.name },
                  { label: 'Patient ID', value: patient.id },
                  { label: 'Age', value: `${patient.age} years` },
                  { label: 'Gender', value: patient.gender },
                  { label: 'Date of Birth', value: patient.dob || '—' },
                  { label: 'Blood Group', value: patient.bloodGroup || '—' },
                  { label: 'Phone', value: patient.phone || '—' },
                  { label: 'Email', value: patient.email || '—' },
                ].map(f => (
                  <div key={f.label} className="report-field">
                    <div className="report-field-label">{f.label}</div>
                    <div className="report-field-value">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section">
              <div className="report-section-title">📋 Clinical History</div>
              <div className="report-2col" style={{ marginBottom: 16 }}>
                <div className="report-field">
                  <div className="report-field-label">Known Allergies</div>
                  <div className="report-field-value">{patient.allergies || 'None known'}</div>
                </div>
                <div className="report-field">
                  <div className="report-field-label">Current Medications</div>
                  <div className="report-field-value">{patient.medications || 'None'}</div>
                </div>
              </div>
              <div className="report-field">
                <div className="report-field-label">Medical History</div>
                <div className="report-field-value">{patient.history || '—'}</div>
              </div>
            </div>

            <div className="report-section">
              <div className="report-section-title">🔍 Chief Complaints</div>
              <div className="report-notes-block">{patient.complaints}</div>
            </div>

            <div className="report-section">
              <div className="report-section-title">🔬 Endoscopy Findings</div>
              {consultation?.findings?.length > 0 ? (
                <ul className="report-findings-list">
                  {consultation.findings.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              ) : (
                <p style={{ color: 'var(--slate-400)', fontSize: 14 }}>No endoscopy findings recorded.</p>
              )}
            </div>

            <div className="report-section">
              <div className="report-section-title">🩺 Diagnosis</div>
              {consultation?.diagnosis?.length > 0 ? (
                <div className="report-tag-row">
                  {consultation.diagnosis.map((d, i) => <span key={i} className="report-tag">{d}</span>)}
                </div>
              ) : (
                <p style={{ color: 'var(--slate-400)', fontSize: 14 }}>No diagnosis recorded.</p>
              )}
            </div>

            <div className="report-section">
              <div className="report-section-title">📝 Doctor's Notes</div>
              {consultation?.notes ? (
                <div className="report-notes-block">{consultation.notes}</div>
              ) : (
                <p style={{ color: 'var(--slate-400)', fontSize: 14 }}>No notes recorded.</p>
              )}
            </div>

            {consultation?.prescription && (
              <div className="report-section">
                <div className="report-section-title">💊 Prescription / Management</div>
                <div className="report-notes-block">{consultation.prescription}</div>
              </div>
            )}

            <div className="report-section">
              <div className="report-section-title">📸 Endoscopy Snapshots</div>
              {consultation?.snapshots?.length > 0 ? (
                <div className="report-snapshots-grid">
                  {consultation.snapshots.map((src, i) => (
                    <div key={i} className="report-snapshot">
                      <img src={src} alt={`Snapshot ${i + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="report-snapshots-grid">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="report-snapshot">
                      <div className="report-snapshot-empty">No image</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="report-section">
              <div className="report-section-title">👨‍⚕️ Consulting Doctor</div>
              <div className="report-2col">
                {[
                  { label: 'Name', value: doctor?.name || '—' },
                  { label: 'Specialization', value: doctor?.specialization || '—' },
                  { label: 'License No.', value: doctor?.licenseNo || '—' },
                  { label: 'Hospital', value: doctor?.hospital || '—' },
                ].map(f => (
                  <div key={f.label} className="report-field">
                    <div className="report-field-label">{f.label}</div>
                    <div className="report-field-value">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="report-footer-strip">
            <div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, marginBottom: 4 }}>ENTscope</div>
              <div className="report-watermark">CONFIDENTIAL MEDICAL RECORD — NOT FOR PUBLIC DISTRIBUTION</div>
            </div>
            <div className="report-doctor-sig">
              <div className="report-sig-line" />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{doctor?.name || 'Consulting Doctor'}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{doctor?.specialization || 'ENT Specialist'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
