// StudyFlow AI - Admin Portal & Executive Learning Analytics Routes
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Admin Authorization Guard
function adminGuard(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: Praveen Kumar / Administrator privileges required.'
    });
  }
  next();
}

// 1. Admin Platform Overview Metrics & KPIs
router.get('/overview', authMiddleware, adminGuard, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' OR role IS NULL").get().count;
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    const blockedCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_blocked = 1').get().count;

    const funCheckupCount = db.prepare('SELECT COUNT(*) as count FROM fun_checkups').get().count;
    
    // Study tasks statistics
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM study_tasks').get().count;
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM study_tasks WHERE status = 'completed'").get().count;
    const inProgressTasks = db.prepare("SELECT COUNT(*) as count FROM study_tasks WHERE status = 'in_progress'").get().count;
    const missedTasks = db.prepare("SELECT COUNT(*) as count FROM study_tasks WHERE status = 'missed' OR is_missed = 1").get().count;

    // Study hours
    const taskMinutes = db.prepare("SELECT COALESCE(SUM(duration_mins), 0) as mins FROM study_tasks WHERE status = 'completed'").get().mins;
    const sessionMinutes = db.prepare("SELECT COALESCE(SUM(duration_mins), 0) as mins FROM study_sessions WHERE status = 'completed'").get().mins;
    const totalStudyHours = ((taskMinutes + sessionMinutes) / 60).toFixed(1);

    // Tests statistics
    const testAttempts = db.prepare('SELECT COUNT(*) as count, COALESCE(AVG(score), 82.5) as avg_score FROM test_attempts').get();

    res.json({
      admin_name: req.user.username === 'praveen.admin' || req.user.username === 'praveen' ? 'Praveen Kumar' : req.user.username,
      metrics: {
        total_users: totalUsers,
        total_students: studentCount,
        total_admins: adminCount,
        blocked_users: blockedCount,
        fun_checkups_completed: funCheckupCount,
        study_hours_logged: parseFloat(totalStudyHours),
        total_study_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        missed_tasks: missedTasks,
        task_completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100,
        tests_taken: testAttempts.count,
        average_test_score: Math.round(testAttempts.avg_score)
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load admin overview: ' + e.message });
  }
});

// 2. Get All Users' Fun Mind Check-Up Answers & Scores
router.get('/fun-checkups', authMiddleware, adminGuard, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        fc.*,
        u.username,
        u.email,
        u.role,
        u.is_blocked,
        u.created_at as registered_at,
        p.full_name,
        p.college,
        p.department,
        p.year_semester
      FROM fun_checkups fc
      JOIN users u ON fc.user_id = u.id
      LEFT JOIN profiles p ON fc.user_id = p.user_id
      ORDER BY fc.updated_at DESC
    `).all();

    const formatted = rows.map(r => {
      let relax = [];
      try {
        relax = Array.isArray(r.relaxation_activities) ? r.relaxation_activities : JSON.parse(r.relaxation_activities || '[]');
      } catch (e) {
        relax = r.relaxation_activities ? [r.relaxation_activities] : [];
      }

      let analysisDetails = {};
      try {
        analysisDetails = JSON.parse(r.analysis_details || '{}');
      } catch (e) {}

      return {
        id: r.id,
        user_id: r.user_id,
        username: r.username,
        full_name: r.full_name || r.username,
        email: r.email,
        college: r.college || 'University',
        department: r.department || 'Engineering',
        year_semester: r.year_semester || 'Undergraduate',
        score: r.score || 0,
        grade: r.grade || 'B Tier',
        analysis_details: analysisDetails,
        answers: {
          best_friend: r.best_friend || '—',
          makes_me_laugh: r.makes_me_laugh || '—',
          most_texted: r.most_texted || '—',
          bad_day_friend: r.bad_day_friend || '—',
          study_buddy: r.study_buddy || '—',
          biggest_subject_enemy: r.biggest_subject_enemy || 'None',
          relaxation_activities: relax,
          exam_survival_friend: r.exam_survival_friend || '—',
          favorite_entertainment: r.favorite_entertainment || '—',
          nickname: r.nickname || '—',
          male_best_friend: r.male_best_friend || r.best_friend || '—',
          female_best_friend: r.female_best_friend || '—',
          funniest_college_moment: r.funniest_college_moment || '—',
          free_day_activity: r.free_day_activity || '—',
          life_title_movie: r.life_title_movie || '—'
        },
        ai_summary: r.ai_summary,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });

    res.json({
      count: formatted.length,
      students: formatted
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch student checkups: ' + e.message });
  }
});

// 3. Multi-User Study Analytics & Academic Progress Analysis
router.get('/study-analytics', authMiddleware, adminGuard, (req, res) => {
  try {
    const students = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_blocked,
        p.full_name,
        p.college,
        p.department,
        p.year_semester,
        (SELECT COUNT(*) FROM study_tasks WHERE user_id = u.id) as total_tasks,
        (SELECT COUNT(*) FROM study_tasks WHERE user_id = u.id AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM study_tasks WHERE user_id = u.id AND status = 'in_progress') as in_progress_tasks,
        (SELECT COUNT(*) FROM study_tasks WHERE user_id = u.id AND (status = 'missed' OR is_missed = 1)) as missed_tasks,
        (SELECT COALESCE(SUM(duration_mins), 0) FROM study_tasks WHERE user_id = u.id AND status = 'completed') as completed_study_mins,
        (SELECT COUNT(*) FROM fun_checkups WHERE user_id = u.id) as has_completed_fun_checkup,
        (SELECT COALESCE(SUM(amount), 0) FROM xp_transactions WHERE user_id = u.id) as total_xp
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'student' OR u.role IS NULL
      ORDER BY total_xp DESC
    `).all();

    // Subject breakdown across all students
    const subjectStats = db.prepare(`
      SELECT 
        s.name,
        s.code,
        COUNT(st.id) as task_count,
        SUM(CASE WHEN st.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN st.status = 'missed' OR st.is_missed = 1 THEN 1 ELSE 0 END) as missed_count
      FROM subjects s
      LEFT JOIN study_tasks st ON s.id = st.subject_id
      GROUP BY s.name
      ORDER BY task_count DESC
    `).all();

    res.json({
      students: students.map(s => ({
        ...s,
        full_name: s.full_name || s.username,
        completion_pct: s.total_tasks > 0 ? Math.round((s.completed_tasks / s.total_tasks) * 100) : 100,
        study_hours: (s.completed_study_mins / 60).toFixed(1)
      })),
      subjects: subjectStats
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load study analytics: ' + e.message });
  }
});

