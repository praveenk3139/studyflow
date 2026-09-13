const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { optionalAuth } = require('../middleware/auth');

const BREAK_ACTIVITIES = [
  { id: 'memory', title: 'Memory Tile Match', icon: '🃏', duration_seconds: 60, description: 'Flip and match 6 pairs of academic/AI concept symbols to gently reset working memory.' },
  { id: 'reaction', title: 'Reaction Time Test', icon: '⚡', duration_seconds: 45, description: 'Click as rapidly as possible when the screen shifts green to measure sensory alertness.' },
  { id: 'breathing', title: '4-7-8 Guided Breathing', icon: '🫁', duration_seconds: 90, description: 'Synchronized calming breath cycle to lower sympathetic nervous system arousal.' },
  { id: 'numbers', title: 'Speed Math Sprint', icon: '🔢', duration_seconds: 60, description: 'Fast mental arithmetic sprints to sharpen neuro-cognitive agility.' },
  { id: 'zen', title: '60-Second Zen Relaxation', icon: '🧘', duration_seconds: 60, description: 'Soothing micro-break with ambient harmonic chime and focus visualization.' }
];

router.get('/activities', (req, res) => {
  res.json({ activities: BREAK_ACTIVITIES });
});

// Complete a break activity
router.post('/complete', optionalAuth, (req, res) => {
  const userId = req.user.id;
  const { activity_id, score } = req.body;

  const activity = BREAK_ACTIVITIES.find(a => a.id === activity_id) || BREAK_ACTIVITIES[0];

  // Award healthy break XP
  db.prepare('INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 25, ?)').run(
    userId,
    `Completed Mind Break: ${activity.title}`
  );

  res.json({
    message: 'Break complete. Ready to continue your study plan?',
    activity_name: activity.title,
    xp_gained: 25,
    next_action: 'Resume Active Study Task'
  });
});

module.exports = router;
