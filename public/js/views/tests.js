// Test Module View
const TestsView = {
  activeTest: null,
  questions: [],
  currentQIndex: 0,
  userAnswers: {},
  markedForReview: new Set(),
  timerInterval: null,
  secondsLeft: 0,
  timeSpentSecs: 0,

  async render() {
    // If currently taking a test, do not overwrite with test catalog
    if (this.activeTest) {
      this.renderTakingTest();
      return;
    }

    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">🧪 Examination & Diagnostic Test Center</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Practice MCQs, True/False, fill-in-the-blanks, and descriptive questions with live timers and AI diagnostics.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="TestsView.generateAiTestModal()">
            🤖 Generate AI Diagnostic Sprint
          </button>
        </div>
      </div>

      <!-- Test Catalog Grid -->
      <div id="tests-catalog-list" class="grid-2" style="margin-bottom: 30px;">
        <div style="text-align: center; padding: 40px;"><div class="pulse-indicator"></div> Loading test catalogue...</div>
      </div>

      <!-- Performance History -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📈 Test Performance Diagnostic History</div>
        </div>
        <div id="tests-history-table">
          <div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading past attempts...</div>
        </div>
      </div>
    `;

    this.loadCatalog();
  },

  async loadCatalog() {
    const listEl = document.getElementById('tests-catalog-list');
    const histEl = document.getElementById('tests-history-table');

    try {
      const [testsRes, historyRes] = await Promise.all([
        api.get('/tests'),
        api.get('/tests/history/summary')
      ]);

      if (testsRes.tests.length === 0) {
        listEl.innerHTML = `<div class="card" style="padding: 30px; text-align: center;">No tests currently available. Click "Generate AI Diagnostic" above!</div>`;
      } else {
        listEl.innerHTML = testsRes.tests.map(t => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span class="badge badge-low">${t.subject_name || 'Data Structures'}</span>
                <span style="font-size: 12px; color: var(--text-muted);">⏱️ ${t.duration_mins} Mins</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">
                ${t.title}
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 14px;">
                Total Marks: <strong>${t.total_marks}</strong> • Pass: ${t.pass_marks} • Questions: ${t.questions_count || 4}
              </p>
              ${t.last_score !== null && t.last_score !== undefined ? `
                <div style="background: var(--bg-base); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; margin-bottom: 14px;">
                  Last Attempt: <strong style="color: var(--accent-emerald);">${t.last_score}/${t.total_marks} (${t.last_accuracy}%)</strong>
                </div>
              ` : ''}
            </div>

            <button class="btn btn-primary" style="width: 100%;" onclick="TestsView.startTest(${t.id})">
              Start Exam Sprint ⏱️
            </button>
          </div>
        `).join('');
      }

      // History Table
      if (historyRes.history.length === 0) {
        histEl.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">No completed test attempts yet.</div>`;
      } else {
        histEl.innerHTML = `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); text-align: left;">
                  <th style="padding: 10px;">Test Title</th>
                  <th style="padding: 10px;">Score</th>
                  <th style="padding: 10px;">Accuracy</th>
                  <th style="padding: 10px;">Weak Topics Identified</th>
                  <th style="padding: 10px;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${historyRes.history.map(h => `
                  <tr style="border-bottom: 1px solid var(--border-subtle);">
                    <td style="padding: 12px 10px; font-weight: 600;">${h.test_title}</td>
                    <td style="padding: 12px 10px; font-weight: 700; color: var(--accent-cyan);">${h.score} / ${h.total_marks}</td>
                    <td style="padding: 12px 10px;">
                      <span class="badge ${h.accuracy_pct >= 75 ? 'badge-low' : 'badge-high'}">
                        ${h.accuracy_pct}%
                      </span>
                    </td>
                    <td style="padding: 12px 10px; font-size: 12px; color: var(--accent-amber);">
                      ${JSON.parse(h.weak_topics_json || '[]').join(', ') || 'None identified'}
                    </td>
                    <td style="padding: 12px 10px; font-size: 12px; color: var(--text-muted);">
                      ${new Date(h.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (e) {
      listEl.innerHTML = `<div style="color: var(--accent-rose);">Failed to load tests catalogue</div>`;
    }
  },

  async startTest(testId) {
    try {
      const res = await api.get(`/tests/${testId}`);
      this.activeTest = res.test;
      this.questions = res.questions;
      this.currentQIndex = 0;
      this.userAnswers = {};
      this.markedForReview.clear();
      this.secondsLeft = res.test.duration_mins * 60;
      this.timeSpentSecs = 0;

      // Start countdown timer
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        this.secondsLeft--;
        this.timeSpentSecs++;
        const timerEl = document.getElementById('test-live-timer');
        if (timerEl) {
          const m = Math.floor(this.secondsLeft / 60);
          const s = this.secondsLeft % 60;
          timerEl.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        if (this.secondsLeft <= 0) {
          clearInterval(this.timerInterval);
          this.submitTest(true);
        }
      }, 1000);

      this.renderTakingTest();
    } catch (e) {
      showToast('Could not initiate test session', 'error');
    }
  },

  renderTakingTest() {
    const container = document.getElementById('view-content');
    const q = this.questions[this.currentQIndex];
    const totalQ = this.questions.length;

    const mins = Math.floor(this.secondsLeft / 60);
    const secs = this.secondsLeft % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    container.innerHTML = `
      <!-- Top Exam Bar -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 76px; z-index: 80;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700;">${this.activeTest.title}</h3>
          <span style="font-size: 12px; color: var(--text-muted);">Question ${this.currentQIndex + 1} of ${totalQ} • ${q.marks} Marks</span>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="background: var(--bg-base); padding: 8px 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 18px; font-weight: 800; color: var(--accent-amber); border: 1px solid rgba(245, 158, 11, 0.3);">
            ⏱️ <span id="test-live-timer">${timeFormatted}</span>
          </div>
          <button class="btn btn-emerald" onclick="TestsView.confirmSubmit()">
            Submit Exam ✓
          </button>
        </div>
      </div>

      <!-- Question Workspace & Palette Grid -->
      <div class="grid-dashboard" style="grid-template-columns: 1fr 280px;">
        <!-- Question Presentation Box -->
        <div class="card" style="padding: 28px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 14px;">
            <span class="badge badge-low">Unit ${q.unit_number || 1}</span>
            <button class="btn btn-secondary btn-sm" onclick="TestsView.toggleReview(${q.id})">
              ${this.markedForReview.has(q.id) ? '🚩 Marked for Review' : '🏳️ Mark for Review'}
            </button>
          </div>

          <h3 style="font-size: 17px; font-weight: 700; line-height: 1.6; color: var(--text-primary); margin-bottom: 20px;">
            ${q.question_text}
          </h3>

          <!-- Question Input Types (MCQ, True/False, Fill, Short, Descriptive) -->
          <div id="test-question-input" style="margin-bottom: 30px;">
            ${this.renderQuestionInput(q)}
          </div>

          <!-- Bottom Navigation Controls -->
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 20px;">
            <button class="btn btn-secondary" onclick="TestsView.prevQuestion()" ${this.currentQIndex === 0 ? 'disabled' : ''}>
              ← Previous Question
            </button>
            <button class="btn btn-primary" onclick="TestsView.nextQuestion()" ${this.currentQIndex === totalQ - 1 ? 'disabled' : ''}>
              Next Question →
            </button>
          </div>
        </div>

        <!-- Question Palette Sidebar -->
        <div class="card" style="padding: 20px;">
          <div class="card-title" style="font-size: 14px; margin-bottom: 14px;">
            🧭 Question Palette
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
            ${this.questions.map((item, idx) => {
              const isAnswered = this.userAnswers[item.id] !== undefined && this.userAnswers[item.id] !== '';
              const isMarked = this.markedForReview.has(item.id);
              const isCurrent = idx === this.currentQIndex;

              let bg = 'var(--bg-base)';
              let border = 'var(--border-subtle)';
              if (isCurrent) border = 'var(--accent-cyan)';
              if (isAnswered) bg = 'rgba(16, 185, 129, 0.25)';
              if (isMarked) bg = 'rgba(245, 158, 11, 0.25)';

              return `
                <button style="height: 40px; border-radius: var(--radius-sm); border: 2px solid ${border}; background: ${bg}; color: var(--text-primary); font-weight: 700; font-size: 13px; cursor: pointer;" onclick="TestsView.jumpToQuestion(${idx})">
                  ${idx + 1}
                </button>
              `;
            }).join('')}
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: var(--text-muted);">
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: rgba(16, 185, 129, 0.5); border-radius: 2px;"></span> Answered</div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: rgba(245, 158, 11, 0.5); border-radius: 2px;"></span> Marked for Review</div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: var(--bg-base); border-radius: 2px;"></span> Unanswered</div>
          </div>
        </div>
      </div>
    `;
  },

  renderQuestionInput(q) {
    const currentAnswer = this.userAnswers[q.id] || '';

    if (q.question_type === 'mcq' || q.question_type === 'tf') {
      const options = q.options || ['True', 'False'];
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${options.map(opt => `
            <label style="display: flex; align-items: center; gap: 12px; background: var(--bg-base); padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid ${currentAnswer === opt ? 'var(--accent-cyan)' : 'var(--border-subtle)'}; cursor: pointer;">
              <input type="radio" name="q_${q.id}" value="${opt}" ${currentAnswer === opt ? 'checked' : ''} onchange="TestsView.saveAnswer(${q.id}, '${opt.replace(/'/g, "\\'")}')" />
              <span style="font-size: 14px; font-weight: 500;">${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    }

    if (q.question_type === 'fill') {
      return `
        <div>
          <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Type single exact term or complexity:</label>
          <input type="text" class="input" value="${currentAnswer}" placeholder="e.g. O(log N)" oninput="TestsView.saveAnswer(${q.id}, this.value)" />
        </div>
      `;
    }

    // Short or Descriptive
    return `
      <div>
        <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">Explain with key technical concepts & proof steps (AI evaluation enabled):</label>
        <textarea class="textarea" rows="5" placeholder="Write comprehensive response..." oninput="TestsView.saveAnswer(${q.id}, this.value)">${currentAnswer}</textarea>
      </div>
    `;
  },

  saveAnswer(qId, val) {
    this.userAnswers[qId] = val;
  },

  toggleReview(qId) {
    if (this.markedForReview.has(qId)) this.markedForReview.delete(qId);
    else this.markedForReview.add(qId);
    this.renderTakingTest();
  },

  nextQuestion() {
    if (this.currentQIndex < this.questions.length - 1) {
      this.currentQIndex++;
      this.renderTakingTest();
    }
  },

  prevQuestion() {
    if (this.currentQIndex > 0) {
      this.currentQIndex--;
      this.renderTakingTest();
    }
  },

  jumpToQuestion(idx) {
    this.currentQIndex = idx;
    this.renderTakingTest();
  },

  confirmSubmit() {
    const answeredCount = Object.values(this.userAnswers).filter(a => a !== '').length;
    const unanswered = this.questions.length - answeredCount;

    if (!confirm(`Submit Exam?\n\nAnswered: ${answeredCount}\nUnanswered: ${unanswered}\n\nDo you want to finalize and evaluate now?`)) {
      return;
    }
    this.submitTest(false);
  },

  async submitTest(autoTimedOut = false) {
    clearInterval(this.timerInterval);
    showToast(autoTimedOut ? 'Time expired! Auto-evaluating responses...' : 'Submitting and scoring with AI diagnostic engine...', 'info');

    try {
      const res = await api.post(`/tests/${this.activeTest.id}/submit`, {
        answers: this.userAnswers,
        time_spent_secs: this.timeSpentSecs
      });

      this.activeTest = null;
      this.showDiagnosticReport(res);
    } catch (e) {
      showToast('Error during evaluation: ' + e.message, 'error');
    }
  },

  showDiagnosticReport(report) {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div class="card" style="max-width: 860px; margin: 0 auto; padding: 32px; border-top: 4px solid var(--accent-emerald);">
        <!-- Header Banner -->
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
          <h2 style="font-size: 24px; font-weight: 800;">Diagnostic Evaluation Complete</h2>
          <p style="color: var(--text-secondary); font-size: 14px;">
            Detailed breakdown: Score → Accuracy → Weak Topics → Recommended Revision
          </p>
        </div>

        <!-- 4 Key Metrics Bar -->
        <div class="grid-4" style="margin-bottom: 28px;">
          <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-cyan);">${report.score} / ${report.total_marks}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Score Earned</div>
          </div>

          <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: ${report.accuracy >= 75 ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${report.accuracy}%</div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Accuracy</div>
          </div>

          <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-purple);">${Math.floor(report.time_spent_secs / 60)}m ${report.time_spent_secs % 60}s</div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Time Spent</div>
          </div>

          <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 26px; font-weight: 800; color: var(--accent-amber);">+${report.xp_earned} XP</div>
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted);">Study XP Gained</div>
          </div>
        </div>

        <!-- Weak Topics Identified -->
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px;">
          <h4 style="font-size: 15px; font-weight: 700; color: #fbbf24; margin-bottom: 6px;">
            🎯 Weak Topics Identified for Revision
          </h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${report.weak_topics.length > 0 ? report.weak_topics.map(t => `<span class="badge badge-medium">${t}</span>`).join('') : '<span style="font-size: 13px; color: var(--text-secondary);">Flawless diagnostic! No weak areas flagged.</span>'}
          </div>
        </div>

        <!-- AI Revision Recommendations -->
        <div style="background: var(--bg-base); padding: 18px; border-radius: var(--radius-md); margin-bottom: 28px;">
          <h4 style="font-size: 15px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px;">
            🧠 AI Personal Coach Revision Recommendations
          </h4>
          <ul style="padding-left: 20px; font-size: 13.5px; line-height: 1.7; color: var(--text-secondary);">
            ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <!-- Individual Question Feedback Review -->
        <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 14px;">Question-by-Question Diagnostic Feedback</h4>
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px;">
          ${report.evaluated_answers.map((ans, idx) => `
            <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); border-left: 4px solid ${ans.is_correct ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 600; font-size: 14px;">Q${idx + 1}. ${ans.question_text}</span>
                <strong style="color: ${ans.is_correct ? '#10b981' : '#f43f5e'}; font-size: 13px;">${ans.marks_awarded} / ${ans.max_marks} M</strong>
              </div>
              <div style="font-size: 13px; color: var(--text-secondary);">
                Your response: <em>${ans.student_answer || '(No answer provided)'}</em>
              </div>
              <div style="font-size: 12.5px; color: var(--accent-cyan); margin-top: 4px;">
                ${ans.ai_feedback}
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align: center;">
          <button class="btn btn-primary" onclick="TestsView.render()">
            Return to Exam Center
          </button>
        </div>
      </div>
    `;
  },

  generateAiTestModal() {
    const topic = prompt('Enter subject / topic for AI Diagnostic Test (e.g. Graph Algorithms Dijkstra):', 'Graph Algorithms');
    if (!topic) return;

    showToast('AI is generating a targeted diagnostic test with MCQs, True/False, and Fill-in-the-blanks...', 'info');

    api.post('/tests/generate-ai', {
      subject_id: 1,
      topic,
      question_count: 5
    }).then(res => {
      showToast(res.message, 'success');
      this.loadCatalog();
    });
  }
};
