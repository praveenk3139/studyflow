// Mind Break & Relaxation Mini-Games View
const MindBreakView = {
  activeGame: 'memory',
  gameTimer: null,

  // Memory Game State
  memoryCards: [],
  flippedIndexes: [],
  matchedPairs: 0,

  // Reaction Game State
  reactionState: 'idle', // idle, waiting, ready, done
  reactionTimeout: null,
  reactionStartTime: 0,

  // Math Sprint State
  mathScore: 0,
  currentMathProblem: null,

  render() {
    const container = document.getElementById('view-content');
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <h2 style="font-size: 22px; font-weight: 800;">🧠 Mind Break & Cognitive Recharge</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">
            Scientific micro-breaks to reset working memory, lower cortisol, and restore attentional reserves without endless gaming.
          </p>
        </div>
      </div>

      <!-- Activity Selector Tabs -->
      <div style="display: flex; gap: 10px; margin-bottom: 24px; overflow-x: auto;">
        <button class="btn ${this.activeGame === 'memory' ? 'btn-primary' : 'btn-secondary'}" onclick="MindBreakView.selectGame('memory')">
          🃏 Memory Tile Match
        </button>
        <button class="btn ${this.activeGame === 'reaction' ? 'btn-primary' : 'btn-secondary'}" onclick="MindBreakView.selectGame('reaction')">
          ⚡ Reaction Time Test
        </button>
        <button class="btn ${this.activeGame === 'breathing' ? 'btn-primary' : 'btn-secondary'}" onclick="MindBreakView.selectGame('breathing')">
          🫁 4-7-8 Guided Breath
        </button>
        <button class="btn ${this.activeGame === 'math' ? 'btn-primary' : 'btn-secondary'}" onclick="MindBreakView.selectGame('math')">
          🔢 Speed Math Sprint
        </button>
        <button class="btn ${this.activeGame === 'zen' ? 'btn-primary' : 'btn-secondary'}" onclick="MindBreakView.selectGame('zen')">
          🧘 60s Zen Reset
        </button>
      </div>

      <!-- Game Stage Box -->
      <div class="game-container" id="mind-break-stage">
        <!-- Rendered dynamically -->
      </div>
    `;

    this.renderActiveGame();
  },

  selectGame(gameId) {
    if (this.reactionTimeout) clearTimeout(this.reactionTimeout);
    this.activeGame = gameId;
    this.render();
  },

  renderActiveGame() {
    const stage = document.getElementById('mind-break-stage');

    if (this.activeGame === 'memory') {
      this.initMemoryGame();
      stage.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">🃏 Memory Tile Match</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          Match 6 pairs of academic/AI concept tiles to reset working memory.
        </p>

        <div class="memory-grid" id="memory-grid">
          ${this.memoryCards.map((card, idx) => `
            <div class="memory-card" id="mcard-${idx}" onclick="MindBreakView.flipMemoryCard(${idx})">
              ❓
            </div>
          `).join('')}
        </div>

        <div style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">
          Pairs matched: <strong id="matched-count" style="color: var(--accent-cyan);">${this.matchedPairs}</strong> / 6
        </div>
      `;
    } else if (this.activeGame === 'reaction') {
      this.reactionState = 'idle';
      stage.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">⚡ Reaction Time Test</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          Tests neuro-cognitive reaction speed. Click the box as soon as it turns GREEN!
        </p>

        <div id="reaction-box" style="width: 100%; max-width: 460px; height: 200px; border-radius: var(--radius-lg); background: #1e293b; border: 2px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; cursor: pointer; user-select: none;" onclick="MindBreakView.handleReactionClick()">
          Click Here to Begin
        </div>
      `;
    } else if (this.activeGame === 'breathing') {
      stage.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">🫁 4-7-8 Guided Breathing Visualizer</h3>
        <p style="font-size: 13px; color: var(--text-secondary);">
          Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds. Synchronize with the circle.
        </p>

        <div class="breathing-circle-wrapper">
          <div class="breathing-circle" id="breath-circle">
            Inhale
          </div>
        </div>

        <div style="font-size: 16px; font-weight: 700; color: var(--accent-cyan); margin-top: 10px;" id="breath-status">
          Preparing cycle...
        </div>

        <button class="btn btn-primary" style="margin-top: 20px;" onclick="MindBreakView.startBreathingCycle()">
          Start Breathing Cycle 🧘
        </button>
      `;
    } else if (this.activeGame === 'math') {
      this.mathScore = 0;
      this.generateMathProblem();
      stage.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">🔢 Speed Math Sprint</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          Rapid mental arithmetic sprints to boost executive alertness.
        </p>

        <div style="background: var(--bg-base); padding: 24px 36px; border-radius: var(--radius-lg); margin-bottom: 20px;">
          <div style="font-size: 32px; font-weight: 800; color: var(--accent-cyan);" id="math-problem-text">
            ${this.currentMathProblem.question}
          </div>
        </div>

        <div style="display: flex; gap: 10px; max-width: 320px; width: 100%;">
          <input type="number" id="math-answer-input" class="input" placeholder="Your answer..." onkeydown="if (event.key === 'Enter') MindBreakView.submitMathAnswer()" autofocus />
          <button class="btn btn-primary" onclick="MindBreakView.submitMathAnswer()">Check</button>
        </div>

        <div style="font-size: 14px; margin-top: 16px; color: var(--text-secondary);">
          Current Sprint Score: <strong id="math-score" style="color: var(--accent-emerald);">0</strong>
        </div>
      `;
    } else if (this.activeGame === 'zen') {
      stage.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">🧘 60-Second Zen Focus Reset</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 24px;">
          Rest your eyes away from text. Let your brain consolidate recently studied concepts.
        </p>

        <div style="width: 100px; height: 100px; border-radius: 50%; background: radial-gradient(circle, #38bdf8, transparent 70%); animation: pulse 3s infinite; margin: 20px 0;"></div>

        <blockquote style="font-size: 15px; font-style: italic; color: var(--text-primary); max-width: 480px; margin-bottom: 24px;">
          “Quiet minds cannot be perplexed or frightened or broken by exam anxiety.”
        </blockquote>

        <button class="btn btn-emerald" onclick="MindBreakView.completeBreak('zen')">
          Complete Break & Resume Study Plan ✓
        </button>
      `;
    }
  },

  // 1. Memory Game Implementation
  initMemoryGame() {
    const icons = ['💻', '🤖', '📚', '⚡', '🧠', '🔬'];
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
    this.memoryCards = deck;
    this.flippedIndexes = [];
    this.matchedPairs = 0;
  },

  flipMemoryCard(idx) {
    if (this.flippedIndexes.length === 2) return;
    if (this.flippedIndexes.includes(idx)) return;

    const cardEl = document.getElementById(`mcard-${idx}`);
    cardEl.innerText = this.memoryCards[idx];
    cardEl.classList.add('flipped');
    this.flippedIndexes.push(idx);

    if (this.flippedIndexes.length === 2) {
      const [i1, i2] = this.flippedIndexes;
      if (this.memoryCards[i1] === this.memoryCards[i2]) {
        // Matched
        this.matchedPairs++;
        document.getElementById('matched-count').innerText = this.matchedPairs;
        playAudioChime('success');
        this.flippedIndexes = [];
        if (this.matchedPairs === 6) {
          setTimeout(() => this.completeBreak('memory'), 600);
        }
      } else {
        setTimeout(() => {
          document.getElementById(`mcard-${i1}`).innerText = '❓';
          document.getElementById(`mcard-${i2}`).innerText = '❓';
          document.getElementById(`mcard-${i1}`).classList.remove('flipped');
          document.getElementById(`mcard-${i2}`).classList.remove('flipped');
          this.flippedIndexes = [];
        }, 800);
      }
    }
  },

  // 2. Reaction Test Implementation
  handleReactionClick() {
    const box = document.getElementById('reaction-box');
    if (this.reactionState === 'idle') {
      this.reactionState = 'waiting';
      box.style.background = '#dc2626'; // Red: wait
      box.innerText = 'Wait for GREEN...';
      const delay = Math.floor(Math.random() * 2500) + 1500;
      this.reactionTimeout = setTimeout(() => {
        this.reactionState = 'ready';
        this.reactionStartTime = Date.now();
        box.style.background = '#16a34a'; // Green: click!
        box.innerText = 'CLICK NOW!';
      }, delay);
    } else if (this.reactionState === 'waiting') {
      clearTimeout(this.reactionTimeout);
      this.reactionState = 'idle';
      box.style.background = '#1e293b';
      box.innerText = 'Too soon! Click to try again.';
      showToast('Clicked too early! Wait for green.', 'warning');
    } else if (this.reactionState === 'ready') {
      const scoreMs = Date.now() - this.reactionStartTime;
      this.reactionState = 'idle';
      box.style.background = '#1e293b';
      box.innerHTML = `⚡ ${scoreMs} ms!<br/><span style="font-size: 13px; color: var(--accent-emerald);">Sharp neurological response time! Click to retry.</span>`;
      playAudioChime('success');
      setTimeout(() => this.completeBreak('reaction'), 1200);
    }
  },

  // 3. 4-7-8 Breathing Cycle
  startBreathingCycle() {
    const circle = document.getElementById('breath-circle');
    const status = document.getElementById('breath-status');

    // Inhale 4s
    circle.className = 'breathing-circle inhale';
    circle.innerText = 'Inhale';
    status.innerText = 'Breathe in slowly through the nose (4s)...';

    setTimeout(() => {
      // Hold 7s
      circle.className = 'breathing-circle hold';
      circle.innerText = 'Hold';
      status.innerText = 'Hold breath gently without tension (7s)...';

      setTimeout(() => {
        // Exhale 8s
        circle.className = 'breathing-circle exhale';
        circle.innerText = 'Exhale';
        status.innerText = 'Release breath smoothly through mouth (8s)...';

        setTimeout(() => {
          status.innerText = 'Cycle complete! Feel the calm in your nervous system.';
          this.completeBreak('breathing');
        }, 8000);
      }, 7000);
    }, 4000);
  },

  // 4. Math Sprint
  generateMathProblem() {
    const n1 = Math.floor(Math.random() * 20) + 5;
    const n2 = Math.floor(Math.random() * 15) + 3;
    const isMult = Math.random() > 0.5;

    if (isMult) {
      this.currentMathProblem = { question: `${n1} × ${n2}`, answer: n1 * n2 };
    } else {
      this.currentMathProblem = { question: `${n1 * 4} - ${n2 * 2}`, answer: (n1 * 4) - (n2 * 2) };
    }
  },

  submitMathAnswer() {
    const input = document.getElementById('math-answer-input');
    const val = parseInt(input.value);
    if (isNaN(val)) return;

    if (val === this.currentMathProblem.answer) {
      this.mathScore += 10;
      document.getElementById('math-score').innerText = this.mathScore;
      playAudioChime('success');
      showToast('Correct! +10 Points', 'success');

      if (this.mathScore >= 30) {
        this.completeBreak('math');
      } else {
        this.generateMathProblem();
        document.getElementById('math-problem-text').innerText = this.currentMathProblem.question;
        input.value = '';
      }
    } else {
      showToast('Try again!', 'error');
      input.value = '';
    }
  },

  // Wrap-up modal after break (Per Section 19)
  async completeBreak(gameId) {
    try {
      const res = await api.post('/mind-break/complete', { activity_id: gameId });
      playAudioChime('break');

      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 8px;">✨</div>
          <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">Break Complete!</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px;">
            ${res.message}<br/>Attentional reserves restored.
          </p>
          <div style="font-size: 14px; font-weight: 700; color: var(--accent-amber); margin-bottom: 24px;">
            +${res.xp_gained} Healthy Break XP Awarded
          </div>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); window.location.hash='#planner'">
              Continue Strict Study Plan 🚀
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              Stay on Mind Break
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (e) {}
  }
};
