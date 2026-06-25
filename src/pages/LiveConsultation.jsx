import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { endoscopyFindings, diagnosisList } from '../data/sampleData'
import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function LiveConsultation() {
  const { patientId } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [doctor, setDoctor] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [videoReady, setVideoReady] = useState(false)

  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [zoom, setZoom] = useState(1)

  const [snapshots, setSnapshots] = useState([])
  const [snapshotFlash, setSnapshotFlash] = useState(false)

  const [selectedFindings, setSelectedFindings] = useState([])
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([])
  const [notes, setNotes] = useState('')
  const [prescription, setPrescription] = useState('')

  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const d = JSON.parse(localStorage.getItem('currentDoctor') || 'null')
    setDoctor(d)

    async function loadPatient() {
      const snap = await getDoc(doc(db, 'patients', patientId))
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() }
        setPatient(p)
        if (p.consultationNotes) setNotes(p.consultationNotes)
        if (p.findings) setSelectedFindings(p.findings)
        if (p.diagnosis) setSelectedDiagnosis(p.diagnosis)
        if (p.prescription) setPrescription(p.prescription)
      }
    }
    loadPatient()

    const interval = setInterval(() =>
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [patientId])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, cameraOn])

  async function toggleCamera() {
    if (cameraOn) {
      stream?.getTracks().forEach(t => t.stop())
      setStream(null)
      setCameraOn(false)
      setVideoReady(false)
      setCameraError('')
    } else {
      setCameraStarting(true)
      setCameraError('')
      const attempts = [
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: true, audio: false },
      ]
      let got = null
      let lastErr = null
      for (const c of attempts) {
        try { got = await navigator.mediaDevices.getUserMedia(c); break }
        catch (err) { lastErr = err }
      }
      setCameraStarting(false)
      if (got) {
        setStream(got)
        setCameraOn(true)
        setCameraError('')
      } else {
        const err = lastErr
        setCameraError(
          err?.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' :
          err?.name === 'NotFoundError' ? 'No camera detected. Connect an endoscope or webcam.' :
          'Camera unavailable. Use Demo mode below.'
        )
        setCameraOn(false)
      }
    }
  }

  function startDemoMode() {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraOn(true)
    setCameraError('')
  }

  function takeSnapshot() {
    const canvas = canvasRef.current
    if (!canvas) return
    setSnapshotFlash(true)
    setTimeout(() => setSnapshotFlash(false), 300)

    if (videoRef.current && stream && videoReady) {
      const ctx = canvas.getContext('2d')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      setSnapshots(s => [...s, canvas.toDataURL('image/jpeg', 0.85)])
    } else {
      const ctx = canvas.getContext('2d')
      canvas.width = 640; canvas.height = 480
      const bg = ctx.createRadialGradient(320, 240, 10, 320, 240, 280)
      bg.addColorStop(0, '#0d2b2b')
      bg.addColorStop(0.6, '#011a1a')
      bg.addColorStop(1, '#000')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 640, 480)
      ctx.strokeStyle = '#5dd8d8'; ctx.lineWidth = 2; ctx.globalAlpha = 0.5
      ctx.beginPath(); ctx.ellipse(320, 240, 200, 160, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = 0.7
      ctx.strokeStyle = '#02c4c4'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.ellipse(320, 240, 90, 72, 0.4, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = 'rgba(2,196,196,0.18)'
      ctx.beginPath(); ctx.ellipse(320, 240, 90, 72, 0.4, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#5dd8d8'; ctx.font = 'bold 12px monospace'
      ctx.fillText('ENTscope DEMO', 18, 28)
      ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(93,216,216,0.6)'
      ctx.fillText(new Date().toLocaleTimeString(), 18, 46)
      ctx.fillText('WL: NORMAL  |  MAG: 1.0x', 18, 464)
      ctx.strokeStyle = 'rgba(93,216,216,0.4)'; ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(320, 180); ctx.lineTo(320, 300); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(240, 240); ctx.lineTo(400, 240); ctx.stroke()
      ctx.setLineDash([])
      setSnapshots(s => [...s, canvas.toDataURL('image/jpeg', 0.9)])
    }
  }

  const toggleFinding = f =>
    setSelectedFindings(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  const toggleDiagnosis = d =>
    setSelectedDiagnosis(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  async function endConsultation() {
    const consultationData = {
      patientId,
      doctorId: doctor?.id || '',
      notes,
      findings: selectedFindings,
      diagnosis: selectedDiagnosis,
      prescription,
      snapshots,
      completedAt: new Date().toISOString(),
      duration: elapsed,
    }
    await addDoc(collection(db, 'consultations'), consultationData)
    await updateDoc(doc(db, 'patients', patientId), {
      status: 'Completed',
      completedAt: new Date().toISOString(),
      queueNo: 0,
      consultationNotes: notes,
      findings: selectedFindings,
      diagnosis: selectedDiagnosis,
    })
    stream?.getTracks().forEach(t => t.stop())
    navigate(`/report/${patientId}`)
  }

  function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const videoStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
    transform: `scale(${zoom})`,
    transformOrigin: 'center',
    transition: 'transform 0.2s',
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  }

  if (!patient) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0f1a', color: 'white', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #5dd8d8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading patient…</span>
    </div>
  )

  return (
    <div className="consultation-page">
      <div className="consultation-topbar">
        <div className="consultation-title">
          <div className="live-indicator"><span className="live-dot" />LIVE</div>
          <div className="patient-chip">
            <div>
              <div className="name">{patient.name}</div>
              <div className="meta">{patient.age}y · {patient.gender} · {patient.bloodGroup}</div>
            </div>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            ⏱ {formatTime(elapsed)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="ctrl-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <button className="btn btn-danger btn-sm" onClick={endConsultation}>End &amp; Generate Report</button>
        </div>
      </div>

      <div className="consultation-workspace">
        <div className="video-area">
          <div className="video-main" style={{ position: 'relative', overflow: 'hidden' }}>

            {cameraStarting && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#080e1a', zIndex: 10 }}>
                <div style={{ width: 48, height: 48, border: '3px solid #5dd8d8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'rgba(93,216,216,0.8)', fontSize: 14, fontFamily: 'monospace' }}>Connecting camera…</p>
              </div>
            )}

            {cameraOn && stream && (
              <video ref={videoRef} autoPlay muted playsInline className="video-element" style={videoStyle}
                onLoadedMetadata={() => setVideoReady(true)} onCanPlay={() => setVideoReady(true)} />
            )}

            {cameraOn && !stream && !cameraStarting && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#080e1a' }}>
                <svg viewBox="0 0 220 165" width="220" height="165">
                  <defs>
                    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0d2b2b" />
                      <stop offset="100%" stopColor="#000" />
                    </radialGradient>
                  </defs>
                  <rect width="220" height="165" fill="url(#bgGrad)" />
                  <ellipse cx="110" cy="82" rx="80" ry="62" stroke="#5dd8d8" strokeWidth="1" fill="none" opacity="0.5" />
                  <ellipse cx="110" cy="82" rx="40" ry="31" stroke="#02c4c4" strokeWidth="1.5" fill="rgba(2,196,196,0.15)" />
                  <circle cx="110" cy="82" r="9" fill="#5dd8d8" opacity="0.8" />
                  <line x1="110" y1="55" x2="110" y2="109" stroke="rgba(93,216,216,0.3)" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="78" y1="82" x2="142" y2="82" stroke="rgba(93,216,216,0.3)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="12" y="20" fill="#5dd8d8" fontSize="9" fontFamily="monospace" opacity="0.7">ENTscope DEMO</text>
                  <text x="12" y="155" fill="rgba(93,216,216,0.5)" fontSize="8" fontFamily="monospace">WL: NORMAL | MAG: 1.0x</text>
                </svg>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
                  {cameraError || 'Demo mode — simulated endoscope feed'}
                </p>
              </div>
            )}

            {!cameraOn && !cameraStarting && (
              <div className="video-no-feed">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M15 10l4.553-2.277A1 1 0 0121 8.62v6.76a1 1 0 01-1.447.898L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p>Endoscope feed inactive</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ctrl-btn ctrl-btn-teal" onClick={toggleCamera}>▶ Start Camera</button>
                  <button className="ctrl-btn" onClick={startDemoMode}>🖥️ Demo Mode</button>
                </div>
                {cameraError && (
                  <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 8, maxWidth: 260, textAlign: 'center' }}>{cameraError}</p>
                )}
              </div>
            )}

            {snapshotFlash && (
              <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.7, pointerEvents: 'none', zIndex: 20 }} />
            )}

            {cameraOn && stream && videoReady && (
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '4px 10px', zIndex: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: 11, color: 'white', fontFamily: 'monospace' }}>LIVE</span>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <div className="video-controls">
            <div className="controls-row">
              <div className="controls-group">
                <button className={`ctrl-btn ${cameraOn ? 'active' : ''}`} onClick={toggleCamera} disabled={cameraStarting}>
                  {cameraStarting ? '⏳ Starting…' : cameraOn ? '⏹ Stop' : '📷 Start Camera'}
                </button>
                <button className="ctrl-btn ctrl-btn-teal" onClick={takeSnapshot} disabled={!cameraOn}>
                  📸 Snapshot
                </button>
              </div>
              <div className="controls-group">
                <div className="slider-control">
                  <span className="slider-label">Brightness</span>
                  <input type="range" min="50" max="200" value={brightness} onChange={e => setBrightness(+e.target.value)} />
                  <span className="slider-value">{brightness}%</span>
                </div>
              </div>
              <div className="controls-group">
                <div className="slider-control">
                  <span className="slider-label">Contrast</span>
                  <input type="range" min="50" max="200" value={contrast} onChange={e => setContrast(+e.target.value)} />
                  <span className="slider-value">{contrast}%</span>
                </div>
              </div>
              <div className="controls-group">
                <div className="slider-control">
                  <span className="slider-label">Zoom</span>
                  <input type="range" min="100" max="300" value={zoom * 100} onChange={e => setZoom(+e.target.value / 100)} />
                  <span className="slider-value">{Math.round(zoom * 100)}%</span>
                </div>
              </div>
              <div className="controls-group">
                <button className="ctrl-btn" onClick={() => { setBrightness(100); setContrast(100); setZoom(1) }}>↺ Reset</button>
              </div>
            </div>
          </div>

          {snapshots.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                Snapshots ({snapshots.length})
              </div>
              <div className="snapshots-row">
                {snapshots.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt={`Snapshot ${i + 1}`} className="snapshot-thumb" />
                    <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 9, fontFamily: 'monospace', padding: '2px 5px', borderRadius: 4 }}>
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="notes-panel">
          <div className="notes-panel-header">
            <span className="notes-panel-title">📋 Clinical Notes</span>
            <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>#{patient.id}</span>
          </div>

          <div className="notes-section">
            <div className="notes-section-label">Patient Info</div>
            <div className="patient-info-grid">
              {[
                { l: 'Blood Group', v: patient.bloodGroup },
                { l: 'Allergies', v: patient.allergies },
                { l: 'Medications', v: patient.medications },
                { l: 'History', v: patient.history?.slice(0, 60) + (patient.history?.length > 60 ? '…' : '') },
              ].map(f => (
                <div key={f.l} className="info-pill">
                  <div className="info-pill-label">{f.l}</div>
                  <div className="info-pill-value">{f.v || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="notes-section">
            <div className="notes-section-label">Chief Complaints</div>
            <p style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6 }}>{patient.complaints}</p>
          </div>

          <div className="notes-section">
            <div className="notes-section-label">Endoscopy Findings</div>
            <div className="tag-list">
              {endoscopyFindings.map(f => (
                <span key={f} className={`tag ${selectedFindings.includes(f) ? 'selected' : ''}`} onClick={() => toggleFinding(f)}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="notes-section">
            <div className="notes-section-label">Diagnosis</div>
            <div className="tag-list">
              {diagnosisList.map(d => (
                <span key={d} className={`tag ${selectedDiagnosis.includes(d) ? 'selected' : ''}`} onClick={() => toggleDiagnosis(d)}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="notes-section">
            <div className="notes-section-label">Doctor's Notes</div>
            <textarea className="notes-textarea" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Clinical observations, examination findings, plan…" style={{ minHeight: 100 }} />
          </div>

          <div className="notes-section">
            <div className="notes-section-label">Prescription / Management</div>
            <textarea className="notes-textarea" value={prescription} onChange={e => setPrescription(e.target.value)}
              placeholder="Medications, dosage, follow-up, investigations…" style={{ minHeight: 80 }} />
          </div>

          <div className="notes-panel-footer">
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={endConsultation}>
              ✓ End Consultation &amp; Report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
