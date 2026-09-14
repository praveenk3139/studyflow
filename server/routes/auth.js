const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { generateToken, authMiddleware, optionalAuth } = require('../middleware/auth');

// Sign up
router.post('/signup', (req, res) => {
  const { username, email, password, full_name, college, department, year_semester } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  // Check unique username and email
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email is already registered' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const insertUser = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
  const result = insertUser.run(username, email, passwordHash);
  const userId = result.lastInsertRowid;

  // Insert profile
  db.prepare(`
    INSERT INTO profiles (user_id, full_name, college, department, year_semester)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, full_name || username, college || '', department || '', year_semester || '');

  // Insert settings
  db.prepare(`
    INSERT INTO user_settings (user_id) VALUES (?)
  `).run(userId);

  // Seed default meal schedule
  const insertMeal = db.prepare(`
    INSERT INTO meal_schedule (user_id, meal_type, scheduled_time, duration_mins)
    VALUES (?, ?, ?, ?)
  `);
  insertMeal.run(userId, 'Breakfast', '08:00', 30);
  insertMeal.run(userId, 'Lunch', '12:30', 45);
  insertMeal.run(userId, 'Evening Snack', '17:00', 20);
  insertMeal.run(userId, 'Dinner', '20:15', 45);

  // Seed starter subjects for new student
  try {
    const insertSubj = db.prepare(`
      INSERT INTO subjects (user_id, name, code, target_grade, color)
      VALUES (?, ?, ?, ?, ?)
    `);
    const dsId = insertSubj.run(userId, 'Data Structures & Algorithms', 'CS301', 'A+', '#3b82f6').lastInsertRowid;
    const osId = insertSubj.run(userId, 'Operating Systems', 'CS302', 'A', '#8b5cf6').lastInsertRowid;
    const cnId = insertSubj.run(userId, 'Computer Networks', 'CS303', 'A+', '#06b6d4').lastInsertRowid;

    // Seed syllabus units
    const insertSyllabus = db.prepare(`
      INSERT INTO syllabus (subject_id, unit_number, unit_title, topics_json, estimated_hours, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertSyllabus.run(dsId, 1, 'Trees & Binary Search Trees', JSON.stringify(['Binary Trees', 'BST Operations', 'AVL Trees']), 10.0, 'in_progress');
    insertSyllabus.run(dsId, 2, 'Graph Algorithms', JSON.stringify(['BFS & DFS', 'Dijkstra', 'Shortest Paths']), 12.0, 'pending');
    insertSyllabus.run(osId, 1, 'Process Management & Scheduling', JSON.stringify(['Process State', 'Round Robin', 'Multithreading']), 8.0, 'in_progress');

    // Seed starter study plan
    const planId = db.prepare(`
      INSERT INTO study_plans (user_id, title, start_date, end_date, is_active, strict_mode_enabled)
      VALUES (?, 'Semester Mastery Plan', date('now'), date('now', '+30 days'), 1, 1)
    `).run(userId).lastInsertRowid;

    const insertTask = db.prepare(`
      INSERT INTO study_tasks (plan_id, user_id, subject_id, topic, start_time, end_time, duration_mins, priority, goal, status, is_missed, recovery_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date();
    const t1Start = new Date(now.getTime() - 10 * 60000);
    const t1End = new Date(now.getTime() + 35 * 60000);
    insertTask.run(planId, userId, dsId, 'Tree Traversal & Search Algorithms', t1Start.toISOString(), t1End.toISOString(), 45, 'high', 'Master Inorder, Preorder, Postorder with 2 practice problems', 'in_progress', 0, 0);

    // Focus Shield default blocked sites
    const insertBlocked = db.prepare(`
      INSERT INTO blocked_sites (user_id, domain, category, is_active)
      VALUES (?, ?, ?, 1)
    `);
    insertBlocked.run(userId, 'youtube.com', 'Entertainment / Video');
    insertBlocked.run(userId, 'instagram.com', 'Social Media');
    insertBlocked.run(userId, 'reddit.com', 'Distraction / Forum');
    insertBlocked.run(userId, 'tiktok.com', 'Social Video');
    insertBlocked.run(userId, 'twitter.com', 'Social Media');

    // Welcome XP Bonus
    db.prepare(`
      INSERT INTO xp_transactions (user_id, amount, reason)
      VALUES (?, ?, ?)
    `).run(userId, 100, 'Welcome to StudyFlow AI! 🌟');
  } catch (seedErr) {
    console.warn('Optional starter seed notice:', seedErr.message);
  }

  const user = { id: userId, username, email, role: 'student' };
  const token = generateToken(user);

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user
  });
});

// Login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body; // username or email

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  if (user.is_blocked) {
    return res.status(403).json({ error: 'Access denied: Your account has been blocked by Administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
  }

  const token = generateToken(user);

  // Fetch full profile and settings
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    profile,
    settings
  });
});

// Current user profile
router.get('/me', optionalAuth, (req, res) => {
  const user = req.user;
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);

  // Get current streak and XP
  const xpSum = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM xp_transactions WHERE user_id = ?').get(user.id);
  const badgesCount = db.prepare('SELECT COUNT(*) as count FROM achievements WHERE user_id = ?').get(user.id);

  res.json({
    user,
    profile,
    settings,
    stats: {
      xp: xpSum.total,
      streak_days: 7,
      badges: badgesCount.count
    }
  });
});

// Update Profile
router.put('/profile', authMiddleware, (req, res) => {
  const { full_name, phone, college, department, year_semester, bio, profile_image } = req.body;
  const userId = req.user.id;

  db.prepare(`
    UPDATE profiles
    SET full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        college = COALESCE(?, college),
        department = COALESCE(?, department),
        year_semester = COALESCE(?, year_semester),
        bio = COALESCE(?, bio),
        profile_image = COALESCE(?, profile_image),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(full_name, phone, college, department, year_semester, bio, profile_image, userId);

  const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  res.json({ message: 'Profile updated successfully', profile: updatedProfile });
});

// Change Password endpoint
router.put('/change-password', authMiddleware, (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Both current password and new password are required' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(new_password, salt);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
