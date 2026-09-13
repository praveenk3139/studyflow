// PDF Study Lab View
const PdfLabView = {
  selectedPdfId: null,
  activeTab: 'summary',
  flashcardIndex: 0,
  flashcards: [],

  async render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">📄 PDF Study Lab</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Upload lecture notes, textbooks, and handouts. Automatically generate summaries, flashcards, MCQs, and search inside text.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <label class="btn btn-primary" style="cursor: pointer;">
            <span>📤 Upload PDF</span>
            <input type="file" id="pdf-upload-input" accept="application/pdf" style="display: none;" onchange="PdfLabView.handleUpload(this.files[0])" />
          </label>
        </div>
      </div>

      <!-- Main Two-Column Layout: Documents List & Analysis Workspace -->
      <div class="grid-dashboard" style="grid-template-columns: 320px 1fr;">
        <!-- Left Column: Uploaded Documents Shelf -->
        <div class="card" style="padding: 16px; display: flex; flex-direction: column; max-height: calc(100vh - 180px);">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span>📚 Study Materials</span>
            <span id="pdf-count" class="badge badge-low">Loading...</span>
          </div>

          <div id="pdf-doc-list" style="overflow-y: auto; display: flex; flex-direction: column; gap: 8px; flex: 1;">
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">Fetching uploaded documents...</div>
          </div>
        </div>

        <!-- Right Column: Document Viewer & AI Analysis Panel -->
        <div class="card" id="pdf-analysis-panel" style="padding: 24px; min-height: 540px;">
          <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
            <div style="font-size: 40px; margin-bottom: 12px;">📑</div>
            <p>Select an uploaded PDF from the shelf or upload a new lecture handout.</p>
          </div>
        </div>
      </div>
    `;

    this.loadDocuments();
  },

  async loadDocuments() {
    const listEl = document.getElementById('pdf-doc-list');
    const countEl = document.getElementById('pdf-count');

    try {
      const res = await api.get('/pdf');
      countEl.innerText = `${res.documents.length} Files`;

      if (res.documents.length === 0) {
        listEl.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">No documents yet. Click "Upload PDF" above!</div>`;
        return;
      }

      listEl.innerHTML = res.documents.map(doc => `
        <div class="nav-item ${this.selectedPdfId === doc.id ? 'active' : ''}" style="flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px;" onclick="PdfLabView.selectDocument(${doc.id})">
          <div style="font-weight: 600; font-size: 13.5px; color: var(--text-primary);">${doc.title}</div>
          <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-muted);">
            <span>${doc.page_count} Pages</span> • 
            <span>${Math.round(doc.file_size / 1024)} KB</span>
          </div>
        </div>
      `).join('');

      // Auto-select first document
      if (!this.selectedPdfId && res.documents.length > 0) {
        this.selectDocument(res.documents[0].id);
      }
    } catch (e) {
      listEl.innerHTML = `<div style="color: var(--accent-rose); padding: 10px;">Failed to load PDF shelf</div>`;
    }
  },

  async selectDocument(id) {
    this.selectedPdfId = id;
    const panel = document.getElementById('pdf-analysis-panel');
    panel.innerHTML = `<div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div></div>`;

    // Update active state in list
    const items = document.querySelectorAll('#pdf-doc-list .nav-item');
    items.forEach(el => el.classList.remove('active'));

    try {
      const res = await api.get(`/pdf/${id}`);
      const doc = res.document;
      const analysis = res.analysis || {};
      this.flashcards = analysis.flashcards || [];
      this.flashcardIndex = 0;

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 18px; font-weight: 700;">${doc.title}</h3>
              <span class="badge badge-low">${doc.category || 'Lecture Notes'}</span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              ${doc.original_name} • ${doc.page_count} Pages • Uploaded ${new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="PdfLabView.exportNotes('${doc.title.replace(/'/g, "\\'")}')">
              📥 Export Notes
            </button>
          </div>
        </div>

        <!-- In-PDF Search Bar -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <input type="text" id="pdf-search-input" class="input" placeholder="Search keywords inside this document..." onkeydown="if (event.key === 'Enter') PdfLabView.searchDocument(${doc.id})" />
          <button class="btn btn-secondary" onclick="PdfLabView.searchDocument(${doc.id})">🔍 Search</button>
        </div>
        <div id="pdf-search-results" style="margin-bottom: 16px;"></div>

        <!-- Navigation Tabs for Analysis -->
        <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 20px; overflow-x: auto;">
          <button class="btn ${this.activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PdfLabView.setTab('summary')">
            📋 Executive Summary
          </button>
          <button class="btn ${this.activeTab === 'notes' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PdfLabView.setTab('notes')">
            📖 Detailed Notes
          </button>
          <button class="btn ${this.activeTab === 'flashcards' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PdfLabView.setTab('flashcards')">
            🃏 Flashcards (${this.flashcards.length})
          </button>
          <button class="btn ${this.activeTab === 'mcqs' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PdfLabView.setTab('mcqs')">
            🧪 Practice MCQs
          </button>
          <button class="btn ${this.activeTab === 'ask' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="PdfLabView.setTab('ask')">
            🤖 Ask About PDF
          </button>
        </div>

        <!-- Tab Content Viewport -->
        <div id="pdf-tab-content">
          ${this.renderTabContent(analysis, doc)}
        </div>
      `;
    } catch (e) {
      panel.innerHTML = `<div style="color: var(--accent-rose); padding: 40px; text-align: center;">Could not load document analysis</div>`;
    }
  },

  setTab(tabName) {
    this.activeTab = tabName;
    this.selectDocument(this.selectedPdfId);
  },

  renderTabContent(analysis, doc) {
    if (this.activeTab === 'summary') {
      return `
        <div>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px;">Executive Summary</h4>
          <p style="font-size: 14px; line-height: 1.7; color: var(--text-primary); margin-bottom: 20px;">
            ${analysis.summary || 'Summary unavailable.'}
          </p>

          <h4 style="font-size: 15px; font-weight: 700; color: var(--accent-purple); margin-bottom: 10px;">🔑 Extracted Key Concepts</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
            ${(analysis.key_concepts || []).map(c => `
              <span class="badge badge-low" style="padding: 6px 12px; font-size: 12.5px;">${c}</span>
            `).join('')}
          </div>

          <h4 style="font-size: 15px; font-weight: 700; color: var(--accent-emerald); margin-bottom: 10px;">📌 Quick Revision Points</h4>
          <div style="background: var(--bg-base); padding: 16px; border-radius: var(--radius-md); font-size: 13.5px; line-height: 1.8; color: var(--text-secondary); white-space: pre-line;">
            ${analysis.short_notes || ''}
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'notes') {
      return `
        <div style="background: var(--bg-base); padding: 20px; border-radius: var(--radius-md); font-size: 14px; line-height: 1.8; color: var(--text-primary); white-space: pre-line;">
          ${analysis.detailed_notes || 'Detailed notes unavailable.'}
        </div>
      `;
    }

    if (this.activeTab === 'flashcards') {
      if (this.flashcards.length === 0) {
        return `<div style="text-align: center; padding: 40px; color: var(--text-muted);">No flashcards generated for this file yet.</div>`;
      }
      const card = this.flashcards[this.flashcardIndex];
      return `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0;">
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
            Flashcard ${this.flashcardIndex + 1} of ${this.flashcards.length} (Click card to reveal answer)
          </div>

          <!-- Flip Card -->
          <div id="flashcard-box" style="width: 100%; max-width: 500px; min-height: 220px; background: var(--bg-surface-elevated); border: 2px solid var(--border-subtle); border-radius: var(--radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; text-align: center; cursor: pointer; transition: all 0.3s ease; box-shadow: var(--shadow-subtle);" onclick="PdfLabView.flipCard()">
            <div id="flashcard-badge" class="badge badge-low" style="margin-bottom: 12px;">QUESTION</div>
            <div id="flashcard-text" style="font-size: 16px; font-weight: 600; color: var(--text-primary);">
              ${card.front}
            </div>
          </div>

          <div style="display: flex; gap: 14px; margin-top: 24px;">
            <button class="btn btn-secondary" onclick="PdfLabView.prevCard()" ${this.flashcardIndex === 0 ? 'disabled' : ''}>← Previous</button>
            <button class="btn btn-primary" onclick="PdfLabView.flipCard()">🔄 Flip Card</button>
            <button class="btn btn-secondary" onclick="PdfLabView.nextCard()" ${this.flashcardIndex === this.flashcards.length - 1 ? 'disabled' : ''}>Next →</button>
          </div>
        </div>
      `;
    }

    if (this.activeTab === 'mcqs') {
      const mcqs = analysis.mcqs || [];
      return `
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${mcqs.map((mcq, idx) => `
            <div style="background: var(--bg-base); padding: 18px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-cyan);">
              <div style="font-weight: 700; font-size: 14.5px; margin-bottom: 12px;">
                Q${idx + 1}. ${mcq.question}
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${mcq.options.map(opt => `
                  <button class="btn btn-secondary btn-sm" style="justify-content: flex-start; text-align: left;" onclick="PdfLabView.checkOption(this, '${opt.replace(/'/g, "\\'")}', '${mcq.correct.replace(/'/g, "\\'")}', '${(mcq.explanation || '').replace(/'/g, "\\'")}')">
                    ${opt}
                  </button>
                `).join('')}
              </div>
              <div class="feedback-msg" style="margin-top: 10px; font-size: 13px; display: none;"></div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (this.activeTab === 'ask') {
      return `
        <div>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
            Ask any question strictly anchored to the contents of <strong>${doc.title}</strong>:
          </p>
          <div style="display: flex; gap: 10px; margin-bottom: 18px;">
            <input type="text" id="ask-pdf-input" class="input" placeholder="e.g. What does this document say about balance factor bounds?" onkeydown="if (event.key === 'Enter') PdfLabView.askAboutPdf(${doc.id})" />
            <button class="btn btn-primary" onclick="PdfLabView.askAboutPdf(${doc.id})">Ask PDF</button>
          </div>
          <div id="ask-pdf-answer" style="background: var(--bg-base); padding: 18px; border-radius: var(--radius-md); display: none;"></div>
        </div>
      `;
    }

    return '';
  },

  flipCard() {
    const card = this.flashcards[this.flashcardIndex];
    const textEl = document.getElementById('flashcard-text');
    const badgeEl = document.getElementById('flashcard-badge');
    const boxEl = document.getElementById('flashcard-box');

    if (badgeEl.innerText === 'QUESTION') {
      badgeEl.innerText = 'ANSWER';
      badgeEl.className = 'badge badge-high';
      textEl.innerText = card.back;
      boxEl.style.borderColor = 'var(--accent-purple)';
      playAudioChime('chime');
    } else {
      badgeEl.innerText = 'QUESTION';
      badgeEl.className = 'badge badge-low';
      textEl.innerText = card.front;
      boxEl.style.borderColor = 'var(--border-subtle)';
    }
  },

  nextCard() {
    if (this.flashcardIndex < this.flashcards.length - 1) {
      this.flashcardIndex++;
      this.selectDocument(this.selectedPdfId);
    }
  },

  prevCard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.selectDocument(this.selectedPdfId);
    }
  },

  checkOption(btn, chosen, correct, explanation) {
    const parent = btn.parentElement.parentElement;
    const msg = parent.querySelector('.feedback-msg');
    msg.style.display = 'block';

    if (chosen === correct) {
      msg.innerHTML = `<span style="color: #10b981; font-weight: bold;">✓ Correct!</span> ${explanation}`;
      btn.style.background = 'rgba(16, 185, 129, 0.2)';
      btn.style.borderColor = '#10b981';
      playAudioChime('success');
    } else {
      msg.innerHTML = `<span style="color: #f43f5e; font-weight: bold;">✗ Incorrect.</span> Expected: <strong>${correct}</strong>. ${explanation}`;
      btn.style.background = 'rgba(244, 63, 94, 0.2)';
      btn.style.borderColor = '#f43f5e';
    }
  },

  async askAboutPdf(pdfId) {
    const input = document.getElementById('ask-pdf-input');
    const ansEl = document.getElementById('ask-pdf-answer');
    const q = input.value.trim();
    if (!q) return;

    ansEl.style.display = 'block';
    ansEl.innerHTML = `<div class="pulse-indicator"></div> Analyzing PDF context...`;

    try {
      const res = await api.post(`/pdf/${pdfId}/ask`, { question: q });
      ansEl.innerHTML = `
        <h4 style="font-size: 14px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 8px;">Answer from Document:</h4>
        <div style="font-size: 13.5px; line-height: 1.7; color: var(--text-primary); white-space: pre-line;">
          ${res.answer}
        </div>
      `;
    } catch (e) {
      ansEl.innerHTML = `<span style="color: var(--accent-rose);">Failed to analyze document question</span>`;
    }
  },

  async searchDocument(pdfId) {
    const query = document.getElementById('pdf-search-input').value.trim();
    const resultsEl = document.getElementById('pdf-search-results');
    if (!query) return;

    resultsEl.innerHTML = `<div class="pulse-indicator"></div> Searching...`;

    try {
      const res = await api.get(`/pdf/${pdfId}/search?query=${encodeURIComponent(query)}`);
      if (res.matches.length === 0) {
        resultsEl.innerHTML = `<div style="font-size: 12.5px; color: var(--text-muted);">No matches found for "${query}".</div>`;
        return;
      }

      resultsEl.innerHTML = `
        <div style="font-size: 12.5px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px;">
          Found ${res.match_count} match(es):
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${res.matches.map(m => `
            <div style="background: var(--bg-base); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; color: var(--text-secondary); border-left: 2px solid var(--accent-cyan);">
              "...${m.snippet}..."
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {}
  },

  async handleUpload(file) {
    if (!file) return;
    showToast('Uploading and parsing PDF document with AI...', 'info');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/pdf/upload', formData, true);
      showToast('PDF analyzed successfully! +50 XP gained.', 'success');
      this.selectedPdfId = res.document.id;
      this.loadDocuments();
      this.selectDocument(res.document.id);
    } catch (e) {
      showToast('Upload failed: ' + e.message, 'error');
    }
  },

  exportNotes(title) {
    const content = document.getElementById('pdf-tab-content').innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_Notes.txt`;
    a.click();
    showToast('Notes exported to file', 'success');
  }
};