// 4. Complete Student Directory
router.get('/users', authMiddleware, adminGuard, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.is_blocked,
        u.created_at,
        p.full_name,
        p.college,
        p.department,
        p.year_semester,
        p.bio,
        (SELECT COUNT(*) FROM fun_checkups WHERE user_id = u.id) as fun_checkup_completed,
        (SELECT COALESCE(SUM(amount), 0) FROM xp_transactions WHERE user_id = u.id) as xp
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.id ASC
    `).all();

    res.json({
      total: users.length,
      users: users.map(u => ({
        ...u,
        full_name: u.full_name || u.username,
        is_admin: u.role === 'admin',
        is_blocked: u.is_blocked === 1
      }))
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user directory: ' + e.message });
  }
});

// 5. Block or Unblock User Account
router.put('/users/:userId/block', authMiddleware, adminGuard, (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);
    const { block } = req.body; // boolean or undefined to toggle

    const targetUser = db.prepare('SELECT id, username, role, is_blocked FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (targetUser.role === 'admin' || targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot block administrator account' });
    }

    const newBlockedState = block !== undefined ? (block ? 1 : 0) : (targetUser.is_blocked ? 0 : 1);
    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(newBlockedState, targetId);

    res.json({
      message: `User account @${targetUser.username} has been ${newBlockedState ? 'BLOCKED 🚫' : 'UNBLOCKED ✅'}.`,
      is_blocked: newBlockedState === 1
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user block status: ' + e.message });
  }
});

// 6. Delete Student User Account
router.delete('/users/:userId', authMiddleware, adminGuard, (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);

    const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (targetUser.role === 'admin' || targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete administrator account' });
    }

    // SQLite cascade deletes associated profile, tasks, fun_checkups, etc.
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

    res.json({
      message: `User account @${targetUser.username} (ID #${targetId}) permanently deleted.`
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user account: ' + e.message });
  }
});

module.exports = router;
