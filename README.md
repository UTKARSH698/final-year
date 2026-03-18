<div align="center">

# 🌾 AgriFuture India
### AI-Powered Agricultural Decision Platform for Indian Farmers

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://final-year-pjf9.onrender.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini_API-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

> A full-stack agricultural intelligence platform that combines AI-powered crop recommendations, live market data, real-time weather, disease detection, and an e-commerce store — built for Indian farmers.

**Final Year Project — ITM Vocational University, B.Tech CSE (Cloud Technology & Information Security)**

| Role | Team Member |
|------|-------------|
| UI & Design Lead | Utkarsh Batham |
| Model Training Lead | Nikhil Sharma |
| Data Collection Lead | Hiren Mahida |
| Deployment Lead | Harsh Kumar |

</div>

---

## Live Demo

**[https://final-year-pjf9.onrender.com/](https://final-year-pjf9.onrender.com/)**

---

## Features

### 🤖 AI Intelligence (Powered by Google Gemini)
- **Crop Recommendation Engine** — Input soil parameters (N, P, K, pH, rainfall, soil type, location) and get AI-powered crop recommendations with confidence scores
- **AI Disease Detector** — Upload or scan crop images for disease diagnosis and treatment suggestions
- **Digital Twin Simulation** — Live AI simulation of field parameters powered by Gemini
- **AgriBot** — Conversational AI chatbot for farming queries

### 📊 Live Data Feeds
- **Mandi Price Ticker** — Real-time crop market prices (Paddy, Cotton, Soybean, etc.) with % change and source mandis
- **Weather Dashboard** — Met-station synced live weather: temperature, humidity, UV index, wind, atmospheric pressure, rain risk, photosynthesis index
- **Monsoon Sync** — Active monsoon tracking with seasonal alerts

### 🗺️ Agricultural Tools
- **Field Analysis** — Detailed soil parameter input with IoT sensor bridge support (auto-sync with field telemetry hardware)
- **Crop Calendar** — Season-wise planting and harvesting schedule
- **Crop Guide** — Growing guides, best practices, and regional recommendations
- **Government Schemes Finder** — Search and filter central and state agricultural schemes

### 💳 Commerce & Finance
- **AgriStore** — E-commerce marketplace for seeds, fertilisers, and equipment with Razorpay payment integration
- **Expense Tracker** — Farm expense logging and financial reporting
- **Report History** — Track all previous scans, recommendations, and market reports

### 👤 Authentication & Accounts
- **JWT Authentication** — Secure httpOnly cookie-based sessions (7-day expiry)
- **OTP Verification** — Email OTP via Nodemailer (Gmail) + SMS OTP via MSG91
- **bcrypt Password Hashing** — Secure credential storage in SQLite
- **User Profiles** — Personalised dashboards and saved recommendations

### 🌍 Accessibility
- **Multi-language Support** — Language switcher for regional Indian languages
- **Dark/Light Mode** — Theme toggle
- **Responsive Design** — Works on mobile and desktop

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| TypeScript 5.8 | Type-safe development |
| Vite 6 | Build tool & dev server |
| Framer Motion | Animations & transitions |
| Lucide React | Icon library |
| React Markdown | Rendering AI responses |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| Better-SQLite3 | Local SQLite database |
| JSON Web Tokens (JWT) | Auth session management |
| bcryptjs | Password hashing |
| Nodemailer | Email OTP delivery |
| MSG91 | SMS OTP delivery |
| Razorpay | Payment gateway |
| Axios | External API calls |

### AI & External APIs
| Service | Purpose |
|---|---|
| Google Gemini API | Crop recommendations, disease detection, digital twin |
| Weather APIs | Live met-station data |
| Market Data APIs | Live mandi prices |

### Deployment
| Platform | Purpose |
|---|---|
| Render | Production deployment (primary) |
| Railway | Alternative deployment |

---

## Project Structure

```
agrifuture/
├── components/
│   ├── PredictionForm.tsx     # Crop recommendation input (soil params)
│   ├── ResultsView.tsx        # AI recommendation output
│   ├── DiseaseDetector.tsx    # Crop disease detection
│   ├── WeatherSection.tsx     # Live weather dashboard
│   ├── MandiTicker.tsx        # Live market price ticker
│   ├── MarketAnalysis.tsx     # Market trends & analysis
│   ├── CropGuide.tsx          # Crop growing guides
│   ├── CropCalendar.tsx       # Planting & harvest calendar
│   ├── SchemesFinder.tsx      # Government scheme search
│   ├── ExpenseTracker.tsx     # Farm finance tracker
│   ├── Shop.tsx               # E-commerce store (Razorpay)
│   ├── AgriDrone.tsx          # Drone integration module
│   ├── DigitalTwin.tsx        # Gemini-powered field simulation
│   ├── ChatBot.tsx            # AI conversational assistant
│   ├── LoginModal.tsx         # Auth (OTP + password)
│   ├── UserProfile.tsx        # User account
│   ├── History.tsx            # Scan & report history
│   └── Navbar.tsx             # Navigation
├── services/
│   └── geminiService.ts       # Google Gemini API integration
├── server.ts                  # Express backend (auth, payments, APIs)
├── db.ts                      # SQLite database setup
├── AuthContext.tsx             # React auth state management
├── App.tsx                    # Root component & routing
├── types.ts                   # TypeScript type definitions
├── constants.ts               # App-wide constants
├── render.yaml                # Render deployment config
├── railway.json               # Railway deployment config
└── vite.config.ts             # Vite build config
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://ai.google.dev/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/UTKARSH698/final-year.git
cd final-year

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Auth
JWT_SECRET=your_jwt_secret_here

# Email OTP (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# SMS OTP
MSG91_AUTH_KEY=your_msg91_key
MSG91_TEMPLATE_ID=your_template_id

# Payments (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Run Locally

```bash
npm run dev
```

The app runs at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

---

## Deployment

### Render (Recommended)

1. Fork this repository
2. Connect to [Render](https://render.com/) and create a new **Web Service**
3. Set the build command: `npm install --include=dev && npm run build`
4. Set the start command: `npm start`
5. Add all environment variables in the Render dashboard
6. Deploy

The `render.yaml` in this repo auto-configures the service settings.

### Railway

Import the repo into [Railway](https://railway.app/) — `railway.json` handles the config automatically.

---

## Architecture

```
Browser (React + TypeScript + Vite)
         │
         │ HTTP / REST
         ▼
Express Server (Node.js + TypeScript)
    ├── /api/auth         JWT auth, OTP via Email + SMS
    ├── /api/payments     Razorpay order creation & verification
    ├── /api/weather      Live met-station proxy
    ├── /api/market       Mandi price data proxy
    └── Static files      Vite build output
         │
         ├── SQLite DB     User accounts, reports, expenses
         └── Gemini API    Crop AI, disease detection, digital twin
```

---

## Team

| | Name | Role |
|---|---|---|
| 🎨 | **Utkarsh Batham** | UI & Design Lead — Full React/TypeScript frontend, design system |
| 🤖 | Nikhil Sharma | Model Training Lead — AI model selection, fine-tuning, Gemini integration |
| 📊 | Hiren Mahida | Data Collection Lead — Agricultural dataset sourcing and preprocessing |
| ☁️ | Harsh Kumar | Deployment Lead — Cloud hosting, CI/CD, documentation |

---

<div align="center">
  <b>AgriFuture India</b> · Final Year Project · ITM Vocational University · 2026<br/>
  B.Tech CSE — Cloud Technology & Information Security
</div>
