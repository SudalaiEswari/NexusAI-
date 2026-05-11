# 🤖 NEXUS AI v2 — Full-Stack Multi-Agent Business System

> 7 enterprise-grade upgrades: Auth · Email · Real Web Search · File Upload · Real-time · Charts · Multi-language · Cloud Deploy

---

## 🗂️ FOLDER STRUCTURE

```
nexus-ai-v2/
├── backend/
│   ├── agents/
│   │   ├── analystAgent.js       ← SQL + Chart data generation
│   │   ├── supportAgent.js       ← Support + Email + Socket events
│   │   ├── recruitmentAgent.js   ← Resume parsing + Email on schedule
│   │   └── researchAgent.js      ← Real Tavily web search + saved reports
│   ├── routes/
│   │   ├── authRoutes.js         ← Login, Register, JWT, Language pref
│   │   └── agentRoutes.js        ← All 4 agent API endpoints
│   ├── services/
│   │   ├── aiService.js          ← Claude/OpenAI with language support
│   │   ├── emailService.js       ← Nodemailer + 3 email templates
│   │   ├── searchService.js      ← Tavily real web search + mock fallback
│   │   ├── fileService.js        ← Multer upload + PDF/DOCX text extraction
│   │   └── socketService.js      ← Socket.io real-time event emitter
│   ├── middleware/
│   │   └── auth.js               ← JWT protect/adminOnly/optionalAuth
│   ├── db/
│   │   └── database.js           ← SQLite schema + seed data
│   ├── uploads/                  ← Resume files (auto-created)
│   ├── server.js                 ← Express + Socket.io + Security
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   └── index.html                ← Complete single-file frontend
│
├── railway.toml                  ← Railway.app deploy config
├── render.yaml                   ← Render.com deploy config
├── Procfile                      ← Heroku deploy config
└── README.md
```

---

## ✨ ALL 7 NEW FEATURES

| Feature | How it works |
|---------|-------------|
| 🔐 **Real Authentication** | JWT login/register, bcrypt password hashing, refresh tokens |
| 📧 **Email Notifications** | Nodemailer (Gmail SMTP) — ticket created, interview scheduled, resolved |
| 🌐 **Real Web Search** | Tavily AI API (1000 free searches/month) with intelligent mock fallback |
| 📁 **File Upload** | Multer — upload PDF/DOCX/TXT resume, auto-extract skills/experience |
| ⚡ **Real-time Updates** | Socket.io — live ticket alerts, candidate notifications, stats refresh |
| 📊 **Charts & Graphs** | Chart.js — 3 dashboard charts + dynamic query charts (bar/line/doughnut) |
| 🌍 **Multi-language** | 8 languages: EN, Tamil, Hindi, Telugu, French, German, Japanese, Chinese |
| ☁️ **Cloud Deploy** | Railway / Render / Heroku ready — configs included |

---

## 🚀 LOCAL SETUP (Step by Step)

### Step 1 — Install Node.js 18+
Download from https://nodejs.org (LTS version)

### Step 2 — Install dependencies
```bash
cd nexus-ai-v2/backend
npm install
```

### Step 3 — Configure environment
```bash
cp .env.example .env
```
Open `.env` and set your keys:

```env
# Required for AI responses
CLAUDE_API_KEY=sk-ant-xxxxxxxx        # from console.anthropic.com
AI_PROVIDER=claude

# Optional — for real email notifications
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password    # Gmail → Settings → App Passwords

# Optional — for real web search
TAVILY_API_KEY=tvly-xxxxxxxxx         # from tavily.com (free)

# Keep this random and secret
JWT_SECRET=change_this_to_random_string
```

> ⚠️ **Without any API keys** — the system still works fully using mock AI responses and mock search data!

### Step 4 — Start the server
```bash
npm start
```
You'll see:
```
╔══════════════════════════════════════════════╗
║   NEXUS AI v2 — Multi-Agent Business Hub     ║
║   🚀 Running at http://localhost:3001          ║
╚══════════════════════════════════════════════╝

📋 Default Logins:
   Admin: admin@nexusai.com / admin123
   User:  user@nexusai.com  / user123
```

### Step 5 — Open the frontend
Go to: **http://localhost:3001**

Login with: `admin@nexusai.com` / `admin123`

---

## 📡 API ENDPOINTS

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login → get JWT token |
| POST | /api/auth/refresh | Get new access token |
| GET  | /api/auth/me | Get current user |
| PATCH| /api/auth/lang | Update language preference |
| POST | /api/auth/logout | Logout |

### Analyst Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analyst/query | Natural language → SQL → insights + chartData |
| GET  | /api/analyst/stats | Dashboard stats |
| GET  | /api/analyst/charts | Pre-built chart data (3 charts) |

