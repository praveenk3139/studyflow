// Strict Study Planner View
const PlannerView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 22px; font-weight: 800;">📅 Strict Study Planner</h2>
            <span class="badge badge-high">● STRICT ENFORCEMENT ON</span>
          </div>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Enforces planned study schedules, tracks interruptions, queues missed tasks for recovery, and respects meal & sleep boundaries.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" onclick="PlannerView.emergencyBreak()">
            ☕ Emergency Break (10m)
          </button>
          <button class="btn btn-primary" onclick="PlannerView.addTaskModal()">
            + Add Study Task
          </button>
        </div>
      </div>

      <!-- Schedule Content Container -->
      <div id="planner-schedule-content">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Loading study schedule...</div>
      </div>
    `;

    this.loadPlanner();
  },

  async loadPlanner() {
    const container = document.getElementById('planner-schedule-content');

    try {
      const data = await api.get('/planner');
      const active = data.active_task;
      const tasks = data.tasks;
      const recovery = data.recovery_queue;
      const stats = data.stats;

      container.innerHTML = `
        <!-- Prominent Strict Task Card (Per Section 10) -->
        ${active ? `
          <div class="card strict-task-card" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="badge badge-high">CURRENT ACTIVE STUDY TASK</span>
                  <span style="font-size: 12px; color: var(--text-muted);">${active.subject_name || 'Subject'}</span>
                </div>
                <h3 style="font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">
                  ${active.topic}
                </h3>
                <p style="font-size: 14px; color: var(--text-secondary); max-width: 600px;">
                  🎯 <strong>Session Goal:</strong> ${active.goal || 'Focus on theory proofs and practice problems without tab switching.'}
                </p>
                <div style="font-size: 12px; color: var(--accent-cyan); margin-top: 8px;">
                  ⚡ Stay focused until this task is complete. All distractions are filtered by Focus Shield.
                </div>
              </div>

              <div style="text-align: right;">
                <div class="countdown-box">
                  <div class="countdown-segment">
                    <div class="countdown-value">34</div>
                    <div class="countdown-label">Minutes Left</div>
                  </div>
                  <div class="countdown-segment">
                    <div class="countdown-value">00</div>
                    <div class="countdown-label">Seconds</div>
                  </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
                  <button class="btn btn-emerald" onclick="PlannerView.completeTask(${active.id})">
                    ✓ Complete Task
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="PlannerView.postponeTask(${active.id})">
                    Intentional Skip / Postpone
                  </button>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <div class="card" style="margin-bottom: 24px; text-align: center; padding: 28px;">
            <div style="font-size: 28px; margin-bottom: 8px;">🎉</div>
            <h3 style="font-size: 16px; font-weight: 700;">All planned tasks for this session are complete!</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Add a new study sprint or enjoy a well-deserved mind break.</p>
          </div>
        `}

        <!-- Recovery Queue Card (Per Section 10: Never silently remove missed tasks) -->
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--accent-amber);">
          <div class="card-header">
            <div>
              <div class="card-title" style="color: #fbbf24;">
                <span>🔄</span> Missed Tasks Recovery Queue
              </div>
              <div class="card-subtitle">
                Missed or postponed tasks are queued here and protected from being forgotten.
              </div>
            </div>
            <span class="badge badge-medium">${recovery.length} Queued</span>
          </div>

          ${recovery.length === 0 ? `
            <div style="font-size: 13px; color: var(--text-muted); padding: 10px 0;">
              ✨ Excellent! Zero missed tasks in your recovery queue.
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${recovery.map(task => `
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <div>
                    <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${task.topic}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                      ${task.subject_name || 'Subject'} • ${task.duration_mins} Mins • Originally missed
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="PlannerView.reinstateTask(${task.id})">
                    Re-schedule into Plan 🔁
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Today's Chronological Schedule -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📋</span> Planned Study Schedule
            </div>
            <span style="font-size: 13px; color: var(--text-muted);">
              Completion: <strong>${stats.completion_pct}%</strong> (${stats.completed}/${stats.total} Tasks)
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${tasks.map((t, idx) => `
              <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border-left: 4px solid ${t.status === 'completed' ? 'var(--accent-emerald)' : (t.status === 'in_progress' ? 'var(--accent-cyan)' : 'var(--border-subtle)')}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">${t.topic}</span>
                    <span class="badge ${t.status === 'completed' ? 'badge-low' : (t.status === 'in_progress' ? 'badge-high' : 'badge-medium')}">
                      ${t.status.toUpperCase()}
                    </span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted);">
                    ${t.subject_name || 'Subject'} • ⏰ ${new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(t.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${t.duration_mins} mins)
                  </div>
                </div>

                <div style="display: flex; gap: 8px;">
                  ${t.status === 'pending' ? `
                    <button class="btn btn-secondary btn-sm" onclick="PlannerView.startTask(${t.id})">Start Sprint</button>
                  ` : ''}
                  ${t.status === 'in_progress' ? `
                    <button class="btn btn-emerald btn-sm" onclick="PlannerView.completeTask(${t.id})">✓ Mark Done</button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Could not load study schedule</div>`;
    }
  },

  async startTask(taskId) {
    try {
      const res = await api.post(`/planner/task/${taskId}/start`);
      showToast(res.message, 'info');
      this.loadPlanner();
    } catch (e) {}
  },

  async completeTask(taskId) {
    try {
      const res = await api.post(`/planner/task/${taskId}/complete`);
      showToast(res.message, 'success');
      playAudioChime('task_complete');
      this.loadPlanner();
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
    const reason = prompt('Strict Study Plan Notice:\nSkipping active task requires confirmation.\nReason for postponing:');
    if (!reason) return;

    try {
      const res = await api.post(`/planner/task/${taskId}/postpone`, { reason });
      showToast(res.message, 'warning');
      this.loadPlanner();
    } catch (e) {}
  },

  async reinstateTask(taskId) {
    try {
      const res = await api.post('/planner/recovery/reorganize', { task_id: taskId });
      showToast(res.message, 'success');
      this.loadPlanner();
    } catch (e) {}
  },

  addTaskModal() {
    const topic = prompt('Enter Study Topic (e.g. Red-Black Tree Balancing):');
    if (!topic) return;

    const start = new Date(Date.now() + 10 * 60000).toISOString();

    api.post('/planner/task', {
      subject_id: 1,
      topic,
      start_time: start,
      duration_mins: 45,
      priority: 'high',
      goal: 'Complete reading and solve 2 derivation problems.'
    }).then(res => {
      if (res.health_warnings && res.health_warnings.length > 0) {
        showToast(`⚠️ Health Collision Warning: ${res.health_warnings[0].title}`, 'warning', 5000);
      } else {
        showToast('Study task scheduled successfully', 'success');
      }
      this.loadPlanner();
    });
  }
};
