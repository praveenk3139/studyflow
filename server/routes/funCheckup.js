const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { generateDynamicFunQuestion, callGeminiApi } = require('../services/aiService');

// Curated Random Fun Questions
const RANDOM_QUESTIONS = [
  { id: 1, question: "If exams disappeared tomorrow, what would you do first? 😂", emoji: "🎉", placeholder: "e.g. Sleep for 48 hours straight / Book a flight to Japan" },
  { id: 2, question: "Which subject would you permanently delete from college? 🗑️", emoji: "💀", placeholder: "e.g. Advanced Calculus or Theory of Computation" },
  { id: 3, question: "Which of your friends would secretly become a college professor? 👨‍🏫", emoji: "🤓", placeholder: "e.g. Karthik / Sarah" },
  { id: 4, question: "What is your all-time most-used emoji? 🧐", emoji: "📱", placeholder: "e.g. 💀, 😭, 🗿, or 😂" },
  { id: 5, question: "What comfort food could you eat literally every day of semester? 🍕", emoji: "🍜", placeholder: "e.g. Midnight ramen, Biryani, or Pizza" },
  { id: 6, question: "Which fictional character would you choose as your study partner? 🦸", emoji: "🧙", placeholder: "e.g. Tony Stark, Hermione Granger, or Shikamaru" },
  { id: 7, question: "If your college life were a movie, what would its title be? 🎬", emoji: "🍿", placeholder: "e.g. Surviving 8 AM Lectures: The Final Exam" },
  { id: 8, question: "What is your ultimate procrastination superpower? 🛌", emoji: "🎮", placeholder: "e.g. Watching 3-hour video essays on YouTube at 2 AM" },
  { id: 9, question: "Which subject deserves an epic boss battle soundtrack when entering the exam hall? ⚔️", emoji: "🎶", placeholder: "e.g. Mathematics or Operating Systems" },
  { id: 10, question: "What is your most ridiculously productive time of day? ⏰", emoji: "🌙", placeholder: "e.g. 11:30 PM after 2 cups of coffee" }
];

// Helper: Calculate Score out of 100, Grade, and Detailed Analysis
function calculateCheckupAnalysis(data) {
  let squadScore = 0; // max 25
  let academicScore = 0; // max 25
  let wellnessScore = 0; // max 25
  let loreScore = 0; // max 25

  // 1. Squad Support Alliance (25 Marks)
  if (data.best_friend && data.best_friend !== 'Skip') squadScore += 5;
  if (data.male_best_friend && data.male_best_friend !== 'Skip') squadScore += 5;
  if (data.female_best_friend && data.female_best_friend !== 'Skip') squadScore += 5;
  if (data.makes_me_laugh && data.makes_me_laugh !== 'Skip') squadScore += 5;
  if (data.bad_day_friend && data.bad_day_friend !== 'Skip') squadScore += 5;

  // 2. Academic Synergy & Battle Partner (25 Marks)
  if (data.study_buddy && data.study_buddy !== 'Skip') academicScore += 10;
  if (data.biggest_subject_enemy && data.biggest_subject_enemy !== 'Skip') academicScore += 8;
  if (data.exam_survival_friend && data.exam_survival_friend !== 'Skip') academicScore += 7;

  // 3. Wellness & Recharge Dynamics (25 Marks)
  let relaxList = [];
  try {
    relaxList = typeof data.relaxation_activities === 'string' ? JSON.parse(data.relaxation_activities) : (data.relaxation_activities || []);
  } catch (e) { relaxList = []; }
  if (relaxList.length >= 3) wellnessScore += 15;
  else if (relaxList.length >= 1) wellnessScore += 10;
  else wellnessScore += 5;

  if (data.free_day_activity && data.free_day_activity !== 'Skip') wellnessScore += 10;

  // 4. Campus Lore & Creative Mindset (25 Marks)
  if (data.nickname && data.nickname !== 'Skip' && data.nickname !== 'No nickname') loreScore += 7;
  if (data.funniest_college_moment && data.funniest_college_moment.length > 5 && data.funniest_college_moment !== 'Skip') loreScore += 10;
  if (data.life_title_movie && data.life_title_movie !== 'Skip') loreScore += 8;

  const totalScore = Math.min(100, squadScore + academicScore + wellnessScore + loreScore);

  let grade = 'B Tier';
  if (totalScore >= 90) grade = 'S+ Tier (100% Squad & Mindset Mastery)';
  else if (totalScore >= 80) grade = 'A+ Tier (Elite Balance & Squad Synergy)';
  else if (totalScore >= 70) grade = 'A Tier (Strong Focus & Mindful Recharge)';
  else if (totalScore >= 60) grade = 'B Tier (Solid Academic Foundation)';
  else grade = 'C Tier (Developing Squad Lore)';

  const details = {
    total_score: totalScore,
    grade: grade,
    breakdown: {
      squad_support: { mark: squadScore, max: 25, label: 'Squad Support Alliance' },
      academic_synergy: { mark: academicScore, max: 25, label: 'Academic Battle Partner' },
      wellness_recharge: { mark: wellnessScore, max: 25, label: 'Wellness & Recharge' },
      campus_lore: { mark: loreScore, max: 25, label: 'Campus Lore & Creative Mindset' }
    }
  };

  return {
    score: totalScore,
    grade: grade,
    analysis_details: JSON.stringify(details)
  };
}