### Support Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST  | /api/support/query | Submit issue → AI response + ticket + email |
| GET   | /api/support/tickets | All tickets (filter: ?status=Open) |
| PATCH | /api/support/tickets/:id | Update status → sends email if Resolved |
| GET   | /api/support/stats | Ticket counts |
| GET   | /api/support/chart | Ticket status doughnut chart data |

### Recruitment Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/recruitment/evaluate | Evaluate candidate + parse uploaded resume |
| POST | /api/recruitment/schedule | Schedule interview + send email notification |
| GET  | /api/recruitment/candidates | All candidates |
| GET  | /api/recruitment/stats | Recruitment stats |
| GET  | /api/recruitment/chart | Score-by-role bar chart data |

### Research Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/research/query | Web search + AI report + auto-save |
| GET  | /api/research/reports | Saved reports for current user |
| GET  | /api/research/reports/:id | Load a saved report |

---

## ☁️ CLOUD DEPLOYMENT

### Option A — Railway.app (Recommended, Easiest)
1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo
4. Add Environment Variables in Railway dashboard:
   - `CLAUDE_API_KEY`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `TAVILY_API_KEY`
5. Railway auto-detects `railway.toml` and deploys
6. Your app is live at `https://yourapp.up.railway.app`

### Option B — Render.com
1. Push to GitHub
2. Go to https://render.com → New Web Service → GitHub
3. It reads `render.yaml` automatically
4. Add secrets in Render Environment Variables
5. Click Deploy

### Option C — Heroku
```bash
heroku create nexus-ai-v2
heroku config:set CLAUDE_API_KEY=xxx JWT_SECRET=xxx
git push heroku main
```

### After Cloud Deploy — Update Frontend
In `frontend/index.html`, change:
```js
const API = 'http://localhost:3001/api';
// → change to your cloud URL:
const API = 'https://nexus-ai-v2.up.railway.app/api';
```

---

## 📧 GMAIL EMAIL SETUP (5 minutes)

1. Go to your Gmail account → **Settings** → **Security**
2. Enable **2-Step Verification**
3. Search **"App Passwords"** in settings
4. Create an app password for "Mail" → "Other (custom)"
5. Copy the 16-character password
6. Set in `.env`:
   ```
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop   (the 16-char app password)
   ```

---

## 🌐 TAVILY WEB SEARCH SETUP (2 minutes)

1. Go to https://tavily.com
2. Sign up (free) → Get API key
3. Free tier: **1000 searches/month**
4. Set in `.env`:
   ```
   TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxx
   ```

---

## 🌍 MULTI-LANGUAGE SUPPORT

8 languages supported. Users can switch language in the header dropdown.

All AI agent responses (insights, support replies, evaluations, research reports) will be generated in the selected language.

| Code | Language | Flag |
|------|----------|------|
| en | English | 🇬🇧 |
| ta | Tamil (தமிழ்) | 🇮🇳 |
| hi | Hindi (हिंदी) | 🇮🇳 |
| te | Telugu (తెలుగు) | 🇮🇳 |
| fr | French | 🇫🇷 |
| de | German | 🇩🇪 |
| ja | Japanese | 🇯🇵 |
| zh | Chinese | 🇨🇳 |

---

## 📊 CHART TYPES

| Chart | Location | Type |
|-------|----------|------|
| Revenue by Product | Analyst tab | Bar chart |
| Sales by Region | Analyst tab | Doughnut chart |
| Monthly Sales Trend | Analyst tab | Line chart |
| Query Result | Analyst tab | Dynamic (auto-detected) |
| Ticket Status | Support tab | Doughnut chart |
| Avg Score by Role | Recruitment tab | Bar chart |

---

## 🗄️ DATABASE TABLES

- **users** — id, name, email, password (hashed), role, lang, last_login
- **sales** — product, region, amount, quantity, sale_date, salesperson
- **customers** — name, email, phone, company, plan
- **tickets** — ticket_id, customer, email, issue, status, priority, agent_reply
- **candidates** — name, skills, experience, score, status, applied_role, resume_file
- **interviews** — candidate_id, scheduled_at, interviewer, mode
- **research_reports** — topic, report, sources (JSON), user_id
- **notifications** — user_id, type, title, message, is_read

---

## 🔮 FEATURES SUMMARY VS v1

| Feature | v1 | v2 |
|---------|----|----|
| Authentication | ❌ | ✅ JWT + bcrypt |
| Email Notifications | ❌ | ✅ Nodemailer (3 templates) |
| Web Search | Mock only | ✅ Real Tavily API |
| File Upload | ❌ | ✅ PDF/DOCX/TXT resume parsing |
| Real-time Updates | ❌ | ✅ Socket.io live events |
| Charts | ❌ | ✅ 6 Chart.js charts |
| Multi-language | ❌ | ✅ 8 languages |
| Cloud Deploy | Manual | ✅ Railway/Render/Heroku configs |
| Saved Reports | ❌ | ✅ Per-user research history |
| Rate Limiting | ❌ | ✅ 100 req/15min |
| Security | Basic | ✅ Helmet + compression |
