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

  let testUserId = null;
  let testNewUser = `test_student_${Date.now()}`;
  let newAuthToken = '';

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
    testUserId = res.data.user.id;
  });

  // 4. Auth Login with newly created user
  await test(`POST /api/auth/login (${testNewUser})`, async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: testNewUser, password: 'TestPassword123!' });
    if (res.status !== 200 || !res.data.token) throw new Error(`New user login failed: ${JSON.stringify(res.data)}`);
  });

  let authToken = newAuthToken;

  // 5. Strict Study Planner
  await test('GET /api/planner (active task & strict mode)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/planner', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.status !== 200) throw new Error(`Planner tasks missing: ${JSON.stringify(res.data)}`);
  });

  // 6. AI Study Agent Chat
  await test('POST /api/ai/chat (16-mark structured response)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/ai/chat', method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }, { message: 'Give me a 16-mark answer for AVL Trees and single rotations', model: 'gemini-1.5-flash' });
    if (res.status !== 200 || !res.data.content.includes('16-Mark Standard')) {
      throw new Error(`AI response mismatch: ${res.data.content ? res.data.content.slice(0, 100) : 'none'}`);
    }
  });

  // 7. Question Paper Priority Engine
  await test('GET /api/question-papers/analysis (high/medium/low buckets)', async () => {
    const res = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/question-papers/analysis', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.status !== 200 || !res.data.priorities) {
      throw new Error(`Priority analysis incomplete: ${JSON.stringify(res.data)}`);
    }
  });

  // 8. Health & Wellness
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

  // 9. Fun Mind Check-Up (Submit with score evaluation, GET, Random Question, Reaction)
  await test('POST & GET /api/fun-checkup (Scoring & Analysis evaluation)', async () => {
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

    if (postRes.status !== 200 || !postRes.data.score || postRes.data.score < 50) {
      throw new Error(`Fun checkup submission failed or score evaluation invalid: ${JSON.stringify(postRes.data)}`);
    }

    const getRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/fun-checkup', method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (getRes.status !== 200 || !getRes.data.has_completed || !getRes.data.checkup.score) {
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

  // 10. Admin Portal (Praveen Kumar - Overview, Fun Checkups, Directory, Block, Delete)
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

  await test('GET /api/admin/overview & /fun-checkups & /users', async () => {
    const ovRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/admin/overview', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (ovRes.status !== 200 || !ovRes.data.metrics) throw new Error('Admin overview failed');

    const fcRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/admin/fun-checkups', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (fcRes.status !== 200 || !fcRes.data.students) throw new Error('Admin fun checkups failed');

    const uRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/admin/users', method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (uRes.status !== 200 || !uRes.data.users) throw new Error('Admin users directory failed');
  });

  // 11. Admin Block & Delete Student User Tests
  await test(`PUT /api/admin/users/${testUserId}/block (Block student account)`, async () => {
    const blockRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: `/api/admin/users/${testUserId}/block`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { block: true });
    if (blockRes.status !== 200 || !blockRes.data.is_blocked) throw new Error('Block user failed');

    // Attempt login with blocked user (must be rejected 403)
    const loginAttempt = await request({
      hostname: 'localhost', port: TEST_PORT, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: testNewUser, password: 'TestPassword123!' });
    if (loginAttempt.status !== 403) throw new Error(`Expected 403 Forbidden for blocked user login, got ${loginAttempt.status}`);

    // Unblock student account
    const unblockRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: `/api/admin/users/${testUserId}/block`, method: 'PUT',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { block: false });
    if (unblockRes.status !== 200 || unblockRes.data.is_blocked) throw new Error('Unblock user failed');
  });

  await test(`DELETE /api/admin/users/${testUserId} (Delete student account)`, async () => {
    const delRes = await request({
      hostname: 'localhost', port: TEST_PORT, path: `/api/admin/users/${testUserId}`, method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (delRes.status !== 200) throw new Error(`Delete user failed with status ${delRes.status}`);
  });

  server.close();
  console.log(`\n🎉 Tests completed: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
