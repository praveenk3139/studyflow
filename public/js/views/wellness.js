// Health & Wellness View
const WellnessView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 22px; font-weight: 800;">❤️ Health & Wellness Hub</h2>
            <span class="badge badge-demo" id="wellness-demo-badge">DEMO DATA</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Harmonizes study velocity with biological health. Tracks hydration, protects meal schedules, and integrates with compatible wearables.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="WellnessView.toggleDemoMode()">
            🔄 Toggle DEMO vs LIVE DATA
          </button>
          <button class="btn btn-primary" onclick="WellnessView.manualLogModal()">
            📝 Log Health Metrics
          </button>
        </div>
      </div>

      <div id="wellness-content-area">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Syncing wellness streams...</div>
      </div>
    `;

    this.loadWellness();
  },

  async loadWellness() {
    const container = document.getElementById('wellness-content-area');

    try {
      const [summary, mealsRes, wearablesRes, hydrationHist] = await Promise.all([
        api.get('/wellness/summary'),
        api.get('/wellness/meals'),
        api.get('/wellness/wearables'),
        api.get('/wellness/hydration/history')
      ]);

      const badge = document.getElementById('wellness-demo-badge');
      if (badge) {
        badge.innerText = summary.wearable.is_demo ? 'DEMO DATA ACTIVE' : 'LIVE DEVICE SYNC';
        badge.className = summary.wearable.is_demo ? 'badge badge-demo' : 'badge badge-low';
      }

      container.innerHTML = `
        <!-- Hydration Tracker (Section 16) -->
        <div class="card" style="margin-bottom: 24px; border-top: 3px solid var(--accent-cyan);">
          <div class="card-header">
            <div>
              <div class="card-title" style="color: var(--accent-cyan);">
                <span>💧</span> Daily Hydration Tracker
              </div>
              <div class="card-subtitle">
                Target: ${summary.hydration.goal_ml}ml (${summary.hydration.glasses_goal} Glasses) • Recommended based on 4.5h cognitive load
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="WellnessView.addWater(250)">+250ml Glass 💧</button>
              <button class="btn btn-secondary btn-sm" onclick="WellnessView.addWater(500)">+500ml Bottle 🍶</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: center;">
            <div style="background: var(--bg-base); padding: 20px; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 34px; font-weight: 800; color: var(--accent-cyan);">
                ${summary.hydration.glasses_count} / ${summary.hydration.glasses_goal}
              </div>
              <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">
                Glasses Logged Today
              </div>
              <div style="font-size: 14px; font-weight: 600; margin-top: 6px; color: var(--text-secondary);">
                ${summary.hydration.current_ml} ml Total
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                <span>Daily Hydration Goal Progress</span>
                <strong style="color: var(--accent-cyan);">${summary.hydration.percentage}%</strong>
              </div>
              <div class="progress-container" style="height: 14px;">
                <div class="progress-bar progress-cyan" style="width: ${summary.hydration.percentage}%;"></div>
              </div>

              <!-- Weekly Mini Bar History -->
              <div style="display: flex; justify-content: space-between; margin-top: 14px; font-size: 11px; color: var(--text-muted);">
                ${hydrationHist.history.map(h => `
                  <div style="text-align: center;">
                    <div style="height: 36px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 4px;">
                      <div style="width: 14px; height: ${Math.min(36, (h.total_ml / 2500) * 36)}px; background: var(--accent-cyan); border-radius: 2px;"></div>
                    </div>
                    <span>${h.log_date.slice(5)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Meal Schedule (Section 17: Protection from skipping meals) -->
        <div class="card" style="margin-bottom: 24px; border-top: 3px solid var(--accent-amber);">
          <div class="card-header">
            <div>
              <div class="card-title" style="color: var(--accent-amber);">
                <span>🍽️</span> Meal Schedule & Academic Protection
              </div>
              <div class="card-subtitle">
                The study planner strictly prohibits scheduling tasks that override meal hours.
              </div>
            </div>
          </div>

          <div class="grid-4">
            ${mealsRes.meals.map(m => `
              <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-amber);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 14px; color: var(--text-primary);">${m.meal_type}</strong>
                  <span class="badge badge-low">${m.scheduled_time}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                  Protected Window: ${m.duration_mins} Minutes
                </div>
                <button class="btn btn-secondary btn-sm" style="width: 100%; font-size: 11px;" onclick="WellnessView.editMeal(${m.id}, '${m.meal_type}', '${m.scheduled_time}')">
                  Adjust Window ⏰
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Wearable Integration Layer (Section 15 & 36) -->
        <div class="card" style="border-top: 3px solid var(--accent-purple);">
          <div class="card-header">
            <div>
              <div class="card-title" style="color: var(--accent-purple);">
                <span>⌚</span> Compatible Smartwatch & Health Sensor Matrix
              </div>
              <div class="card-subtitle">
                Connect compatible platform APIs (HealthKit, Health Connect, Fitbit, Garmin, Samsung). Data is private by default.
              </div>
            </div>
          </div>

          <!-- Notice regarding Live vs Simulated Data -->
          <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: var(--radius-md); padding: 14px; margin-bottom: 20px; font-size: 12.5px; color: var(--text-secondary); line-height: 1.5;">
            <strong>Wearable Transparency:</strong> If a physical smartwatch API is unavailable, the platform operates in clearly labeled <strong>DEMO DATA</strong> mode. Live synchronization occurs only upon explicit permission grant.
          </div>

          <div class="grid-3">
            ${wearablesRes.providers.map(prov => `
              <div style="background: var(--bg-base); padding: 18px; border-radius: var(--radius-md); border: 1px solid ${prov.connected ? 'var(--accent-purple)' : 'var(--border-subtle)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">${prov.icon}</span>
                    <div>
                      <strong style="font-size: 13.5px; color: var(--text-primary);">${prov.name}</strong>
                      <div style="font-size: 11px; color: var(--text-muted);">
                        ${prov.supportedMetrics.join(' • ')}
                      </div>
                    </div>
                  </div>
                  <span class="badge ${prov.connected ? 'badge-low' : 'badge-medium'}">
                    ${prov.connected ? '🟢 Connected' : '⚪ Not Connected'}
                  </span>
                </div>

                ${prov.connected ? `
                  <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 12px;">
                    Device: <strong>${prov.device_name}</strong><br/>
                    Status: Synced ${prov.is_demo ? '(DEMO DATA)' : '(Live)'}
                  </div>
                  <button class="btn btn-danger btn-sm" style="width: 100%;" onclick="WellnessView.disconnectWatch('${prov.id}')">
                    Disconnect Device
                  </button>
                ` : `
                  <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px;">
                    Awaiting authorization token.
                  </div>
                  <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="WellnessView.connectWatch('${prov.id}')">
                    Pair Platform 🔗
                  </button>
                `}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Could not load wellness hub</div>`;
    }
  },

  async addWater(ml) {
    try {
      const res = await api.post('/wellness/hydration', { amount_ml: ml });
      showToast(res.message, 'success');
      playAudioChime('water');
      this.loadWellness();
    } catch (e) {}
  },

  async toggleDemoMode() {
    try {
      const isCurrentlyDemo = document.getElementById('wellness-demo-badge').innerText.includes('DEMO');
      const res = await api.post('/wellness/wearables/toggle-demo', { enable_demo: !isCurrentlyDemo });
      showToast(res.message, 'info');
      this.loadWellness();
    } catch (e) {}
  },

  async connectWatch(providerId) {
    const isDemo = confirm(`Connect wearable platform?\n\nClick OK to simulate with labeled DEMO DATA, or Cancel to abort.`);
    if (!isDemo) return;

    try {
      const res = await api.post('/wellness/wearables/connect', {
        provider_id: providerId,
        device_name: `${providerId.toUpperCase()} Sensor Sync`,
        is_demo: true
      });
      showToast(res.message, 'success');
      this.loadWellness();
    } catch (e) {}
  },

  async disconnectWatch(providerId) {
    if (!confirm('Disconnect this wearable platform and stop metric streaming?')) return;
    try {
      const res = await api.post('/wellness/wearables/disconnect', { provider_id: providerId });
      showToast(res.message, 'info');
      this.loadWellness();
    } catch (e) {}
  },

  async editMeal(id, mealName, current) {
    const newTime = prompt(`Set scheduled time for ${mealName} (24h format HH:MM):`, current);
    if (!newTime) return;

    try {
      await api.put(`/wellness/meals/${id}`, { scheduled_time: newTime });
      showToast(`${mealName} schedule updated`, 'success');
      this.loadWellness();
    } catch (e) {}
  },

  manualLogModal() {
    const steps = prompt('Enter today’s step count (e.g. 6200):', '6200');
    if (!steps) return;
    const sleep = prompt('Enter hours of sleep last night (e.g. 7.5):', '7.5');
    if (!sleep) return;

    api.post('/wellness/logs', {
      steps: parseInt(steps),
      sleep_hours: parseFloat(sleep)
    }).then(res => {
      showToast(res.message, 'success');
      this.loadWellness();
    });
  }
};
