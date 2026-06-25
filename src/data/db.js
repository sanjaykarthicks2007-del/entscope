/**
 * db.js — ENTscope localStorage database utility
 * Single source of truth for all data access across the app.
 * Handles merging sample data with persisted data, deduplication,
 * and provides a clean CRUD API.
 */

import { samplePatients, sampleDoctors } from './sampleData'

// ─── KEYS ────────────────────────────────────────────────────────────────────
const KEYS = {
  patients:      'entscope_patients',
  doctors:       'entscope_doctors',
  consultations: 'entscope_consultations',
  currentDoctor: 'entscope_current_doctor',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
/** Deduplicate an array of objects by `id`, later entries win (override sample data) */
function dedupeById(arr) {
  const map = new Map()
  arr.forEach(item => map.set(item.id, item))
  return Array.from(map.values())
}

// ─── PATIENTS ────────────────────────────────────────────────────────────────
/** Returns merged, deduplicated list of all patients (sample + registered) */
export function getPatients() {
  const stored = read(KEYS.patients) || []
  return dedupeById([...samplePatients, ...stored])
}

/** Upsert a single patient record. If id exists → update, else → insert. */
export function savePatient(patient) {
  const stored = read(KEYS.patients) || []
  const idx = stored.findIndex(p => p.id === patient.id)
  if (idx !== -1) {
    stored[idx] = patient
  } else {
    stored.push(patient)
  }
  write(KEYS.patients, stored)
}

/** Get a single patient by id */
export function getPatient(id) {
  return getPatients().find(p => p.id === id) || null
}

/** Calculate next queue number across ALL patients (sample + stored) */
export function nextQueueNumber() {
  const all = getPatients()
  const active = all.filter(p => p.status === 'Waiting' || p.status === 'In Consultation')
  if (active.length === 0) return 1
  return Math.max(...active.map(p => p.queueNo || 0)) + 1
}

// ─── DOCTORS ─────────────────────────────────────────────────────────────────
/** Returns merged, deduplicated list of all doctors */
export function getDoctors() {
  const stored = read(KEYS.doctors) || []
  return dedupeById([...sampleDoctors, ...stored])
}

/** Register a new doctor (or update existing by id) */
export function saveDoctor(doctor) {
  const stored = read(KEYS.doctors) || []
  const idx = stored.findIndex(d => d.id === doctor.id)
  if (idx !== -1) {
    stored[idx] = doctor
  } else {
    stored.push(doctor)
  }
  write(KEYS.doctors, stored)
}

/** Find a doctor by email + password (for login) */
export function findDoctorByCredentials(email, password) {
  return getDoctors().find(d => d.email === email && d.password === password) || null
}

// ─── CURRENT SESSION ─────────────────────────────────────────────────────────
export function getCurrentDoctor() {
  return read(KEYS.currentDoctor)
}

export function setCurrentDoctor(doctor) {
  write(KEYS.currentDoctor, doctor)
}

export function clearCurrentDoctor() {
  localStorage.removeItem(KEYS.currentDoctor)
}

// ─── CONSULTATIONS ───────────────────────────────────────────────────────────
export function getConsultations() {
  return read(KEYS.consultations) || {}
}

export function getConsultation(patientId) {
  const all = getConsultations()
  return all[patientId] || null
}

export function saveConsultation(patientId, data) {
  const all = getConsultations()
  all[patientId] = { ...data, savedAt: new Date().toISOString() }
  write(KEYS.consultations, all)
}

// ─── MIGRATION: import legacy keys on first load ──────────────────────────────
// Silently migrate old localStorage keys so existing data isn't lost.
export function migrateOldData() {
  // Migrate old 'patients' key
  if (!localStorage.getItem(KEYS.patients) && localStorage.getItem('patients')) {
    try {
      const old = JSON.parse(localStorage.getItem('patients') || '[]')
      write(KEYS.patients, old)
    } catch {}
  }
  // Migrate old 'registeredDoctors' key
  if (!localStorage.getItem(KEYS.doctors) && localStorage.getItem('registeredDoctors')) {
    try {
      const old = JSON.parse(localStorage.getItem('registeredDoctors') || '[]')
      write(KEYS.doctors, old)
    } catch {}
  }
  // Migrate old 'consultations' key
  if (!localStorage.getItem(KEYS.consultations) && localStorage.getItem('consultations')) {
    try {
      const old = JSON.parse(localStorage.getItem('consultations') || '{}')
      write(KEYS.consultations, old)
    } catch {}
  }
  // Migrate old 'currentDoctor' key
  if (!localStorage.getItem(KEYS.currentDoctor) && localStorage.getItem('currentDoctor')) {
    try {
      const old = JSON.parse(localStorage.getItem('currentDoctor') || 'null')
      if (old) write(KEYS.currentDoctor, old)
    } catch {}
  }
}
