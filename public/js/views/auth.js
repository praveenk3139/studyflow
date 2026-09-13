// StudyFlow AI - Authentication View (Login & User Registration)
const AuthView = {
  currentTab: 'login', // 'login' | 'signup'

  render() {
    const authScreen = document.getElementById('auth-screen');
    if (!authScreen) return;

    authScreen.innerHTML = `
      <div class="auth-wrapper">
        <!-- Floating Ambient Glow Elements -->
        <div class="auth-glow glow-1"></div>
        <div class="auth-glow glow-2"></div>
        <div class="auth-glow glow-3"></div>

        <div class="auth-container">
          <!-- Brand Showcase Side (Desktop Left) -->
          <div class="auth-hero-panel">
            <div class="auth-brand">
              <div class="auth-brand-logo">⚡</div>
              <div>
                <h1 class="auth-brand-title">STUDYFLOW AI</h1>
                <p class="auth-brand-tagline">Study • Focus • Wellness</p>
              </div>
            </div>

            <div class="auth-hero-content">
              <h2 class="auth-hero-heading">Study Smarter.<br/><span class="text-gradient-cyan">Stay Focused.</span><br/>Stay Healthy.</h2>
              <p class="auth-hero-desc">
                The all-in-one student platform combining AI reasoning, exam paper analysis, strict study scheduling, and wearable health wellness.
              </p>

              <div class="auth-feature-list">
                <div class="auth-feature-item">
                  <span class="auth-feat-icon">🤖</span>
                  <div>
                    <strong>AI Study Coach & PDF Lab</strong>
                    <p>Instant syllabus breakdown, flashcards, and step-by-step doubt solver.</p>
                  </div>
                </div>

                <div class="auth-feature-item">
                  <span class="auth-feat-icon">🛡️</span>
                  <div>
                    <strong>Distraction Shield</strong>
                    <p>Blocks social algorithms, infinite feeds, and keeps you strictly locked on target.</p>
                  </div>
                </div>

                <div class="auth-feature-item">
                  <span class="auth-feat-icon">💧</span>
                  <div>
                    <strong>Hydration & Sleep Balance</strong>
                    <p>Guards your physical wellness with mindful break reminders and meal schedules.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="auth-hero-footer">
              <div class="auth-badge">🎓 Built for Top Students & Academic Excellence</div>
            </div>
          </div>

          <!-- Auth Form Card (Right Side) -->
          <div class="auth-card-panel">
            <div class="auth-card">
              <!-- Auth Tabs -->
              <div class="auth-tabs">
                <button type="button" class="auth-tab ${this.currentTab === 'login' ? 'active' : ''}" onclick="AuthView.switchTab('login')">
                  <span>🔑</span> Sign In
                </button>
                <button type="button" class="auth-tab ${this.currentTab === 'signup' ? 'active' : ''}" onclick="AuthView.switchTab('signup')">
                  <span>✨</span> Create Account
                </button>
              </div>

              <!-- Inline Alert Message Box -->
              <div id="auth-alert" class="auth-alert" style="display: none;"></div>

              <!-- 1. LOGIN FORM -->
              <div id="login-form-view" style="${this.currentTab === 'login' ? 'display: block;' : 'display: none;'}">
                <div class="auth-header">
                  <h3 class="auth-title">Welcome Back! 👋</h3>
                  <p class="auth-subtitle">Enter your student username or email and password.</p>
                </div>

                <form id="form-login" onsubmit="AuthView.handleLogin(event)">
                  <div class="form-group">
                    <label class="form-label" for="login-identifier">Username or Email</label>
                    <div class="input-with-icon">
                      <span class="input-icon">👤</span>
                      <input 
                        type="text" 
                        id="login-identifier" 
                        class="auth-input" 
                        placeholder="e.g. alex.student or student@university.edu" 
                        required 
                        autocomplete="username"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <label class="form-label" for="login-password" style="margin-bottom: 0;">Password</label>
                      <a href="javascript:void(0)" onclick="AuthView.showForgotPasswordModal()" class="auth-link-sm">Forgot password?</a>
                    </div>
                    <div class="input-with-icon">
                      <span class="input-icon">🔒</span>
                      <input 
                        type="password" 
                        id="login-password" 
                        class="auth-input" 
                        placeholder="••••••••" 
                        required 
                        autocomplete="current-password"
                      />
                      <button type="button" class="btn-toggle-pw" onclick="AuthView.togglePasswordVisibility('login-password', this)" title="Toggle password visibility">
                        👁️
                      </button>
                    </div>
                  </div>

                  <div class="form-group-checkbox">
                    <label class="checkbox-label">
                      <input type="checkbox" id="login-remember" checked />
                      <span>Remember this browser</span>
                    </label>
                  </div>

                  <button type="submit" id="btn-login-submit" class="btn-auth-submit">
                    <span class="btn-text">Sign In to StudyFlow</span>
                    <span class="btn-icon">➔</span>
                  </button>
                </form>

                <!-- Demo Account Quick Fill Helper -->
                <div class="auth-divider">
                  <span>OR 1-CLICK QUICK ACCESS</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <button type="button" class="btn-demo-account" onclick="AuthView.fillAdminCredentials()" style="border-left: 3px solid #f59e0b; background: rgba(245, 158, 11, 0.08);">
                    <span class="demo-icon">👑</span>
                    <div>
                      <strong style="color: #fde68a;">Sign in as Admin (Praveen Kumar)</strong>
                      <div class="demo-sub">User: <code>praveen</code> • Role: <code>Super Administrator</code></div>
                    </div>
                  </button>

                  <button type="button" class="btn-demo-account" onclick="AuthView.fillDemoCredentials()">
                    <span class="demo-icon">⚡</span>
                    <div>
                      <strong>Sign in as Student (Alex Mercer)</strong>
                      <div class="demo-sub">User: <code>alex.student</code> • Pass: <code>StudyFlow2026!</code></div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 2. SIGN UP / CREATE USER FORM -->
              <div id="signup-form-view" style="${this.currentTab === 'signup' ? 'display: block;' : 'display: none;'}">
                <div class="auth-header">
                  <h3 class="auth-title">Create Student Account 🚀</h3>
                  <p class="auth-subtitle">Join StudyFlow AI to supercharge your study routine.</p>
                </div>

                <form id="form-signup" onsubmit="AuthView.handleSignup(event)">
                  <div class="grid-2-form">
                    <div class="form-group">
                      <label class="form-label" for="signup-username">Username <span class="required">*</span></label>
                      <div class="input-with-icon">
                        <span class="input-icon">@</span>
                        <input 
                          type="text" 
                          id="signup-username" 
                          class="auth-input" 
                          placeholder="e.g. john_doe" 
                          required 
                          autocomplete="username"
                        />
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="signup-fullname">Full Name <span class="required">*</span></label>
                      <div class="input-with-icon">
                        <span class="input-icon">👤</span>
                        <input 
                          type="text" 
                          id="signup-fullname" 
                          class="auth-input" 
                          placeholder="e.g. John Doe" 
                          required
                          autocomplete="name"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="signup-email">Email Address <span class="required">*</span></label>
                    <div class="input-with-icon">
                      <span class="input-icon">✉️</span>
                      <input 
                        type="email" 
                        id="signup-email" 
                        class="auth-input" 
                        placeholder="e.g. john@university.edu" 
                        required 
                        autocomplete="email"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label" for="signup-password">Password <span class="required">*</span></label>
                    <div class="input-with-icon">
                      <span class="input-icon">🔒</span>
                      <input 
                        type="password" 
                        id="signup-password" 
                        class="auth-input" 
                        placeholder="Create a strong password (min 6 characters)" 
                        required 
                        minlength="6"
                        autocomplete="new-password"
                        oninput="AuthView.checkPasswordStrength(this.value)"
                      />
                      <button type="button" class="btn-toggle-pw" onclick="AuthView.togglePasswordVisibility('signup-password', this)" title="Toggle password visibility">
                        👁️
                      </button>
                    </div>
                    <div id="pw-strength-bar" class="pw-strength-bar">
                      <div id="pw-strength-fill" class="pw-strength-fill"></div>
                    </div>
                    <div id="pw-strength-text" class="pw-strength-text"></div>
                  </div>

                  <div class="grid-2-form">
                    <div class="form-group">
                      <label class="form-label" for="signup-college">College / University</label>
                      <div class="input-with-icon">
                        <span class="input-icon">🏛️</span>
                        <input 
                          type="text" 
                          id="signup-college" 
                          class="auth-input" 
                          placeholder="e.g. Stanford / IIT / MIT" 
                        />
                      </div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" for="signup-dept">Department & Year</label>
                      <div class="input-with-icon">
                        <span class="input-icon">📚</span>
                        <input 
                          type="text" 
                          id="signup-dept" 
                          class="auth-input" 
                          placeholder="e.g. CS - Year 2 Sem 4" 
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" id="btn-signup-submit" class="btn-auth-submit btn-signup">
                    <span class="btn-text">Create Account & Get Started</span>
                    <span class="btn-icon">✨</span>
                  </button>
                </form>
              </div>

              <!-- Footer note -->
              <div class="auth-footer-text">
                <span id="auth-switch-text">
                  ${this.currentTab === 'login' ? "Don't have an account? " : "Already have an account? "}
                </span>
                <a href="javascript:void(0)" onclick="AuthView.switchTab('${this.currentTab === 'login' ? 'signup' : 'login'}')" class="auth-link-bold">
                  ${this.currentTab === 'login' ? 'Create one now' : 'Sign In'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.render();
    this.clearAlert();
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerText = '🙈';
    } else {
      input.type = 'password';
      btn.innerText = '👁️';
    }
  },

  checkPasswordStrength(pw) {
    const fill = document.getElementById('pw-strength-fill');
    const text = document.getElementById('pw-strength-text');
    if (!fill || !text) return;

    if (!pw) {
      fill.style.width = '0%';
      text.innerText = '';
      return;
    }

    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) {
      fill.style.width = '33%';
      fill.style.backgroundColor = 'var(--accent-rose)';
      text.innerText = 'Strength: Weak';
      text.style.color = 'var(--accent-rose)';
    } else if (score <= 4) {
      fill.style.width = '66%';
      fill.style.backgroundColor = 'var(--accent-amber)';
      text.innerText = 'Strength: Moderate';
      text.style.color = 'var(--accent-amber)';
    } else {
      fill.style.width = '100%';
      fill.style.backgroundColor = 'var(--accent-emerald)';
      text.innerText = 'Strength: Strong 🛡️';
      text.style.color = 'var(--accent-emerald)';
    }
  },

  fillAdminCredentials() {
    const identifierInput = document.getElementById('login-identifier');
    const passwordInput = document.getElementById('login-password');
    if (identifierInput) identifierInput.value = 'praveen';
    if (passwordInput) passwordInput.value = 'praveen1732@';
    this.showAlert('Admin credentials filled (Praveen Kumar)! Click "Sign In" or press Enter.', 'info');
  },

  fillDemoCredentials() {
    const identifierInput = document.getElementById('login-identifier');
    const passwordInput = document.getElementById('login-password');
    if (identifierInput) identifierInput.value = 'alex.student';
    if (passwordInput) passwordInput.value = 'StudyFlow2026!';
    this.showAlert('Demo credentials filled! Click "Sign In" or press Enter.', 'info');
  },

  showAlert(message, type = 'error') {
    const alertEl = document.getElementById('auth-alert');
    if (!alertEl) return;
    alertEl.className = `auth-alert alert-${type}`;
    alertEl.innerHTML = `
      <span>${type === 'error' ? '⚠️' : type === 'success' ? '✅' : '💡'}</span>
      <div>${message}</div>
    `;
    alertEl.style.display = 'flex';
  },

  clearAlert() {
    const alertEl = document.getElementById('auth-alert');
    if (alertEl) alertEl.style.display = 'none';
  },

  async handleLogin(e) {
    e.preventDefault();
    this.clearAlert();

    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-login-submit');

    if (!identifier || !password) {
      this.showAlert('Please provide both username/email and password.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      submitBtn.querySelector('.btn-text').innerText = 'Verifying credentials...';
    }

    try {
      const res = await api.post('/auth/login', { identifier, password });

      if (res.token) {
        api.setToken(res.token);
        showToast(`Welcome back, ${res.profile?.full_name || res.user?.username}!`, 'success');
        playAudioChime('success');
        App.onAuthenticated(res.user, res.profile);
      } else {
        throw new Error('No authentication token received from server');
      }
    } catch (err) {
      this.showAlert(err.message || 'Login failed. Please check your credentials.');
      playAudioChime('error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('.btn-text').innerText = 'Sign In to StudyFlow';
      }
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    this.clearAlert();

    const username = document.getElementById('signup-username').value.trim();
    const full_name = document.getElementById('signup-fullname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const college = document.getElementById('signup-college')?.value.trim() || '';
    const department = document.getElementById('signup-dept')?.value.trim() || '';
    const submitBtn = document.getElementById('btn-signup-submit');

    if (!username || !email || !password || !full_name) {
      this.showAlert('Username, Full Name, Email, and Password are required.');
      return;
    }

    if (password.length < 6) {
      this.showAlert('Password must be at least 6 characters long.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      submitBtn.querySelector('.btn-text').innerText = 'Creating account...';
    }

    try {
      const res = await api.post('/auth/signup', {
        username,
        full_name,
        email,
        password,
        college,
        department,
        year_semester: department
      });

      if (res.token) {
        api.setToken(res.token);
        showToast(`Account created! Welcome to StudyFlow AI, ${full_name}! 🌟`, 'success', 4500);
        playAudioChime('success');
        App.onAuthenticated(res.user, { full_name, college, department });
      } else {
        throw new Error('Registration completed but no token returned');
      }
    } catch (err) {
      this.showAlert(err.message || 'Registration failed. Username or email might be taken.');
      playAudioChime('error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('.btn-text').innerText = 'Create Account & Get Started';
      }
    }
  },

  showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 440px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 700;">🔑 Reset Student Password</h3>
          <button class="btn btn-secondary btn-sm" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          Enter your registered student email address. We will verify and simulate sending reset instructions.
        </p>
        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label">Registered Email</label>
          <input type="email" id="reset-email" class="input" placeholder="student@university.edu" />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="AuthView.sendPasswordReset(this)">Send Reset Link</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async sendPasswordReset(btn) {
    const email = document.getElementById('reset-email')?.value.trim();
    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }
    btn.disabled = true;
    btn.innerText = 'Sending...';
    try {
      const res = await api.post('/auth/forgot-password', { email });
      showToast(res.message, 'success', 5000);
      btn.closest('.modal-overlay')?.remove();
    } catch (e) {
      btn.disabled = false;
      btn.innerText = 'Send Reset Link';
    }
  }
};