// Helper: Generate playful AI commentary on answers
function generateFunSummary(data) {
  const parts = [];

  const friend = data.best_friend && data.best_friend !== 'Skip' ? data.best_friend : null;
  const maleFriend = data.male_best_friend && data.male_best_friend !== 'Skip' ? data.male_best_friend : null;
  const femaleFriend = data.female_best_friend && data.female_best_friend !== 'Skip' ? data.female_best_friend : null;
  const buddy = data.study_buddy && data.study_buddy !== 'Skip' && data.study_buddy !== 'Nobody 😭' ? data.study_buddy : null;
  const enemy = data.biggest_subject_enemy && data.biggest_subject_enemy !== 'None 😎' && data.biggest_subject_enemy !== 'Skip' ? data.biggest_subject_enemy : null;
  const nick = data.nickname && data.nickname !== 'Skip' && data.nickname !== 'No nickname' ? data.nickname : null;
  const funnyMoment = data.funniest_college_moment && data.funniest_college_moment !== 'Skip' ? data.funniest_college_moment : null;
  const freeDay = data.free_day_activity && data.free_day_activity !== 'Skip' ? data.free_day_activity : null;
  const movieTitle = data.life_title_movie && data.life_title_movie !== 'Skip' ? data.life_title_movie : null;
  
  let relaxList = [];
  try {
    relaxList = typeof data.relaxation_activities === 'string' ? JSON.parse(data.relaxation_activities) : (data.relaxation_activities || []);
  } catch (e) {
    relaxList = [];
  }
  const relaxStr = relaxList.slice(0, 2).join(' & ');

  if (maleFriend && femaleFriend) {
    parts.push(`😂 Your core alliance is stacked with ${maleFriend} & ${femaleFriend} anchoring your squad!`);
  } else if (friend && buddy && (friend.toLowerCase() === buddy.toLowerCase())) {
    parts.push(`😂 You're running an elite two-person academic powerhouse with ${friend}!`);
  } else if (friend) {
    parts.push(`😂 ${friend} is clearly the main character in your college lore!`);
  } else {
    parts.push(`😂 Running a lone-wolf mastermind operation!`);
  }

  if (enemy) {
    parts.push(`${enemy} is officially the Final Boss on your degree quest 💀.`);
  } else {
    parts.push(`Zero subject enemies detected—pure academic invincibility 😎.`);
  }

  if (funnyMoment) {
    parts.push(`That campus story ("${funnyMoment.slice(0, 70)}...") belongs in university history archives 😂.`);
  }

  if (freeDay) {
    parts.push(`On a free day, you recharge with ${freeDay.slice(0, 50)}.`);
  } else if (relaxStr) {
    parts.push(`${relaxStr} is your sacred recovery sanctuary.`);
  }

  if (movieTitle) {
    parts.push(`🎬 If your journey had a box office title, "${movieTitle}" is an instant 10/10.`);
  }

  if (nick) {
    parts.push(`Agent '${nick}', your study squad is ready to conquer this semester! 🚀`);
  } else {
    parts.push(`Keep your focus high and remember to hydrate! 🌟`);
  }

  return parts.join(' ');
}

