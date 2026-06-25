# ENTscope — Clinical Consultation Platform

A full-featured ENT clinic management web app built with React + Vite.

## 📁 Project Structure

```
entscope/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              ← Entry point
    ├── App.jsx               ← Router
    ├── data/
    │   └── sampleData.js     ← Demo doctors, patients, findings
    ├── styles/
    │   └── global.css        ← Full design system (all pages)
    └── pages/
        ├── LandingPage.jsx
        ├── DoctorLogin.jsx
        ├── DoctorRegister.jsx
        ├── PatientRegister.jsx
        ├── DoctorDashboard.jsx
        ├── LiveConsultation.jsx
        └── ConsultationReport.jsx
```

## 🚀 Setup & Run

### Prerequisites
- Node.js 18+ installed (https://nodejs.org)

### Steps

```bash
# 1. Navigate into the project folder
cd entscope

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Then open http://localhost:5173 in your browser.

## 🔑 Demo Login

```
Email:    priya@entscope.in
Password: doctor123
```

Or register a new doctor account via the Register page.

## 📄 Build for Production

```bash
npm run build
npm run preview
```

## 🧭 Pages & Routes

| Route | Page |
|---|---|
| `/` | Landing Page |
| `/login` | Doctor Login |
| `/register` | Doctor Register |
| `/patient-register` | Patient Registration |
| `/dashboard` | Doctor Dashboard (protected) |
| `/consultation/:id` | Live Consultation (protected) |
| `/report/:id` | Consultation Report (protected) |

## ✨ Features

- **Landing Page** — Marketing page with features + stats
- **Doctor Auth** — Register & login with localStorage persistence
- **Patient Queue** — Add patients, track Waiting / In Consultation / Completed
- **Live Consultation** — Camera feed, brightness/contrast/zoom controls, snapshots, click-to-select findings & diagnoses, doctor notes
- **Consultation Report** — Printable clinical report with all findings, snapshots, doctor signature strip

## 🎨 Tech Stack

- React 18
- React Router v6
- Vite 5
- Pure CSS (no Tailwind, no component library)
- LocalStorage for persistence (no backend needed)
