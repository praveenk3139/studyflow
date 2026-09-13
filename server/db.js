const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'studyflow.db');
const db = new Database(dbPath);

// Enable WAL mode for optimal concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  const schema = `
    -- Users & Profiles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      college TEXT,
      department TEXT,
      year_semester TEXT,
      profile_image TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme TEXT DEFAULT 'dark',
      daily_study_goal_hours REAL DEFAULT 4.0,
      daily_water_goal_ml INTEGER DEFAULT 2500,
      preferred_session_mins INTEGER DEFAULT 45,
      strict_plan_mode INTEGER DEFAULT 1,
      sound_effects INTEGER DEFAULT 1,
      ai_provider TEXT DEFAULT 'auto',
      ai_model TEXT DEFAULT 'gemini-1.5-flash',
      api_keys_json TEXT DEFAULT '{}',
      youtube_study_mode INTEGER DEFAULT 1,
      shorts_restricted INTEGER DEFAULT 1,
      daily_youtube_limit_mins INTEGER DEFAULT 60,
      privacy_share_stats INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Academic: Subjects, Syllabus, Exams
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      target_grade TEXT DEFAULT 'A+',
      color TEXT DEFAULT '#4f46e5',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS syllabus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      unit_number INTEGER NOT NULL,
      unit_title TEXT NOT NULL,
      topics_json TEXT NOT NULL,
      estimated_hours REAL DEFAULT 10.0,
      status TEXT DEFAULT 'in_progress',
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      exam_date DATETIME NOT NULL,
      total_marks INTEGER DEFAULT 100,
      weightage_pct INTEGER DEFAULT 40,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    -- Strict Study Planner
    CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active INTEGER DEFAULT 1,
      strict_mode_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      subject_id INTEGER,
      topic TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_mins INTEGER NOT NULL,
      priority TEXT DEFAULT 'high', -- high, medium, low
      goal TEXT,
      status TEXT DEFAULT 'pending', -- pending, in_progress, completed, missed, postponed
      is_missed INTEGER DEFAULT 0,
      recovery_order INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER,
      subject_id INTEGER,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration_mins INTEGER DEFAULT 0,
      status TEXT DEFAULT 'in_progress', -- in_progress, completed, interrupted
      interruptions_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES study_tasks(id) ON DELETE SET NULL
    );

    -- PDF Documents & Analysis
    CREATE TABLE IF NOT EXISTS pdf_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      page_count INTEGER DEFAULT 1,
      extracted_text TEXT,
      category TEXT DEFAULT 'lecture_notes',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pdf_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pdf_id INTEGER NOT NULL,
      summary TEXT,
      detailed_notes TEXT,
      short_notes TEXT,
      key_concepts_json TEXT,
      flashcards_json TEXT,
      mcqs_json TEXT,
      descriptive_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pdf_id) REFERENCES pdf_documents(id) ON DELETE CASCADE
    );

    -- Question Papers & Analysis
    CREATE TABLE IF NOT EXISTS question_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      exam_term TEXT NOT NULL,
      filename TEXT,
      extracted_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analyzed_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paper_id INTEGER,
      subject_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      marks INTEGER NOT NULL,
      unit_number INTEGER DEFAULT 1,
      frequency INTEGER DEFAULT 1,
      priority_level TEXT DEFAULT 'HIGH PRIORITY', -- HIGH PRIORITY, MEDIUM PRIORITY, LOW PRIORITY
      difficulty TEXT DEFAULT 'Medium',
      pattern_type TEXT DEFAULT 'Theoretical',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paper_id) REFERENCES question_papers(id) ON DELETE SET NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS important_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      marks INTEGER NOT NULL,
      unit_number INTEGER NOT NULL,
      frequency INTEGER DEFAULT 3,
      importance_level TEXT DEFAULT 'High historical importance',
      priority TEXT DEFAULT 'HIGH PRIORITY',
      suggested_prep TEXT,
      sample_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    -- Tests & Evaluations
    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      subject_id INTEGER,
      title TEXT NOT NULL,
      test_type TEXT DEFAULT 'mixed', -- mcq, descriptive, pyq, mixed
      duration_mins INTEGER DEFAULT 30,
      total_marks INTEGER DEFAULT 50,
      pass_marks INTEGER DEFAULT 25,
      is_ai_generated INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS test_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'mcq', -- mcq, tf, fill, short, descriptive
      options_json TEXT,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      marks INTEGER DEFAULT 1,
      unit_number INTEGER DEFAULT 1,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      score REAL NOT NULL,
      total_marks REAL NOT NULL,
      accuracy_pct REAL NOT NULL,
      time_spent_secs INTEGER NOT NULL,
      weak_topics_json TEXT,
      recommendations_json TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      student_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      marks_awarded REAL DEFAULT 0,
      ai_feedback TEXT,
      FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
    );

    -- AI Conversations & Hub
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      provider TEXT DEFAULT 'auto',
      model TEXT DEFAULT 'gemini-1.5-flash',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL, -- user, assistant, system
      content TEXT NOT NULL,
      model_used TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      query_type TEXT DEFAULT 'study_agent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Focus Shield & Distraction
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mode TEXT DEFAULT 'deep_study', -- deep_study, exam_mode, light_study, break_mode
      duration_mins INTEGER DEFAULT 45,
      planned_mins INTEGER DEFAULT 45,
      distraction_attempts INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed', -- in_progress, completed, abandoned
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blocked_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      category TEXT DEFAULT 'Social Media',
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS allowed_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      category TEXT DEFAULT 'Educational',
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS distraction_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      focus_session_id INTEGER,
      attempted_target TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (focus_session_id) REFERENCES focus_sessions(id) ON DELETE SET NULL
    );

    -- Health & Wellness
    CREATE TABLE IF NOT EXISTS hydration_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount_ml INTEGER NOT NULL,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meal_type TEXT NOT NULL, -- Breakfast, Lunch, Evening snack, Dinner
      scheduled_time TEXT NOT NULL, -- e.g. "08:30", "12:30", "17:00", "20:00"
      duration_mins INTEGER DEFAULT 30,
      is_enabled INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wellness_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      log_date DATE NOT NULL,
      sleep_hours REAL DEFAULT 7.2,
      sleep_quality TEXT DEFAULT 'Good',
      steps INTEGER DEFAULT 4820,
      active_minutes INTEGER DEFAULT 45,
      avg_heart_rate INTEGER DEFAULT 72,
      resting_heart_rate INTEGER DEFAULT 64,
      mood TEXT DEFAULT 'Focused',
      notes TEXT,
      is_demo_data INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wearable_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL, -- Apple Health, Google Health Connect, Fitbit, Garmin, Samsung Health
      status TEXT DEFAULT 'Connected', -- Connected, Not Connected, Syncing
      device_name TEXT,
      last_sync_at DATETIME,
      permissions_json TEXT DEFAULT '["steps", "heart_rate", "sleep"]',
      is_demo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS health_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      permission_name TEXT NOT NULL,
      is_granted INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Friends, Social & Study Groups
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'accepted', -- pending, accepted, blocked
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, accepted, rejected
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      subject_id INTEGER,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member', -- admin, member
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Notifications & Gamification
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system', -- study, health, meal, friend, exam, achievement
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Fun Mind Check-Up (Completely Optional, Friendly, Non-Romantic)
    CREATE TABLE IF NOT EXISTS fun_checkups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      best_friend TEXT,
      makes_me_laugh TEXT,
      most_texted TEXT,
      bad_day_friend TEXT,
      study_buddy TEXT,
      biggest_subject_enemy TEXT,
      relaxation_activities TEXT,
      exam_survival_friend TEXT,
      favorite_entertainment TEXT,
      nickname TEXT,
      male_best_friend TEXT,
      female_best_friend TEXT,
      funniest_college_moment TEXT,
      free_day_activity TEXT,
      life_title_movie TEXT,
      ai_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  db.exec(schema);

  // Dynamic schema migration for fun_checkups if columns were added later
  try {
    const existingCols = db.prepare('PRAGMA table_info(fun_checkups)').all().map(c => c.name);
    const newCols = [
      'male_best_friend',
      'female_best_friend',
      'funniest_college_moment',
      'free_day_activity',
      'life_title_movie'
    ];
    for (const col of newCols) {
      if (!existingCols.includes(col)) {
        db.prepare(`ALTER TABLE fun_checkups ADD COLUMN ${col} TEXT`).run();
      }
    }
  } catch (e) {
    console.warn('Fun checkup schema migration check:', e.message);
  }

  seedInitialData();
  ensureAdminUser();
}

