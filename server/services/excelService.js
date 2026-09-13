// StudyFlow AI - Excel Sheet Integration Service for Fun Questions & User Answers Log
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { db } = require('../db');

const EXCEL_FILE_PATH = path.join(__dirname, '../../fun_questions.xlsx');

// 15 Comprehensive Fun Mind Check-Up Questions
const CHECKUP_QUESTIONS = [
  { ID: 1, Category: 'Squad & Best Friends', Question: 'Who is your best friend?', Subtitle: 'The partner in crime who knows all your semester secrets', Type: 'text', Default_Options: 'Name / Nickname / Skip' },
  { ID: 2, Category: 'Humor & Memes', Question: 'Who makes you laugh the most?', Subtitle: 'The person whose memes make boring lectures survivable', Type: 'text', Default_Options: 'Name / Nickname / Skip' },
  { ID: 3, Category: 'Communication', Question: 'Who do you text the most?', Subtitle: 'The top pinned contact on your chat apps', Type: 'text', Default_Options: 'Name / Nickname / Skip' },
  { ID: 4, Category: 'Support & Comfort', Question: "Who would you call when you're having a bad day?", Subtitle: 'Your go-to comfort buddy when stress hits hard', Type: 'text', Default_Options: 'Name / Nickname / Skip' },
  { ID: 5, Category: 'Academics', Question: 'Who is your study buddy?', Subtitle: 'The friend who grinds previous-year question papers with you', Type: 'text', Default_Options: 'Name / Nobody 😭 / StudyFlow AI 🤖' },
  { ID: 6, Category: 'Academics', Question: 'Which subject is your biggest enemy?', Subtitle: 'The Final Boss that keeps giving you nightmares before finals', Type: 'single', Default_Options: 'Mathematics, Programming, Networks, OS, DBMS, None' },
  { ID: 7, Category: 'Wellness & Relaxation', Question: "What's your favorite way to relax?", Subtitle: 'Select all that recharge your mental battery', Type: 'multiple', Default_Options: 'Gaming, YouTube, Music, Movies, Anime, Sleep, Outdoor' },
  { ID: 8, Category: 'Exam Squad', Question: 'Which friend would survive an exam with you?', Subtitle: 'The legendary companion who enters the exam battle by your side', Type: 'text', Default_Options: "Friend Name / I'm surviving alone 💀" },
  { ID: 9, Category: 'Entertainment', Question: "What's your favorite movie, anime, series, or game?", Subtitle: 'The masterpiece you will defend until graduation', Type: 'text', Default_Options: 'Custom Title (e.g. Interstellar, Attack on Titan)' },
  { ID: 10, Category: 'Identity & Humor', Question: 'Do you have a funny or secret nickname?', Subtitle: 'What your friends or family call you behind closed doors', Type: 'text', Default_Options: 'Nickname / No nickname' },
  { ID: 11, Category: 'Squad & Best Friends', Question: 'Who is your male best friend?', Subtitle: 'Your ride-or-die bro for late night tea, gaming, and project panics', Type: 'text', Default_Options: 'Name / Same as Best Friend / Solo Guy' },
  { ID: 12, Category: 'Squad & Best Friends', Question: 'Who is your female best friend?', Subtitle: 'Your trusted friend with all the neat lecture notes & honest advice', Type: 'text', Default_Options: 'Name / Same as Best Friend / StudyFlow AI' },
  { ID: 13, Category: 'Campus Lore & Humor', Question: 'What is the funniest thing that happened in your college life?', Subtitle: 'The hilarious mishap, lab disaster, or meme moment you still laugh about', Type: 'textarea', Default_Options: 'Joined wrong lecture / Lab mishap / Free Text' },
  { ID: 14, Category: 'Dream Relaxation', Question: 'If you had a completely free day tomorrow, what would you do?', Subtitle: 'Zero exams, zero assignments, zero alarms—what is your dream day?', Type: 'text', Default_Options: 'Sleep all day / 14-Hour Gaming Sprint / Road Trip / Binge Series' },
  { ID: 15, Category: 'Cinematic Life Saga', Question: 'If your life were an anime/game/movie, what would its title be?', Subtitle: 'Give your university journey an epic, hilarious, or cinematic title!', Type: 'text', Default_Options: 'Surviving 8 AM Lectures / Solo Leveling: Semester Arc' }
];

