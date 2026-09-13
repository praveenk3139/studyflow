// Important Questions Generator View
const ImportantQuestionsView = {
  activeMarksFilter: null,
  activeUnitFilter: null,

  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">⭐ Important Questions Repository</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Targeted exam questions generated from syllabus weighting, recurrence frequencies, and lecture notes.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" onclick="ImportantQuestionsView.generateModal()">
            ⚡ Generate from Unit Topics
          </button>
        </div>
      </div>

      <!-- Filters Bar: Marks (2m, 5m, 10m, 13m, 16m) & Units -->
      <div class="card" style="padding: 18px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <!-- Marks Categories -->
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-right: 4px;">
              Mark Type:
            </span>
            <button class="btn ${!this.activeMarksFilter ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ImportantQuestionsView.filterMarks(null)">
              All Marks
            </button>
            <button class="btn ${this.activeMarksFilter === 2 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ImportantQuestionsView.filterMarks(2)">
              2 Marks (Short/Invariants)
            </button>
            <button class="btn ${this.activeMarksFilter === 5 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ImportantQuestionsView.filterMarks(5)">
              5 Marks (Conceptual)
            </button>
            <button class="btn ${this.activeMarksFilter === 10 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ImportantQuestionsView.filterMarks(10)">
              10 Marks (Detailed)
            </button>
            <button class="btn ${this.activeMarksFilter === 13 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ImportantQuestionsView.filterMarks(13)">
              13 Marks (Analytical)
            </button>
            <button class="btn ${this.activeMarksFilter === 16 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="ImportantQuestionsView.filterMarks(16)">
              16 Marks (Comprehensive)
            </button>
          </div>

          <!-- Unit Selector -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">
              Unit:
            </span>
            <select class="select" style="width: 140px; padding: 6px 10px; font-size: 12px;" onchange="ImportantQuestionsView.filterUnit(this.value)">
              <option value="">All Units</option>
              <option value="1">Unit 1: Trees & BST</option>
              <option value="2">Unit 2: Graphs & Sched</option>
              <option value="3">Unit 3: Dynamic Prog</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Questions Stream -->
      <div id="important-questions-list" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Loading questions...</div>
      </div>
    `;

    this.loadQuestions();
  },

  async loadQuestions() {
    const listEl = document.getElementById('important-questions-list');
    let url = '/important-questions?';
    if (this.activeMarksFilter) url += `marks=${this.activeMarksFilter}&`;
    if (this.activeUnitFilter) url += `unit=${this.activeUnitFilter}&`;

    try {
      const res = await api.get(url);
      if (res.questions.length === 0) {
        listEl.innerHTML = `
          <div class="card" style="text-align: center; padding: 40px;">
            <h3>No questions found matching current mark or unit filters</h3>
            <p style="color: var(--text-muted); margin-top: 6px;">Try resetting marks or unit criteria.</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = res.questions.map((q, idx) => `
        <div class="card" style="padding: 20px; border-left: 4px solid ${q.marks >= 10 ? 'var(--accent-purple)' : 'var(--accent-cyan)'};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                <span class="badge ${q.priority === 'HIGH PRIORITY' ? 'badge-high' : 'badge-medium'}">
                  ${q.priority}
                </span>
                <span class="badge badge-low">${q.marks} Marks Category</span>
                <span style="font-size: 12px; color: var(--text-muted);">
                  ${q.subject_name || 'Data Structures'} • Unit ${q.unit_number}
                </span>
                <span style="font-size: 12px; color: var(--accent-amber);">
                  ★ ${q.importance_level} (${q.frequency}x Frequency)
                </span>
              </div>

              <h4 style="font-size: 16px; font-weight: 700; color: var(--text-primary); line-height: 1.5; margin-bottom: 10px;">
                ${q.question_text}
              </h4>

              <div style="background: var(--bg-base); padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                <strong style="color: var(--accent-cyan);">💡 Suggested Preparation Steps:</strong> ${q.suggested_prep || 'Review core formulas, balance factors, and practice proof.'}
              </div>

              <!-- Collapsible Sample Model Answer -->
              <details style="cursor: pointer;">
                <summary style="font-size: 13px; font-weight: 600; color: var(--accent-purple); user-select: none;">
                  View Structured University Model Answer
                </summary>
                <div style="margin-top: 10px; background: rgba(0, 0, 0, 0.3); padding: 14px; border-radius: var(--radius-md); font-size: 13.5px; line-height: 1.7; color: var(--text-primary); white-space: pre-line;">
                  ${q.sample_answer || 'Complete analytical solution detailing standard working and complexity proofs.'}
                </div>
              </details>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="ImportantQuestionsView.askCoachAboutQuestion('${q.question_text.replace(/'/g, "\\'")}')">
                🤖 Ask Coach
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      listEl.innerHTML = `<div style="color: var(--accent-rose); padding: 30px; text-align: center;">Could not load important questions</div>`;
    }
  },

  filterMarks(marks) {
    this.activeMarksFilter = marks;
    this.render();
  },

  filterUnit(unit) {
    this.activeUnitFilter = unit ? parseInt(unit) : null;
    this.loadQuestions();
  },

  askCoachAboutQuestion(qText) {
    window.location.hash = '#ai-agent';
    setTimeout(() => {
      AiAgentView.sendQuickPrompt(`Give me a structured university exam answer with diagrams for: "${qText}"`);
    }, 200);
  },

  generateModal() {
    const topic = prompt('Enter curriculum topic or unit to generate questions for:', 'Dynamic Programming 0/1 Knapsack');
    if (!topic) return;

    api.post('/important-questions/generate', {
      subject_id: 1,
      unit_number: 3,
      topic
    }).then(res => {
      showToast(res.message, 'success');
      this.loadQuestions();
    });
  }
};
