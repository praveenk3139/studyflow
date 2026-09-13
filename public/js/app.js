// StudyFlow AI - Main Router & State Controller
const App = {
  currentUser: null,
  currentProfile: null,

  routes: {
    'dashboard': DashboardView,
    'admin': AdminView,
    'fun-checkup': FunCheckupView,
    'ai-agent': AiAgentView,
    'pdf-lab': PdfLabView,
    'question-papers': QuestionPapersView,
    'important-questions': ImportantQuestionsView,
    'tests': TestsView,
    'planner': PlannerView,
    'focus-shield': FocusShieldView,
    'wellness': WellnessView,
    'mind-break': MindBreakView,
    'social': SocialView,
    'analytics': AnalyticsView,
    'settings': SettingsView
  },

  async init() {
    // 1. Setup hash routing
    window.addEventListener('hashchange', () => {
      if (this.currentUser) {
        this.handleRoute();
      }
    });

    // 2. Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.currentUser) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.location.hash = '#ai-agent';
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        window.location.hash = '#mind-break';
      }
    });

    // 3. Setup periodic health & hydration reminders
    setInterval(() => {
      if (this.currentUser) {
        this.checkPeriodicReminders();
      }
    }, 55 * 60 * 1000);

    // 4. Verify existing session token or present Login / Register Screen
    if (api.token) {
      try {
        const me = await api.get('/auth/me');
        if (me && me.user) {
          this.onAuthenticated(me.user, me.profile);
          return;
        }
      } catch (err) {
        console.warn('Existing session invalid or expired, presenting login portal');
        api.setToken(null);
      }
    }

    // Default: Show Login Page first!
    this.showAuthScreen();
  },

  showAuthScreen() {
    this.currentUser = null;
    this.currentProfile = null;

    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');

    if (appContainer) appContainer.style.display = 'none';
    if (authScreen) {
      authScreen.style.display = 'block';
      AuthView.render();
    }
  },

  onAuthenticated(user, profile) {
    this.currentUser = user;
    this.currentProfile = profile;

    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');

    if (authScreen) authScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';

    this.refreshUserHeader();
    this.handleRoute();
  },

  logout() {
    api.setToken(null);
    showToast('You have signed out successfully', 'info');
    this.showAuthScreen();
  },

  handleRoute() {
    let hash = window.location.hash.slice(1);
    if (!hash || hash.startsWith('access_token')) {
      hash = 'dashboard';
    }

    // Handle query params in hash if any
    const [routeKey] = hash.split('?');
    const view = this.routes[routeKey] || this.routes['dashboard'];

    // Update active state in sidebar and mobile nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('href') === `#${routeKey}`) {
        el.classList.add('active');
      }
    });

    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.remove('active');
      if (el.getAttribute('href') === `#${routeKey}`) {
        el.classList.add('active');
      }
    });

    // Close mobile sidebar if open
    document.getElementById('sidebar').classList.remove('open');

    // Render corresponding view
    view.render();
    window.scrollTo(0, 0);
  },

  async refreshUserHeader() {
    try {
      const res = await api.get('/auth/me');
      const user = res.profile || { full_name: 'Alex Mercer' };
      const stats = res.stats || { xp: 1450, streak_days: 7 };
      const role = (res.user && res.user.role) || (this.currentUser && this.currentUser.role) || 'student';
      const isAdmin = role === 'admin' || user.full_name === 'Praveen Kumar';

      const nameEl = document.getElementById('header-user-name');
      if (nameEl) nameEl.innerText = user.full_name || (isAdmin ? 'Praveen Kumar' : 'Student');

      const subEl = document.getElementById('header-user-sub');
      if (subEl) {
        if (isAdmin) {
          subEl.innerHTML = `<span style="color: #f59e0b; font-weight: 700;">👑 Super Administrator</span>`;
        } else {
          const subDetails = [user.department, user.college].filter(Boolean).join(' • ');
          subEl.innerText = subDetails || 'Student Profile';
        }
      }

      const avatarEl = document.getElementById('header-user-avatar');
      if (avatarEl) {
        avatarEl.innerText = isAdmin ? '👑' : (user.full_name || 'S').charAt(0).toUpperCase();
        if (isAdmin) avatarEl.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
      }

      const streakEl = document.getElementById('header-streak-count');
      if (streakEl) streakEl.innerText = `${stats.streak_days || 1}d`;

      const xpEl = document.getElementById('header-xp-count');
      if (xpEl) xpEl.innerText = `${(stats.xp || 0).toLocaleString()} XP`;

      // Show/hide admin link in sidebar
      const adminNav = document.getElementById('nav-admin-link');
      if (adminNav) {
        adminNav.style.display = 'flex'; // Visible for easy access
        if (isAdmin) {
          adminNav.classList.add('nav-item-highlight');
        }
      }
    } catch (e) {}
  },

  toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
  },

  checkPeriodicReminders() {
    showToast('💧 Hydration Reminder: You have been studying for 55 minutes. Consider taking a short break and drinking water.', 'info', 6000);
    playAudioChime('water');
  },

  openNotificationsModal() {
    api.get('/wellness/summary').then(w => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 460px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 17px; font-weight: 700;">🔔 Notifications & Schedule Alerts</h3>
            <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="background: var(--bg-base); padding: 12px 14px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-cyan);">
              <strong style="font-size: 13px; color: var(--accent-cyan);">Strict Study Plan Active</strong>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Task: AVL Trees - Rotations & Balancing (34m remaining).
              </div>
            </div>

            <div style="background: var(--bg-base); padding: 12px 14px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-amber);">
              <strong style="font-size: 13px; color: var(--accent-amber);">Protected Meal Schedule</strong>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                ${w.next_meal.meal_type} scheduled at ${w.next_meal.scheduled_time}. StudyFlow will alert you 10 minutes prior.
              </div>
            </div>

            <div style="background: var(--bg-base); padding: 12px 14px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-purple);">
              <strong style="font-size: 13px; color: var(--accent-purple);">Exam Approaching</strong>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                Data Structures examination in 12 days. 4 high-priority topics pending revision.
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    });
  }
};

// Initialize Application when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
