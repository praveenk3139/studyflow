// Focus Shield & Distraction Protection View
const FocusShieldView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 22px; font-weight: 800;">🛡️ Focus & Distraction Shield</h2>
            <span class="badge badge-low">ACTIVE SHIELDING</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Filters social distractions, enforces study YouTube mode, and monitors focus continuity while keeping communication channels open.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <a class="btn btn-secondary" href="/extension/manifest.json" download="manifest.json">
            🧩 Download Browser Extension
          </a>
        </div>
      </div>

      <div id="focus-shield-content">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Loading Focus Shield state...</div>
      </div>
    `;

    this.loadFocusData();
  },

  async loadFocusData() {
    const container = document.getElementById('focus-shield-content');
    try {
      const data = await api.get('/focus');
      const yt = data.youtube_settings;
      const wa = data.whatsapp_settings;
      const blocked = data.blocked_sites;
      const allowed = data.allowed_sites;

      container.innerHTML = `
        <!-- Focus Modes Selection (Section 11) -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div class="card-title">🎯 Focus Modes</div>
            <span class="badge badge-high">Current: Deep Study</span>
          </div>

          <div class="grid-4">
            <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border: 2px solid var(--accent-cyan); cursor: pointer;" onclick="FocusShieldView.setMode('deep_study')">
              <div style="font-size: 24px; margin-bottom: 6px;">🧠</div>
              <strong style="font-size: 14px; color: var(--accent-cyan);">Deep Study Mode</strong>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Maximum distraction protection. Blocks social sites, enables YouTube study mode.
              </p>
            </div>

            <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer;" onclick="FocusShieldView.setMode('exam_mode')">
              <div style="font-size: 24px; margin-bottom: 6px;">⚡</div>
              <strong style="font-size: 14px; color: var(--accent-rose);">Exam Mode</strong>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Strictest focus settings. Only active curriculum, notes, and academic portals permitted.
              </p>
            </div>

            <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer;" onclick="FocusShieldView.setMode('light_study')">
              <div style="font-size: 24px; margin-bottom: 6px;">📖</div>
              <strong style="font-size: 14px; color: var(--accent-purple);">Light Study</strong>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Gentle audio reminders when straying from study materials.
              </p>
            </div>

            <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); cursor: pointer;" onclick="FocusShieldView.setMode('break_mode')">
              <div style="font-size: 24px; margin-bottom: 6px;">☕</div>
              <strong style="font-size: 14px; color: var(--accent-emerald);">Break Mode</strong>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                Temporarily relax restrictions during scheduled breaks and meals.
              </p>
            </div>
          </div>
        </div>

        <!-- YouTube & WhatsApp Section (Sections 12 & 13) -->
        <div class="grid-2" style="margin-bottom: 24px;">
          <!-- YouTube Study Mode Card -->
          <div class="card" style="border-top: 3px solid #ef4444;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: #ef4444;">▶</span> YouTube Study Mode
              </div>
              <span class="badge badge-low">ALLOWED BY DEFAULT</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Educational YouTube lectures remain accessible. StudyFlow AI suppresses addictive recommendation feeds and Shorts rabbit-holes.
            </p>

            <div style="display: flex; flex-direction: column; gap: 14px; background: var(--bg-base); padding: 16px; border-radius: var(--radius-md);">
              <label style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; cursor: pointer;">
                <span>Strict Shorts Restriction:</span>
                <input type="checkbox" ${yt.shorts_restricted ? 'checked' : ''} onchange="FocusShieldView.updateYt(this.checked, ${yt.daily_limit_mins})" />
              </label>
              <label style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; cursor: pointer;">
                <span>Reduce Distracting Recommendations:</span>
                <input type="checkbox" checked />
              </label>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
                <span>Daily YouTube Study Limit:</span>
                <strong>${yt.daily_limit_mins} Mins</strong>
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">
                Today's tracked YouTube study lecture time: <strong>${yt.today_time_spent_mins} minutes</strong>
              </div>
            </div>
          </div>

          <!-- WhatsApp Student Communication Card -->
          <div class="card" style="border-top: 3px solid #10b981;">
            <div class="card-header">
              <div class="card-title">
                <span style="color: #10b981;">💬</span> WhatsApp Access & Privacy
              </div>
              <span class="badge badge-low">ALLOWED</span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
              Students can coordinate with peer groups and college classmates during study sessions.
            </p>

            <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md);">
              <div style="font-size: 13px; font-weight: 600; color: var(--accent-emerald); margin-bottom: 6px;">
                🔒 Zero Message Snooping
              </div>
              <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 10px;">
                ${wa.privacy_notice}
              </p>
              <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                <span>⏱️ Continuity Tracker:</span>
                <span style="color: var(--accent-cyan);">Monitors focus tab engagement</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Blocked & Allowed Domain Matrices -->
        <div class="grid-2">
          <!-- Blocked Sites List -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🚫 Default Distraction Blocklist</div>
              <button class="btn btn-secondary btn-sm" onclick="FocusShieldView.addBlockedModal()">+ Add Site</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
              ${blocked.map(b => `
                <div style="background: var(--bg-base); padding: 10px 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13.5px; font-weight: 600;">${b.domain}</span>
                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">${b.category}</span>
                  </div>
                  <button style="background: none; border: none; color: var(--accent-rose); cursor: pointer;" onclick="FocusShieldView.removeBlocked(${b.id})">✕</button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Allowed Sites List -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">✓ Permitted Educational Websites</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto;">
              ${allowed.map(a => `
                <div style="background: var(--bg-base); padding: 10px 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13.5px; font-weight: 600; color: var(--accent-cyan);">${a.domain}</span>
                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">${a.category}</span>
                  </div>
                  <span class="badge badge-low">Permitted</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Could not load Focus Shield settings</div>`;
    }
  },

  async setMode(mode) {
    try {
      const res = await api.post('/focus/mode', { mode, planned_mins: 45 });
      showToast(res.message, 'success');
      this.loadFocusData();
    } catch (e) {}
  },

  async updateYt(shortsRestricted, dailyLimit) {
    try {
      await api.put('/focus/youtube-settings', {
        youtube_study_mode: true,
        shorts_restricted: shortsRestricted,
        daily_youtube_limit_mins: dailyLimit
      });
      showToast('YouTube Study Mode settings saved', 'success');
    } catch (e) {}
  },

  addBlockedModal() {
    const domain = prompt('Enter domain to block during Deep Study (e.g. netflix.com, discord.com):');
    if (!domain) return;

    api.post('/focus/blocked-sites', { domain, category: 'Entertainment' }).then(res => {
      showToast(res.message, 'success');
      this.loadFocusData();
    });
  },

  async removeBlocked(id) {
    await api.delete(`/focus/blocked-sites/${id}`);
    showToast('Site unblocked', 'info');
    this.loadFocusData();
  }
};
