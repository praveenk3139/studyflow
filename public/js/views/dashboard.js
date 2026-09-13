// Dashboard View
const DashboardView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 300px;">
        <div class="pulse-indicator" style="width: 24px; height: 24px;"></div>
      </div>
    `;

    try {
      const [plannerData, wellnessData, analyticsData, profileData, funData] = await Promise.all([
        api.get('/planner'),
        api.get('/wellness/summary'),
        api.get('/analytics'),
        api.get('/auth/me'),
        api.get('/fun-checkup').catch(() => ({ has_completed: false, checkup: null }))
      ]);

      const activeTask = plannerData.active_task;
      const user = profileData.profile || { full_name: 'Alex Mercer' };
      const upcomingExam = analyticsData.exams && analyticsData.exams[0];
      const hasFunCheckup = funData && funData.has_completed && funData.checkup;
      const fc = funData && funData.checkup ? funData.checkup : {};

      // Calculate countdown string if exam exists
      let examCountdownStr = '12 Days 08 Hours';
      if (upcomingExam) {
        const diff = new Date(upcomingExam.exam_date) - new Date();
        const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
        const mins = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
        examCountdownStr = `${days}d ${hours}h ${mins}m`;
      }

      container.innerHTML = `
        <!-- Welcome Banner -->
        <div class="welcome-banner">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
            <div>
              <h2 style="font-size: 26px; font-weight: 800; margin-bottom: 6px;">
                Good day, ${user.full_name.split(' ')[0]} 👋
              </h2>
              <p style="color: var(--text-secondary); font-size: 14px; max-width: 600px;">
                “Study smarter. Stay focused. Stay healthy.” Today's target: <strong>5.0 hours</strong> focused study with scheduled meal & hydration protection.
              </p>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-secondary" onclick="window.location.hash='#fun-checkup'">
                😂 Fun Check-Up
              </button>
              <button class="btn btn-secondary" onclick="window.location.hash='#wellness'">
                💧 Log Water (+250ml)
              </button>
              <button class="btn btn-primary" onclick="window.location.hash='#ai-agent'">
                🤖 Ask AI Doubts
              </button>
            </div>
          </div>
        </div>

        <!-- Strict Active Study Task Banner -->
        ${activeTask ? `
          <div class="card strict-task-card" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <span class="badge badge-high">● STRICT STUDY PLAN ACTIVE</span>
                  <span style="font-size: 13px; color: var(--text-muted);">${activeTask.subject_name || 'Data Structures'}</span>
                </div>
                <h3 style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                  Current Task: ${activeTask.topic}
                </h3>
                <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                  🎯 Goal: ${activeTask.goal || 'Complete practice problems and review key invariants.'}
                </p>
              </div>

              <div style="text-align: right;">
                <div class="countdown-box">
                  <div class="countdown-segment">
                    <div class="countdown-value" id="dashboard-timer">34</div>
                    <div class="countdown-label">Mins Left</div>
                  </div>
                  <div class="countdown-segment">
                    <div class="countdown-value">00</div>
                    <div class="countdown-label">Secs</div>
                  </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
                  <button class="btn btn-emerald btn-sm" onclick="DashboardView.completeTask(${activeTask.id})">
                    ✓ Complete Task
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="DashboardView.emergencyBreak()">
                    ☕ Emergency Break
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="DashboardView.postponeTask(${activeTask.id})">
                    Override / Postpone
                  </button>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Main Dashboard Grid -->
        <div class="grid-dashboard">
          <!-- Left Column: Academic & Tools -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            
            <!-- 😂 NEW: Fun Mind Check-Up Card (Section 1) -->
            <div class="card" style="border-top: 4px solid #38bdf8; background: linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(26, 34, 52, 0.6));">
              <div class="card-header">
                <div>
                  <div class="card-title" style="font-size: 18px; display: flex; align-items: center; gap: 8px;">
                    <span>😂</span> Fun Mind Check-Up
                  </div>
                  <div class="card-subtitle">
                    “Take a quick break and answer some fun questions about yourself!”
                  </div>
                </div>
                <span class="badge ${hasFunCheckup ? 'badge-low' : 'badge-medium'}">
                  ${hasFunCheckup ? '✨ Profile Ready' : '⭐ Optional Break'}
                </span>
              </div>

              ${hasFunCheckup ? `
                <div style="background: var(--bg-base); padding: 12px 14px; border-radius: var(--radius-md); margin: 12px 0; border-left: 3px solid var(--accent-cyan);">
                  <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
                    👯 <strong>Best Friend:</strong> ${fc.best_friend || '—'} &nbsp;•&nbsp; 
                    💀 <strong>Enemy Subject:</strong> <span style="color: #fca5a5;">${fc.biggest_subject_enemy || 'None'}</span> &nbsp;•&nbsp; 
                    🤐 <strong>Nickname:</strong> ${fc.nickname || 'Study Champion'}
                  </div>
                  <div style="font-size: 12px; color: var(--accent-cyan); font-style: italic; margin-top: 4px;">
                    "${fc.ai_summary ? fc.ai_summary.slice(0, 110) + '...' : 'Your study squad is ready to roll!'}"
                  </div>
                </div>
              ` : `
                <p style="font-size: 13px; color: var(--text-secondary); margin: 12px 0;">
                  Discover your ultimate study squad dynamics, roast your biggest subject enemy, and get lighthearted AI commentary! (100% optional & private).
                </p>
              `}

              <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
                <button class="btn btn-primary btn-sm" onclick="window.location.hash='#fun-checkup'">
                  ${hasFunCheckup ? '🔄 Retake Check-Up' : 'Start Fun Check-Up 🚀'}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#fun-checkup'">
                  View My Answers 👀
                </button>
                <button class="btn btn-secondary btn-sm" onclick="FunCheckupView.openRandomQuestionModal()">
                  🎲 AI Random Question
                </button>
              </div>
            </div>

            <!-- Upcoming Exam Countdown Card -->
            <div class="card" style="border-top: 3px solid var(--accent-indigo);">
              <div class="card-header">
                <div>
                  <div class="card-title">
                    <span>🎯 Upcoming Milestone Examination</span>
                  </div>
                  <div class="card-subtitle">${upcomingExam ? upcomingExam.title : 'End-Semester Theory Exam'}</div>
                </div>
                <span class="badge badge-high">${examCountdownStr}</span>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0;">
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: var(--accent-cyan);">78%</div>
                  <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Syllabus Covered</div>
                </div>
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: var(--accent-purple);">92%</div>
                  <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Diagnostic Accuracy</div>
                </div>
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); text-align: center;">
                  <div style="font-size: 22px; font-weight: 800; color: var(--accent-amber);">4</div>
                  <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">High-Priority Topics</div>
                </div>
              </div>

              <div class="progress-container">
                <div class="progress-bar progress-cyan" style="width: 78%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
                <span>Units 1 & 2 Completed</span>
                <span>Unit 3 Revision In Progress</span>
              </div>
            </div>

            <!-- Main Tools Grid -->
            <div>
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 14px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">
                Study & Companion Hub
              </h3>
              <div class="grid-3">
                <a class="tool-card" href="#fun-checkup" style="border-left: 3px solid var(--accent-cyan);">
                  <div class="tool-icon" style="color: #38bdf8;">😂</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Fun Check-Up</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Friends & Casual Quiz</div>
                  </div>
                </a>

                <a class="tool-card" href="#planner">
                  <div class="tool-icon" style="color: #38bdf8;">📅</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Study Planner</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Strict Mode & Recovery</div>
                  </div>
                </a>

                <a class="tool-card" href="#ai-agent">
                  <div class="tool-icon" style="color: #a855f7;">🤖</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">AI Study Agent</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Multi-Model Doubts Hub</div>
                  </div>
                </a>

                <a class="tool-card" href="#pdf-lab">
                  <div class="tool-icon" style="color: #3b82f6;">📄</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">PDF Study Lab</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Notes, Flashcards & MCQs</div>
                  </div>
                </a>

                <a class="tool-card" href="#question-papers">
                  <div class="tool-icon" style="color: #f59e0b;">📝</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">PYQ Analyzer</div>
                    <div style="font-size: 12px; color: var(--text-muted);">High Historical Recurrence</div>
                  </div>
                </a>

                <a class="tool-card" href="#important-questions">
                  <div class="tool-icon" style="color: #ec4899;">⭐</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Important Questions</div>
                    <div style="font-size: 12px; color: var(--text-muted);">2m, 5m, 10m, 16m Sets</div>
                  </div>
                </a>

                <a class="tool-card" href="#tests">
                  <div class="tool-icon" style="color: #10b981;">🧪</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Take Test</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Auto & AI Evaluation</div>
                  </div>
                </a>

                <a class="tool-card" href="#focus-shield">
                  <div class="tool-icon" style="color: #6366f1;">🛡️</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Focus Shield</div>
                    <div style="font-size: 12px; color: var(--text-muted);">YouTube & Distraction Mode</div>
                  </div>
                </a>

                <a class="tool-card" href="#mind-break">
                  <div class="tool-icon" style="color: #14b8a6;">🧠</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Mind Break</div>
                    <div style="font-size: 12px; color: var(--text-muted);">5 Healthy Mini-Games</div>
                  </div>
                </a>

                <a class="tool-card" href="#social">
                  <div class="tool-icon" style="color: #8b5cf6;">👥</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Friends & Chat</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Study Groups & Doubts</div>
                  </div>
                </a>

                <a class="tool-card" href="#wellness">
                  <div class="tool-icon" style="color: #f43f5e;">❤️</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Health & Wellness</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Hydration & Wearable Sync</div>
                  </div>
                </a>

                <a class="tool-card" href="#analytics">
                  <div class="tool-icon" style="color: #06b6d4;">📊</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Analytics</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Academic & Focus Trends</div>
                  </div>
                </a>

                <a class="tool-card" href="#settings">
                  <div class="tool-icon" style="color: #94a3b8;">⚙️</div>
                  <div>
                    <div style="font-weight: 600; font-size: 14px;">Settings</div>
                    <div style="font-size: 12px; color: var(--text-muted);">Privacy & AI Models</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- Right Column: Dedicated Health Card & Coach -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Dedicated Health & Wellness Card (Per Section 31) -->
            <div class="card" style="border-top: 3px solid var(--accent-rose);">
              <div class="card-header">
                <div class="card-title">
                  <span style="color: var(--accent-rose);">❤️</span> WELLNESS
                </div>
                ${wellnessData.wearable.is_demo ? `
                  <span class="badge badge-demo">DEMO DATA</span>
                ` : `
                  <span class="badge ${wellnessData.wearable.status === 'Connected' ? 'badge-low' : 'badge-medium'}">
                    ${wellnessData.wearable.status === 'Connected' ? '🟢 Live Sync' : '⚪ Not Paired'}
                  </span>
                `}
              </div>

              <!-- Health Grid -->
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Hydration -->
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-size: 13px; font-weight: 600; color: var(--accent-cyan);">💧 Hydration</span>
                    <strong style="font-size: 16px;">${wellnessData.hydration.glasses_count} / ${wellnessData.hydration.glasses_goal} Glasses</strong>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar progress-cyan" style="width: ${wellnessData.hydration.percentage}%;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="font-size: 11px; color: var(--text-muted);">${wellnessData.hydration.current_ml} / ${wellnessData.hydration.goal_ml} ml</span>
                    <button class="btn btn-secondary btn-sm" onclick="DashboardView.quickLogWater()">+250ml Sip</button>
                  </div>
                </div>

                <!-- Next Meal -->
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: 600; color: var(--accent-amber);">🍽️ Next Meal</span>
                    <div style="font-size: 11px; color: var(--text-muted);">${wellnessData.next_meal.meal_type || 'Lunch'} Scheduled</div>
                  </div>
                  <div style="font-size: 18px; font-weight: 800; color: var(--accent-amber);">
                    ${wellnessData.next_meal.scheduled_time || '12:30 PM'}
                  </div>
                </div>

                <!-- Activity Steps -->
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: 600; color: var(--accent-emerald);">🚶 Activity</span>
                    <div style="font-size: 11px; color: var(--text-muted);">${wellnessData.activity.active_minutes} active minutes</div>
                  </div>
                  <div style="font-size: 18px; font-weight: 800; color: var(--accent-emerald);">
                    ${wellnessData.activity.steps.toLocaleString()} steps
                  </div>
                </div>

                <!-- Sleep -->
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: 600; color: var(--accent-purple);">😴 Sleep Quality</span>
                    <div style="font-size: 11px; color: var(--text-muted);">${wellnessData.activity.sleep_quality} restorative sleep</div>
                  </div>
                  <div style="font-size: 18px; font-weight: 800; color: var(--accent-purple);">
                    ${wellnessData.activity.sleep_hours}h
                  </div>
                </div>

                <!-- Smartwatch Status -->
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: 600;">⌚ Smartwatch</span>
                    <div style="font-size: 11px; color: var(--text-muted);">
                      ${wellnessData.wearable.device_name || 'Apple Watch Series 9'}
                    </div>
                  </div>
                  <div style="font-size: 13px; font-weight: 700; color: #10b981;">
                    🟢 Connected
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Study Coach Recommendations -->
            <div class="card" style="border-top: 3px solid var(--accent-cyan);">
              <div class="card-header">
                <div class="card-title">
                  <span>🧠 AI Personal Study Coach</span>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${analyticsData.ai_coach.map(insight => `
                  <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-cyan);">
                    <div style="font-size: 11px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 2px;">
                      ${insight.badge}
                    </div>
                    <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">
                      ${insight.text}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <h3>⚠️ Unable to load dashboard overview</h3>
          <p style="color: var(--text-muted); margin: 10px 0;">${err.message}</p>
          <button class="btn btn-primary" onclick="DashboardView.render()">Retry</button>
        </div>
      `;
    }
  },

  async completeTask(taskId) {
    try {
      const res = await api.post(`/planner/task/${taskId}/complete`);
      showToast(res.message, 'success');
      this.render();
    } catch (e) {}
  },

  async emergencyBreak() {
    try {
      const res = await api.post('/planner/emergency-break', { duration_mins: 10 });
      showToast(res.message, 'info');
      window.location.hash = '#mind-break';
    } catch (e) {}
  },

  async postponeTask(taskId) {
    const reason = prompt('Strict Study Plan Notice: Postponing will shift this topic into your Recovery Queue. Reason for rescheduling:');
    if (!reason) return;

    try {
      const res = await api.post(`/planner/task/${taskId}/postpone`, { reason });
      showToast(res.message, 'warning');
      this.render();
    } catch (e) {}
  },

  async quickLogWater() {
    try {
      const res = await api.post('/wellness/hydration', { amount_ml: 250 });
      showToast(`💧 ${res.message}`, 'success');
      playAudioChime('water');
      this.render();
    } catch (e) {}
  }
};
