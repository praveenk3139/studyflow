const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Aggregated Analytics Dashboard
router.get('/', optionalAuth, (req, res) => {
  const userId = req.user.id;

  // 1. Academic Metrics
  const subjects = db.prepare('SELECT id, name, color FROM subjects WHERE user_id = ?').all(userId);

  const completedTasks = db.prepare(`
    SELECT COUNT(*) as count, SUM(duration_mins) as total_mins
    FROM study_tasks
    WHERE user_id = ? AND status = 'completed'
  `).get(userId);

  const missedTasks = db.prepare(`
    SELECT COUNT(*) as count
    FROM study_tasks
    WHERE user_id = ? AND (status = 'missed' OR is_missed = 1)
  `).get(userId);

  const testStats = db.prepare(`
    SELECT COUNT(*) as attempts_count, COALESCE(AVG(score), 0) as avg_score, COALESCE(AVG(accuracy_pct), 0) as avg_accuracy
    FROM test_attempts
    WHERE user_id = ?
  `).get(userId);

  // Subject-wise time breakdown
  const subjectBreakdown = subjects.map(s => {
    const mins = db.prepare(`
      SELECT COALESCE(SUM(duration_mins), 0) as mins
      FROM study_tasks
      WHERE user_id = ? AND subject_id = ?
    `).get(userId, s.id);
    return {
      subject_id: s.id,
      name: s.name,
      color: s.color,
      study_hours: Math.round(((mins ? mins.mins : 0) / 60) * 10) / 10
    };
  });

  // 2. Focus Metrics
  const focusSessions = db.prepare(`
    SELECT COUNT(*) as sessions_count, COALESCE(SUM(duration_mins), 0) as focus_mins
    FROM focus_sessions
    WHERE user_id = ?
  `).get(userId);

  const distractionCount = db.prepare(`
    SELECT COUNT(*) as total_distractions
    FROM distraction_events
    WHERE user_id = ?
  `).get(userId);

  // 3. Wellness & Health Adherence
  const hydrationSum = db.prepare(`
    SELECT COALESCE(SUM(amount_ml), 0) as total_ml
    FROM hydration_logs
    WHERE user_id = ? AND date(logged_at) = date('now')
  `).get(userId);

  const wellnessHistory = db.prepare(`
    SELECT log_date, steps, sleep_hours, avg_heart_rate, is_demo_data
    FROM wellness_logs
    WHERE user_id = ?
    ORDER BY log_date ASC
    LIMIT 7
  `).all(userId);

  // 4. AI Coach Diagnostics & Recommendations
  const coachInsights = [
    {
      type: 'academic',
      badge: '📈 Unit Progress',
      text: 'Your accuracy in AVL Tree rotations reached 92% on your latest diagnostic test! Solid work on self-balancing mechanics.'
    },
    {
      type: 'schedule',
      badge: '⏱️ Study Target Warning',
      text: 'You have spent 35% less planned time on Operating Systems compared to Data Structures this week. Recommended next sprint: Process Scheduling.'
    },
    {
      type: 'wellness',
      badge: '💧 Wellness Harmony',
      text: 'Hydration goal is 50% met today. Scheduling a 10-minute water break right after your current task will maintain peak focus.'
    }
  ];

  // 5. Exam Countdown
  const upcomingExams = db.prepare(`
    SELECT e.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
    FROM exams e
    JOIN subjects s ON e.subject_id = s.id
    WHERE e.user_id = ?
    ORDER BY e.exam_date ASC
  `).all(userId);

  res.json({
    academic: {
      completed_tasks: completedTasks.count || 0,
      total_study_hours: Math.round(((completedTasks.total_mins || 0) / 60) * 10) / 10,
      missed_tasks: missedTasks.count || 0,
      tests_taken: testStats.attempts_count || 0,
      avg_test_accuracy: Math.round(testStats.avg_accuracy || 0),
      subject_breakdown: subjectBreakdown
    },
    focus: {
      total_focus_sessions: focusSessions.sessions_count || 0,
      total_focus_hours: Math.round(((focusSessions.focus_mins || 0) / 60) * 10) / 10,
      distraction_attempts: distractionCount.total_distractions || 0,
      focus_streak_days: 7
    },
    wellness: {
      today_water_ml: hydrationSum.total_ml || 0,
      history: wellnessHistory
    },
    ai_coach: coachInsights,
    exams: upcomingExams
  });
});

module.exports = router;
