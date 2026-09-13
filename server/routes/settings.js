const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth, authMiddleware } = require('../middleware/auth');

// Get all settings for current user
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  const permissions = db.prepare('SELECT * FROM health_permissions WHERE user_id = ?').all(userId);

  res.json({
    settings: settings || {},
    health_permissions: permissions
  });
});

// Update settings
router.put('/', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const {
    daily_study_goal_hours,
    daily_water_goal_ml,
    preferred_session_mins,
    strict_plan_mode,
    sound_effects,
    ai_provider,
    ai_model,
    api_keys_json,
    privacy_share_stats
  } = req.body;

  db.prepare(`
    UPDATE user_settings
    SET daily_study_goal_hours = COALESCE(?, daily_study_goal_hours),
        daily_water_goal_ml = COALESCE(?, daily_water_goal_ml),
        preferred_session_mins = COALESCE(?, preferred_session_mins),
        strict_plan_mode = COALESCE(?, strict_plan_mode),
        sound_effects = COALESCE(?, sound_effects),
        ai_provider = COALESCE(?, ai_provider),
        ai_model = COALESCE(?, ai_model),
        api_keys_json = COALESCE(?, api_keys_json),
        privacy_share_stats = COALESCE(?, privacy_share_stats),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    daily_study_goal_hours,
    daily_water_goal_ml,
    preferred_session_mins,
    strict_plan_mode !== undefined ? (strict_plan_mode ? 1 : 0) : null,
    sound_effects !== undefined ? (sound_effects ? 1 : 0) : null,
    ai_provider,
    ai_model,
    api_keys_json,
    privacy_share_stats !== undefined ? (privacy_share_stats ? 1 : 0) : null,
    userId
  );

  res.json({ message: 'Settings saved successfully' });
});

// Privacy: Export all personal data as JSON
router.get('/export-data', optionalAuth, (req, res) => {
  const userId = req.user.id;

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const tasks = db.prepare('SELECT * FROM study_tasks WHERE user_id = ?').all(userId);
  const wellness = db.prepare('SELECT * FROM wellness_logs WHERE user_id = ?').all(userId);
  const hydration = db.prepare('SELECT * FROM hydration_logs WHERE user_id = ?').all(userId);
  const tests = db.prepare('SELECT * FROM test_attempts WHERE user_id = ?').all(userId);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=studyflow_personal_archive.json');
  res.json({
    export_timestamp: new Date().toISOString(),
    profile,
    study_tasks: tasks,
    wellness_logs: wellness,
    hydration_records: hydration,
    test_attempts: tests
  });
});

// Privacy: Delete sensitive health data
router.delete('/delete-health-data', optionalAuth, (req, res) => {
  const userId = req.user.id;
  db.prepare('DELETE FROM wellness_logs WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM hydration_logs WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM wearable_connections WHERE user_id = ?').run(userId);

  res.json({ message: 'All personal health, hydration, and wearable logs permanently purged from the platform.' });
});

module.exports = router;
