const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { checkHealthCollisions } = require('../services/healthService');

// Get active study plan and today's schedule
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user.id;

  const plan = db.prepare('SELECT * FROM study_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1').get(userId);

  // All tasks for this user
  const tasks = db.prepare(`
    SELECT t.*, s.name as subject_name, s.color as subject_color, s.code as subject_code
    FROM study_tasks t
    LEFT JOIN subjects s ON t.subject_id = s.id
    WHERE t.user_id = ?
    ORDER BY t.start_time ASC
  `).all(userId);

  // Active task (currently in progress or next pending)
  let activeTask = tasks.find(t => t.status === 'in_progress');
  if (!activeTask) {
    activeTask = tasks.find(t => t.status === 'pending');
  }

  // Missed tasks recovery queue
  const recoveryQueue = tasks.filter(t => t.status === 'missed' || t.is_missed === 1);

  // Completed tasks count
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Strict mode toggle status
  const userSettings = db.prepare('SELECT strict_plan_mode FROM user_settings WHERE user_id = ?').get(userId);

  res.json({
    plan,
    strict_mode: userSettings ? Boolean(userSettings.strict_plan_mode) : true,
    active_task: activeTask || null,
    tasks,
    recovery_queue: recoveryQueue,
    stats: {
      total: tasks.length,
      completed: completedTasks.length,
      missed: recoveryQueue.length,
      completion_pct: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0
    }
  });
});

// Create study plan manually or via AI
router.post('/create', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { title, start_date, end_date, tasks } = req.body;

  const planResult = db.prepare(`
    INSERT INTO study_plans (user_id, title, start_date, end_date, is_active, strict_mode_enabled)
    VALUES (?, ?, ?, ?, 1, 1)
  `).run(userId, title || 'Semester Mastery Plan', start_date || new Date().toISOString().slice(0, 10), end_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));

  const planId = planResult.lastInsertRowid;

  if (tasks && Array.isArray(tasks)) {
    const insertTask = db.prepare(`
      INSERT INTO study_tasks (plan_id, user_id, subject_id, topic, start_time, end_time, duration_mins, priority, goal, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    tasks.forEach(t => {
      insertTask.run(
        planId,
        userId,
        t.subject_id || null,
        t.topic,
        t.start_time,
        t.end_time,
        t.duration_mins || 45,
        t.priority || 'high',
        t.goal || ''
      );
    });
  }

  res.status(201).json({ message: 'Study plan created successfully', plan_id: planId });
});

// Add single study task (with Health Collision Verification)
router.post('/task', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { plan_id, subject_id, topic, start_time, duration_mins, priority, goal } = req.body;

  if (!topic || !start_time) {
    return res.status(400).json({ error: 'Topic and Start Time are required' });
  }

  const duration = parseInt(duration_mins) || 45;
  const start = new Date(start_time);
  const end = new Date(start.getTime() + duration * 60000);

  // Check health collisions (Meals, Sleep, Hydration intervals)
  const collisions = checkHealthCollisions(userId, start_time, duration);

  let activePlanId = plan_id;
  if (!activePlanId) {
    const existing = db.prepare('SELECT id FROM study_plans WHERE user_id = ? AND is_active = 1 LIMIT 1').get(userId);
    activePlanId = existing ? existing.id : 1;
  }

  const result = db.prepare(`
    INSERT INTO study_tasks (plan_id, user_id, subject_id, topic, start_time, end_time, duration_mins, priority, goal, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    activePlanId,
    userId,
    subject_id || null,
    topic,
    start.toISOString(),
    end.toISOString(),
    duration,
    priority || 'high',
    goal || ''
  );

  res.status(201).json({
    message: 'Study task added',
    task_id: result.lastInsertRowid,
    health_warnings: collisions
  });
});

// Start task / switch active task
router.post('/task/:id/start', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  // Set any current in_progress task to pending if not completed
  db.prepare(`
    UPDATE study_tasks
    SET status = 'pending'
    WHERE user_id = ? AND status = 'in_progress' AND id != ?
  `).run(userId, taskId);

  // Mark this task as in_progress
  db.prepare(`
    UPDATE study_tasks
    SET status = 'in_progress'
    WHERE id = ? AND user_id = ?
  `).run(taskId, userId);

  // Create study session
  const task = db.prepare('SELECT * FROM study_tasks WHERE id = ?').get(taskId);
  if (task) {
    db.prepare(`
      INSERT INTO study_sessions (user_id, task_id, subject_id, start_time, status)
      VALUES (?, ?, ?, datetime('now'), 'in_progress')
    `).run(userId, taskId, task.subject_id);
  }

  res.json({ message: 'Study session started for task', task_id: taskId });
});

// Complete active task
router.post('/task/:id/complete', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  db.prepare(`
    UPDATE study_tasks
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, is_missed = 0
    WHERE id = ? AND user_id = ?
  `).run(taskId, userId);

  // Close study session
  db.prepare(`
    UPDATE study_sessions
    SET status = 'completed', end_time = datetime('now'), duration_mins = 45
    WHERE task_id = ? AND user_id = ? AND status = 'in_progress'
  `).run(taskId, userId);

  // Award XP
  db.prepare('INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 100, ?)').run(
    userId,
    'Completed Planned Study Task'
  );

  res.json({ message: 'Task marked as completed! +100 XP gained.' });
});

// Intentional Skip / Postpone (Strict Mode requirement: intentional override & recovery queue)
router.post('/task/:id/postpone', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { reason } = req.body;

  db.prepare(`
    UPDATE study_tasks
    SET status = 'missed', is_missed = 1, recovery_order = (SELECT COALESCE(MAX(recovery_order), 0) + 1 FROM study_tasks WHERE user_id = ?)
    WHERE id = ? AND user_id = ?
  `).run(userId, taskId, userId);

  // Log distraction / postponement event
  db.prepare(`
    INSERT INTO distraction_events (user_id, attempted_target, reason)
    VALUES (?, 'Study Task Postponed', ?)
  `).run(userId, reason || 'Student requested intentional postponement');

  res.json({
    message: 'Task moved to Recovery Queue. Strict plan re-organized remaining study sessions.',
    recovery_status: 'QUEUED'
  });
});

// Emergency Break (10-15 minute protected pause)
router.post('/emergency-break', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { duration_mins } = req.body;
  const mins = parseInt(duration_mins) || 10;

  // Log notification and pause session
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (?, 'Emergency Break Activated', ?, 'health', '#mind-break')
  `).run(userId, `Emergency break active for ${mins} minutes. Rest your eyes, stretch, and hydrate.`);

  res.json({
    message: `Emergency break active for ${mins} minutes. System paused without penalizing your streak.`,
    duration_mins: mins
  });
});

// Reorganize / Recover missed task
router.post('/recovery/reorganize', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { task_id, new_start_time } = req.body;

  const newStart = new_start_time ? new Date(new_start_time) : new Date(Date.now() + 60 * 60000);
  const newEnd = new Date(newStart.getTime() + 45 * 60000);

  db.prepare(`
    UPDATE study_tasks
    SET status = 'pending', is_missed = 0, start_time = ?, end_time = ?
    WHERE id = ? AND user_id = ?
  `).run(newStart.toISOString(), newEnd.toISOString(), task_id, userId);

  res.json({ message: 'Task reinstated into primary schedule from recovery queue.' });
});

module.exports = router;
