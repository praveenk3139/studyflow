const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Get focus mode configuration, blocked/allowed lists, and YouTube/WhatsApp settings
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user.id;

  const blocked = db.prepare('SELECT * FROM blocked_sites WHERE user_id = ?').all(userId);
  const allowed = db.prepare('SELECT * FROM allowed_sites WHERE user_id = ?').all(userId);
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);

  // Recent focus sessions
  const recentSessions = db.prepare(`
    SELECT * FROM focus_sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(userId);

  // Distraction events count
  const distractionCount = db.prepare(`
    SELECT COUNT(*) as count FROM distraction_events
    WHERE user_id = ? AND date(created_at) = date('now')
  `).get(userId);

  res.json({
    active_mode: 'deep_study',
    blocked_sites: blocked,
    allowed_sites: allowed,
    youtube_settings: {
      study_mode_enabled: Boolean(settings ? settings.youtube_study_mode : true),
      shorts_restricted: Boolean(settings ? settings.shorts_restricted : true),
      daily_limit_mins: settings ? settings.daily_youtube_limit_mins : 60,
      today_time_spent_mins: 22
    },
    whatsapp_settings: {
      allowed: true,
      track_session_leaves: true,
      privacy_notice: 'StudyFlow tracks study session continuity only; private messages are never inspected or read.'
    },
    recent_sessions: recentSessions,
    today_distraction_attempts: distractionCount.count
  });
});

// Update focus mode settings (Deep Study / Exam Mode / Light Study / Break Mode)
router.post('/mode', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { mode, planned_mins } = req.body; // deep_study, exam_mode, light_study, break_mode

  const insertSession = db.prepare(`
    INSERT INTO focus_sessions (user_id, mode, duration_mins, planned_mins, status)
    VALUES (?, ?, 0, ?, 'in_progress')
  `);
  const result = insertSession.run(userId, mode || 'deep_study', planned_mins || 45);

  res.json({
    message: `Focus Shield activated in [${mode.toUpperCase()}] mode`,
    session_id: result.lastInsertRowid,
    mode
  });
});

// Log a distraction attempt (e.g. attempted Instagram or Twitter navigation)
router.post('/distraction-event', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { attempted_target, reason } = req.body;

  db.prepare(`
    INSERT INTO distraction_events (user_id, attempted_target, reason)
    VALUES (?, ?, ?)
  `).run(userId, attempted_target || 'Blocked Website', reason || 'Navigated while Deep Study active');

  res.json({
    message: 'Distraction logged by Focus Shield. Stay focused on your active study task!',
    target: attempted_target
  });
});

// Add / Remove blocked site
router.post('/blocked-sites', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { domain, category } = req.body;

  if (!domain) return res.status(400).json({ error: 'Domain is required' });

  db.prepare(`
    INSERT INTO blocked_sites (user_id, domain, category, is_active)
    VALUES (?, ?, ?, 1)
  `).run(userId, domain.toLowerCase().trim(), category || 'Custom Distraction');

  res.status(201).json({ message: `Added ${domain} to Focus Blocklist` });
});

router.delete('/blocked-sites/:id', optionalAuth, (req, res) => {
  const userId = req.user.id;
  db.prepare('DELETE FROM blocked_sites WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ message: 'Removed site from blocklist' });
});

// Update YouTube Study Mode settings
router.put('/youtube-settings', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { youtube_study_mode, shorts_restricted, daily_youtube_limit_mins } = req.body;

  db.prepare(`
    UPDATE user_settings
    SET youtube_study_mode = COALESCE(?, youtube_study_mode),
        shorts_restricted = COALESCE(?, shorts_restricted),
        daily_youtube_limit_mins = COALESCE(?, daily_youtube_limit_mins),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    youtube_study_mode !== undefined ? (youtube_study_mode ? 1 : 0) : null,
    shorts_restricted !== undefined ? (shorts_restricted ? 1 : 0) : null,
    daily_youtube_limit_mins || null,
    userId
  );

  res.json({ message: 'YouTube Study Mode settings updated successfully' });
});

module.exports = router;