// 1. Get user's Fun Mind Check-Up data & Score Analysis
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;

  const checkup = db.prepare('SELECT * FROM fun_checkups WHERE user_id = ?').get(userId);

  if (!checkup) {
    return res.json({
      has_completed: false,
      checkup: null
    });
  }

  let relaxation = [];
  try {
    relaxation = JSON.parse(checkup.relaxation_activities || '[]');
  } catch (e) {
    relaxation = checkup.relaxation_activities ? [checkup.relaxation_activities] : [];
  }

  let analysisDetails = null;
  try {
    analysisDetails = JSON.parse(checkup.analysis_details || '{}');
  } catch (e) {}

  res.json({
    has_completed: true,
    checkup: {
      ...checkup,
      relaxation_activities: relaxation,
      analysis_details: analysisDetails
    }
  });
});

// 2. Submit or update Fun Mind Check-Up & Evaluate Score Mark
router.post('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const {
    best_friend,
    makes_me_laugh,
    most_texted,
    bad_day_friend,
    study_buddy,
    biggest_subject_enemy,
    relaxation_activities,
    exam_survival_friend,
    favorite_entertainment,
    nickname,
    male_best_friend,
    female_best_friend,
    funniest_college_moment,
    free_day_activity,
    life_title_movie
  } = req.body;

  const relaxJson = Array.isArray(relaxation_activities) 
    ? JSON.stringify(relaxation_activities) 
    : (typeof relaxation_activities === 'string' ? relaxation_activities : '[]');

  const aiSummary = generateFunSummary({
    best_friend,
    makes_me_laugh,
    most_texted,
    bad_day_friend,
    study_buddy,
    biggest_subject_enemy,
    relaxation_activities: relaxJson,
    exam_survival_friend,
    favorite_entertainment,
    nickname,
    male_best_friend,
    female_best_friend,
    funniest_college_moment,
    free_day_activity,
    life_title_movie
  });

  const evaluation = calculateCheckupAnalysis({
    best_friend,
    makes_me_laugh,
    most_texted,
    bad_day_friend,
    study_buddy,
    biggest_subject_enemy,
    relaxation_activities: relaxJson,
    exam_survival_friend,
    favorite_entertainment,
    nickname,
    male_best_friend,
    female_best_friend,
    funniest_college_moment,
    free_day_activity,
    life_title_movie
  });

  const existing = db.prepare('SELECT id FROM fun_checkups WHERE user_id = ?').get(userId);

  if (existing) {
    db.prepare(`
      UPDATE fun_checkups
      SET best_friend = ?,
          makes_me_laugh = ?,
          most_texted = ?,
          bad_day_friend = ?,
          study_buddy = ?,
          biggest_subject_enemy = ?,
          relaxation_activities = ?,
          exam_survival_friend = ?,
          favorite_entertainment = ?,
          nickname = ?,
          male_best_friend = ?,
          female_best_friend = ?,
          funniest_college_moment = ?,
          free_day_activity = ?,
          life_title_movie = ?,
          ai_summary = ?,
          score = ?,
          grade = ?,
          analysis_details = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      best_friend || '',
      makes_me_laugh || '',
      most_texted || '',
      bad_day_friend || '',
      study_buddy || '',
      biggest_subject_enemy || '',
      relaxJson,
      exam_survival_friend || '',
      favorite_entertainment || '',
      nickname || '',
      male_best_friend || '',
      female_best_friend || '',
      funniest_college_moment || '',
      free_day_activity || '',
      life_title_movie || '',
      aiSummary,
      evaluation.score,
      evaluation.grade,
      evaluation.analysis_details,
      userId
    );
  } else {
    db.prepare(`
      INSERT INTO fun_checkups (
        user_id, best_friend, makes_me_laugh, most_texted, bad_day_friend, study_buddy,
        biggest_subject_enemy, relaxation_activities, exam_survival_friend, favorite_entertainment, nickname,
        male_best_friend, female_best_friend, funniest_college_moment, free_day_activity, life_title_movie,
        ai_summary, score, grade, analysis_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      best_friend || '',
      makes_me_laugh || '',
      most_texted || '',
      bad_day_friend || '',
      study_buddy || '',
      biggest_subject_enemy || '',
      relaxJson,
      exam_survival_friend || '',
      favorite_entertainment || '',
      nickname || '',
      male_best_friend || '',
      female_best_friend || '',
      funniest_college_moment || '',
      free_day_activity || '',
      life_title_movie || '',
      aiSummary,
      evaluation.score,
      evaluation.grade,
      evaluation.analysis_details
    );

    // Give XP bonus for mindful break completion (+50 XP)
    try {
      db.prepare(`
        INSERT INTO xp_transactions (user_id, amount, reason)
        VALUES (?, 50, 'Completed Fun Mind Check-Up 🌟')
      `).run(userId);
    } catch (e) {}
  }

  const updated = db.prepare('SELECT * FROM fun_checkups WHERE user_id = ?').get(userId);
  let parsedRelax = [];
  try { parsedRelax = JSON.parse(updated.relaxation_activities || '[]'); } catch (e) {}
  let parsedAnalysis = {};
  try { parsedAnalysis = JSON.parse(updated.analysis_details || '{}'); } catch (e) {}

  res.json({
    message: '🎉 Fun Mind Check-Up completed & analyzed successfully!',
    checkup: {
      ...updated,
      relaxation_activities: parsedRelax,
      analysis_details: parsedAnalysis
    },
    ai_summary: aiSummary,
    score: evaluation.score,
    grade: evaluation.grade
  });
});

