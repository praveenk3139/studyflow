const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'studyflow_super_secret_jwt_key_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, role, is_blocked FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User account no longer exists' });
    }
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Forbidden: Your account has been blocked by Administrator.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// Optional auth for public preview or demo mode
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, email, role, is_blocked FROM users WHERE id = ?').get(decoded.id);
      if (user && !user.is_blocked) req.user = user;
    } catch (e) {
      // ignore
    }
  }
  // Default to demo user if no token
  if (!req.user) {
    const demoUser = db.prepare('SELECT id, username, email, role, is_blocked FROM users WHERE username = ?').get('alex.student');
    if (demoUser && !demoUser.is_blocked) req.user = demoUser;
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authMiddleware,
  optionalAuth
};
