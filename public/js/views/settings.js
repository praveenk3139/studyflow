// Settings & Privacy Dashboard View
const SettingsView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 22px; font-weight: 800;">⚙️ System Settings & Privacy Dashboard</h2>
        <p style="color: var(--text-secondary); font-size: 13px;">
          Configure personal study targets, AI provider keys, Focus Shield rules, and enforce strict health data sovereignty.
        </p>
      </div>

      <div id="settings-content-area">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Loading configuration...</div>
      </div>
    `;

    this.loadSettings();
  },

  async loadSettings() {
    const container = document.getElementById('settings-content-area');

    try {
      const [profileData, settingsData, funData] = await Promise.all([
        api.get('/auth/me'),
        api.get('/settings'),
        api.get('/fun-checkup').catch(() => ({ has_completed: false, checkup: null }))
      ]);

      const prof = profileData.profile || {};
      const user = profileData.user || {};
      const set = settingsData.settings || {};
      const fc = funData.checkup || {};
      const hasFun = funData.has_completed && funData.checkup;

      let relaxStr = '—';
      try {
        if (fc.relaxation_activities) {
          const r = Array.isArray(fc.relaxation_activities) ? fc.relaxation_activities : JSON.parse(fc.relaxation_activities);
          relaxStr = r.join(', ');
        }
      } catch (e) {}

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 24px; max-width: 860px;">
          <!-- 1. Student Academic Profile -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">👤 Student Profile Information</div>
            </div>
            <div class="grid-2" style="margin-bottom: 16px;">
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Full Name</label>
                <input type="text" id="set-full-name" class="input" value="${prof.full_name || ''}" />
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Username</label>
                <input type="text" class="input" value="${user.username || ''}" disabled style="opacity: 0.7;" />
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">College / University</label>
                <input type="text" id="set-college" class="input" value="${prof.college || ''}" />
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Department & Year</label>
                <input type="text" id="set-department" class="input" value="${prof.department || ''}" />
              </div>
            </div>
            <button class="btn btn-primary" onclick="SettingsView.saveProfile()">Update Profile</button>
          </div>

          <!-- 2. My Fun Profile (Section 9) -->
          <div class="card" style="border-top: 3px solid var(--accent-cyan);">
            <div class="card-header">
              <div class="card-title">😂 My Fun Profile</div>
              <span class="badge ${hasFun ? 'badge-low' : 'badge-medium'}">
                ${hasFun ? '😂 Fun Check-Up Completed' : 'Pending Check-Up'}
              </span>
            </div>

            ${hasFun ? `
              <div class="grid-2" style="margin-bottom: 16px;">
                <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md);">
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">👯 Best Friend</span>
                  <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">${fc.best_friend || '—'}</div>
                </div>
                <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md);">
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">📚 Study Buddy</span>
                  <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">${fc.study_buddy || '—'}</div>
                </div>
                <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md);">
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">💀 Biggest Subject Enemy</span>
                  <div style="font-size: 14px; font-weight: 600; margin-top: 2px; color: #fca5a5;">${fc.biggest_subject_enemy || 'None 😎'}</div>
                </div>
                <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md);">
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">🎮 Favorite Relaxation</span>
                  <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">${relaxStr}</div>
                </div>
                <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md);">
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">🎬 Favorite Entertainment</span>
                  <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">${fc.favorite_entertainment || '—'}</div>
                </div>
                <div style="background: var(--bg-base); padding: 12px; border-radius: var(--radius-md);">
                  <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">🤐 Nickname</span>
                  <div style="font-size: 14px; font-weight: 600; margin-top: 2px;">${fc.nickname || '—'}</div>
                </div>
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#fun-checkup'">
                  ✏️ Edit Answers
                </button>
                <button class="btn btn-danger btn-sm" onclick="SettingsView.deleteFunCheckup()">
                  🗑️ Delete All Fun Check-Up Data
                </button>
              </div>
            ` : `
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
                You haven't completed your Fun Mind Check-Up yet! Take 2 minutes to answer casual questions about your study squad and favorite relaxation activities.
              </p>
              <button class="btn btn-primary btn-sm" onclick="window.location.hash='#fun-checkup'">
                Start Fun Check-Up 🚀
              </button>
            `}
          </div>

          <!-- 2. Study & Strict Plan Preferences -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📚 Study & Planning Parameters</div>
            </div>
            <div class="grid-2" style="margin-bottom: 16px;">
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Daily Study Goal (Hours)</label>
                <input type="number" step="0.5" id="set-goal-hours" class="input" value="${set.daily_study_goal_hours || 4.5}" />
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Preferred Session Duration (Mins)</label>
                <input type="number" id="set-session-mins" class="input" value="${set.preferred_session_mins || 45}" />
              </div>
            </div>
            <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
              <label style="display: flex; justify-content: space-between; align-items: center; font-size: 13.5px; cursor: pointer;">
                <div>
                  <strong>Strict Study Plan Enforcement</strong>
                  <div style="font-size: 12px; color: var(--text-muted);">Requires intentional confirmation to postpone; tracks missed tasks into recovery queue.</div>
                </div>
                <input type="checkbox" id="set-strict-mode" ${set.strict_plan_mode ? 'checked' : ''} />
              </label>
            </div>
            <button class="btn btn-primary" onclick="SettingsView.saveStudySettings()">Save Study Settings</button>
          </div>

          <!-- 3. AI Provider Configuration -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🤖 AI Hub & API Security</div>
              <span class="badge badge-low">⚡ Gemini & Ollama Qwen3 Active</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
              StudyFlow AI is integrated with <strong>Google Gemini</strong> (with active API key) and supports local offline reasoning with <strong>Ollama (Qwen 3)</strong>.
            </p>
            <div class="grid-2" style="margin-bottom: 16px;">
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Default Provider</label>
                <select class="select" id="set-ai-provider">
                  <option value="gemini" ${set.ai_provider === 'gemini' || !set.ai_provider ? 'selected' : ''}>Google Gemini (Cloud)</option>
                  <option value="ollama" ${set.ai_provider === 'ollama' ? 'selected' : ''}>Ollama Qwen 3 (Local Offline)</option>
                  <option value="openai" ${set.ai_provider === 'openai' ? 'selected' : ''}>OpenAI</option>
                  <option value="grok" ${set.ai_provider === 'grok' ? 'selected' : ''}>xAI Grok</option>
                  <option value="perplexity" ${set.ai_provider === 'perplexity' ? 'selected' : ''}>Perplexity</option>
                </select>
              </div>
                <input type="password" id="set-api-key" class="input" placeholder="AI API Key (optional)" value="" />
            </div>
            <button class="btn btn-primary" onclick="SettingsView.saveAiSettings()">Update AI Hub Settings</button>
          </div>

          <!-- 4. Privacy & Sensitive Health Data Sovereignty (Section 29) -->
          <div class="card" style="border-top: 3px solid var(--accent-rose);">
            <div class="card-header">
              <div class="card-title" style="color: var(--accent-rose);">
                <span>🔒</span> Privacy & Data Sovereignty
              </div>
              <span class="badge badge-low">GDPR & Student Privacy Compliant</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px;">
              Health and wearable telemetry is private by default. You possess complete rights to export personal archives or purge health records permanently.
            </p>

            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <a class="btn btn-secondary" href="/api/settings/export-data" download="studyflow_personal_archive.json">
                📥 Export All Personal Data (JSON)
              </a>
              <button class="btn btn-danger" onclick="SettingsView.deleteHealthData()">
                🗑️ Permanently Delete All Health & Wearable Data
              </button>
            </div>
          <!-- 5. Account Password & Private Credentials -->
          <div class="card" style="border-top: 3px solid var(--accent-amber);">
            <div class="card-header">
              <div class="card-title">
                <span>🔑</span> Change Password & Account Security
              </div>
              <span class="badge badge-high">Private & Encrypted</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
              Keep your administrator or student credentials completely private. You can update your account password securely at any time.
            </p>

            <div class="grid-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px;">
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Current Password</label>
                <input type="password" id="set-cur-pw" class="input" placeholder="••••••••" />
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">New Password</label>
                <input type="password" id="set-new-pw" class="input" placeholder="Min 6 characters" />
              </div>
              <div>
                <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Confirm New Password</label>
                <input type="password" id="set-conf-pw" class="input" placeholder="Re-enter new password" />
              </div>
            </div>
            <button class="btn btn-primary" onclick="SettingsView.changePassword()">Update Account Password</button>
          </div>

          <!-- 6. Active Session & Account Switch -->
          <div class="card" style="border-top: 3px solid var(--accent-cyan);">
            <div class="card-header">
              <div class="card-title">
                <span>🚪</span> Active Account & Session
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); margin-bottom: 14px;">
              <div>
                <strong>${prof.full_name || user.username}</strong>
                <div style="font-size: 12px; color: var(--text-secondary);">Logged in as <code>@${user.username}</code> (${user.email || 'No email'})</div>
              </div>
              <button class="btn btn-danger" onclick="App.logout()">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Could not load settings</div>`;
    }
  },

  async saveProfile() {
    const full_name = document.getElementById('set-full-name').value;
    const college = document.getElementById('set-college').value;
    const department = document.getElementById('set-department').value;

    try {
      await api.put('/auth/profile', { full_name, college, department });
      showToast('Profile updated successfully', 'success');
      App.refreshUserHeader();
    } catch (e) {}
  },

  async saveStudySettings() {
    const hours = parseFloat(document.getElementById('set-goal-hours').value);
    const mins = parseInt(document.getElementById('set-session-mins').value);
    const strict = document.getElementById('set-strict-mode').checked;

    try {
      await api.put('/settings', {
        daily_study_goal_hours: hours,
        preferred_session_mins: mins,
        strict_plan_mode: strict
      });
      showToast('Study settings saved', 'success');
    } catch (e) {}
  },

  async saveAiSettings() {
    const provider = document.getElementById('set-ai-provider').value;
    const key = document.getElementById('set-api-key').value;

    try {
      await api.put('/settings', {
        ai_provider: provider,
        api_keys_json: key ? JSON.stringify({ [provider]: key }) : '{}'
      });
      showToast('AI Provider preferences securely stored', 'success');
    } catch (e) {}
  },

  async changePassword() {
    const curPw = document.getElementById('set-cur-pw')?.value;
    const newPw = document.getElementById('set-new-pw')?.value;
    const confPw = document.getElementById('set-conf-pw')?.value;

    if (!curPw || !newPw || !confPw) {
      showToast('Please fill in all password fields', 'warning');
      return;
    }

    if (newPw !== confPw) {
      showToast('New password and confirmation do not match', 'error');
      return;
    }

    if (newPw.length < 6) {
      showToast('New password must be at least 6 characters', 'warning');
      return;
    }

    try {
      const res = await api.put('/auth/change-password', {
        current_password: curPw,
        new_password: newPw
      });
      showToast(res.message || 'Password changed successfully!', 'success');
      document.getElementById('set-cur-pw').value = '';
      document.getElementById('set-new-pw').value = '';
      document.getElementById('set-conf-pw').value = '';
    } catch (e) {
      showToast(e.message || 'Password update failed', 'error');
    }
  },

  async deleteHealthData() {
    if (!confirm('CAUTION: Are you sure you want to permanently purge all hydration logs, sleep records, and wearable connections? This action cannot be reversed.')) {
      return;
    }

    try {
      const res = await api.delete('/settings/delete-health-data');
      showToast(res.message, 'info');
    } catch (e) {}
  },

  async deleteFunCheckup() {
    if (!confirm('Are you sure you want to permanently delete all your Fun Check-Up answers and AI summary?')) {
      return;
    }

    try {
      const res = await api.delete('/fun-checkup');
      showToast(res.message, 'info');
      this.loadSettings();
    } catch (e) {
      showToast('Could not delete checkup: ' + e.message, 'error');
    }
  }
};