// 3. Delete individual answer field
router.delete('/field/:fieldName', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { fieldName } = req.params;

  const allowedFields = [
    'best_friend', 'makes_me_laugh', 'most_texted', 'bad_day_friend',
    'study_buddy', 'biggest_subject_enemy', 'relaxation_activities',
    'exam_survival_friend', 'favorite_entertainment', 'nickname',
    'male_best_friend', 'female_best_friend', 'funniest_college_moment',
    'free_day_activity', 'life_title_movie'
  ];

  if (!allowedFields.includes(fieldName)) {
    return res.status(400).json({ error: 'Invalid field name' });
  }

  db.prepare(`UPDATE fun_checkups SET ${fieldName} = '' WHERE user_id = ?`).run(userId);
  res.json({ message: `Field '${fieldName}' cleared successfully` });
});

// 4. Delete all Fun Mind Check-Up data
router.delete('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.prepare('DELETE FROM fun_checkups WHERE user_id = ?').run(userId);
  res.json({ message: 'All Fun Check-Up data permanently deleted.' });
});

// 5. Random Fun Question Generator
router.get('/random-question', async (req, res) => {
  try {
    const q = await generateDynamicFunQuestion();
    res.json({
      question: q
    });
  } catch (e) {
    const randomIndex = Math.floor(Math.random() * RANDOM_QUESTIONS.length);
    res.json({
      question: RANDOM_QUESTIONS[randomIndex]
    });
  }
});

// 6. Interactive AI Reaction to Fun Question
router.post('/react', authMiddleware, async (req, res) => {
  const { question, answer } = req.body;
  if (!answer) {
    return res.json({ reaction: "😂 That's one way to dodge the question!" });
  }

  let finalReaction = null;

  try {
    const prompt = `A university student answered this fun check-up question: "${question}".\nStudent's Answer: "${answer}".\nGive a super short (1-2 sentences), hilarious, positive, lighthearted student-friendly reaction with emojis. Strictly non-romantic.`;
    const aiReaction = await callGeminiApi(prompt, 'gemini-1.5-flash');
    if (aiReaction) {
      finalReaction = aiReaction.trim();
    }
  } catch (e) {}

  if (!finalReaction) {
    let reaction = "😂 Haha, that is iconic! Definitely adding that to your semester lore.";
    const ansLower = answer.toLowerCase();

    if (ansLower.includes('math') || ansLower.includes('calculus')) {
      reaction = "💀 Mathematics catching stray arrows as usual! We will conquer it together!";
    } else if (ansLower.includes('sleep') || ansLower.includes('nap')) {
      reaction = "😴 100% valid. Sleep debt is the true final boss of college.";
    } else if (ansLower.includes('game') || ansLower.includes('gaming') || ansLower.includes('valorant') || ansLower.includes('gta')) {
      reaction = "🎮 Elite choice! Just make sure Focus Shield is active during study sprints!";
    } else if (ansLower.includes('ramen') || ansLower.includes('pizza') || ansLower.includes('biryani') || ansLower.includes('coffee')) {
      reaction = "🍕 Premium student fuel right there. Top tier taste!";
    }
    finalReaction = reaction;
  }

  res.json({ reaction: finalReaction });
});

module.exports = router;