// AI Random Question Pool
const AI_RANDOM_QUESTIONS_POOL = [
  { ID: 101, Emoji: '🎉', Question: 'If exams disappeared tomorrow, what would you do first? 😂', Placeholder: 'e.g. Sleep for 48 hours straight / Book a flight to Japan', Category: 'Celebration' },
  { ID: 102, Emoji: '💀', Question: 'Which subject would you permanently delete from college? 🗑️', Placeholder: 'e.g. Advanced Calculus or Theory of Computation', Category: 'Academics' },
  { ID: 103, Emoji: '🤓', Question: 'Which of your friends would secretly become a college professor? 👨‍🏫', Placeholder: 'e.g. Karthik / Sarah', Category: 'Friends' },
  { ID: 104, Emoji: '📱', Question: 'What is your all-time most-used emoji during exam week? 🧐', Placeholder: 'e.g. 💀, 😭, 🗿, or 😂', Category: 'Campus Life' },
  { ID: 105, Emoji: '🍜', Question: 'What comfort food could you eat literally every day of semester? 🍕', Placeholder: 'e.g. Midnight ramen, Biryani, or Pizza', Category: 'Food & Fuel' },
  { ID: 106, Emoji: '🧙', Question: 'Which fictional character would you choose as your study partner? 🦸', Placeholder: 'e.g. Tony Stark, Hermione Granger, or Shikamaru', Category: 'Imagination' },
  { ID: 107, Emoji: '🍿', Question: 'If your college life were a movie, what would its title be? 🎬', Placeholder: 'e.g. Surviving 8 AM Lectures: The Final Exam', Category: 'Creativity' },
  { ID: 108, Emoji: '🎮', Question: 'What is your ultimate procrastination superpower? 🛌', Placeholder: 'e.g. Watching 3-hour video essays on YouTube at 2 AM', Category: 'Humor' },
  { ID: 109, Emoji: '🎶', Question: 'Which subject deserves an epic boss battle soundtrack when entering the exam hall? ⚔️', Placeholder: 'e.g. Mathematics or Operating Systems', Category: 'Lore' },
  { ID: 110, Emoji: '🌙', Question: 'What is your most ridiculously productive time of day? ⏰', Placeholder: 'e.g. 11:30 PM after 2 cups of coffee', Category: 'Habits' },
  { ID: 111, Emoji: '🛋️', Question: 'What is the weirdest place you have ever studied for an exam? 🗺️', Placeholder: 'e.g. In the metro or bathroom before 9 AM', Category: 'Campus Lore' },
  { ID: 112, Emoji: '⚡', Question: 'If your energy drinks or coffee had a slogan for you, what would it be? ☕', Placeholder: 'e.g. Fueling panic since 2024', Category: 'Humor' }
];

// Helper: Ensure Workbook and all required sheets exist
function initializeExcelSheet() {
  let existingUserLogs = [];

  if (fs.existsSync(EXCEL_FILE_PATH)) {
    try {
      const oldWb = xlsx.readFile(EXCEL_FILE_PATH);
      if (oldWb.Sheets['User Answers Log']) {
        existingUserLogs = xlsx.utils.sheet_to_json(oldWb.Sheets['User Answers Log']);
      }
    } catch (e) {}
  }

  // Create clean new workbook with the 3 sheets
  const wb = xlsx.utils.book_new();

  // 1. Sheet: Fun Check-Up Questions
  const wsCheckup = xlsx.utils.json_to_sheet(CHECKUP_QUESTIONS);
  xlsx.utils.book_append_sheet(wb, wsCheckup, 'Fun Check-Up Questions');

  // 2. Sheet: AI Random Questions Pool
  const wsAiRandom = xlsx.utils.json_to_sheet(AI_RANDOM_QUESTIONS_POOL);
  xlsx.utils.book_append_sheet(wb, wsAiRandom, 'AI Random Questions Pool');

  // 3. Sheet: User Answers Log
  if (!existingUserLogs || existingUserLogs.length === 0) {
    existingUserLogs = loadInitialUserLogsFromDb();
  }
  const wsLogs = xlsx.utils.json_to_sheet(existingUserLogs);
  xlsx.utils.book_append_sheet(wb, wsLogs, 'User Answers Log');

  xlsx.writeFile(wb, EXCEL_FILE_PATH);
  return wb;
}

