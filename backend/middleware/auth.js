// middleware/auth.js — JWT authentication middleware

const jwt = require('jsonwebtoken');
const db  = require('../db/database');

/**
 * protect — verifies JWT token from Authorization header
 * Usage: router.get('/route', protect, handler)
 */
function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please login.' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    const user = db.prepare('SELECT id, name, email, role, lang FROM users WHERE id = ? AND is_active = 1').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found or account disabled.' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * adminOnly — restricts route to admin role
 */
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

/**
 * optionalAuth — attaches user if token present, continues even if not
 */
function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = db.prepare('SELECT id, name, email, role, lang FROM users WHERE id = ?').get(decoded.id);
    }
  } catch (_) {}
  next();
}

module.exports = { protect, adminOnly, optionalAuth };
