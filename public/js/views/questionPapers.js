// Question Paper Analyzer View
const QuestionPapersView = {
  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">📝 Question Paper Analyzer (PYQ)</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Historical pattern discovery across university past exams. Identifies high-priority recurrence topics.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="QuestionPapersView.uploadPaperModal()">
            📤 Upload PYQ Exam Paper
          </button>
        </div>
      </div>

      <div id="qp-dashboard-content">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Loading PYQ analysis...</div>
      </div>
    `;

    this.loadAnalysis();
  },

  async loadAnalysis() {
    const container = document.getElementById('qp-dashboard-content');
    try {
      const [analysisRes, papersRes] = await Promise.all([
        api.get('/question-papers/analysis'),
        api.get('/question-papers')
      ]);

      const p = analysisRes.priorities;
      const dist = analysisRes.distributions;

      container.innerHTML = `
        <!-- High-Level Metric Tiles -->
        <div class="grid-4" style="margin-bottom: 24px;">
          <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-rose);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">High Priority Topics</div>
            <div style="font-size: 24px; font-weight: 800; color: #fb7185; margin: 4px 0;">${analysisRes.summary.high_priority_count} Topics</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Repeated 4+ times historically</div>
          </div>

          <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-amber);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Medium Priority</div>
            <div style="font-size: 24px; font-weight: 800; color: #fbbf24; margin: 4px 0;">${analysisRes.summary.medium_priority_count} Topics</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Moderate recurrence (3 times)</div>
          </div>

          <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-cyan);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Low Priority / Definitions</div>
            <div style="font-size: 24px; font-weight: 800; color: #38bdf8; margin: 4px 0;">${analysisRes.summary.low_priority_count} Topics</div>
            <div style="font-size: 12px; color: var(--text-secondary);">1-2 historical appearances</div>
          </div>

          <div class="card" style="padding: 16px; border-left: 4px solid var(--accent-purple);">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Analyzed Papers</div>
            <div style="font-size: 24px; font-weight: 800; color: #c084fc; margin: 4px 0;">${papersRes.papers.length} Papers</div>
            <div style="font-size: 12px; color: var(--text-secondary);">Winter & Summer End-Semesters</div>
          </div>
        </div>

        <!-- Academic Disclaimer Alert (Per Section 7) -->
        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: var(--radius-md); padding: 12px 18px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">ℹ️</span>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
            <strong>Important Revision Notice:</strong> Analyses represent <em>“High historical importance”</em> and <em>“High-priority revision topics”</em> calculated from past university exam recurrence. Topics are not guaranteed to appear; comprehensive syllabus coverage is strongly advised.
          </p>
        </div>

        <!-- Unit & Marks Visual Breakdown Charts -->
        <div class="grid-2" style="margin-bottom: 24px;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">📊 Unit-Wise Question Distribution</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${Object.entries(dist.units).map(([unit, count]) => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                    <span>Unit ${unit}</span>
                    <strong style="color: var(--accent-cyan);">${count} Questions</strong>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar progress-cyan" style="width: ${Math.min(100, count * 22)}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">🎯 Marks Distribution Matrix</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${Object.entries(dist.marks).map(([mark, count]) => `
                <div>
                  <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                    <span>${mark} Standard Questions</span>
                    <strong style="color: var(--accent-purple);">${count} Questions</strong>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar progress-purple" style="width: ${Math.min(100, count * 25)}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Priority Buckets: HIGH, MEDIUM, LOW -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- HIGH PRIORITY SECTION -->
          <div class="card" style="border-top: 3px solid var(--accent-rose);">
            <div class="card-header">
              <div class="card-title" style="color: #fb7185;">
                <span>🔥</span> HIGH PRIORITY (Repeated Frequently in Previous Years)
              </div>
              <span class="badge badge-high">${p.high.length} Topics</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${p.high.map(q => `
                <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border-left: 3px solid #fb7185;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <span style="font-weight: 700; font-size: 14.5px; color: var(--text-primary); flex: 1;">
                      ${q.question_text}
                    </span>
                    <div style="display: flex; gap: 6px; margin-left: 12px;">
                      <span class="badge badge-high">${q.frequency}x Repeated</span>
                      <span class="badge badge-low">${q.marks} Marks</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); margin-top: 6px;">
                    <span>Subject: ${q.subject_name || 'Data Structures'}</span> •
                    <span>Unit ${q.unit_number}</span> •
                    <span>Type: ${q.pattern_type || 'Analytical'}</span> •
                    <span style="color: #fb7185;">Difficulty: ${q.difficulty || 'Hard'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- MEDIUM PRIORITY SECTION -->
          <div class="card" style="border-top: 3px solid var(--accent-amber);">
            <div class="card-header">
              <div class="card-title" style="color: #fbbf24;">
                <span>⭐</span> MEDIUM PRIORITY (Moderately Recurrent Exam Questions)
              </div>
              <span class="badge badge-medium">${p.medium.length} Topics</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${p.medium.map(q => `
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); border-left: 3px solid #fbbf24;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <span style="font-weight: 600; font-size: 14px; color: var(--text-primary);">
                      ${q.question_text}
                    </span>
                    <div style="display: flex; gap: 6px;">
                      <span class="badge badge-medium">${q.frequency}x</span>
                      <span class="badge badge-low">${q.marks}m</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- LOW PRIORITY SECTION -->
          <div class="card" style="border-top: 3px solid var(--accent-cyan);">
            <div class="card-header">
              <div class="card-title" style="color: #38bdf8;">
                <span>💡</span> LOW PRIORITY (Foundational Definitions & Low Recurrence)
              </div>
              <span class="badge badge-low">${p.low.length} Topics</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${p.low.map(q => `
                <div style="background: var(--bg-base); padding: 14px; border-radius: var(--radius-md); border-left: 3px solid #38bdf8;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <span style="font-weight: 500; font-size: 13.5px; color: var(--text-secondary);">
                      ${q.question_text}
                    </span>
                    <span class="badge badge-low">${q.marks}m</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Failed to load question paper analysis</div>`;
    }
  },

  uploadPaperModal() {
    const year = prompt('Enter exam year (e.g. 2024, 2023):', '2024');
    if (!year) return;
    const term = prompt('Enter examination term (e.g. Winter End-Semester, Spring Mid-Sem):', 'Winter End-Semester');
    if (!term) return;

    api.post('/question-papers/upload', {
      subject_id: 1,
      year: parseInt(year),
      exam_term: term
    }).then(res => {
      showToast(res.message, 'success');
      this.loadAnalysis();
    });
  }
};
