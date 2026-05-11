// routes/authRoutes.js — Login, Register, Profile

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db/database');
const { protect } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

/** Generate access + refresh tokens */
function generateTokens(userId) {
  const access = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  const refresh = jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
  return { access, refresh };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, lang = 'en' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const result = db.prepare(`
      INSERT INTO users (name, email, password, lang) VALUES (?, ?, ?, ?)
    `).run(name, email, hashed, lang);

    const { access, refresh } = generateTokens(result.lastInsertRowid);

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: '🎉 Welcome to NEXUS AI!',
      html: `<h2>Welcome, ${name}!</h2>
             <p>Your account has been created successfully.</p>
             <p>You can now access all 4 AI agents on your dashboard.</p>
             <br/><p>— The NEXUS AI Team</p>`
    }).catch(console.error);

    res.status(201).json({
      success: true,
      token: access,
      refreshToken: refresh,
      user: { id: result.lastInsertRowid, name, email, role: 'user', lang }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    // Update last login
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    const { access, refresh } = generateTokens(user.id);

    res.json({
      success: true,
      token: access,
      refreshToken: refresh,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, lang: user.lang }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/refresh — Get new access token using refresh token
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid refresh token' });

    const { access } = generateTokens(decoded.id);
    res.json({ token: access });
  } catch {
    res.status(401).json({ error: 'Refresh token expired or invalid. Please login again.' });
  }
});

// GET /api/auth/me — Get current user profile
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PATCH /api/auth/lang — Update user language preference
router.patch('/lang', protect, (req, res) => {
  const { lang } = req.body;
  const supported = ['en', 'ta', 'hi', 'te', 'fr', 'de', 'ja', 'zh'];
  if (!supported.includes(lang)) {
    return res.status(400).json({ error: `Unsupported language. Choose: ${supported.join(', ')}` });
  }
  db.prepare('UPDATE users SET lang = ? WHERE id = ?').run(lang, req.user.id);
  res.json({ success: true, lang });
});

// POST /api/auth/logout
router.post('/logout', protect, (req, res) => {
  // In production: blacklist the token or clear refresh tokens
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/users — Get all registered users (for Quick Login demo)
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT name, email, role FROM users ORDER BY id ASC').all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login-fast — Quick login with just an email
router.post('/login-fast', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1').get(email);
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Update last login
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    const { access, refresh } = generateTokens(user.id);

    res.json({
      success: true,
      token: access,
      refreshToken: refresh,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, lang: user.lang }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
