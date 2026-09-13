// StudyFlow AI - Admin Portal & Executive Learning Analytics View (Praveen Kumar)
const AdminView = {
  currentTab: 'fun-checkups', // 'overview' | 'fun-checkups' | 'study-analytics' | 'users' | 'excel'
  overviewData: null,
  checkupsData: null,
  analyticsData: null,
  usersData: null,
  searchQuery: '',

  async render() {
    const container = document.getElementById('view-content');
    if (!container) return;

    // Check if user is admin
    if (App.currentUser && App.currentUser.role !== 'admin') {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 60px 20px; max-width: 500px; margin: 40px auto;">
          <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
          <h3 style="font-size: 20px; font-weight: 700; color: var(--accent-rose);">Access Restricted</h3>
          <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 8px;">
            The Admin Portal requires administrator privileges (Praveen Kumar). Please log in as an administrator to access this area.
          </p>
          <button class="btn btn-primary" style="margin-top: 20px;" onclick="App.logout()">
            Switch Account
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 26px;">👑</span>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">
                Admin Portal & Learning Analytics
              </h2>
              <span class="badge badge-demo" style="font-size: 11px; font-weight: 700;">SUPER ADMIN</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 4px;">
              Administrator: <strong>Praveen Kumar</strong> • Monitoring student study wellness, planner progress, and fun check-up responses.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="AdminView.refreshData()">
              🔄 Live Refresh
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminView.downloadMasterExcel()" style="background: linear-gradient(135deg, #059669, #10b981);">
              📥 Download Master Excel Report (.xlsx)
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Metrics Overview Grid -->
      <div id="admin-kpi-grid" class="grid-4" style="margin-bottom: 24px; gap: 14px;">
        <div class="card" style="border-top: 3px solid var(--accent-cyan); padding: 18px;">
          <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Students</div>
          <div id="metric-students" style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">...</div>
          <div style="font-size: 12px; color: var(--accent-cyan); margin-top: 4px;">Active Learners Roster</div>
        </div>

        <div class="card" style="border-top: 3px solid var(--accent-purple); padding: 18px;">
          <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Fun Check-Ups</div>
          <div id="metric-checkups" style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">...</div>
          <div style="font-size: 12px; color: var(--accent-purple); margin-top: 4px;">Completed Squad Profiles</div>
        </div>

        <div class="card" style="border-top: 3px solid #10b981; padding: 18px;">
          <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Study Hours</div>
          <div id="metric-study-hours" style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">...</div>
          <div style="font-size: 12px; color: #10b981; margin-top: 4px;">Logged in Study Sprints</div>
        </div>

        <div class="card" style="border-top: 3px solid #f59e0b; padding: 18px;">
          <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Task Completion</div>
          <div id="metric-task-rate" style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">...</div>
          <div style="font-size: 12px; color: #f59e0b; margin-top: 4px;">Strict Plan Adherence</div>
        </div>
      </div>

      <!-- Admin Tab Navigation -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; flex-wrap: wrap;">
        <button class="btn btn-sm ${this.currentTab === 'fun-checkups' ? 'btn-primary' : 'btn-secondary'}" onclick="AdminView.switchTab('fun-checkups')">
          😂 All Students' Fun Check-Up Answers
        </button>
        <button class="btn btn-sm ${this.currentTab === 'study-analytics' ? 'btn-primary' : 'btn-secondary'}" onclick="AdminView.switchTab('study-analytics')">
          📈 Student Study & Academic Progress Analysis
        </button>
        <button class="btn btn-sm ${this.currentTab === 'users' ? 'btn-primary' : 'btn-secondary'}" onclick="AdminView.switchTab('users')">
          👥 Registered Student Directory
        </button>
        <button class="btn btn-sm ${this.currentTab === 'excel' ? 'btn-primary' : 'btn-secondary'}" onclick="AdminView.switchTab('excel')">
          📊 Excel Sheet Manager (fun_questions.xlsx)
        </button>
      </div>

      <!-- Main Dynamic Content Panel -->
      <div id="admin-main-panel">
        <div style="text-align: center; padding: 50px;"><div class="pulse-indicator"></div> Loading admin analytics...</div>
      </div>
    `;

    this.loadOverviewMetrics();
    this.renderCurrentTab();
  },

  async loadOverviewMetrics() {
    try {
      const res = await api.get('/admin/overview');
      this.overviewData = res;

      const m = res.metrics;
      const sEl = document.getElementById('metric-students');
      const cEl = document.getElementById('metric-checkups');
      const hEl = document.getElementById('metric-study-hours');
      const tEl = document.getElementById('metric-task-rate');

      if (sEl) sEl.innerText = m.total_students;
      if (cEl) cEl.innerText = m.fun_checkups_completed;
      if (hEl) hEl.innerText = `${m.study_hours_logged} hrs`;
      if (tEl) tEl.innerText = `${m.task_completion_rate}%`;
    } catch (e) {
      console.warn('Could not load overview metrics:', e.message);
    }
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  async refreshData() {
    showToast('Refreshing Administrator Analytics...', 'info');
    await this.loadOverviewMetrics();
    await this.renderCurrentTab();
    showToast('Admin data synchronized!', 'success');
  },

  async renderCurrentTab() {
    const panel = document.getElementById('admin-main-panel');
    if (!panel) return;

    if (this.currentTab === 'fun-checkups') {
      this.renderFunCheckupsTab(panel);
    } else if (this.currentTab === 'study-analytics') {
      this.renderStudyAnalyticsTab(panel);
    } else if (this.currentTab === 'users') {
      this.renderUsersTab(panel);
    } else if (this.currentTab === 'excel') {
      this.renderExcelTab(panel);
    }
  },

  // =========================================================================
  // TAB 1: ALL STUDENTS' FUN CHECK-UP ANSWERS
  // =========================================================================
  async renderFunCheckupsTab(panel) {
    panel.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 18px;">
        <div class="card" style="padding: 16px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 17px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <span>😂</span> Student Fun Mind Responses (15 Questions Master Log)
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary);">
                Review every student's friends, enemy subjects, dream free day, hilarious moments, and AI summaries.
              </p>
            </div>
            
            <div style="display: flex; gap: 10px; width: 300px;">
              <input 
                type="text" 
                class="input" 
                placeholder="🔍 Search student name or answer..." 
                value="${this.escapeHtml(this.searchQuery)}"
                oninput="AdminView.onSearch(this.value)"
              />
            </div>
          </div>
        </div>

        <div id="checkups-list-container" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="text-align: center; padding: 40px;"><div class="pulse-indicator"></div> Loading student checkups...</div>
        </div>
      </div>
    `;

    try {
      const res = await api.get('/admin/fun-checkups');
      this.checkupsData = res.students;
      this.renderCheckupsList();
    } catch (e) {
      const c = document.getElementById('checkups-list-container');
      if (c) c.innerHTML = `<div style="color: var(--accent-rose); padding: 20px;">Could not load responses: ${e.message}</div>`;
    }
  },

  onSearch(val) {
    this.searchQuery = val.toLowerCase();
    this.renderCheckupsList();
  },

  renderCheckupsList() {
    const container = document.getElementById('checkups-list-container');
    if (!container || !this.checkupsData) return;

    let list = this.checkupsData;
    if (this.searchQuery) {
      list = list.filter(s => JSON.stringify(s).toLowerCase().includes(this.searchQuery));
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 50px; color: var(--text-muted);">
          No student check-up responses match your filter.
        </div>
      `;
      return;
    }

    container.innerHTML = list.map((s, idx) => `
      <div class="card" style="border-left: 4px solid var(--accent-cyan); animation: authFadeIn 0.25s ease;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="user-avatar" style="width: 32px; height: 32px; font-size: 13px;">${s.full_name.charAt(0).toUpperCase()}</span>
              <div>
                <strong style="font-size: 16px; color: var(--text-primary);">${this.escapeHtml(s.full_name)}</strong>
                <span style="font-size: 12.5px; color: var(--text-muted); margin-left: 8px;">(@${this.escapeHtml(s.username)})</span>
              </div>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              🎓 ${this.escapeHtml(s.college)} • ${this.escapeHtml(s.department)} • ${this.escapeHtml(s.year_semester)}
            </div>
          </div>

          <div style="text-align: right;">
            <span class="badge badge-low" style="font-size: 11px;">Completed Check-Up</span>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
              Updated: ${new Date(s.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        <!-- 15 Questions Grid -->
        <div class="grid-3" style="gap: 10px; margin-bottom: 16px;">
          <div class="fun-res-pill">
            <span class="fun-res-label">👯 Best Friend</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.best_friend)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">👦 Male Best Friend</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.male_best_friend)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">👧 Female Best Friend</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.female_best_friend)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">😂 Makes You Laugh</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.makes_me_laugh)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">📱 Most Texted</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.most_texted)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">🫂 Bad-Day Friend</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.bad_day_friend)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">📚 Study Buddy</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.study_buddy)}</strong>
          </div>
          <div class="fun-res-pill" style="border-left-color: var(--accent-rose);">
            <span class="fun-res-label">💀 Enemy Subject</span>
            <strong class="fun-res-val" style="color: #fca5a5;">${this.escapeHtml(s.answers.biggest_subject_enemy)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">🎮 Stress Buster</span>
            <strong class="fun-res-val">${s.answers.relaxation_activities.join(', ') || '—'}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">🏝️ Dream Free Day</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.free_day_activity)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">🤐 Nickname</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.nickname)}</strong>
          </div>
          <div class="fun-res-pill">
            <span class="fun-res-label">🎬 Favorite Movie / Anime</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.favorite_entertainment)}</strong>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
          <div class="fun-res-pill" style="border-left-color: #f59e0b;">
            <span class="fun-res-label">😂 Funniest College Moment</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.funniest_college_moment)}</strong>
          </div>
          <div class="fun-res-pill" style="border-left-color: var(--accent-indigo);">
            <span class="fun-res-label">⚔️ Life Title (Movie/Anime)</span>
            <strong class="fun-res-val">${this.escapeHtml(s.answers.life_title_movie)}</strong>
          </div>
        </div>

        <!-- AI Summary -->
        <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--accent-cyan); padding: 12px 14px; border-radius: var(--radius-md);">
          <div style="font-size: 12px; color: var(--accent-cyan); font-weight: 700; margin-bottom: 3px;">
            🤖 AI Study Coach Observation:
          </div>
          <div style="font-size: 13px; color: var(--text-primary); font-style: italic;">
            "${this.escapeHtml(s.ai_summary || 'Squad profile analyzed and ready for semester challenges.')}"
          </div>
        </div>
      </div>
    `).join('');
  },

  // =========================================================================
  // TAB 2: STUDY & ACADEMIC PROGRESS ANALYTICS
  // =========================================================================
  async renderStudyAnalyticsTab(panel) {
    panel.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="card">
          <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">
            📈 Multi-Student Study Analytics & Sprint Efficiency
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
            Live study plan completion rate, recovery queue load, and academic XP performance.
          </p>

          <div id="analytics-table-container">
            <div style="text-align: center; padding: 40px;"><div class="pulse-indicator"></div> Loading study analytics...</div>
          </div>
        </div>
      </div>
    `;

    try {
      const res = await api.get('/admin/study-analytics');
      this.analyticsData = res;

      const container = document.getElementById('analytics-table-container');
      if (!container) return;

      container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
          <thead>
            <tr style="background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-subtle);">
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Student</th>
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">College & Dept</th>
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Study Hours</th>
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Tasks (Done / Total)</th>
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Completion %</th>
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Missed (Recovery)</th>
              <th style="padding: 12px 14px; font-weight: 700; font-size: 11px; text-transform: uppercase;">Academic XP</th>
            </tr>
          </thead>
          <tbody>
            ${res.students.map((st, i) => `
              <tr style="border-bottom: 1px solid var(--border-subtle); background: ${i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'};">
                <td style="padding: 12px 14px;">
                  <strong style="color: var(--accent-cyan);">${this.escapeHtml(st.full_name)}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">@${this.escapeHtml(st.username)}</div>
                </td>
                <td style="padding: 12px 14px; color: var(--text-secondary); font-size: 12.5px;">
                  ${this.escapeHtml(st.department || 'Engineering')}
                </td>
                <td style="padding: 12px 14px; font-weight: 700; color: #10b981;">
                  ${st.study_hours} hrs
                </td>
                <td style="padding: 12px 14px;">
                  ${st.completed_tasks} / ${st.total_tasks}
                </td>
                <td style="padding: 12px 14px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: var(--bg-base); border-radius: 3px; overflow: hidden; min-width: 60px;">
                      <div style="height: 100%; width: ${st.completion_pct}%; background: linear-gradient(90deg, #38bdf8, #10b981);"></div>
                    </div>
                    <span style="font-size: 12px; font-weight: 700;">${st.completion_pct}%</span>
                  </div>
                </td>
                <td style="padding: 12px 14px;">
                  <span class="badge ${st.missed_tasks > 0 ? 'badge-high' : 'badge-low'}">
                    ${st.missed_tasks} missed
                  </span>
                </td>
                <td style="padding: 12px 14px; font-weight: 800; color: #f59e0b;">
                  🏆 ${st.total_xp} XP
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      panel.innerHTML = `<div style="color: var(--accent-rose);">Could not load analytics: ${e.message}</div>`;
    }
  },

  // =========================================================================
  // TAB 3: REGISTERED STUDENT DIRECTORY
  // =========================================================================
  async renderUsersTab(panel) {
    panel.innerHTML = `
      <div class="card">
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">
          👥 Registered Student & Administrator Directory
        </h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
          Manage registered students and review account credentials and access roles.
        </p>

        <div id="users-directory-table">
          <div style="text-align: center; padding: 40px;"><div class="pulse-indicator"></div> Loading directory...</div>
        </div>
      </div>
    `;

    try {
      const res = await api.get('/admin/users');
      const box = document.getElementById('users-directory-table');
      if (!box) return;

      box.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
          <thead>
            <tr style="background: var(--bg-surface-elevated); border-bottom: 2px solid var(--border-subtle);">
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">ID</th>
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">User / Name</th>
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">Email</th>
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">Role</th>
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">Check-Up Status</th>
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">XP Points</th>
              <th style="padding: 12px 14px; font-size: 11px; text-transform: uppercase;">Registered</th>
            </tr>
          </thead>
          <tbody>
            ${res.users.map((u, i) => `
              <tr style="border-bottom: 1px solid var(--border-subtle); background: ${i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'};">
                <td style="padding: 12px 14px; color: var(--text-muted); font-weight: 700;">#${u.id}</td>
                <td style="padding: 12px 14px;">
                  <strong style="color: var(--text-primary);">${this.escapeHtml(u.full_name)}</strong>
                  <div style="font-size: 11.5px; color: var(--text-muted);">@${this.escapeHtml(u.username)}</div>
                </td>
                <td style="padding: 12px 14px; color: var(--text-secondary);">${this.escapeHtml(u.email)}</td>
                <td style="padding: 12px 14px;">
                  <span class="badge ${u.is_admin ? 'badge-demo' : 'badge-low'}" style="font-size: 10.5px;">
                    ${u.is_admin ? '👑 Admin' : '👤 Student'}
                  </span>
                </td>
                <td style="padding: 12px 14px;">
                  <span class="badge ${u.fun_checkup_completed ? 'badge-low' : 'badge-medium'}">
                    ${u.fun_checkup_completed ? '✨ Completed' : 'Pending'}
                  </span>
                </td>
                <td style="padding: 12px 14px; font-weight: 700; color: #f59e0b;">
                  🏆 ${u.xp} XP
                </td>
                <td style="padding: 12px 14px; font-size: 12px; color: var(--text-muted);">
                  ${new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      panel.innerHTML = `<div style="color: var(--accent-rose);">Could not load user list: ${e.message}</div>`;
    }
  },

  // =========================================================================
  // TAB 4: EXCEL SPREADSHEET MANAGER
  // =========================================================================
  renderExcelTab(panel) {
    panel.innerHTML = `
      <div class="card" style="border-top: 4px solid #10b981;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 18px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span>📊</span> Live Excel Integration Hub (fun_questions.xlsx)
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary);">
              All student responses and question pools are continuously synchronized in fun_questions.xlsx.
            </p>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary btn-sm" onclick="FunCheckupView.switchTab('excel')">
              Open Interactive Sheet Viewer 📊
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminView.downloadMasterExcel()" style="background: linear-gradient(135deg, #059669, #10b981);">
              📥 Download Master Excel (.xlsx)
            </button>
          </div>
        </div>

        <div style="background: var(--bg-base); padding: 20px; border-radius: var(--radius-md); line-height: 1.6; font-size: 13.5px; color: var(--text-secondary);">
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
            📑 Master Spreadsheet Content Summary:
          </div>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
            <li><strong>Sheet 1 — Student Study Analytics</strong>: Multi-user study sprint hours, completed vs missed recovery tasks, and academic XP.</li>
            <li><strong>Sheet 2 — All Fun Check-Ups</strong>: Complete 15 questions and answers for every registered student.</li>
            <li><strong>Sheet 3 — Live User Answers Log</strong>: Real-time chronological logging of all check-up submissions and AI Random Question interactions.</li>
            <li><strong>Sheet 4 — Fun Check-Up Master Qs</strong>: All 15 official questions with category tags and response types.</li>
            <li><strong>Sheet 5 — AI Random Questions Pool</strong>: The dynamic question pool used by the AI Study Coach.</li>
          </ul>
        </div>
      </div>
    `;
  },

  downloadMasterExcel() {
    const token = localStorage.getItem('token');
    window.location.href = `/api/admin/master-excel?token=${encodeURIComponent(token)}`;
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
