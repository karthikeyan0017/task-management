import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from './toast.js';
import { CONFIG } from '../config.js';

class AuthModal {
  constructor() {
    this.modalEl = null;
    this.mode = 'login'; // 'login' or 'register'
    this.init();
  }

  init() {
    let modal = document.getElementById('auth-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'auth-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }
    this.modalEl = modal;

    // Close on backdrop click
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
  }

  open(initialMode = 'login') {
    this.mode = initialMode;
    this.render();
    this.modalEl.classList.add('open');
  }

  close() {
    this.modalEl.classList.remove('open');
  }

  render() {
    const isLogin = this.mode === 'login';

    this.modalEl.innerHTML = `
      <div class="modal-dialog animate-fade-in" style="max-width: 440px;">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 class="modal-title">${isLogin ? 'Sign In to TaskFlow' : 'Create an Account'}</h3>
          </div>
          <button class="btn-icon" id="auth-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form id="auth-form" class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
          ${!isLogin ? `
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="auth-fullname">Full Name</label>
              <input class="form-input" id="auth-fullname" type="text" placeholder="e.g. Alex Morgan" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="auth-username">Username</label>
              <input class="form-input" id="auth-username" type="text" placeholder="e.g. alexm" required />
            </div>
          ` : ''}

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="auth-email">Email Address</label>
            <input class="form-input" id="auth-email" type="email" placeholder="name@company.com" required value="${isLogin ? CONFIG.DEFAULT_DEMO_USER.email : ''}" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="auth-password">Password</label>
            <input class="form-input" id="auth-password" type="password" placeholder="••••••••" required value="${isLogin ? CONFIG.DEFAULT_DEMO_USER.password : ''}" />
          </div>

          <div id="auth-error-msg" style="display: none; padding: 10px; border-radius: var(--radius-sm); background: rgba(239, 68, 68, 0.15); border: 1px solid var(--danger); color: var(--danger); font-size: 0.82rem;"></div>

          <button type="submit" class="btn btn-primary" id="auth-submit-btn" style="width: 100%; height: 42px; margin-top: 6px;">
            ${isLogin ? 'Sign In' : 'Create Account'}
          </button>

          ${isLogin ? `
            <div style="position: relative; text-align: center; margin: 6px 0;">
              <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-subtle);"></div>
              <span style="position: relative; background: var(--bg-surface); padding: 0 10px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Or 1-Click Demo</span>
            </div>

            <button type="button" class="btn btn-secondary" id="auth-demo-btn" style="width: 100%; height: 40px;">
              ⚡ Quick Sign In as Demo User
            </button>
          ` : ''}

          <div style="text-align: center; font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
            ${isLogin
              ? `Don't have an account? <a href="#" id="auth-switch-mode" style="color: var(--primary-light); font-weight: 600;">Sign up</a>`
              : `Already registered? <a href="#" id="auth-switch-mode" style="color: var(--primary-light); font-weight: 600;">Sign in</a>`}
          </div>
        </form>
      </div>
    `;

    // Event listeners
    this.modalEl.querySelector('#auth-close-btn').onclick = () => this.close();

    const switchBtn = this.modalEl.querySelector('#auth-switch-mode');
    if (switchBtn) {
      switchBtn.onclick = (e) => {
        e.preventDefault();
        this.mode = this.mode === 'login' ? 'register' : 'login';
        this.render();
      };
    }

    const demoBtn = this.modalEl.querySelector('#auth-demo-btn');
    if (demoBtn) {
      demoBtn.onclick = () => this.handleDemoLogin();
    }

    const form = this.modalEl.querySelector('#auth-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleSubmit();
    };
  }

  async handleDemoLogin() {
    try {
      const res = await api.post('/auth/login', CONFIG.DEFAULT_DEMO_USER);
      state.setAuth(res.user, res.token);
      toast.success(`Welcome back, ${res.user.full_name}!`);
      this.close();
    } catch (err) {
      this.showError(err.message || 'Demo login failed');
    }
  }

  async handleSubmit() {
    const errorEl = this.modalEl.querySelector('#auth-error-msg');
    const submitBtn = this.modalEl.querySelector('#auth-submit-btn');
    errorEl.style.display = 'none';

    const email = this.modalEl.querySelector('#auth-email').value.trim();
    const password = this.modalEl.querySelector('#auth-password').value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      let res;
      if (this.mode === 'login') {
        res = await api.post('/auth/login', { email, password });
      } else {
        const fullName = this.modalEl.querySelector('#auth-fullname').value.trim();
        const username = this.modalEl.querySelector('#auth-username').value.trim();
        res = await api.post('/auth/register', {
          fullName,
          username,
          email,
          password
        });
      }

      state.setAuth(res.user, res.token);
      toast.success(this.mode === 'login' ? `Welcome back, ${res.user.full_name}!` : `Account created! Welcome, ${res.user.full_name}!`);
      this.close();
    } catch (err) {
      this.showError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.mode === 'login' ? 'Sign In' : 'Create Account';
    }
  }

  showError(msg) {
    const errorEl = this.modalEl.querySelector('#auth-error-msg');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }
}

export const authModal = new AuthModal();
