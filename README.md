# Branded Short-Link & Bio-Link Hub

Full-stack production MERN (MongoDB, Express, React, Node.js) platform for branded short links, high-speed redirection, click telemetry analytics, and interactive link-in-bio hubs.

---

## 🌟 Key Features

1. **Authentication & Token Rotation Engine**
   - Pair JWT Authentication (15-minute Access Token, 7-day Refresh Token).
   - httpOnly cookie security with token family rotation and automatic reuse revocation.
   - Email verification simulation, password reset flow, and express-rate-limit protection.

2. **High-Speed Redirection & Telemetry Engine**
   - Base62 6-character short code auto-generation with collision retry.
   - Vanity custom slug reservation & URL scheme validation.
   - Sub-50ms HTTP 302 Found redirection with asynchronous click telemetry logging.
   - Privacy-focused SHA-256 IP hashing, user-agent device parsing (`Mobile`, `Desktop`, `Tablet`), and referrer normalization.

3. **Link Library Studio & QR Generator**
   - Full link management table with search and server-side pagination.
   - One-click short URL copying and client-side QR code generator (`qrcode.react`) with PNG download.
   - Cascading deletion for owned links and associated click telemetry events.

4. **Link-in-Bio Hub**
   - Visual profile builder with live preview.
   - Customizable avatar, display name, bio, and social link buttons.
   - 3 pre-built themes (`Minimal Light`, `Dark Slate`, `Gradient`).
   - Public responsive route `/bio/:username`.

5. **Analytics Dashboard**
   - User-isolated aggregated click telemetry.
   - Interactive `recharts` metrics: Total Clicks, Clicks Over Time (date aggregated), Top Referrers ranking, and Device Distribution breakdown.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JSON Web Token (JWT), bcryptjs, express-rate-limit.
- **Frontend**: React 18, Vite, Recharts, qrcode.react, Lucide Icons, Vanilla CSS with Coss UI design primitives.
- **Testing**: Automated integration test suites using Node.js Native HTTP client & Mongoose.

---

## 📂 Project Structure

```text
branded-short-link-hub/
├── backend/
│   ├── src/
│   │   ├── config/             # DB Connection & Configuration
│   │   ├── controllers/        # REST Route Handlers (Auth, Link, Bio, Analytics)
│   │   ├── middlewares/        # Auth, Rate Limiter & Error Handling Middlewares
│   │   ├── models/             # Mongoose Models (User, Link, ClickEvent, BioProfile)
│   │   ├── routes/             # Express Routers
│   │   ├── utils/              # Token, Validator & Telemetry Helpers
│   │   ├── app.js              # Express Application Pipeline
│   │   └── server.js           # Server Entry Point
│   ├── scratch/                # Automated Integration Test Suites
│   ├── .env.example            # Backend Environment Variables Reference
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Client API Service Wrappers
│   │   ├── components/         # Coss UI Components (Auth, Links, Bio, Analytics)
│   │   ├── context/            # Auth React Context & State
│   │   ├── App.jsx             # Main Application Component
│   │   └── index.css           # Styling & Coss UI Design Tokens
│   ├── vite.config.js          # Vite Config & Backend Proxy Setup
│   ├── .env.example            # Frontend Environment Reference
│   └── package.json
│
├── docs/
│   └── API.md                  # Complete REST API Reference Documentation
└── README.md
```

---

## 🚀 Environment & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB server running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI.

### 1. Backend Environment Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create `.env` from template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start backend development server:
   ```bash
   npm run dev
   ```
   Backend starts on `http://localhost:5000`. Test health status at `http://localhost:5000/api/health`.

### 2. Frontend Environment Setup
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Create `.env` from template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start frontend development server:
   ```bash
   npm run dev
   ```
   Frontend starts on `http://localhost:5173`.

---

## 🧪 Testing & Verification

Run the automated integration test suites from the `backend` directory:

```bash
cd backend
node scratch/test_auth_suite.js     # Step 2: Auth & Token Rotation Suite
node scratch/test_step3_suite.js    # Step 3: Redirection Engine Suite
node scratch/test_step4_suite.js    # Step 4: Link Library Studio & QR Suite
node scratch/test_step5_suite.js    # Step 5: Link-in-Bio Hub Suite
node scratch/test_step6_suite.js    # Step 6: Analytics Dashboard Suite
```

### Production Build
To create a production build for the frontend:
```bash
cd frontend
npm run build
```

---

## 📖 API Documentation
Detailed API documentation covering request/response schemas, status codes, and security requirements is located at [docs/API.md](file:///c:/Users/SACHIN%20MISHRA/.gemini/antigravity-ide/scratch/branded-short-link-hub/docs/API.md).
