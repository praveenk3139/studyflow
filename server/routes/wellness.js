const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { WEARABLE_PROVIDERS, getWellnessSummary } = require('../services/healthService');

// Get overall wellness dashboard summary
router.get('/summary', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const summary = getWellnessSummary(userId);
  res.json(summary);
});

// Log hydration intake (+250ml quick action or custom)
router.post('/hydration', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { amount_ml } = req.body;
  const ml = parseInt(amount_ml) || 250;

  db.prepare(`
    INSERT INTO hydration_logs (user_id, amount_ml)
    VALUES (?, ?)
  `).run(userId, ml);

  // Check today's total
  const todayHydration = db.prepare(`
    SELECT SUM(amount_ml) as total FROM hydration_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(userId);

  // Award XP
  db.prepare('INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 15, ?)').run(
    userId,
    `Logged Hydration (+${ml}ml)`
  );

  res.status(201).json({
    message: `Logged ${ml}ml of water! Stay refreshed.`,
    today_total_ml: todayHydration.total,
    glasses_count: Math.floor(todayHydration.total / 250)
  });
});

// Get hydration logs for past 7 days (weekly history chart)
router.get('/hydration/history', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const history = db.prepare(`
    SELECT date(logged_at) as log_date, SUM(amount_ml) as total_ml, COUNT(*) as logs_count
    FROM hydration_logs
    WHERE user_id = ? AND logged_at >= datetime('now', '-7 days')
    GROUP BY date(logged_at)
    ORDER BY date(logged_at) ASC
  `).all(userId);

  res.json({ history });
});

// Meal schedule list & updates
router.get('/meals', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const meals = db.prepare('SELECT * FROM meal_schedule WHERE user_id = ? ORDER BY scheduled_time ASC').all(userId);
  res.json({ meals });
});

router.put('/meals/:id', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { scheduled_time, duration_mins, is_enabled } = req.body;

  db.prepare(`
    UPDATE meal_schedule
    SET scheduled_time = COALESCE(?, scheduled_time),
        duration_mins = COALESCE(?, duration_mins),
        is_enabled = COALESCE(?, is_enabled),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(scheduled_time, duration_mins, is_enabled !== undefined ? (is_enabled ? 1 : 0) : null, req.params.id, userId);

  res.json({ message: 'Meal schedule updated successfully' });
});

// Wearable provider list and connection state
router.get('/wearables', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const connections = db.prepare('SELECT * FROM wearable_connections WHERE user_id = ?').all(userId);

  const providerList = WEARABLE_PROVIDERS.map(p => {
    const conn = connections.find(c => c.provider.toLowerCase().includes(p.id));
    return {
      ...p,
      connected: conn ? conn.status === 'Connected' : false,
      status: conn ? conn.status : 'Not Connected',
      device_name: conn ? conn.device_name : null,
      last_sync: conn ? conn.last_sync_at : null,
      is_demo: conn ? Boolean(conn.is_demo) : false
    };
  });

  res.json({ providers: providerList });
});

// Connect / Disconnect wearable (or toggle DEMO DATA)
router.post('/wearables/connect', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { provider_id, device_name, is_demo } = req.body;

  const provider = WEARABLE_PROVIDERS.find(p => p.id === provider_id) || WEARABLE_PROVIDERS[0];

  // Upsert connection
  db.prepare(`
    INSERT INTO wearable_connections (user_id, provider, status, device_name, last_sync_at, is_demo)
    VALUES (?, ?, 'Connected', ?, datetime('now'), ?)
    ON CONFLICT(id) DO UPDATE SET
      status = 'Connected',
      last_sync_at = datetime('now'),
      is_demo = excluded.is_demo
  `).run(userId, provider.name, device_name || `${provider.name} Device`, is_demo ? 1 : 0);

  res.json({
    message: `Successfully connected ${provider.name}`,
    status: 'Connected',
    is_demo: Boolean(is_demo)
  });
});

router.post('/wearables/disconnect', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { provider_id } = req.body;

  db.prepare('DELETE FROM wearable_connections WHERE user_id = ?').run(userId);
  res.json({ message: 'Smartwatch/wearable disconnected. Health data sync halted.' });
});

// Toggle Demo Data vs Live Data
router.post('/wearables/toggle-demo', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { enable_demo } = req.body;

  db.prepare(`
    UPDATE wellness_logs
    SET is_demo_data = ?
    WHERE user_id = ? AND log_date = date('now')
  `).run(enable_demo ? 1 : 0, userId);

  db.prepare(`
    UPDATE wearable_connections
    SET is_demo = ?
    WHERE user_id = ?
  `).run(enable_demo ? 1 : 0, userId);

  res.json({
    message: enable_demo ? 'Switched to labeled DEMO DATA mode.' : 'Switched to LIVE SYNC mode. Awaiting real device pairing.',
    is_demo: Boolean(enable_demo)
  });
});

// Update or manually record wellness entry
router.post('/logs', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { sleep_hours, sleep_quality, steps, active_minutes, avg_heart_rate, mood, notes } = req.body;

  db.prepare(`
    INSERT INTO wellness_logs (user_id, log_date, sleep_hours, sleep_quality, steps, active_minutes, avg_heart_rate, mood, notes, is_demo_data)
    VALUES (?, date('now'), ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      sleep_hours = excluded.sleep_hours,
      sleep_quality = excluded.sleep_quality,
      steps = excluded.steps,
      active_minutes = excluded.active_minutes,
      avg_heart_rate = excluded.avg_heart_rate,
      mood = excluded.mood,
      notes = excluded.notes,
      is_demo_data = 0
  `).run(
    userId,
    sleep_hours || 7.0,
    sleep_quality || 'Good',
    steps || 5000,
    active_minutes || 40,
    avg_heart_rate || 72,
    mood || 'Energetic',
    notes || 'Manually logged wellness report.'
  );

  res.status(201).json({ message: 'Wellness metrics updated successfully.' });
});

module.exports = router;
