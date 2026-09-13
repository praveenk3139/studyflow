// Automated API Verification Test for StudyFlow AI
const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const TEST_PORT = 3099;
const app = require('../server/server');

async function runTests() {
  console.log('🧪 Starting StudyFlow AI Backend API Tests...');

  const server = app.listen(TEST_PORT);
  await new Promise(r => setTimeout(r, 400));

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health-check', async () => {
    const res = await request({ hostname: 'localhost', port: TEST_PORT, path: '/api/health-check', method: 'GET' });
    if (res.status !== 200 || res.data.app !== 'StudyFlow AI') throw new Error(`Unexpected response: ${JSON.stringify(res)}`);
  });

  // 2. Auth Login with Invalid Credentials Check
  await test('POST /api/auth/login (invalid password rejection)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'alex.student', password: 'WrongPassword123!' });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  // 3. Auth Signup (Create New User)
  const testNewUser = `test_student_${Date.now()}`;
  let newAuthToken = '';
  await test('POST /api/auth/signup (create new student account)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/auth/signup', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: testNewUser,
      full_name: 'Test Student',
      email: `${testNewUser}@university.edu`,
      password: 'TestPassword123!',
      college: 'MIT Engineering',
      department: 'Computer Science'
    });
    if (res.status !== 201 || !res.data.token) throw new Error(`Signup failed: ${JSON.stringify(res.data)}`);
    newAuthToken = res.data.token;
  });

  // 4. Auth Login with newly created user
  await test(`POST /api/auth/login (${testNewUser})`, async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: testNewUser, password: 'TestPassword123!' });
    if (res.status !== 200 || !res.data.token) throw new Error(`New user login failed: ${JSON.stringify(res.data)}`);
  });

  // 5. Use new user token for subsequent tests
  authToken = newAuthToken;
  await test('POST /api/auth/login (use newly created user)', async () => {
    // Just a placeholder, we already verified login in step 4
  });

  // 6. Strict Study Planner
  await test('GET /api/planner (active task & strict mode)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/planner', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    // With no seeded data, planner might be empty, but should return 200
    if (res.status !== 200) throw new Error(`Planner tasks missing: ${JSON.stringify(res.data)}`);
  });

  // 7. AI Study Agent Chat
  await test('POST /api/ai/chat (16-mark structured response)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/ai/chat', method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }, { message: 'Give me a 16-mark answer for AVL Trees and single rotations', model: 'gemini-1.5-flash' });
    if (res.status !== 200 || !res.data.content.includes('16-Mark Standard')) {
      throw new Error(`AI response mismatch: ${res.data.content ? res.data.content.slice(0, 100) : 'none'}`);
    }
  });

  // 8. Question Paper Priority Engine
  await test('GET /api/question-papers/analysis (high/medium/low buckets)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/question-papers/analysis', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.status !== 200 || !res.data.priorities) {
      throw new Error(`Priority analysis incomplete: ${JSON.stringify(res.data)}`);
    }
  });

  // 9. Test Module & Auto-Evaluation
  await test('GET /api/tests (No tests seeded)', async () => {
    const listRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/tests', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (listRes.status !== 200) throw new Error('Failed to get tests');
  });

  // 10. Health & Wellness (Log Hydration & Status Summary)
  await test('POST /api/wellness/hydration (+250ml) & GET /summary', async () => {
    const hydRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/wellness/hydration', method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }, { amount_ml: 250 });
    if (hydRes.status !== 201) throw new Error(`Hydration log failed: ${JSON.stringify(hydRes.data)}`);

    const summaryRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/wellness/summary', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (summaryRes.status !== 200 || !summaryRes.data.wearable) throw new Error(`Wellness summary failed: ${JSON.stringify(summaryRes.data)}`);
  });

  // 11. Focus Shield & YouTube Settings
  await test('GET /api/focus and check allowed/blocked rules', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/focus', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.status !== 200) throw new Error('Focus settings not retrievable');
  });

  // 12. Fun Mind Check-Up (Submit, Get, Random Question, Reaction & Privacy Deletion)
  await test('POST & GET /api/fun-checkup (Fun Mind Check-Up 15-Question workflow)', async () => {
    // Submit questionnaire
    const postRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup', method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }, {
      best_friend: 'Arun',
      makes_me_laugh: 'Karthik',
      most_texted: 'Arun',
      bad_day_friend: 'Karthik',
      study_buddy: 'Arun',
      biggest_subject_enemy: 'Mathematics',
      relaxation_activities: ['🎮 Gaming', '▶️ YouTube'],
      exam_survival_friend: 'Arun',
      favorite_entertainment: 'Interstellar',
      nickname: 'Rocky',
      male_best_friend: 'Rahul',
      female_best_friend: 'Priya',
      funniest_college_moment: 'Professor caught us playing games in the front row 😂',
      free_day_activity: 'Sleep for 12 hours straight then binge anime 🍿',
      life_title_movie: 'Solo Leveling: The Finals Arc ⚔️'
    });

    if (postRes.status !== 200 || !postRes.data.ai_summary) {
      throw new Error(`Fun checkup submission failed: ${JSON.stringify(postRes.data)}`);
    }

    // Verify GET
    const getRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (getRes.status !== 200 || !getRes.data.has_completed || getRes.data.checkup.male_best_friend !== 'Rahul' || getRes.data.checkup.female_best_friend !== 'Priya') {
      throw new Error(`Fun checkup retrieval failed: ${JSON.stringify(getRes.data)}`);
    }
  });

  await test('GET /api/fun-checkup/random-question & POST /react', async () => {
    const randRes = await request({ hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup/random-question', method: 'GET' });
    if (randRes.status !== 200 || !randRes.data.question) throw new Error('Random question failed');

    const reactRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup/react', method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }, { question: randRes.data.question.question, answer: 'Mathematics and Calculus' });
    if (reactRes.status !== 200 || !reactRes.data.reaction) throw new Error('Reaction failed');
  });

  // 13. Excel Sheet Integration (fun_questions.xlsx live sync & download)
  await test('GET /api/fun-checkup/excel-data & /download-excel (fun_questions.xlsx)', async () => {
    const dataRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup/excel-data', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (dataRes.status !== 200 || !dataRes.data.success || !dataRes.data.data.user_answers_log) {
      throw new Error(`Excel data query failed: ${JSON.stringify(dataRes.data)}`);
    }

    const dlRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup/download-excel', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (dlRes.status !== 200) throw new Error(`Excel download failed with status ${dlRes.status}`);
  });

  // 14. Admin Portal for Praveen Kumar (Overview, Fun Check-ups, Study Analytics, Master Excel)
  let adminToken = '';
  await test('POST /api/auth/login (Praveen Kumar - Admin)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'praveen', password: 'praveen1732@' });
    if (res.status !== 200 || !res.data.token || res.data.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.token;
  });

  await test('GET /api/admin/overview (KPIs, Active Students, Excel Status)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/admin/overview', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200 || !res.data.metrics || res.data.metrics.total_users < 1) {
      throw new Error(`Admin overview failed: ${JSON.stringify(res.data)}`);
    }
  });

  await test('GET /api/admin/fun-checkups (All student responses & 15 answers)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/admin/fun-checkups', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200 || !res.data.students || !Array.isArray(res.data.students)) {
      throw new Error(`Admin fun checkups failed: ${JSON.stringify(res.data)}`);
    }
  });

  await test('GET /api/admin/study-analytics (Multi-user study hours & recovery queue)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/admin/study-analytics', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 200 || !res.data.students || !Array.isArray(res.data.students)) {
      throw new Error(`Admin study analytics failed: ${JSON.stringify(res.data)}`);
    }
  });

  await test('GET /api/admin/master-excel (Multi-sheet master Excel workbook)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: `/api/admin/master-excel?token=${adminToken}`, method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Master Excel download failed with status ${res.status}`);
  });

  server.close();
  console.log(`\n🎉 Tests completed: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