// Load existing answers from database to populate initial Excel sheet
function loadInitialUserLogsFromDb() {
  const logs = [];
  try {
    const checkups = db.prepare(`
      SELECT fc.*, u.username, p.full_name 
      FROM fun_checkups fc
      JOIN users u ON fc.user_id = u.id
      LEFT JOIN profiles p ON fc.user_id = p.user_id
    `).all();

    for (const row of checkups) {
      const user = row.full_name || row.username;
      const ts = row.updated_at || row.created_at || new Date().toISOString();

      const fieldMap = [
        { q: 'Who is your best friend?', a: row.best_friend },
        { q: 'Who makes you laugh the most?', a: row.makes_me_laugh },
        { q: 'Who do you text the most?', a: row.most_texted },
        { q: "Who would you call when you're having a bad day?", a: row.bad_day_friend },
        { q: 'Who is your study buddy?', a: row.study_buddy },
        { q: 'Which subject is your biggest enemy?', a: row.biggest_subject_enemy },
        { q: "What's your favorite way to relax?", a: row.relaxation_activities },
        { q: 'Which friend would survive an exam with you?', a: row.exam_survival_friend },
        { q: "What's your favorite movie, anime, series, or game?", a: row.favorite_entertainment },
        { q: 'Do you have a funny or secret nickname?', a: row.nickname },
        { q: 'Who is your male best friend?', a: row.male_best_friend },
        { q: 'Who is your female best friend?', a: row.female_best_friend },
        { q: 'What is the funniest thing that happened in your college life?', a: row.funniest_college_moment },
        { q: 'If you had a completely free day tomorrow, what would you do?', a: row.free_day_activity },
        { q: 'If your life were an anime/game/movie, what would its title be?', a: row.life_title_movie }
      ];

      for (const item of fieldMap) {
        if (item.a && item.a !== 'Skip') {
          logs.push({
            'Timestamp': ts,
            'User ID': row.user_id,
            'Student Name': user,
            'Type': 'Squad Check-Up',
            'Question': item.q,
            'Student Answer': item.a,
            'AI Coach Reaction': row.ai_summary ? row.ai_summary.slice(0, 120) + '...' : '—'
          });
        }
      }
    }
  } catch (e) {}

  return logs;
}

// Log a single user answer or full checkup to Excel
function logUserAnswerToExcel({ userId, username, fullName, type, question, answer, reaction }) {
  try {
    let wb;
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      wb = xlsx.readFile(EXCEL_FILE_PATH);
    } else {
      wb = initializeExcelSheet();
    }

    let logs = [];
    if (wb.Sheets['User Answers Log']) {
      logs = xlsx.utils.sheet_to_json(wb.Sheets['User Answers Log']);
    }

    const studentName = fullName || username || `Student #${userId}`;
    const newEntry = {
      'Timestamp': new Date().toLocaleString(),
      'User ID': userId,
      'Student Name': studentName,
      'Type': type || 'AI Random Question',
      'Question': question,
      'Student Answer': answer,
      'AI Coach Reaction': reaction || '—'
    };

    // Prepend to top so newest answers appear first
    logs.unshift(newEntry);

    // Write back to sheet
    const ws = xlsx.utils.json_to_sheet(logs);
    wb.Sheets['User Answers Log'] = ws;
    xlsx.writeFile(wb, EXCEL_FILE_PATH);

    return true;
  } catch (e) {
    console.error('Error logging to Excel:', e.message);
    return false;
  }
}

