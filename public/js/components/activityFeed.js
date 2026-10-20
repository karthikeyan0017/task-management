import { api } from '../api.js';
import { state } from '../state.js';

class ActivityFeed {
  constructor() {
    this.container = null;
  }

  mount(containerEl) {
    this.container = containerEl;
    this.loadActivities();

    state.subscribe('currentView', (view) => {
      if (view === 'activity') this.loadActivities();
    });
  }

  async loadActivities() {
    try {
      const res = await api.get('/stats/activities', { limit: 40 });
      if (res && res.activities) {
        this.render(res.activities);
      }
    } catch (err) {
      console.error('[ActivityFeed] Error loading activities:', err);
    }
  }

  render(activities) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; width: 100%;">
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 16px;">
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700;">Live Workspace Activity</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Real-time stream of task creations, moves, edits, and updates.</p>
            </div>
            <button class="btn btn-secondary" id="refresh-activity-btn" style="height: 32px; font-size: 0.8rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${activities.length === 0 ? `
              <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                No recent activity recorded yet.
              </div>
            ` : activities.map(act => {
              const initial = (act.user_name || 'U').charAt(0).toUpperCase();

              let actionBadge = '';
              if (act.action === 'created') {
                actionBadge = '<span class="badge" style="background: var(--status-completed-bg); color: var(--status-completed);">Created</span>';
              } else if (act.action === 'status_changed') {
                actionBadge = '<span class="badge" style="background: var(--status-in-progress-bg); color: var(--status-in-progress);">Status Change</span>';
              } else if (act.action === 'deleted') {
                actionBadge = '<span class="badge" style="background: var(--priority-urgent-bg); color: var(--priority-urgent);">Deleted</span>';
              } else {
                actionBadge = '<span class="badge" style="background: var(--bg-surface-elevated); color: var(--text-secondary);">Updated</span>';
              }

              const timeStr = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + new Date(act.created_at).toLocaleDateString();

              return `
                <div style="display: flex; gap: 14px; align-items: flex-start; padding: 12px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${act.avatar_color || '#6366f1'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;">
                    ${initial}
                  </div>
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 600; font-size: 0.88rem; color: var(--text-primary);">${act.user_name || 'Team Member'}</span>
                        ${actionBadge}
                      </div>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">${timeStr}</span>
                    </div>
                    <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">${act.details}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    const refreshBtn = this.container.querySelector('#refresh-activity-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => this.loadActivities();
    }
  }
}

export const activityFeed = new ActivityFeed();
