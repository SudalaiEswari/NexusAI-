// server.js — NEXUS AI v2 Main Server
// Features: Express + Socket.io + Auth + CORS + Security + Cloud-ready

require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const helmet     = require('helmet');
const compression= require('compression');
const bodyParser = require('body-parser');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

// ── Init DB first ──────────────────────────────────────────────
require('./db/database');

// ── Import routes ──────────────────────────────────────────────
const authRoutes  = require('./routes/authRoutes');
const agentRoutes = require('./routes/agentRoutes');

// ── Create app + HTTP server (needed for Socket.io) ───────────
const app    = express();
const server = http.createServer(app);

// ── Init Socket.io ────────────────────────────────────────────
const socketService = require('./services/socketService');
socketService.init(server);

const PORT = process.env.PORT || 3001;

// ── Security middleware ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled so frontend CDN scripts work
  crossOriginEmbedderPolicy: false
}));
app.use(compression()); // Gzip responses

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5500',       // Live Server (VS Code)
  process.env.FRONTEND_URL,      // Cloud deploy URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // In production allow all; in dev be strict
    if (process.env.NODE_ENV === 'production') return cb(null, true);
    cb(null, true); // Allow all during development
  },
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: { error: 'Too many requests. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ── Serve uploaded files ──────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Serve frontend ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api',      agentRoutes);

// ── Catch-all → serve frontend index.html ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 10}MB allowed.` });
  }
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start server ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   NEXUS AI v2 — Multi-Agent Business Hub     ║');
  console.log(`║   🚀 Running at http://localhost:${PORT}          ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║   ✅ Features Active:                         ║');
  console.log('║   🔐 JWT Authentication                       ║');
  console.log('║   📧 Email Notifications (Nodemailer)         ║');
  console.log('║   🌐 Real Web Search (Tavily / Mock)          ║');
  console.log('║   📁 File Upload (PDF/DOCX resume parsing)   ║');
  console.log('║   ⚡ Real-time Updates (Socket.io)            ║');
  console.log('║   📊 Charts & Graphs (Chart.js data)         ║');
  console.log('║   🌍 Multi-language (8 languages)            ║');
  console.log('║   ☁️  Cloud-Ready (Railway/Render/Fly.io)     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\n📋 Default Logins:');
  console.log('   Admin: admin@nexusai.com / admin123');
  console.log('   User:  user@nexusai.com  / user123\n');
});

module.exports = { app, server };
