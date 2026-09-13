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
      phone TEXT,
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

  // Dynamic schema migration for profiles and fun_checkups if columns were added later
  try {
    const profCols = db.prepare('PRAGMA table_info(profiles)').all().map(c => c.name);
    if (!profCols.includes('phone')) {
      db.prepare('ALTER TABLE profiles ADD COLUMN phone TEXT').run();
    }

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
    console.warn('Schema migration check notice:', e.message);
  }

  seedInitialData();
  ensureAdminUser();
}

function ensureAdminUser() {
  try {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('praveen1732@', salt);

    // Ensure praveen exists as primary super admin
    let praveenUser = db.prepare("SELECT * FROM users WHERE username = 'praveen' OR email = 'praveenk3139@gmail.com'").get();

    if (!praveenUser) {
      const result = db.prepare(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
      `).run('praveen', 'praveenk3139@gmail.com', adminPasswordHash, 'admin');
      
      const adminId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO profiles (user_id, full_name, phone, college, department, year_semester, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        'Praveen Kumar',
        '9094219300',
        'StudyFlow Admin & Academic Board',
        'Platform Administration & Learning Analytics',
        'Super Administrator',
        'Head of Academic Analytics & Platform Administrator. Contact: 9094219300.'
      );

      db.prepare(`
        INSERT INTO user_settings (user_id, theme, daily_study_goal_hours, daily_water_goal_ml, preferred_session_mins, strict_plan_mode)
        VALUES (?, 'dark', 6.0, 3000, 50, 1)
      `).run(adminId);
    } else {
      // Update password hash, email, role and phone
      db.prepare("UPDATE users SET username = 'praveen', email = 'praveenk3139@gmail.com', password_hash = ?, role = 'admin' WHERE id = ?").run(adminPasswordHash, praveenUser.id);
      db.prepare("UPDATE profiles SET full_name = 'Praveen Kumar', phone = '9094219300' WHERE user_id = ?").run(praveenUser.id);
    }

    // Also update praveen.admin if present
    let adminUser = db.prepare("SELECT * FROM users WHERE username = 'praveen.admin'").get();
    if (adminUser) {
      db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(adminPasswordHash, adminUser.id);
      db.prepare("UPDATE profiles SET full_name = 'Praveen Kumar', phone = '9094219300' WHERE user_id = ?").run(adminUser.id);
    }
  } catch (e) {
    console.warn('ensureAdminUser notice:', e.message);
  }
}

function seedInitialData() {
  // Demo users (Alex Mercer, Priya Patel, Marcus Vance) and their mock data have been removed.
  // Initialization of mock data is disabled per user request.
  return;
}


module.exports = {
  db,
  initDatabase
};
