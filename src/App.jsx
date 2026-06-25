import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import LandingPage from './pages/LandingPage.jsx'
import DoctorRegister from './pages/DoctorRegister.jsx'
import DoctorLogin from './pages/DoctorLogin.jsx'
import PatientRegister from './pages/PatientRegister.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import LiveConsultation from './pages/LiveConsultation.jsx'
import ConsultationReport from './pages/ConsultationReport.jsx'

function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setChecking(false)
    })
    return () => unsub()
  }, [])

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--teal-950)', color: 'white', fontSize: 16 }}>
      Loading…
    </div>
  )

  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<DoctorRegister />} />
        <Route path="/login" element={<DoctorLogin />} />
        <Route path="/patient-register" element={<PatientRegister />} />
        <Route path="/dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/consultation/:patientId" element={<ProtectedRoute><LiveConsultation /></ProtectedRoute>} />
        <Route path="/report/:patientId" element={<ProtectedRoute><ConsultationReport /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
