<div align="center">

# 🌾 AgriFuture India
### AI-Powered Agricultural Decision Platform for Indian Farmers

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://final-year-pjf9.onrender.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

> A full-stack agricultural intelligence platform combining 6 AI modules, live market data, real-time weather, disease detection, drone analytics, and an e-commerce store — built for Indian farmers.

**Built by Utkarsh Batham** — B.Tech CSE (Cloud Technology & Information Security), ITM Vocational University

</div>

---

## Live Demo

**[https://final-year-pjf9.onrender.com/](https://final-year-pjf9.onrender.com/)**

---

## Features

### 🤖 AI Intelligence (6 Modules — Powered by Google Gemini)
- **Crop Recommendation Engine** — Input soil parameters (N, P, K, pH, rainfall, soil type, location) and get AI-powered crop recommendations with confidence scores & fertilizer plans
- **AI Disease Detector** — Upload or scan crop images for instant diagnosis with severity level (Low/Moderate/High), pathogen type, chemical + organic treatment, and prevention tips
- **AgriDrone V2** — Satellite terrain analysis, irrigation source mapping (5+ sources), soil health gauge (0-100), NDVI vegetation index, voice commands, scan history, download/share reports, before/after comparison
- **Market Forecasting** — 30-day AI price predictions with interactive tooltip chart, sentiment gauge (Buy/Sell/Hold), profit calculator, live mandi ticker, price range visualizer, quick-switch crop pills, and regional prices
- **Digital Twin Simulation** — Real-time field parameter modeling powered by Gemini with visual node network
- **AgriBot** — Conversational AI chatbot with streaming responses, farming FAQ quick-picks, and context-aware guidance

### 📊 Live Data Feeds
- **Mandi Price Ticker** — 27+ crops with live prices, % change, and source mandis (scrolling ticker)
- **Weather Dashboard** — Met-station synced live weather: temperature, humidity, UV index, wind, atmospheric pressure, rain risk, photosynthesis index
- **Monsoon Sync** — Active monsoon tracking with seasonal alerts
- **Open-Meteo Integration** — Live weather on AgriDrone page (no API key needed)

### 🗺️ Agricultural Tools
- **Field Analysis** — Detailed soil parameter input with IoT sensor bridge support
- **Crop Calendar** — AI-generated week-by-week crop schedule
- **Crop Rotation** — Crop rotation planning to maintain soil health
- **Crop Encyclopedia** — 59 crop varieties with NPK demand bars, season tags (Kharif/Rabi/Zaid), water level indicators, pH data, soil types, grid/list view toggle, 6 category filters (Cereal/Pulse/Cash Crop/Vegetable/Fruit/Spice), multi-sort (name/price/yield/duration/water), full-detail modal with growing tips, and up-to-3 crop comparison table
- **Government Scheme Finder** — AI-powered discovery of 100+ schemes with eligibility match scores (0-98%), 7 category filters (Income/Insurance/Credit/Subsidy/Irrigation/Equipment), bookmark & compare up to 3 schemes side-by-side, total benefit calculator, popular schemes ticker, quick crop pills, search history, sort by relevance/amount, and copy scheme details

### 💳 Commerce & Finance
- **AgriStore** — 58+ agricultural products (seeds, fertilizers, equipment) with Razorpay payment integration, ratings, sorting, and market-linked pricing
- **Expense Tracker** — Category-based farm expense/revenue logging with analytics dashboard
- **Report History** — Full audit trail of all scans, predictions, and market reports with bar charts and sparklines

### 🔐 Authentication & Security
- **JWT Authentication** — Secure httpOnly cookie-based sessions (7-day expiry)
- **OTP Verification** — Email OTP via Nodemailer (Gmail) + SMS OTP via MSG91 widget
- **bcrypt Password Hashing** — 10 salt rounds, secure credential storage in PostgreSQL
- **Phone Normalization** — Handles 91-prefix matching for consistent login
- **Rate Limiting** — 5 OTP requests / 15 min, 10 login attempts / 15 min per IP
- **Helmet Security Headers** — XSS, CSRF, and clickjacking protection
- **Zod Schema Validation** — All API inputs validated with TypeScript-first schemas
- **Admin Dashboard** — User management and system analytics

### 🌍 Accessibility & UX
- **Multi-language Support** — 7 Indian languages (Hindi, Gujarati, Marathi, Telugu, Kannada, Tamil, Bengali)
- **Dark/Light Mode** — Persistent theme toggle
- **Responsive Design** — Mobile-first, works on all devices
- **PWA Support** — Installable app with offline functionality and cache-first service worker
- **Command Palette** — Cmd+K quick navigation
- **Framer Motion Animations** — Smooth, professional UI transitions throughout

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.8 | Type-safe development |
| Vite | 6 | Build tool & dev server (HMR) |
| TailwindCSS | 4.2 | Utility-first CSS styling |
| Framer Motion | 12.34 | Animations & transitions |
| Lucide React | 0.554 | Icon library (180+ icons) |
| React Markdown | 10.1 | Rendering AI responses |
| Zod | 4.3 | Client-side schema validation |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js + Express | 5 | REST API server (ESM) |
| PostgreSQL | 18 | Production database (Render) |
| JSON Web Tokens | 9.0 | Auth session management (7-day) |
| bcryptjs | 3.0 | Password hashing (10 salt rounds) |
| Nodemailer | 8.0 | Email OTP delivery (Gmail) |
| MSG91 | — | SMS OTP delivery (widget) |
| Razorpay | 2.9 | Payment gateway integration |
| Helmet | 8.1 | HTTP security headers |
| Express Rate Limit | 7.5 | API rate limiting / DDoS protection |
| Zod | 4.3 | Server-side input validation |
| Multer | 2.1 | File upload handling (10MB limit) |
| Cookie Parser | 1.4 | httpOnly cookie sessions |

### AI & External APIs
| Service | Purpose |
|---|---|
| Google Gemini 2.5 Flash | Crop recommendations, disease detection, drone analysis, market forecasting |
| Google Gemini 3 Flash | Chatbot (AgriBot), digital twin simulation |
| Open-Meteo API | Live weather data (no API key needed) |
| MSG91 | SMS OTP delivery & verification |
| Razorpay | Payment processing & signature verification |

### DevTools & Testing
| Tool | Purpose |
|---|---|
| Vitest 3.2 | Unit testing framework |
| Supertest 7.1 | HTTP endpoint testing |
| tsx | TypeScript execution (dev server) |

### Deployment
| Platform | Purpose |
|---|---|
| Render | Production hosting (Web Service + PostgreSQL) |
| Railway | Alternative deployment option |

---

## Project Structure

```
agrifuture/
├── components/                  # 30 React components
│   ├── PredictionForm.tsx       # Crop recommendation input (soil params)
│   ├── ResultsView.tsx          # AI recommendation output with scores
│   ├── DiseaseDetector.tsx      # Image-based crop disease detection
│   ├── WeatherSection.tsx       # Live weather dashboard
│   ├── MandiTicker.tsx          # Live market price ticker
│   ├── MarketAnalysis.tsx       # Market forecasting + profit calculator
│   ├── CropGuide.tsx            # Crop growing guides
│   ├── CropCalendar.tsx         # AI planting & harvest calendar
│   ├── CropRotation.tsx         # Crop rotation planning
│   ├── SchemesFinder.tsx        # Government scheme search
│   ├── ExpenseTracker.tsx       # Farm finance tracker
│   ├── Shop.tsx                 # AgriStore (58+ products, Razorpay)
│   ├── AgriDrone.tsx            # Drone V2 (terrain, health gauge, voice)
│   ├── DigitalTwin.tsx          # Gemini-powered field simulation
│   ├── ChatBot.tsx              # AI conversational assistant
│   ├── LoginModal.tsx           # Auth (OTP + password login)
│   ├── UserProfile.tsx          # User account management
│   ├── History.tsx              # Scan & report history + analytics
│   ├── AdminDashboard.tsx       # Admin panel
│   ├── Navbar.tsx               # Navigation + language switcher
│   ├── Hero.tsx                 # Landing page hero section
│   ├── Footer.tsx               # Footer with DB status
│   ├── CommandPalette.tsx       # Cmd+K quick navigation
│   ├── AboutTechStack.tsx       # Tech stack info page
│   ├── Toast.tsx                # Notification system
│   ├── ErrorBoundary.tsx        # React error boundary
│   ├── InstallPrompt.tsx        # PWA install prompt
│   ├── NetworkStatus.tsx        # Online/offline indicator
│   ├── ScrollToTop.tsx          # Scroll-to-top button
│   └── SupportSection.tsx       # Team credits
├── routes/                      # 6 API route files
│   ├── auth.ts                  # Login, register, OTP, profile
│   ├── predictions.ts           # AI crop & disease endpoints
│   ├── payments.ts              # Razorpay order & verification
│   ├── market.ts                # Mandi rates & market prices
│   ├── reports.ts               # Scan history CRUD
│   └── expenses.ts              # Farm expense CRUD
├── services/
│   └── geminiService.ts         # Google Gemini API integration
├── middleware/
│   └── authenticate.ts          # JWT auth middleware
├── utils/
│   ├── cookie.ts                # Auth cookie helpers
│   ├── otp.ts                   # OTP generation & storage
│   ├── email.ts                 # Nodemailer email sender
│   └── sms.ts                   # MSG91 SMS sender
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── service-worker.js        # Cache-first service worker
│   └── drone-satellite-view.svg # Custom animated drone HUD
├── server.ts                    # Express backend entry point
├── db.ts                        # PostgreSQL connection & schema
├── AuthContext.tsx               # React auth state provider
├── App.tsx                      # Root component & routing
├── types.ts                     # 44+ TypeScript interfaces
├── constants.ts                 # MANDI_RATES, languages, translations
├── vite.config.ts               # Vite build configuration
├── render.yaml                  # Render deployment config
└── railway.json                 # Railway deployment config
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Google Gemini API key](https://ai.google.dev/)
- PostgreSQL database (or use Render's free tier)

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

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# Auth
JWT_SECRET=your_jwt_secret

# Email OTP (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# SMS OTP (MSG91)
MSG91_AUTH_KEY=your_msg91_key
MSG91_TEMPLATE_ID=your_template_id
MSG91_WIDGET_TOKEN=your_widget_token

# Payments (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Run Locally

```bash
# Start dev server (frontend + backend)
npm run dev
```

The app runs at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | DB connectivity & row counts |
| `POST` | `/api/auth/send-otp` | No | Send email/phone OTP |
| `POST` | `/api/auth/register` | No | Register with OTP verification |
| `POST` | `/api/auth/login` | No | Password login (email or phone) |
| `POST` | `/api/auth/login-otp` | No | OTP-based login |
| `POST` | `/api/auth/verify-msg91-token` | No | MSG91 widget verification |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `POST` | `/api/auth/logout` | No | Clear auth cookie |
| `PUT` | `/api/auth/profile` | Yes | Update name, state, land size |
| `GET` | `/api/mandi-rates` | No | 27+ crop prices with locations |
| `GET` | `/api/market-prices` | No | Top 6 market prices |
| `POST` | `/api/predict/crop` | No | AI crop recommendation |
| `POST` | `/api/predict/disease` | No | Image-based disease diagnosis |
| `GET` | `/api/reports` | Yes | User's scan history |
| `POST` | `/api/reports` | Yes | Save a new report |
| `DELETE` | `/api/reports/:id` | Yes | Delete a report |
| `GET` | `/api/expenses` | Yes | User's farm expenses |
| `POST` | `/api/expenses` | Yes | Add an expense |
| `DELETE` | `/api/expenses/:id` | Yes | Delete an expense |
| `POST` | `/api/payments/create-order` | No | Create Razorpay order |
| `POST` | `/api/payments/verify-payment` | No | Verify Razorpay signature |

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT 'Farmer',
  email       TEXT UNIQUE,
  phone       TEXT UNIQUE,
  password    TEXT,
  state       TEXT,
  land_size   TEXT,
  role        TEXT DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Reports (crop predictions, drone scans)
CREATE TABLE reports (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id),
  type        TEXT NOT NULL,
  data        JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Farm expenses
CREATE TABLE expenses (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES users(id),
  category    TEXT,
  amount      NUMERIC,
  description TEXT,
  date        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Orders (Razorpay)
CREATE TABLE orders (
  id                TEXT PRIMARY KEY,
  user_id           TEXT REFERENCES users(id),
  razorpay_order_id TEXT,
  amount            NUMERIC,
  status            TEXT DEFAULT 'pending',
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id        SERIAL PRIMARY KEY,
  user_id   TEXT REFERENCES users(id),
  action    TEXT,
  detail    TEXT,
  ip        TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Architecture

```
Browser (React 19 + TypeScript + Vite + TailwindCSS)
         │
         │ HTTPS / REST API
         ▼
Express 5 Server (Node.js + TypeScript, run via tsx)
    ├── routes/auth.ts        JWT auth, OTP (Email + SMS), rate limiting
    ├── routes/predictions.ts AI crop & disease endpoints (Gemini)
    ├── routes/payments.ts    Razorpay order creation & HMAC verification
    ├── routes/market.ts      Mandi price data (27+ crops)
    ├── routes/reports.ts     Scan history CRUD
    ├── routes/expenses.ts    Farm expense CRUD
    └── Static files          Vite production build
         │
         ├── PostgreSQL (Render)    Users, reports, expenses, orders, activity log
         ├── Google Gemini API      6 AI modules (crop, disease, drone, market, twin, chat)
         ├── Razorpay API           Payment processing
         ├── MSG91 API              SMS OTP
         ├── Nodemailer             Email OTP (Gmail SMTP)
         └── Open-Meteo API         Live weather data
```

---

## Deployment

### Render (Recommended)

1. Fork this repository
2. Connect to [Render](https://render.com/) and create a new **Web Service**
3. Add a **PostgreSQL** database from Render dashboard
4. Set the build command: `npm install --include=dev && npm run build`
5. Set the start command: `npm start`
6. Add all environment variables (including `DATABASE_URL` from Render PostgreSQL)
7. Deploy

The `render.yaml` in this repo auto-configures the service settings.

### Railway

Import the repo into [Railway](https://railway.app/) — `railway.json` handles the config automatically. Add a PostgreSQL plugin for the database.

---

## Project Stats

| Metric | Count |
|--------|-------|
| Total Lines of Code | 12,550+ |
| TypeScript/TSX Files | 56 |
| React Components | 30 |
| API Route Files | 6 |
| AI Modules | 6 |
| REST Endpoints | 20+ |
| Store Products | 58 |
| Crops Tracked | 27+ |
| Languages Supported | 7 |

---

## Author

**Utkarsh Batham** — Full-stack development, AI integration, UI/UX design, database architecture, deployment & DevOps

---

<div align="center">
  <b>AgriFuture India</b> · Final Year Project · ITM Vocational University · 2026<br/>
  B.Tech CSE — Cloud Technology & Information Security
</div>
