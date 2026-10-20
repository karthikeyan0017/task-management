import { state } from '../state.js';
import { api } from '../api.js';

class AnalyticsView {
  constructor() {
    this.container = null;
  }

  mount(containerEl) {
    this.container = containerEl;
    this.loadStats();

    state.subscribe('tasks', () => this.loadStats());
    state.subscribe('currentView', (view) => {
      if (view === 'analytics') this.loadStats();
    });
  }

  async loadStats() {
    try {
      const res = await api.get('/stats/overview');
      if (res && res.stats) {
        state.setStats(res.stats);
        this.render(res.stats);
      }
    } catch (err) {
      console.error('[Analytics] Failed to fetch stats:', err);
      // Fallback compute locally
      this.renderFromState();
    }
  }

  renderFromState() {
    const tasks = state.getState().tasks;
    const todayStr = new Date().toISOString().split('T')[0];

    let completed = 0, inProgress = 0, review = 0, todo = 0, overdue = 0;
    const priority = { urgent: 0, high: 0, medium: 0, low: 0 };
    const tags = {};

    tasks.forEach(t => {
      if (t.status === 'completed') completed++;
      else if (t.status === 'in_progress') inProgress++;
      else if (t.status === 'review') review++;
      else todo++;

      if (priority[t.priority] !== undefined) priority[t.priority]++;
      if (t.status !== 'completed' && t.due_date && t.due_date < todayStr) overdue++;

      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      }
    });

    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.render({
      total,
      completed,
      inProgress,
      review,
      todo,
      overdue,
      completionRate,
      priorityBreakdown: priority,
      tagBreakdown: tags
    });
  }

  render(stats) {
    if (!this.container) return;

    const {
      total = 0,
      completed = 0,
      inProgress = 0,
      review = 0,
      todo = 0,
      overdue = 0,
      completionRate = 0,
      priorityBreakdown = { urgent: 0, high: 0, medium: 0, low: 0 },
      tagBreakdown = {}
    } = stats;

    // SVG Donut calculation
    const statusData = [
      { label: 'Completed', count: completed, color: 'var(--status-completed)' },
      { label: 'In Progress', count: inProgress, color: 'var(--status-in-progress)' },
      { label: 'Under Review', count: review, color: 'var(--status-review)' },
      { label: 'To Do', count: todo, color: 'var(--status-todo)' }
    ];

    const circumference = 2 * Math.PI * 40; // radius = 40
    let accumulatedAngle = 0;

    const donutSlices = statusData.map(item => {
      const fraction = total > 0 ? item.count / total : 0;
      const strokeDash = fraction * circumference;
      const strokeDashoffset = -accumulatedAngle;
      accumulatedAngle += strokeDash;

      return `
        <circle cx="50" cy="50" r="40" fill="transparent"
          stroke="${item.color}"
          stroke-width="14"
          stroke-dasharray="${strokeDash} ${circumference}"
          stroke-dashoffset="${strokeDashoffset}"
          stroke-linecap="round"
          style="transition: stroke-dasharray 600ms ease;"
        />
      `;
    }).join('');

    // Priority Bar max calculation
    const maxPriority = Math.max(1, ...Object.values(priorityBreakdown));

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%;">
        <!-- Metric Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Total Tasks</div>
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 6px;">${total}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Across all workspace columns</div>
          </div>

          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Completion Rate</div>
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--success); margin-top: 6px;">${completionRate}%</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">${completed} of ${total} tasks finished</div>
          </div>

          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">In Progress</div>
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent); margin-top: 6px;">${inProgress + review}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">${inProgress} active, ${review} in review</div>
          </div>

          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; box-shadow: var(--shadow-sm);">
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Overdue Attention</div>
            <div style="font-size: 2.2rem; font-weight: 800; color: ${overdue > 0 ? 'var(--danger)' : 'var(--text-muted)'}; margin-top: 6px;">${overdue}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">${overdue > 0 ? 'Requires immediate action' : 'All due dates healthy'}</div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
          <!-- Status Donut Chart -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 20px;">Task Distribution by Status</h4>
            <div style="display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;">
              <div style="position: relative; width: 140px; height: 140px;">
                <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%;">
                  ${total === 0 ? `
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-surface-elevated)" stroke-width="14" />
                  ` : donutSlices}
                </svg>
                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  <span style="font-size: 1.3rem; font-weight: 800;">${total}</span>
                  <span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Total</span>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${statusData.map(item => `
                  <div style="display: flex; align-items: center; gap: 10px; font-size: 0.82rem;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${item.color};"></span>
                    <span style="color: var(--text-secondary); width: 95px;">${item.label}:</span>
                    <span style="font-weight: 700; color: var(--text-primary);">${item.count}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Priority Bar Breakdown -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 20px;">Priority Breakdown</h4>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${[
                { label: 'Urgent', key: 'urgent', color: 'var(--priority-urgent)' },
                { label: 'High', key: 'high', color: 'var(--priority-high)' },
                { label: 'Medium', key: 'medium', color: 'var(--priority-medium)' },
                { label: 'Low', key: 'low', color: 'var(--priority-low)' }
              ].map(p => {
                const count = priorityBreakdown[p.key] || 0;
                const percent = Math.round((count / maxPriority) * 100);
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                      <span style="font-weight: 600; color: var(--text-secondary);">${p.label} Priority</span>
                      <span style="font-weight: 700; color: var(--text-primary);">${count}</span>
                    </div>
                    <div style="height: 8px; width: 100%; background: var(--bg-surface-elevated); border-radius: var(--radius-full); overflow: hidden;">
                      <div style="height: 100%; width: ${percent}%; background-color: ${p.color}; border-radius: var(--radius-full); transition: width 500ms ease;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Tags Breakdown -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm);">
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 14px;">Workspace Tags Distribution</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${Object.keys(tagBreakdown).length === 0 ? `
              <div style="color: var(--text-muted); font-size: 0.85rem;">No tags assigned yet.</div>
            ` : Object.entries(tagBreakdown).map(([tag, count]) => `
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: var(--radius-full); background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle);">
                <span style="font-weight: 600; font-size: 0.82rem; color: var(--text-primary);">${tag}</span>
                <span style="font-size: 0.72rem; padding: 1px 6px; border-radius: var(--radius-full); background: var(--primary-subtle); color: var(--primary-light); font-weight: 700;">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

export const analyticsView = new AnalyticsView();
