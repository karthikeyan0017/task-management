import { state } from './state.js';
import { api } from './api.js';
import { wsClient } from './websocket.js';
import { kanbanBoard } from './components/kanbanBoard.js';
import { taskList } from './components/taskList.js';
import { analyticsView } from './components/analyticsView.js';
import { activityFeed } from './components/activityFeed.js';
import { taskModal } from './components/taskModal.js';
import { authModal } from './components/authModal.js';
import { toast } from './components/toast.js';

class App {
  async init() {
    console.log('[TaskFlow] Initializing application...');

    // 1. Theme Setup
    this.initTheme();

    // 2. Auth Session Check
    await this.checkAuthSession();

    // 3. Connect WebSocket
    wsClient.connect();

    // 4. Mount View Components
    kanbanBoard.mount(document.getElementById('view-kanban'));
    taskList.mount(document.getElementById('view-list'));
    analyticsView.mount(document.getElementById('view-analytics'));
    activityFeed.mount(document.getElementById('view-activity'));

    // 5. Load Initial Tasks & Stats
    await this.loadInitialData();

    // 6. Bind Global Listeners & Navigation
    this.bindNavigation();
    this.bindFilters();
    this.bindShortcuts();
    this.bindUserUI();
    this.bindLiveStatus();

    console.log('[TaskFlow] Application ready!');
  }

  initTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.onclick = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('taskflow_theme', newTheme);
        this.updateThemeButton(newTheme);
      };
    }
  }

  updateThemeButton(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      btn.title = 'Switch to Light Mode';
    } else {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      btn.title = 'Switch to Dark Mode';
    }
  }

  async checkAuthSession() {
    const token = state.getState().token;
    if (token) {
      try {
        const res = await api.get('/auth/me');
        if (res.user) {
          state.setAuth(res.user, token);
        }
      } catch {
        state.setAuth(null, null);
      }
    }
  }

  async loadInitialData() {
    try {
      const res = await api.get('/tasks');
      if (res && res.tasks) {
        state.setTasks(res.tasks);
        this.updateTagsCloud(res.tasks);
      }
    } catch (err) {
      console.error('[TaskFlow] Error loading tasks:', err);
      toast.error('Could not load tasks from server.');
    }
  }

  updateTagsCloud(tasks) {
    const tagContainer = document.getElementById('sidebar-tags-container');
    if (!tagContainer) return;

    const tagCounts = {};
    tasks.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const activeTag = state.getState().filters.tag;

    tagContainer.innerHTML = `
      <div class="tag-filter-chip ${activeTag === 'all' ? 'active' : ''}" data-tag="all">All</div>
      ${Object.keys(tagCounts).map(tag => `
        <div class="tag-filter-chip ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag} (${tagCounts[tag]})</div>
      `).join('')}
    `;

    tagContainer.querySelectorAll('.tag-filter-chip').forEach(chip => {
      chip.onclick = () => {
        const tag = chip.dataset.tag;
        state.setFilter('tag', tag);
        this.updateTagsCloud(state.getState().tasks);
      };
    });
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('[data-view-target]');
    navItems.forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        const targetView = item.dataset.viewTarget;
        this.switchView(targetView);

        // Close mobile drawer if open
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sidebar) sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
      };
    });

    // Mobile Hamburger
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (menuBtn && sidebar && backdrop) {
      menuBtn.onclick = () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('open');
      };

      backdrop.onclick = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      };
    }
  }

  switchView(viewName) {
    state.setView(viewName);

    // Update nav active classes
    document.querySelectorAll('[data-view-target]').forEach(el => {
      if (el.dataset.viewTarget === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update visible panel
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`view-${viewName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  }

  bindFilters() {
    // Search input
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.oninput = (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.setFilter('search', e.target.value);
        }, 200);
      };
    }

    // Quick Scope Filters (All vs Assigned to Me)
    document.querySelectorAll('[data-scope-filter]').forEach(btn => {
      btn.onclick = () => {
        const scope = btn.dataset.scopeFilter;
        document.querySelectorAll('[data-scope-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.setFilter('scope', scope);
      };
    });

    // Priority quick filters
    document.querySelectorAll('[data-priority-filter]').forEach(btn => {
      btn.onclick = () => {
        const prio = btn.dataset.priorityFilter;
        document.querySelectorAll('[data-priority-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.setFilter('priority', prio);
      };
    });

    // Header "+ New Task" button
    const newTaskBtn = document.getElementById('header-new-task-btn');
    if (newTaskBtn) {
      newTaskBtn.onclick = () => taskModal.open();
    }
  }

  bindShortcuts() {
    window.addEventListener('keydown', (e) => {
      // If user is typing in an input or textarea, don't trigger global hotkeys
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') {
          taskModal.close();
          authModal.close();
        }
        return;
      }

      // '/' to focus search
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // 'N' or 'n' to open new task
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        taskModal.open();
      }

      // 'Escape' to close modals
      if (e.key === 'Escape') {
        taskModal.close();
        authModal.close();
      }
    });
  }

  bindUserUI() {
    const userContainer = document.getElementById('sidebar-user-container');
    const updateUI = () => {
      const user = state.getState().user;
      if (!userContainer) return;

      if (user) {
        const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
        userContainer.innerHTML = `
          <div class="user-profile-card" id="user-profile-trigger">
            <div class="user-avatar-group">
              <div class="user-avatar-circle" style="background-color: ${user.avatar_color || '#6366f1'};">${initial}</div>
              <div class="user-meta">
                <div class="user-name-text">${user.full_name}</div>
                <div class="user-email-text">${user.email}</div>
              </div>
            </div>
            <button id="logout-btn" title="Sign Out" style="color: var(--text-muted); padding: 4px; border-radius: 4px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        `;

        const logoutBtn = userContainer.querySelector('#logout-btn');
        if (logoutBtn) {
          logoutBtn.onclick = (e) => {
            e.stopPropagation();
            state.setAuth(null, null);
            toast.info('Signed out successfully.');
          };
        }
      } else {
        userContainer.innerHTML = `
          <button class="btn btn-primary" id="open-signin-btn" style="width: 100%; height: 38px; font-size: 0.85rem;">
            Sign In / Demo
          </button>
        `;

        const signinBtn = userContainer.querySelector('#open-signin-btn');
        if (signinBtn) {
          signinBtn.onclick = () => authModal.open('login');
        }
      }
    };

    state.subscribe('user', updateUI);
    updateUI();

    // Progress bar in sidebar widget
    state.subscribe('tasks', (tasks) => {
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const fill = document.getElementById('sidebar-progress-fill');
      const text = document.getElementById('sidebar-progress-text');
      if (fill) fill.style.width = `${percent}%`;
      if (text) text.textContent = `${percent}%`;
    });
  }

  bindLiveStatus() {
    const badge = document.getElementById('ws-live-status');
    const text = document.getElementById('ws-live-text');

    state.subscribe('wsConnected', (connected) => {
      if (!badge || !text) return;
      const onlineCount = state.getState().onlineClients || 1;

      if (connected) {
        badge.classList.remove('disconnected');
        text.textContent = onlineCount > 1 ? `Live (${onlineCount} peers)` : 'Live Sync Active';
      } else {
        badge.classList.add('disconnected');
        text.textContent = 'Connecting...';
      }
    });
  }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
