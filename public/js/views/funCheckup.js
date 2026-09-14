// StudyFlow AI - Fun Mind Check-Up & AI Random Question Hub View
const FunCheckupView = {
  currentTab: 'checkup', // 'checkup' | 'random'
  currentStep: 1,
  totalSteps: 15,
  answers: {
    best_friend: '',
    makes_me_laugh: '',
    most_texted: '',
    bad_day_friend: '',
    study_buddy: '',
    biggest_subject_enemy: '',
    relaxation_activities: [],
    exam_survival_friend: '',
    favorite_entertainment: '',
    nickname: '',
    male_best_friend: '',
    female_best_friend: '',
    funniest_college_moment: '',
    free_day_activity: '',
    life_title_movie: ''
  },
  existingData: null,
  isEditing: false,

  // State for AI Random Question Hub & Modal
  embeddedRandomQ: null,
  modalRandomQ: null,
  isSubmittingEmbedded: false,
  isSubmittingModal: false,
  sessionHistory: [],

  async render() {
    const container = document.getElementById('view-content');
    if (!container) return;

    // Check if URL specifies a tab
    const hash = window.location.hash;
    if (hash.includes('tab=random')) {
      this.currentTab = 'random';
    }

    container.innerHTML = `
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <h2 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
              <span>😂</span> Fun Mind Check-Up
              <span class="badge badge-low" style="font-size: 11px; font-weight: 600;">⚡ AI Powered Analysis</span>
            </h2>
            <p style="color: var(--text-secondary); font-size: 13.5px; margin-top: 4px;">
              Take a quick mindful break, earn your Mindset Score & Grade, and build your student squad lore!
            </p>
          </div>

          <!-- Top Navigation Tabs -->
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button class="fun-tab-btn ${this.currentTab === 'checkup' ? 'active' : ''}" onclick="FunCheckupView.switchTab('checkup')">
              📋 Squad Check-Up (15 Qs)
            </button>
            <button class="fun-tab-btn ${this.currentTab === 'random' ? 'active' : ''}" onclick="FunCheckupView.switchTab('random')">
              🎲 AI Random Question Hub
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#mind-break'">
              🧠 Mind Games
            </button>
          </div>
        </div>
      </div>

      <!-- Strict Study Plan Guard Notice -->
      <div id="fun-study-notice" style="display: none; margin-bottom: 20px;">
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #fde68a;">
          <span style="font-size: 18px;">⏳</span>
          <div>
            <strong>Study Sprint Active:</strong> Your study session is currently running. You can enjoy the Fun Check-Up right now as an intentional mental break!
          </div>
        </div>
      </div>

      <!-- Main Dynamic Content Container -->
      <div id="fun-checkup-main">
        <div style="text-align: center; padding: 60px;"><div class="pulse-indicator"></div> Loading...</div>
      </div>
    `;

    this.checkStrictPlan();
    this.renderCurrentTab();
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.fun-tab-btn').forEach(btn => {
      if (btn.innerText.includes('Squad') && tab === 'checkup') btn.classList.add('active');
      else if (btn.innerText.includes('Hub') && tab === 'random') btn.classList.add('active');
      else btn.classList.remove('active');
    });
    this.renderCurrentTab();
  },

  async checkStrictPlan() {
    try {
      const planner = await api.get('/planner');
      if (planner.active_task && planner.active_task.status === 'in_progress') {
        const notice = document.getElementById('fun-study-notice');
        if (notice) notice.style.display = 'block';
      }
    } catch (e) {}
  },

  async renderCurrentTab() {
    const mainEl = document.getElementById('fun-checkup-main');
    if (!mainEl) return;

    if (this.currentTab === 'random') {
      this.renderRandomQuestionHub(mainEl);
    } else {
      this.loadCheckup(mainEl);
    }
  },

  // =========================================================================
  // TAB 1: 15-QUESTION CHECK-UP WIZARD & RESULT CARD
  // =========================================================================
  async loadCheckup(container = document.getElementById('fun-checkup-main')) {
    try {
      const res = await api.get('/fun-checkup');
      this.existingData = res.checkup;

      if (res.has_completed && res.checkup && !this.isEditing) {
        this.renderResultCard(res.checkup, container);
      } else {
        if (res.checkup) {
          this.answers = {
            best_friend: res.checkup.best_friend || '',
            makes_me_laugh: res.checkup.makes_me_laugh || '',
            most_texted: res.checkup.most_texted || '',
            bad_day_friend: res.checkup.bad_day_friend || '',
            study_buddy: res.checkup.study_buddy || '',
            biggest_subject_enemy: res.checkup.biggest_subject_enemy || '',
            relaxation_activities: Array.isArray(res.checkup.relaxation_activities) ? res.checkup.relaxation_activities : [],
            exam_survival_friend: res.checkup.exam_survival_friend || '',
            favorite_entertainment: res.checkup.favorite_entertainment || '',
            nickname: res.checkup.nickname || '',
            male_best_friend: res.checkup.male_best_friend || '',
            female_best_friend: res.checkup.female_best_friend || '',
            funniest_college_moment: res.checkup.funniest_college_moment || '',
            free_day_activity: res.checkup.free_day_activity || '',
            life_title_movie: res.checkup.life_title_movie || ''
          };
        }
        this.renderQuestionWizard(container);
      }
    } catch (e) {
      this.renderQuestionWizard(container);
    }
  },

  renderQuestionWizard(container = document.getElementById('fun-checkup-main')) {
    const step = this.currentStep;
    const progressPct = Math.round((step / this.totalSteps) * 100);

    container.innerHTML = `
      <div class="card" style="max-width: 680px; margin: 0 auto; padding: 32px 28px; position: relative;">
        <!-- Header Progress -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 13px; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; letter-spacing: 0.5px;">
            Question ${step} of ${this.totalSteps}
          </span>
          <span style="font-size: 12.5px; color: var(--text-muted); font-weight: 600;">
            ${progressPct}% Complete
          </span>
        </div>

        <div style="height: 6px; background: var(--bg-base); border-radius: var(--radius-full); overflow: hidden; margin-bottom: 28px;">
          <div style="height: 100%; width: ${progressPct}%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple)); transition: width 0.3s ease;"></div>
        </div>

        <!-- Dynamic Question Content -->
        <div id="step-content" style="min-height: 220px; animation: authFadeIn 0.3s ease;">
          ${this.getQuestionHtml(step)}
        </div>

        <!-- Navigation Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
          <div>
            ${step > 1 ? `
              <button class="btn btn-secondary" onclick="FunCheckupView.prevStep()">
                ← Back
              </button>
            ` : (this.existingData ? `
              <button class="btn btn-secondary btn-sm" onclick="FunCheckupView.cancelEdit()">
                Cancel
              </button>
            ` : `<div></div>`)}
          </div>

          <div style="display: flex; gap: 12px;">
            <button class="btn btn-secondary" onclick="FunCheckupView.skipStep()">
              Skip
            </button>
            <button class="btn btn-primary" onclick="FunCheckupView.nextStep()" style="min-width: 110px;">
              ${step === this.totalSteps ? 'Finish & Analyze 🎉' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  getQuestionHtml(step) {
    switch(step) {
      case 1:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">👯</div>
            <h3 class="fun-q-title">Who is your best friend?</h3>
            <p class="fun-q-sub">The partner in crime who knows all your semester secrets.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter friend's name or nickname (e.g. Arun or Rocky)" 
                value="${this.escapeHtml(this.answers.best_friend)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
          </div>
        `;
      case 2:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">😂</div>
            <h3 class="fun-q-title">Who makes you laugh the most?</h3>
            <p class="fun-q-sub">The person whose memes and jokes make boring lectures survivable.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter name or nickname (e.g. Karthik)" 
                value="${this.escapeHtml(this.answers.makes_me_laugh)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
          </div>
        `;
      case 3:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">📱</div>
            <h3 class="fun-q-title">Who do you text the most?</h3>
            <p class="fun-q-sub">The top pinned contact on your chat apps.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter name or nickname" 
                value="${this.escapeHtml(this.answers.most_texted)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
          </div>
        `;
      case 4:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">🫂</div>
            <h3 class="fun-q-title">Who would you call when you're having a bad day?</h3>
            <p class="fun-q-sub">Your go-to comfort buddy when stress hits hard.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter name or nickname" 
                value="${this.escapeHtml(this.answers.bad_day_friend)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
          </div>
        `;
      case 5:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">📚</div>
            <h3 class="fun-q-title">Who is your study buddy?</h3>
            <p class="fun-q-sub">The friend who grinds previous-year question papers with you.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter name or nickname (or select option below)" 
                value="${this.escapeHtml(this.answers.study_buddy)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('Nobody 😭')">Nobody 😭 (Solo Grinder)</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('StudyFlow AI 🤖')">StudyFlow AI 🤖</button>
            </div>
          </div>
        `;
      case 6:
        const subjects = ['Mathematics', 'Programming', 'Data Structures', 'Computer Networks', 'Operating Systems', 'Database Management', 'None 😎'];
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">💀</div>
            <h3 class="fun-q-title">Which subject is your biggest enemy?</h3>
            <p class="fun-q-sub">The Final Boss that keeps giving you nightmares before finals.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 18px; margin-bottom: 16px;">
              ${subjects.map(s => `
                <button 
                  type="button" 
                  class="fun-select-btn ${this.answers.biggest_subject_enemy === s ? 'selected' : ''}" 
                  onclick="FunCheckupView.selectSingleAnswer('biggest_subject_enemy', '${s}')"
                >
                  ${s}
                </button>
              `).join('')}
            </div>

            <div class="form-group" style="margin-top: 12px;">
              <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Or enter a custom subject:</label>
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="e.g. Electrical Engineering / Physics" 
                value="${!subjects.includes(this.answers.biggest_subject_enemy) ? this.escapeHtml(this.answers.biggest_subject_enemy) : ''}"
                oninput="FunCheckupView.answers.biggest_subject_enemy = this.value"
              />
            </div>
          </div>
        `;
      case 7:
        const relaxOptions = [
          '🎮 Gaming', '▶️ YouTube', '🎵 Music', '🎬 Movies', 
          '🍿 Anime', '😴 Sleeping', '💬 Talking with friends', 
          '🚶 Going outside', '📖 Reading'
        ];
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">🎮</div>
            <h3 class="fun-q-title">What's your favorite way to relax?</h3>
            <p class="fun-q-sub">Select all that recharge your mental battery. (Multi-select allowed)</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin-top: 18px;">
              ${relaxOptions.map(opt => `
                <button 
                  type="button" 
                  class="fun-select-btn ${this.answers.relaxation_activities.includes(opt) ? 'selected' : ''}" 
                  onclick="FunCheckupView.toggleMultiAnswer('${opt}')"
                >
                  ${opt}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      case 8:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">😂</div>
            <h3 class="fun-q-title">Which friend would survive an exam with you?</h3>
            <p class="fun-q-sub">The legendary companion who enters the exam battle by your side.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter friend's name or nickname" 
                value="${this.escapeHtml(this.answers.exam_survival_friend)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('I\\'m surviving alone 💀')">
                I'm surviving alone 💀
              </button>
            </div>
          </div>
        `;
      case 9:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">🎬</div>
            <h3 class="fun-q-title">What's your favorite movie, anime, series, or game?</h3>
            <p class="fun-q-sub">The masterpiece you will defend until graduation.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="e.g. Attack on Titan, Interstellar, Witcher 3, Arcane" 
                value="${this.escapeHtml(this.answers.favorite_entertainment)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
          </div>
        `;
      case 10:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">🤐</div>
            <h3 class="fun-q-title">Do you have a funny or secret nickname?</h3>
            <p class="fun-q-sub">What your friends or family call you behind closed doors.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="e.g. Rocky / Captain / Matrix" 
                value="${this.escapeHtml(this.answers.nickname)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('No nickname')">
                No nickname
              </button>
            </div>
          </div>
        `;
      case 11:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">👦</div>
            <h3 class="fun-q-title">Who is your male best friend?</h3>
            <p class="fun-q-sub">Your ride-or-die bro for late night tea, gaming sessions, and project panics.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter male friend's name or nickname (e.g. Rahul / David)" 
                value="${this.escapeHtml(this.answers.male_best_friend)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('${this.escapeHtml(this.answers.best_friend || 'Arun')}')">Same as Best Friend</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('Solo Guy 😎')">Solo Guy 😎</button>
            </div>
          </div>
        `;
      case 12:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">👧</div>
            <h3 class="fun-q-title">Who is your female best friend?</h3>
            <p class="fun-q-sub">Your trusted friend with all the neat lecture notes, honest advice, and best study tips.</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="Enter female friend's name or nickname (e.g. Priya / Sarah)" 
                value="${this.escapeHtml(this.answers.female_best_friend)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('${this.escapeHtml(this.answers.best_friend || 'Sarah')}')">Same as Best Friend</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('StudyFlow AI 🤖')">StudyFlow AI 🤖</button>
            </div>
          </div>
        `;
      case 13:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">😂</div>
            <h3 class="fun-q-title">What is the funniest thing that happened in your college life?</h3>
            <p class="fun-q-sub">The hilarious mishap, lab disaster, or meme moment you and your friends still laugh about.</p>
            <div class="form-group" style="margin-top: 20px;">
              <textarea 
                id="q-input" 
                class="textarea" 
                rows="3"
                placeholder="e.g. Professor caught us playing Subway Surfers in the front row / Fell asleep and got locked in the library"
                autofocus
              >${this.escapeHtml(this.answers.funniest_college_moment)}</textarea>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('Joined the wrong lecture for 45 minutes 😭')">Joined wrong lecture 😭</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('Lab experiment went completely wrong 💥')">Lab mishap 💥</button>
            </div>
          </div>
        `;
      case 14:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">🎮</div>
            <h3 class="fun-q-title">If you had a completely free day tomorrow, what would you do?</h3>
            <p class="fun-q-sub">Zero exams, zero assignments, zero alarms—what is your dream relaxation day?</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="e.g. Sleep for 14 hours straight, order midnight pizza, and play video games" 
                value="${this.escapeHtml(this.answers.free_day_activity)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('😴 Sleep for 12 hours straight')">😴 Sleep all day</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('🎮 14-Hour Gaming Sprint with Friends')">🎮 Gaming sprint</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('🍿 Binge an entire anime/series season')">🍿 Binge series</button>
            </div>
          </div>
        `;
      case 15:
        return `
          <div class="fun-q-box">
            <div class="fun-q-icon">⚔️</div>
            <h3 class="fun-q-title">If your life were an anime/game/movie, what would its title be?</h3>
            <p class="fun-q-sub">Give your university journey an epic, hilarious, or cinematic title!</p>
            <div class="form-group" style="margin-top: 20px;">
              <input 
                type="text" 
                id="q-input" 
                class="input" 
                placeholder="e.g. Solo Leveling: The Semester Finals Arc / The Procrastination Chronicles" 
                value="${this.escapeHtml(this.answers.life_title_movie)}"
                autofocus
                onkeydown="if(event.key==='Enter') FunCheckupView.nextStep()"
              />
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('Surviving 8 AM Lectures 💀')">Surviving 8 AM Lectures 💀</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('Solo Leveling: Semester Arc ⚔️')">Solo Leveling: Semester Arc ⚔️</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setQuickInput('The Midnight Coffee Chronicles ☕')">Midnight Coffee Chronicles ☕</button>
            </div>
          </div>
        `;
      default:
        return '';
    }
  },

  setQuickInput(val) {
    const input = document.getElementById('q-input');
    if (input) {
      input.value = val;
      input.focus();
    }
    this.saveCurrentInputValue(val);
  },

  selectSingleAnswer(key, val) {
    this.answers[key] = val;
    this.renderQuestionWizard();
  },

  toggleMultiAnswer(opt) {
    const list = this.answers.relaxation_activities;
    const idx = list.indexOf(opt);
    if (idx > -1) list.splice(idx, 1);
    else list.push(opt);
    this.renderQuestionWizard();
  },

  saveCurrentInputValue(forcedVal = null) {
    const input = document.getElementById('q-input');
    const val = forcedVal !== null ? forcedVal : (input ? input.value.trim() : '');

    switch(this.currentStep) {
      case 1: this.answers.best_friend = val; break;
      case 2: this.answers.makes_me_laugh = val; break;
      case 3: this.answers.most_texted = val; break;
      case 4: this.answers.bad_day_friend = val; break;
      case 5: if (val) this.answers.study_buddy = val; break;
      case 6: if (val && !['Mathematics', 'Programming', 'Data Structures', 'Computer Networks', 'Operating Systems', 'Database Management', 'None 😎'].includes(this.answers.biggest_subject_enemy)) this.answers.biggest_subject_enemy = val; break;
      case 8: this.answers.exam_survival_friend = val; break;
      case 9: this.answers.favorite_entertainment = val; break;
      case 10: this.answers.nickname = val; break;
      case 11: this.answers.male_best_friend = val; break;
      case 12: this.answers.female_best_friend = val; break;
      case 13: this.answers.funniest_college_moment = val; break;
      case 14: this.answers.free_day_activity = val; break;
      case 15: this.answers.life_title_movie = val; break;
    }
  },

  nextStep() {
    this.saveCurrentInputValue();
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderQuestionWizard();
    } else {
      this.submitCheckup();
    }
  },

  prevStep() {
    this.saveCurrentInputValue();
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderQuestionWizard();
    }
  },

  skipStep() {
    switch(this.currentStep) {
      case 1: this.answers.best_friend = 'Skip'; break;
      case 2: this.answers.makes_me_laugh = 'Skip'; break;
      case 3: this.answers.most_texted = 'Skip'; break;
      case 4: this.answers.bad_day_friend = 'Skip'; break;
      case 5: this.answers.study_buddy = 'Skip'; break;
      case 6: this.answers.biggest_subject_enemy = 'None 😎'; break;
      case 7: if (this.answers.relaxation_activities.length === 0) this.answers.relaxation_activities = ['▶️ YouTube']; break;
      case 8: this.answers.exam_survival_friend = 'Skip'; break;
      case 9: this.answers.favorite_entertainment = 'Skip'; break;
      case 10: this.answers.nickname = 'Skip'; break;
      case 11: this.answers.male_best_friend = 'Skip'; break;
      case 12: this.answers.female_best_friend = 'Skip'; break;
      case 13: this.answers.funniest_college_moment = 'Skip'; break;
      case 14: this.answers.free_day_activity = 'Skip'; break;
      case 15: this.answers.life_title_movie = 'Skip'; break;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderQuestionWizard();
    } else {
      this.submitCheckup();
    }
  },

  async submitCheckup() {
    const container = document.getElementById('fun-checkup-main');
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 60px 20px; max-width: 600px; margin: 0 auto;">
        <div class="pulse-indicator" style="margin: 0 auto 16px;"></div>
        <h3 style="font-size: 18px; font-weight: 700;">Evaluating & Analyzing Check-Up Score... ⚡</h3>
        <p style="color: var(--text-secondary); font-size: 13px; margin-top: 6px;">Computing squad marks and mindset tier.</p>
      </div>
    `;

    try {
      const res = await api.post('/fun-checkup', this.answers);
      this.isEditing = false;
      this.existingData = res.checkup;
      showToast('🎉 Fun Mind Check-Up analyzed successfully! (+50 XP)', 'success');
      playAudioChime('task_complete');
      this.renderResultCard(res.checkup, container);
    } catch (e) {
      showToast('Could not save check-up: ' + e.message, 'error');
      this.renderQuestionWizard(container);
    }
  },

  renderResultCard(data, container = document.getElementById('fun-checkup-main')) {
    let relax = [];
    try {
      relax = Array.isArray(data.relaxation_activities) ? data.relaxation_activities : JSON.parse(data.relaxation_activities || '[]');
    } catch (e) {
      relax = [data.relaxation_activities || 'Gaming'];
    }

    const score = data.score !== undefined && data.score !== null ? data.score : 85;
    const grade = data.grade || 'A+ Tier (Elite Balance & Squad Synergy)';

    let breakdown = {
      squad_support: { mark: 22, max: 25, label: 'Squad Support Alliance' },
      academic_synergy: { mark: 20, max: 25, label: 'Academic Battle Partner' },
      wellness_recharge: { mark: 21, max: 25, label: 'Wellness & Recharge' },
      campus_lore: { mark: 22, max: 25, label: 'Campus Lore & Creative Mindset' }
    };

    if (data.analysis_details) {
      try {
        const parsed = typeof data.analysis_details === 'string' ? JSON.parse(data.analysis_details) : data.analysis_details;
        if (parsed.breakdown) breakdown = parsed.breakdown;
      } catch (e) {}
    }

    container.innerHTML = `
      <div style="max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; animation: authFadeIn 0.3s ease;">
        
        <!-- Score Card Banner -->
        <div class="card" style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98)); border-top: 4px solid var(--accent-cyan); border-radius: var(--radius-lg); padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
            <div>
              <span class="badge badge-low" style="margin-bottom: 6px;">🎯 Official Mindset & Squad Evaluation</span>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
                <span>🏆</span> CHECK-UP ANALYSIS & SCORE CARD
              </h2>
              <p style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
                Evaluated across 4 core academic & wellness dimensions.
              </p>
            </div>

            <div style="display: flex; align-items: center; gap: 14px; background: rgba(15, 23, 42, 0.6); padding: 14px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: 900; color: var(--accent-cyan); line-height: 1;">${score}</div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: 2px;">Score / 100</div>
              </div>
              <div style="height: 36px; width: 1px; background: var(--border-subtle);"></div>
              <div>
                <span class="badge badge-demo" style="font-size: 12px; font-weight: 700;">${this.escapeHtml(grade)}</span>
                <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 3px;">Evaluated & Recorded</div>
              </div>
            </div>
          </div>

          <!-- Sub-marks Breakdown Grid -->
          <div class="grid-2" style="gap: 14px;">
            ${Object.keys(breakdown).map(k => {
              const item = breakdown[k];
              const pct = Math.round((item.mark / item.max) * 100);
              return `
                <div style="background: var(--bg-base); padding: 14px 16px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-cyan);">
                  <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px;">
                    <strong style="color: var(--text-primary);">${this.escapeHtml(item.label)}</strong>
                    <span style="font-weight: 700; color: var(--accent-cyan);">${item.mark} / ${item.max}</span>
                  </div>
                  <div style="height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #38bdf8, #8b5cf6);"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Main Result Card -->
        <div class="card" style="border-top: 4px solid var(--accent-purple); position: relative; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
            <div>
              <span class="badge badge-low" style="margin-bottom: 8px;">🎉 Check-Up Answers Record</span>
              <h2 style="font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                <span>😂</span> YOUR SQUAD & HUMOR PROFILE
              </h2>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="FunCheckupView.startEdit()">
                ✏️ Edit Answers
              </button>
              <button class="btn btn-secondary btn-sm" style="color: var(--accent-rose);" onclick="FunCheckupView.deleteData()">
                🗑️ Delete Data
              </button>
            </div>
          </div>

          <!-- Section 1: Squad & Allies -->
          <div style="font-size: 13px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>👯</span> Inner Squad & Allies
          </div>
          <div class="grid-3" style="margin-bottom: 20px;">
            <div class="fun-res-pill">
              <span class="fun-res-label">👯 Best Friend</span>
              <strong class="fun-res-val">${this.escapeHtml(data.best_friend || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">👦 Male Best Friend</span>
              <strong class="fun-res-val">${this.escapeHtml(data.male_best_friend || data.best_friend || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">👧 Female Best Friend</span>
              <strong class="fun-res-val">${this.escapeHtml(data.female_best_friend || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">😂 Makes You Laugh</span>
              <strong class="fun-res-val">${this.escapeHtml(data.makes_me_laugh || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">📱 Most Texted</span>
              <strong class="fun-res-val">${this.escapeHtml(data.most_texted || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">🫂 Bad-Day Friend</span>
              <strong class="fun-res-val">${this.escapeHtml(data.bad_day_friend || '—')}</strong>
            </div>
          </div>

          <!-- Section 2: Study Dynamics & Enemies -->
          <div style="font-size: 13px; font-weight: 700; color: var(--accent-purple); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>📚</span> Academic Front & Relaxation
          </div>
          <div class="grid-3" style="margin-bottom: 20px;">
            <div class="fun-res-pill">
              <span class="fun-res-label">📚 Study Buddy</span>
              <strong class="fun-res-val">${this.escapeHtml(data.study_buddy || '—')}</strong>
            </div>

            <div class="fun-res-pill" style="border-left-color: var(--accent-rose);">
              <span class="fun-res-label">💀 Biggest Enemy</span>
              <strong class="fun-res-val" style="color: #fca5a5;">${this.escapeHtml(data.biggest_subject_enemy || 'None 😎')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">🛡️ Exam Survival Ally</span>
              <strong class="fun-res-val">${this.escapeHtml(data.exam_survival_friend || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">🎮 Stress Buster</span>
              <strong class="fun-res-val">${relax.length > 0 ? relax.join(', ') : '—'}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">🏝️ Dream Free Day</span>
              <strong class="fun-res-val">${this.escapeHtml(data.free_day_activity || '—')}</strong>
            </div>

            <div class="fun-res-pill">
              <span class="fun-res-label">🤐 Secret Nickname</span>
              <strong class="fun-res-val">${this.escapeHtml(data.nickname || '—')}</strong>
            </div>
          </div>

          <!-- Section 3: Lore & Movie Title -->
          <div style="font-size: 13px; font-weight: 700; color: #f59e0b; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🎬</span> Campus Lore & Movie Saga
          </div>
          <div class="grid-2" style="margin-bottom: 24px;">
            <div class="fun-res-pill" style="border-left-color: #f59e0b;">
              <span class="fun-res-label">😂 Funniest College Moment</span>
              <strong class="fun-res-val">${this.escapeHtml(data.funniest_college_moment || '—')}</strong>
            </div>

            <div class="fun-res-pill" style="border-left-color: var(--accent-indigo);">
              <span class="fun-res-label">⚔️ Life Title (Movie/Anime)</span>
              <strong class="fun-res-val">${this.escapeHtml(data.life_title_movie || '—')}</strong>
            </div>
          </div>

          <!-- AI Playful Commentary -->
          <div style="background: rgba(56, 189, 248, 0.08); border-left: 3px solid var(--accent-cyan); padding: 16px 18px; border-radius: var(--radius-md); margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 16px;">🤖</span>
              <strong style="font-size: 13.5px; color: var(--accent-cyan);">AI Study Coach Analysis:</strong>
            </div>
            <p style="font-size: 13.5px; line-height: 1.6; color: var(--text-primary); font-style: italic;">
              "${data.ai_summary || 'Your study squad is locked in and ready for the semester!'}"
            </p>
          </div>

          <!-- Interactive Action Buttons -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="FunCheckupView.openAiChatWithContext()">
              🤖 Talk About Your Answers
            </button>
            <button class="btn btn-secondary" onclick="FunCheckupView.switchTab('random')">
              🎲 Open Full Question Hub
            </button>
          </div>
        </div>

        <!-- 🎲 COMBINED SECTION: Embedded Live AI Random Question Widget Directly on the Results Card -->
        <div class="card" id="embedded-random-widget" style="border-top: 4px solid var(--accent-purple); background: linear-gradient(135deg, rgba(26, 34, 52, 0.85), rgba(17, 24, 39, 0.95));">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px;">
            <div>
              <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
                <span>✨</span> Instant AI Random Question Break
              </div>
              <div class="card-subtitle">Roll fun questions anytime & get hilarious real-time AI coach feedback.</div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-roll-embedded" onclick="FunCheckupView.rollEmbeddedRandomQuestion()">
              🎲 Roll Question
            </button>
          </div>

          <div id="embedded-q-box" style="background: var(--bg-base); padding: 18px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-purple); margin-bottom: 16px;">
            <div style="text-align: center; color: var(--text-muted); font-size: 13.5px;">
              <span class="pulse-indicator"></span> Loading live AI question...
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label" style="font-size: 12px;">Your Quick Answer</label>
            <div style="display: flex; gap: 10px;">
              <input 
                type="text" 
                id="embedded-q-answer" 
                class="input" 
                placeholder="Type your funny answer..." 
                onkeydown="if(event.key==='Enter') FunCheckupView.submitEmbeddedRandomAnswer()" 
              />
              <button class="btn btn-primary" id="btn-submit-embedded" onclick="FunCheckupView.submitEmbeddedRandomAnswer()" style="white-space: nowrap;">
                Send ✨
              </button>
            </div>
          </div>

          <div id="embedded-q-reaction" style="display: none;" class="ai-reaction-bubble">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span>🤖</span>
              <strong style="font-size: 13px; color: var(--accent-cyan);">AI Study Coach Reaction:</strong>
            </div>
            <div id="embedded-reaction-text" class="ai-reaction-text"></div>
          </div>
        </div>

        <!-- Connection with Mind Break Games -->
        <div class="card" style="background: linear-gradient(135deg, rgba(26, 34, 52, 0.7), rgba(17, 24, 39, 0.9));">
          <div class="card-header">
            <div class="card-title">🧠 Ready for a Quick Mind Break?</div>
            <span class="badge badge-low">5-Min Focus Refresh</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
            Boost your reaction time, memory, or practice deep breathing before jumping back into study tasks.
          </p>
          <div class="grid-4" style="gap: 12px;">
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#mind-break'">🃏 Memory Game</button>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#mind-break'">⚡ Reaction Test</button>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#mind-break'">🧩 Pattern Challenge</button>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#mind-break'">🫁 Breathing Exercise</button>
          </div>
        </div>
      </div>
    `;

    // Load initial question for the embedded widget
    this.rollEmbeddedRandomQuestion();
  },

  startEdit() {
    this.isEditing = true;
    this.currentStep = 1;
    this.renderQuestionWizard();
  },

  cancelEdit() {
    this.isEditing = false;
    if (this.existingData) {
      this.renderResultCard(this.existingData);
    }
  },

  async deleteData() {
    if (!confirm('Are you sure you want to permanently delete your Fun Check-Up answers?')) return;

    try {
      await api.delete('/fun-checkup');
      this.existingData = null;
      this.answers = {
        best_friend: '',
        makes_me_laugh: '',
        most_texted: '',
        bad_day_friend: '',
        study_buddy: '',
        biggest_subject_enemy: '',
        relaxation_activities: [],
        exam_survival_friend: '',
        favorite_entertainment: '',
        nickname: '',
        male_best_friend: '',
        female_best_friend: '',
        funniest_college_moment: '',
        free_day_activity: '',
        life_title_movie: ''
      };
      this.currentStep = 1;
      this.isEditing = false;
      showToast('All Fun Check-Up data deleted successfully', 'info');
      this.renderQuestionWizard();
    } catch (e) {
      showToast('Could not delete data: ' + e.message, 'error');
    }
  },

  openAiChatWithContext() {
    window.location.hash = '#ai-agent';
    setTimeout(() => {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = "Tell me about my study squad and funny college moments 😂";
        input.focus();
      }
    }, 400);
  },

  // =========================================================================
  // TAB 2: DEDICATED AI RANDOM QUESTION HUB
  // =========================================================================
  async renderRandomQuestionHub(container) {
    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; animation: authFadeIn 0.3s ease;">
        
        <!-- Hub Card -->
        <div class="card" style="border-top: 4px solid var(--accent-purple); position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
            <div>
              <span class="badge badge-demo" style="margin-bottom: 6px;">⚡ Infinite Generator</span>
              <h3 style="font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                <span>🎲</span> AI Random Question Hub
              </h3>
              <p style="font-size: 13px; color: var(--text-secondary);">
                Dynamic questions enhanced by Gemini 1.5 Flash + Ollama Qwen3!
              </p>
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" id="btn-hub-roll" onclick="FunCheckupView.rollHubQuestion()">
                🎲 Roll Another
              </button>
            </div>
          </div>

          <!-- Dynamic Question Display Box -->
          <div id="hub-q-box" style="background: var(--bg-base); padding: 22px; border-radius: var(--radius-md); border-left: 4px solid var(--accent-cyan); margin-bottom: 20px;">
            <div style="text-align: center; color: var(--text-muted); font-size: 14px;">
              <span class="pulse-indicator"></span> Generating question...
            </div>
          </div>

          <!-- Quick Suggestion Pills -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
            <span style="font-size: 11.5px; color: var(--text-muted); align-self: center; font-weight: 600;">Quick Suggestions:</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setHubAnswer('100% True 😂')">100% True 😂</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setHubAnswer('Nobody 😭 (Solo Grinder)')">Nobody 😭</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setHubAnswer('Defending until graduation 🍿')">Defending until graduation 🍿</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="FunCheckupView.setHubAnswer('StudyFlow AI 🤖')">StudyFlow AI 🤖</button>
          </div>

          <!-- Answer Input Area -->
          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label" style="font-weight: 600;">Your Answer</label>
            <input 
              type="text" 
              id="hub-q-answer" 
              class="input" 
              placeholder="Type your witty answer here..." 
              onkeydown="if(event.key==='Enter') FunCheckupView.submitHubAnswer()"
            />
          </div>

          <!-- AI Reaction Response Box -->
          <div id="hub-q-reaction" style="display: none;" class="ai-reaction-bubble">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🤖</span>
                <strong style="font-size: 13.5px; color: var(--accent-cyan);">AI Study Coach Observation:</strong>
              </div>
              <span class="badge badge-low" style="font-size: 10.5px;">Live Evaluated</span>
            </div>
            <div id="hub-reaction-text" class="ai-reaction-text"></div>
          </div>

          <!-- Bottom Action Buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
            <button class="btn btn-secondary" onclick="FunCheckupView.rollHubQuestion()">
              🎲 Next Question
            </button>
            <button class="btn btn-primary" id="btn-hub-submit" onclick="FunCheckupView.submitHubAnswer()" style="min-width: 140px;">
              Submit Answer ✨
            </button>
          </div>
        </div>

        <!-- History of Answered Questions in this Session -->
        <div class="card" id="hub-history-card" style="${this.sessionHistory.length === 0 ? 'display: none;' : ''}">
          <div class="card-header">
            <div class="card-title" style="display: flex; align-items: center; gap: 8px;">
              <span>📜</span> Session Answered Questions (${this.sessionHistory.length})
            </div>
            <button class="btn btn-secondary btn-sm" onclick="FunCheckupView.clearSessionHistory()">Clear</button>
          </div>
          <div id="hub-history-list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
            ${this.renderHistoryItemsHtml()}
          </div>
        </div>
      </div>
    `;

    this.rollHubQuestion();
  },

  setHubAnswer(val) {
    const input = document.getElementById('hub-q-answer');
    if (input) {
      input.value = val;
      input.focus();
    }
  },

  renderHistoryItemsHtml() {
    return this.sessionHistory.map((item, idx) => `
      <div style="background: var(--bg-base); padding: 14px 16px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-purple);">
        <div style="font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
          ${this.escapeHtml(item.question)}
        </div>
        <div style="font-size: 13px; color: var(--accent-cyan); margin-bottom: 6px;">
          ✍️ <strong>Your Answer:</strong> ${this.escapeHtml(item.answer)}
        </div>
        <div style="font-size: 12.5px; color: var(--text-secondary); font-style: italic;">
          🤖 <strong>AI Coach:</strong> "${this.escapeHtml(item.reaction)}"
        </div>
      </div>
    `).join('');
  },

  clearSessionHistory() {
    this.sessionHistory = [];
    const card = document.getElementById('hub-history-card');
    if (card) card.style.display = 'none';
  },

  async rollHubQuestion() {
    const box = document.getElementById('hub-q-box');
    const input = document.getElementById('hub-q-answer');
    const reactionEl = document.getElementById('hub-q-reaction');
    const rollBtn = document.getElementById('btn-hub-roll');

    if (rollBtn) rollBtn.disabled = true;
    if (reactionEl) reactionEl.style.display = 'none';
    if (input) {
      input.value = '';
      input.focus();
    }

    if (box) {
      box.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 13.5px;">
          <div class="pulse-indicator"></div> Generating fresh question...
        </div>
      `;
    }

    try {
      const res = await api.get('/fun-checkup/random-question');
      this.embeddedRandomQ = res.question;

      if (box) {
        box.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 26px;">${res.question.emoji || '🎲'}</span>
            <span class="badge badge-low" style="font-size: 11px;">${this.escapeHtml(res.question.provider || 'AI Powered')}</span>
          </div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); line-height: 1.4;">
            "${this.escapeHtml(res.question.question)}"
          </div>
        `;
      }

      if (input && res.question.placeholder) {
        input.placeholder = res.question.placeholder;
      }
    } catch (e) {
      if (box) {
        box.innerHTML = `<div style="color: var(--accent-rose);">Could not load question. Please try rolling again.</div>`;
      }
    } finally {
      if (rollBtn) rollBtn.disabled = false;
    }
  },

  async submitHubAnswer() {
    if (!this.embeddedRandomQ || !this.embeddedRandomQ.question) {
      showToast('Please roll a question first!', 'info');
      return;
    }

    const input = document.getElementById('hub-q-answer');
    const ans = input ? input.value.trim() : '';

    if (!ans) {
      showToast('Type an answer or roll another question!', 'info');
      if (input) input.focus();
      return;
    }

    const submitBtn = document.getElementById('btn-hub-submit');
    const reactionEl = document.getElementById('hub-q-reaction');
    const reactionText = document.getElementById('hub-reaction-text');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Analyzing... ⚡';
    }

    try {
      const res = await api.post('/fun-checkup/react', {
        question: this.embeddedRandomQ.question,
        answer: ans
      });

      const reaction = res.reaction || "😂 That's an legendary answer!";
      if (reactionText) reactionText.innerText = reaction;
      if (reactionEl) reactionEl.style.display = 'block';

      // Save to session history
      this.sessionHistory.unshift({
        question: this.embeddedRandomQ.question,
        answer: ans,
        reaction: reaction
      });

      // Update history UI
      const historyCard = document.getElementById('hub-history-card');
      const historyList = document.getElementById('hub-history-list');
      if (historyCard) historyCard.style.display = 'block';
      if (historyList) historyList.innerHTML = this.renderHistoryItemsHtml();

      playAudioChime('success');
      showToast('✨ Answer Evaluated by AI Coach! (+10 XP)', 'success');
    } catch (e) {
      showToast('Could not evaluate answer: ' + e.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Answer ✨';
      }
    }
  },

  // =========================================================================
  // EMBEDDED WIDGET (Inside Result Card)
  // =========================================================================
  async rollEmbeddedRandomQuestion() {
    const box = document.getElementById('embedded-q-box');
    const input = document.getElementById('embedded-q-answer');
    const reactionEl = document.getElementById('embedded-q-reaction');
    const rollBtn = document.getElementById('btn-roll-embedded');

    if (rollBtn) rollBtn.disabled = true;
    if (reactionEl) reactionEl.style.display = 'none';
    if (input) {
      input.value = '';
    }

    if (box) {
      box.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px;">
          <div class="pulse-indicator"></div> Loading question...
        </div>
      `;
    }

    try {
      const res = await api.get('/fun-checkup/random-question');
      this.embeddedRandomQ = res.question;

      if (box) {
        box.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span style="font-size: 20px;">${res.question.emoji || '🎲'}</span>
            <strong style="font-size: 14.5px; color: var(--text-primary);">"${this.escapeHtml(res.question.question)}"</strong>
          </div>
        `;
      }
      if (input && res.question.placeholder) {
        input.placeholder = res.question.placeholder;
      }
    } catch (e) {
      if (box) box.innerHTML = `<div style="color: var(--accent-rose);">Click roll to load question.</div>`;
    } finally {
      if (rollBtn) rollBtn.disabled = false;
    }
  },

  async submitEmbeddedRandomAnswer() {
    if (!this.embeddedRandomQ || !this.embeddedRandomQ.question) return;

    const input = document.getElementById('embedded-q-answer');
    const ans = input ? input.value.trim() : '';
    if (!ans) {
      showToast('Type an answer first!', 'info');
      return;
    }

    const btn = document.getElementById('btn-submit-embedded');
    const reactionEl = document.getElementById('embedded-q-reaction');
    const reactionText = document.getElementById('embedded-reaction-text');

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Sending...';
    }

    try {
      const res = await api.post('/fun-checkup/react', {
        question: this.embeddedRandomQ.question,
        answer: ans
      });

      if (reactionText) reactionText.innerText = res.reaction || "😂 That is legendary!";
      if (reactionEl) reactionEl.style.display = 'block';
      playAudioChime('success');
      showToast('Answer evaluated! ✨', 'success');
    } catch (e) {
      showToast('Could not get reaction: ' + e.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Send ✨';
      }
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
