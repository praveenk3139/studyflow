// Analytics Dashboard View
const AnalyticsView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 22px; font-weight: 800;">📊 Academic, Focus & Wellness Analytics</h2>
        <p style="color: var(--text-secondary); font-size: 13px;">
          Empirical telemetry synthesized across study hours, exam accuracy, cognitive focus sessions, and biological wellness.
        </p>
      </div>

      <div id="analytics-content-area">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Aggregating telemetry...</div>
      </div>
    `;

    this.loadAnalytics();
  },

  async loadAnalytics() {
    const container = document.getElementById('analytics-content-area');

    try {
      const data = await api.get('/analytics');
      const acad = data.academic;
      const focus = data.focus;
      const well = data.wellness;
      const coach = data.ai_coach;

      container.innerHTML = `
        <!-- High-Level Metric Tiles -->
        <div class="grid-4" style="margin-bottom: 24px;">
          <div class="card" style="border-top: 3px solid var(--accent-cyan);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Completed Study Tasks</div>
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-cyan); margin: 4px 0;">${acad.completed_tasks}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${acad.total_study_hours} Hours logged</div>
          </div>

          <div class="card" style="border-top: 3px solid var(--accent-purple);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Test Diagnostic Accuracy</div>
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-purple); margin: 4px 0;">${acad.avg_test_accuracy}%</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${acad.tests_taken} Tests completed</div>
          </div>

          <div class="card" style="border-top: 3px solid var(--accent-emerald);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Deep Focus Streak</div>
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-emerald); margin: 4px 0;">${focus.focus_streak_days} Days</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${focus.total_focus_hours}h Focus Shield time</div>
          </div>

          <div class="card" style="border-top: 3px solid var(--accent-amber);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Distraction Defense</div>
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-amber); margin: 4px 0;">${focus.distraction_attempts} Blocked</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Social media urges deflected</div>
          </div>
        </div>

        <!-- Academic & Focus Visual Distribution Charts -->
        <div class="grid-2" style="margin-bottom: 24px;">
          <!-- Subject-Wise Study Hours Distribution -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">📚 Subject-Wise Time Allocation</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${acad.subject_breakdown.map(s => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 4px;">
                    <span style="font-weight: 600;">${s.name}</span>
                    <strong style="color: ${s.color};">${s.study_hours} Hours</strong>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar" style="background: ${s.color}; width: ${Math.min(100, s.study_hours * 25)}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Wellness & Sleep Telemetry -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">💤 Sleep & Biological Rest Trends</div>
              <span class="badge badge-demo">Synced Telemetry</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${well.history.map(h => `
                <div style="background: var(--bg-base); padding: 12px 16px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="font-size: 13.5px; color: var(--text-primary);">${h.log_date}</strong>
                    <div style="font-size: 11.5px; color: var(--text-muted);">${h.steps.toLocaleString()} Steps • ${h.avg_heart_rate} bpm</div>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 16px; font-weight: 800; color: var(--accent-purple);">${h.sleep_hours}h</span>
                    <div style="font-size: 11px; color: var(--accent-emerald);">Restorative</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- AI Study Coach Synthetic Advisory -->
        <div class="card" style="border-top: 3px solid var(--accent-cyan);">
          <div class="card-header">
            <div class="card-title">🧠 AI Personal Study Coach Insights</div>
            <span class="badge badge-low">Generated from Actual Academic Logs</span>
          </div>

          <div class="grid-3">
            ${coach.map(c => `
              <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-cyan);">
                <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px;">
                  ${c.badge}
                </div>
                <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                  ${c.text}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Could not load analytics</div>`;
    }
  }
};