function ensureAdminUser() {
  try {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('StudyFlow2026!', salt);

    // Ensure praveen.admin exists
    let adminUser = db.prepare("SELECT * FROM users WHERE username = 'praveen.admin'").get();

    if (!adminUser) {
      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run('praveen.admin', 'praveen@studyflow.ai', passwordHash, 'admin');
      
      const adminId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO profiles (user_id, full_name, college, department, year_semester, bio)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        'Praveen Kumar',
        'StudyFlow Admin & Academic Board',
        'Platform Administration & Learning Analytics',
        'Super Administrator',
        'Head of Academic Analytics & Platform Administrator. Monitoring student study wellness, planner efficiency, and fun mind health.'
      );

      db.prepare(`
        INSERT INTO user_settings (user_id, theme, daily_study_goal_hours, daily_water_goal_ml, preferred_session_mins, strict_plan_mode)
        VALUES (?, 'dark', 6.0, 3000, 50, 1)
      `).run(adminId);
    } else {
      // Ensure admin role and password are up to date
      db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(passwordHash, adminUser.id);
      db.prepare("UPDATE profiles SET full_name = 'Praveen Kumar' WHERE user_id = ?").run(adminUser.id);
    }

    // Also update praveen user if present
    let praveenUser = db.prepare("SELECT * FROM users WHERE username = 'praveen'").get();
    if (praveenUser) {
      db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(passwordHash, praveenUser.id);
      db.prepare("UPDATE profiles SET full_name = 'Praveen Kumar' WHERE user_id = ?").run(praveenUser.id);
    }
  } catch (e) {
    console.warn('ensureAdminUser notice:', e.message);
  }
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('StudyFlow2026!', salt);

  // 1. Create Demo User
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  const demoUserId = insertUser.run('alex.student', 'alex@studyflow.ai', passwordHash, 'student').lastInsertRowid;

  // 2. Create Profile
  db.prepare(`
    INSERT INTO profiles (user_id, full_name, college, department, year_semester, bio)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    'Alex Mercer',
    'Stanford University / MIT School of Engineering',
    'Computer Science & Engineering',
    'Year 3 - Semester 5',
    'Aspiring Distributed Systems & AI Engineer. Studying hard, sleeping well.'
  );

  // 3. User Settings
  db.prepare(`
    INSERT INTO user_settings (user_id, theme, daily_study_goal_hours, daily_water_goal_ml, preferred_session_mins, strict_plan_mode)
    VALUES (?, 'dark', 5.0, 2500, 45, 1)
  `).run(demoUserId);

  // 4. Subjects
  const insertSubj = db.prepare(`
    INSERT INTO subjects (user_id, name, code, target_grade, color)
    VALUES (?, ?, ?, ?, ?)
  `);
  const dsId = insertSubj.run(demoUserId, 'Data Structures & Algorithms', 'CS301', 'A+', '#3b82f6').lastInsertRowid;
  const osId = insertSubj.run(demoUserId, 'Operating Systems', 'CS302', 'A', '#8b5cf6').lastInsertRowid;
  const cnId = insertSubj.run(demoUserId, 'Computer Networks', 'CS303', 'A+', '#06b6d4').lastInsertRowid;
  const dmId = insertSubj.run(demoUserId, 'Discrete Mathematics', 'MA301', 'A', '#ec4899').lastInsertRowid;

  // 5. Syllabus Units
  const insertSyllabus = db.prepare(`
    INSERT INTO syllabus (subject_id, unit_number, unit_title, topics_json, estimated_hours, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSyllabus.run(dsId, 1, 'Trees & Binary Search Trees', JSON.stringify(['Binary Trees', 'BST Operations', 'AVL Trees', 'Red-Black Trees']), 10.0, 'completed');
  insertSyllabus.run(dsId, 2, 'Graph Algorithms', JSON.stringify(['BFS & DFS', 'Dijkstra', 'Bellman-Ford', 'Minimum Spanning Trees']), 12.0, 'in_progress');
  insertSyllabus.run(dsId, 3, 'Dynamic Programming', JSON.stringify(['0/1 Knapsack', 'LCS', 'Matrix Chain Multiplication']), 14.0, 'pending');

  insertSyllabus.run(osId, 1, 'Process Management & Scheduling', JSON.stringify(['Process State', 'FCFS, SJF, Round Robin', 'Multithreading']), 8.0, 'in_progress');
  insertSyllabus.run(osId, 2, 'Memory Management & Virtual Memory', JSON.stringify(['Paging', 'Segmentation', 'Page Replacement Policies']), 10.0, 'pending');

  // 6. Upcoming Exams (Exam Countdown)
  const insertExam = db.prepare(`
    INSERT INTO exams (user_id, subject_id, title, exam_date, total_marks, weightage_pct)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 12);
  targetDate.setHours(targetDate.getHours() + 8);
  insertExam.run(demoUserId, dsId, 'End-Semester Theory: Data Structures', targetDate.toISOString(), 100, 50);

  const osExamDate = new Date();
  osExamDate.setDate(osExamDate.getDate() + 18);
  insertExam.run(demoUserId, osId, 'Mid-Semester Exam: Operating Systems', osExamDate.toISOString(), 75, 30);

  // 7. Study Plan & Strict Tasks
  const planId = db.prepare(`
    INSERT INTO study_plans (user_id, title, start_date, end_date, is_active, strict_mode_enabled)
    VALUES (?, 'Autumn Final Exam Mastery Plan', date('now'), date('now', '+30 days'), 1, 1)
  `).run(demoUserId).lastInsertRowid;

  const insertTask = db.prepare(`
    INSERT INTO study_tasks (plan_id, user_id, subject_id, topic, start_time, end_time, duration_mins, priority, goal, status, is_missed, recovery_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const t1Start = new Date(now.getTime() - 15 * 60000);
  const t1End = new Date(now.getTime() + 35 * 60000);
  insertTask.run(planId, demoUserId, dsId, 'AVL Trees: Rotations & Balancing', t1Start.toISOString(), t1End.toISOString(), 50, 'high', 'Master LL, RR, LR, RL tree rotations with 3 practice problems', 'in_progress', 0, 0);

  const t2Start = new Date(now.getTime() + 45 * 60000);
  const t2End = new Date(now.getTime() + 95 * 60000);
  insertTask.run(planId, demoUserId, osId, 'Round Robin Scheduling Algorithm & Gantt Charts', t2Start.toISOString(), t2End.toISOString(), 50, 'high', 'Solve 16-mark previous exam problem', 'pending', 0, 0);

  const t3Start = new Date(now.getTime() + 110 * 60000);
  const t3End = new Date(now.getTime() + 160 * 60000);
  insertTask.run(planId, demoUserId, cnId, 'TCP 3-Way Handshake & Sliding Window Protocol', t3Start.toISOString(), t3End.toISOString(), 50, 'medium', 'Review diagram and state transitions', 'pending', 0, 0);

  // One missed task for the recovery queue demonstration
  const tMissedStart = new Date(now.getTime() - 180 * 60000);
  const tMissedEnd = new Date(now.getTime() - 130 * 60000);
  insertTask.run(planId, demoUserId, dmId, 'Graph Isomorphism & Euler Paths', tMissedStart.toISOString(), tMissedEnd.toISOString(), 50, 'high', 'Review theorems and solve 5 problem sets', 'missed', 1, 1);

  // 8. Important Questions (with 2m, 5m, 10m, 13m, 16m categories)
  const insertImpQ = db.prepare(`
    INSERT INTO important_questions (user_id, subject_id, question_text, marks, unit_number, frequency, importance_level, priority, suggested_prep, sample_answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertImpQ.run(
    demoUserId, dsId,
    'Explain AVL Tree single (LL, RR) and double (LR, RL) rotations with step-by-step diagrams and time complexity.',
    16, 1, 6, 'High historical importance', 'HIGH PRIORITY',
    'Draw tree before and after rotation. State balance factor criteria BF in {-1, 0, 1}. Time complexity is O(1) for rotation, O(log n) for search/insertion.',
    'An AVL tree is a self-balancing BST where the difference between heights of left and right subtrees for any node cannot exceed 1...'
  );
  insertImpQ.run(
    demoUserId, dsId,
    'Compare BFS and DFS in terms of data structures used, time complexity, and applications.',
    10, 2, 4, 'High-priority revision topic', 'HIGH PRIORITY',
    'Highlight Queue vs Stack, O(V+E) time, Cycle detection vs Shortest path on unweighted graphs.',
    'Breadth First Search (BFS) uses a FIFO Queue to traverse level by level, ideal for shortest paths on unweighted graphs. DFS uses a LIFO Stack or recursion...'
  );
  insertImpQ.run(
    demoUserId, dsId,
    'Define Balance Factor in an AVL Tree and state its valid range.',
    2, 1, 7, 'High historical importance', 'HIGH PRIORITY',
    'BF = height(left_subtree) - height(right_subtree). Must be -1, 0, or +1.',
    'Balance Factor (BF) = Height(Left Subtree) - Height(Right Subtree). For an AVL tree, BF must strictly belong to {-1, 0, +1}.'
  );
  insertImpQ.run(
    demoUserId, osId,
    'Illustrate Round Robin Process Scheduling with Time Quantum = 3ms. Calculate Average Waiting Time and Turnaround Time.',
    16, 1, 5, 'High historical importance', 'HIGH PRIORITY',
    'Construct Gantt chart, table with Arrival Time, Burst Time, Completion Time, TAT, WT.',
    'Round Robin is a preemptive CPU scheduling algorithm designed for time-sharing systems where each process receives a small fixed unit of CPU time...'
  );
  insertImpQ.run(
    demoUserId, osId,
    'What is Beladys Anomaly? Under which page replacement algorithm does it occur?',
    5, 2, 3, 'Medium historical importance', 'MEDIUM PRIORITY',
    'Explain FIFO anomaly where increasing page frames leads to more page faults. Provide counterexample.',
    'Beladys Anomaly is the phenomenon where increasing the number of page frames allocated to a process results in an increase in page faults instead of decreasing...'
  );

  // 9. Question Papers & Analyzed Questions
  const qpId = db.prepare(`
    INSERT INTO question_papers (user_id, subject_id, year, exam_term, filename, extracted_text)
    VALUES (?, ?, 2024, 'Winter University End-Sem', 'CS301_2024_Nov.pdf', 'Data Structures End Sem Examination 2024...')
  `).run(demoUserId, dsId).lastInsertRowid;

  const insertAnalyzed = db.prepare(`
    INSERT INTO analyzed_questions (paper_id, subject_id, question_text, marks, unit_number, frequency, priority_level, difficulty, pattern_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAnalyzed.run(qpId, dsId, 'Construct an AVL tree from elements [14, 17, 11, 7, 53, 4, 13] showing all rotations.', 16, 1, 5, 'HIGH PRIORITY', 'Hard', 'Analytical / Construction');
  insertAnalyzed.run(qpId, dsId, 'Dijkstras Shortest Path Algorithm: Trace single source shortest path on given weighted graph.', 13, 2, 4, 'HIGH PRIORITY', 'Medium', 'Algorithmic Trace');
  insertAnalyzed.run(qpId, dsId, 'State the properties of a Red-Black Tree.', 5, 1, 3, 'MEDIUM PRIORITY', 'Medium', 'Theoretical');
  insertAnalyzed.run(qpId, dsId, 'Explain Minimum Spanning Tree with Kruskals Algorithm.', 10, 2, 4, 'HIGH PRIORITY', 'Medium', 'Algorithmic');
  insertAnalyzed.run(qpId, dsId, 'Define strictly binary tree vs complete binary tree.', 2, 1, 2, 'LOW PRIORITY', 'Easy', 'Definition');

  // 10. Sample Test & Questions
  const testId = db.prepare(`
    INSERT INTO tests (user_id, subject_id, title, test_type, duration_mins, total_marks, pass_marks, is_ai_generated)
    VALUES (?, ?, 'Unit 1 & 2 Diagnostic: Trees and Graph Algorithms', 'mixed', 20, 25, 13, 1)
  `).run(demoUserId, dsId).lastInsertRowid;

  const insertTestQ = db.prepare(`
    INSERT INTO test_questions (test_id, question_text, question_type, options_json, correct_answer, explanation, marks, unit_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTestQ.run(
    testId,
    'What is the worst-case search time complexity in a balanced AVL Tree with N nodes?',
    'mcq',
    JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N log N)']),
    'O(log N)',
    'Because AVL trees guarantee that the height is strictly bounded by ~1.44 * log2(N), worst case search is O(log N).',
    2, 1
  );
  insertTestQ.run(
    testId,
    'Dijkstra’s algorithm guarantees finding the shortest path even if some edge weights are negative.',
    'tf',
    JSON.stringify(['True', 'False']),
    'False',
    'Dijkstra fails on graphs with negative weight edges because greedy selection assumes once a node is visited its shortest path is final. Use Bellman-Ford instead.',
    2, 2
  );
  insertTestQ.run(
    testId,
    'In a binary min-heap with N elements, the minimum element can be retrieved in _____ time.',
    'fill',
    JSON.stringify([]),
    'O(1)',
    'The root node always contains the minimum element in a min-heap, allowing O(1) peek time.',
    2, 1
  );
  insertTestQ.run(
    testId,
    'Explain the condition that triggers a Double Left-Right (LR) rotation in an AVL Tree.',
    'short',
    JSON.stringify([]),
    'An LR rotation occurs when a new node is inserted into the right subtree of the left child of an unbalanced node (Node BF = +2, Left Child BF = -1).',
    'First performs a Left rotation on left child, followed by a Right rotation on the root.',
    4, 1
  );

  // 11. PDF Documents & Analysis
  const pdfId = db.prepare(`
    INSERT INTO pdf_documents (user_id, title, filename, original_name, file_size, page_count, extracted_text, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    'Lecture 04 - Self Balancing Trees & AVL Rotations',
    'sample_avl_lecture.pdf',
    'CS301_Lecture4_AVL.pdf',
    2450000,
    18,
    'Introduction to AVL Trees. An AVL tree is a self-balancing binary search tree in which each node maintains an extra piece of information called a balance factor...',
    'lecture_notes'
  ).lastInsertRowid;

  db.prepare(`
    INSERT INTO pdf_analysis (pdf_id, summary, detailed_notes, short_notes, key_concepts_json, flashcards_json, mcqs_json, descriptive_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pdfId,
    'This lecture explores AVL trees, self-balancing mechanics, rotation types (LL, RR, LR, RL), and strict height guarantees that avoid O(N) degeneration.',
    '### Comprehensive Study Notes\n\n1. **Definition**: Proposed by Adelson-Velsky and Landis (1962). Height-balanced binary search tree.\n2. **Balance Factor**: Defined as Height(Left) - Height(Right). Must stay in {-1, 0, +1}.\n3. **Rotations**:\n   - **LL Rotation**: Single right rotation at unbalance node.\n   - **RR Rotation**: Single left rotation.\n   - **LR Rotation**: Left rotation on child, then right rotation on node.\n   - **RL Rotation**: Right rotation on child, then left rotation on node.\n4. **Complexity Analysis**: Search O(log N), Insert O(log N), Delete O(log N). Rebalancing takes O(1) per rotation.',
    '• AVL tree = self-balancing BST\n• BF = H(L) - H(R) in {-1, 0, 1}\n• Rotations: LL (Right), RR (Left), LR (Left-Right), RL (Right-Left)\n• Time complexity: O(log N) for search/insert/delete.',
    JSON.stringify(['AVL Tree', 'Balance Factor', 'LL Rotation', 'RR Rotation', 'LR Rotation', 'RL Rotation', 'Height Bound']),
    JSON.stringify([
      { front: 'What is the balance factor condition for an AVL tree?', back: 'Balance Factor = Height(Left) - Height(Right), must be -1, 0, or +1.' },
      { front: 'What rotation fixes a right-heavy node with a left-heavy right child?', back: 'RL (Right-Left) Double Rotation.' },
      { front: 'What is the maximum height of an AVL tree with N nodes?', back: 'Approximately 1.44 * log2(N).' }
    ]),
    JSON.stringify([
      { question: 'Which rotation is needed for an insertion into the left subtree of the left child?', options: ['LL Rotation (Single Right)', 'RR Rotation (Single Left)', 'LR Rotation', 'RL Rotation'], correct: 'LL Rotation (Single Right)' },
      { question: 'What is the time complexity of a single AVL tree rotation?', options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'], correct: 'O(1)' }
    ]),
    JSON.stringify([
      { question: 'Explain with diagrams how an LR double rotation restores AVL balance.', marks: 10 }
    ])
  );

  // 12. Health & Wellness Setup
  // Meal Schedule
  const insertMeal = db.prepare(`
    INSERT INTO meal_schedule (user_id, meal_type, scheduled_time, duration_mins, is_enabled)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertMeal.run(demoUserId, 'Breakfast', '08:00', 30, 1);
  insertMeal.run(demoUserId, 'Lunch', '12:30', 45, 1);
  insertMeal.run(demoUserId, 'Evening Snack', '17:00', 20, 1);
  insertMeal.run(demoUserId, 'Dinner', '20:15', 45, 1);

  // Hydration Logs (Today: 5 glasses logged = 1250 ml)
  const insertHydration = db.prepare(`
    INSERT INTO hydration_logs (user_id, amount_ml, logged_at)
    VALUES (?, ?, datetime('now', ?))
  `);
  insertHydration.run(demoUserId, 250, '-4 hours');
  insertHydration.run(demoUserId, 250, '-3 hours');
  insertHydration.run(demoUserId, 250, '-2 hours');
  insertHydration.run(demoUserId, 250, '-1 hour');
  insertHydration.run(demoUserId, 250, '-10 minutes');

  // Wellness Logs (Current / Recent Days)
  const insertWellness = db.prepare(`
    INSERT INTO wellness_logs (user_id, log_date, sleep_hours, sleep_quality, steps, active_minutes, avg_heart_rate, resting_heart_rate, mood, notes, is_demo_data)
    VALUES (?, date('now', ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertWellness.run(demoUserId, '0 days', 7.2, 'Restful', 4820, 45, 72, 64, 'Focused & Energetic', 'Smooth study routine. Drank 5 glasses so far.', 1);
  insertWellness.run(demoUserId, '-1 day', 7.8, 'Very Restful', 7240, 60, 70, 62, 'Sharp', 'Good cardio workout in evening.', 1);
  insertWellness.run(demoUserId, '-2 days', 6.5, 'Fair', 5100, 35, 76, 66, 'Slightly Tired', 'Late-night review session.', 1);

  // Wearable Connection (Demo Connection: Apple Watch Series 9 / Google Pixel Watch)
  db.prepare(`
    INSERT INTO wearable_connections (user_id, provider, status, device_name, last_sync_at, permissions_json, is_demo)
    VALUES (?, 'Apple Health / HealthKit', 'Connected', 'Apple Watch Series 9', datetime('now', '-5 minutes'), '["steps", "heart_rate", "sleep", "mindfulness"]', 1)
  `).run(demoUserId);

  // Focus Blocked & Allowed Sites
  const insertBlocked = db.prepare(`
    INSERT INTO blocked_sites (user_id, domain, category, is_active)
    VALUES (?, ?, ?, 1)
  `);
  ['instagram.com', 'facebook.com', 'x.com', 'twitter.com', 'snapchat.com', 'reddit.com', 'tiktok.com', 'twitch.tv', 'amazon.com'].forEach(d => {
    insertBlocked.run(demoUserId, d, 'Social / Entertainment');
  });

  const insertAllowed = db.prepare(`
    INSERT INTO allowed_sites (user_id, domain, category, is_active)
    VALUES (?, ?, ?, 1)
  `);
  ['studyflow.ai', 'youtube.com', 'web.whatsapp.com', 'github.com', 'stackoverflow.com', 'wikipedia.org', 'mit.edu', 'stanford.edu'].forEach(d => {
    insertAllowed.run(demoUserId, d, 'Educational / Permitted');
  });

  // 13. Friends & Social System
  // Create a couple peer student accounts
  const friend1Id = insertUser.run('priya.patel', 'priya@studyflow.ai', passwordHash, 'student').lastInsertRowid;
  db.prepare(`
    INSERT INTO profiles (user_id, full_name, college, department, year_semester, bio)
    VALUES (?, 'Priya Patel', 'Stanford Engineering', 'Computer Science', 'Year 3 - Semester 5', 'Studying OS & Algorithms. Lets solve problems together!')
  `).run(friend1Id);

  const friend2Id = insertUser.run('marcus.vance', 'marcus@studyflow.ai', passwordHash, 'student').lastInsertRowid;
  db.prepare(`
    INSERT INTO profiles (user_id, full_name, college, department, year_semester, bio)
    VALUES (?, 'Marcus Vance', 'MIT EECS', 'Electrical Eng & CS', 'Year 3 - Semester 5', 'Distributed systems and cloud enthusiast.')
  `).run(friend2Id);

  // Establish friendships
  db.prepare(`INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')`).run(demoUserId, friend1Id);
  db.prepare(`INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')`).run(demoUserId, friend2Id);

  // Initial Messages
  db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
    VALUES (?, ?, 'Hey Alex! Have you reviewed the AVL Tree double rotation questions from the 2024 paper?', 1, datetime('now', '-2 hours'))
  `).run(friend1Id, demoUserId);

  db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, content, is_read, created_at)
    VALUES (?, ?, 'Yes Priya! Just completed the practice test and scored 92%. I can share my summary notes in our study room.', 1, datetime('now', '-1 hour'))
  `).run(demoUserId, friend1Id);

  // Study Group Room
  const groupId = db.prepare(`
    INSERT INTO groups (user_id, name, description, subject_id, is_private)
    VALUES (?, 'CS301 Algorithms & Final Exam Squad', 'Collaborative study group for Trees, Graphs, and Dynamic Programming mastery.', ?, 0)
  `).run(demoUserId, dsId).lastInsertRowid;

  db.prepare(`INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')`).run(groupId, demoUserId);
  db.prepare(`INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`).run(groupId, friend1Id);
  db.prepare(`INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')`).run(groupId, friend2Id);

  db.prepare(`
    INSERT INTO group_messages (group_id, sender_id, content, created_at)
    VALUES (?, ?, 'Welcome to the CS301 Final Exam Prep room! Remember to keep your daily focus streaks active.', datetime('now', '-3 hours'))
  `).run(groupId, demoUserId);

  // 14. Gamification, Badges & XP
  const insertAch = db.prepare(`
    INSERT INTO achievements (user_id, badge_code, title, description, icon)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAch.run(demoUserId, 'FIRST_SESSION', 'First Study Session', 'Completed your inaugural focused study sprint on StudyFlow AI', '🏆');
  insertAch.run(demoUserId, 'STREAK_7', '7-Day Study Streak', 'Consistently hit your daily study goal for 7 consecutive days', '🔥');
  insertAch.run(demoUserId, 'HYDRATION_HERO', 'Hydration Hero', 'Met your 2500ml daily water goal without missing reminders', '💧');
  insertAch.run(demoUserId, 'FOCUS_MASTER', 'Focus Shield Master', 'Completed a 45-minute Deep Study session with zero distractions', '🛡️');

  db.prepare(`INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 250, 'Completed AVL Tree Diagnostic Test')`).run(demoUserId);
  db.prepare(`INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 100, 'Completed 45m Deep Study Focus Sprint')`).run(demoUserId);
  db.prepare(`INSERT INTO xp_transactions (user_id, amount, reason) VALUES (?, 50, 'Hydration Streak Bonus')`).run(demoUserId);

  // 15. Initial Demo Fun Mind Check-Up
  db.prepare(`
    INSERT OR IGNORE INTO fun_checkups (
      user_id, best_friend, makes_me_laugh, most_texted, bad_day_friend, study_buddy, 
      biggest_subject_enemy, relaxation_activities, exam_survival_friend, favorite_entertainment, nickname, ai_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    demoUserId,
    'Arun',
    'Karthik',
    'Arun',
    'Karthik',
    'Arun',
    'Mathematics',
    JSON.stringify(['🎮 Gaming', '▶️ YouTube', '🎵 Music']),
    'Arun',
    'Attack on Titan & Interstellar',
    'Rocky',
    '😂 You’re basically running a two-person study squad with Arun & Karthik! Mathematics is your final boss, YouTube & gaming is your recovery zone, and your crew is definitely surviving exam season together.'
  );

  // 16. Initial Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, is_read, action_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run(demoUserId, 'Strict Study Plan Active', 'Current task: AVL Trees - Rotations. 35 minutes remaining.', 'study', 0, '#planner');
  insertNotif.run(demoUserId, 'Hydration Reminder', 'You have been studying for 45 minutes. Consider taking a short sip of water.', 'health', 0, '#wellness');
  insertNotif.run(demoUserId, 'Exam Approaching', 'Data Structures exam in 12 days. 2 high-priority topics pending revision.', 'exam', 0, '#important-questions');

  console.log('Database initialized and successfully seeded with realistic academic and wellness data!');
}

module.exports = {
  db,
  initDatabase
};