// Sync all 15 checkup answers for a user to Excel
function syncFullCheckupToExcel(userId, data, aiSummary) {
  try {
    const userRow = db.prepare('SELECT u.username, p.full_name FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?').get(userId);
    const studentName = (userRow && (userRow.full_name || userRow.username)) || `Student #${userId}`;

    const fieldMap = [
      { q: 'Who is your best friend?', a: data.best_friend },
      { q: 'Who makes you laugh the most?', a: data.makes_me_laugh },
      { q: 'Who do you text the most?', a: data.most_texted },
      { q: "Who would you call when you're having a bad day?", a: data.bad_day_friend },
      { q: 'Who is your study buddy?', a: data.study_buddy },
      { q: 'Which subject is your biggest enemy?', a: data.biggest_subject_enemy },
      { q: "What's your favorite way to relax?", a: Array.isArray(data.relaxation_activities) ? data.relaxation_activities.join(', ') : data.relaxation_activities },
      { q: 'Which friend would survive an exam with you?', a: data.exam_survival_friend },
      { q: "What's your favorite movie, anime, series, or game?", a: data.favorite_entertainment },
      { q: 'Do you have a funny or secret nickname?', a: data.nickname },
      { q: 'Who is your male best friend?', a: data.male_best_friend },
      { q: 'Who is your female best friend?', a: data.female_best_friend },
      { q: 'What is the funniest thing that happened in your college life?', a: data.funniest_college_moment },
      { q: 'If you had a completely free day tomorrow, what would you do?', a: data.free_day_activity },
      { q: 'If your life were an anime/game/movie, what would its title be?', a: data.life_title_movie }
    ];

    let wb;
    if (fs.existsSync(EXCEL_FILE_PATH)) {
      wb = xlsx.readFile(EXCEL_FILE_PATH);
    } else {
      wb = initializeExcelSheet();
    }

    let logs = [];
    if (wb.Sheets['User Answers Log']) {
      logs = xlsx.utils.sheet_to_json(wb.Sheets['User Answers Log']);
    }

    // Remove older checkup logs for this user to keep it clean and current
    logs = logs.filter(l => !(l['User ID'] === userId && l['Type'] === 'Squad Check-Up'));

    const ts = new Date().toLocaleString();
    for (const item of fieldMap) {
      if (item.a && item.a !== 'Skip') {
        logs.unshift({
          'Timestamp': ts,
          'User ID': userId,
          'Student Name': studentName,
          'Type': 'Squad Check-Up',
          'Question': item.q,
          'Student Answer': item.a,
          'AI Coach Reaction': aiSummary ? aiSummary.slice(0, 120) + '...' : '—'
        });
      }
    }

    const ws = xlsx.utils.json_to_sheet(logs);
    wb.Sheets['User Answers Log'] = ws;
    xlsx.writeFile(wb, EXCEL_FILE_PATH);
    return true;
  } catch (e) {
    console.error('Error syncing checkup to Excel:', e.message);
    return false;
  }
}

// Read questions from Excel file for the AI Random Question generator
function getRandomQuestionsFromExcel() {
  try {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      initializeExcelSheet();
    }
    const wb = xlsx.readFile(EXCEL_FILE_PATH);
    let pool = [];

    if (wb.Sheets['AI Random Questions Pool']) {
      const rows = xlsx.utils.sheet_to_json(wb.Sheets['AI Random Questions Pool']);
      if (rows && rows.length > 0) {
        pool = rows.map(r => ({
          id: r.ID || Math.floor(Math.random() * 1000),
          emoji: r.Emoji || '🎲',
          question: r.Question || r.question,
          placeholder: r.Placeholder || r.placeholder || 'Type your answer...',
          category: r.Category || 'General',
          provider: 'Excel Sheet (fun_questions.xlsx)'
        }));
      }
    }

    if (pool.length === 0) {
      pool = AI_RANDOM_QUESTIONS_POOL;
    }
    return pool;
  } catch (e) {
    return AI_RANDOM_QUESTIONS_POOL;
  }
}

// Get complete Excel Data for UI Dashboard & Preview
function getExcelSummaryData() {
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    initializeExcelSheet();
  }

  const wb = xlsx.readFile(EXCEL_FILE_PATH);
  const result = {
    file_name: 'fun_questions.xlsx',
    file_path: EXCEL_FILE_PATH,
    sheets: wb.SheetNames,
    checkup_questions: wb.Sheets['Fun Check-Up Questions'] ? xlsx.utils.sheet_to_json(wb.Sheets['Fun Check-Up Questions']) : CHECKUP_QUESTIONS,
    ai_random_pool: wb.Sheets['AI Random Questions Pool'] ? xlsx.utils.sheet_to_json(wb.Sheets['AI Random Questions Pool']) : AI_RANDOM_QUESTIONS_POOL,
    user_answers_log: wb.Sheets['User Answers Log'] ? xlsx.utils.sheet_to_json(wb.Sheets['User Answers Log']) : []
  };

  return result;
}

// Initialize on module load
initializeExcelSheet();

module.exports = {
  EXCEL_FILE_PATH,
  CHECKUP_QUESTIONS,
  AI_RANDOM_QUESTIONS_POOL,
  initializeExcelSheet,
  logUserAnswerToExcel,
  syncFullCheckupToExcel,
  getRandomQuestionsFromExcel,
  getExcelSummaryData
};
