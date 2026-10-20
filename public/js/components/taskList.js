import { state } from '../state.js';
import { api } from '../api.js';
import { taskModal } from './taskModal.js';
import { toast } from './toast.js';

class TaskList {
  constructor() {
    this.container = null;
  }

  mount(containerEl) {
    this.container = containerEl;
    this.render();

    state.subscribe('filteredTasks', () => this.render());
  }

  render() {
    if (!this.container) return;

    const tasks = state.getState().filteredTasks;
    const todayStr = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 1rem; font-weight: 700;">Task List (${tasks.length})</h3>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" id="list-add-task-btn" style="height: 34px; font-size: 0.8rem;">
              + Add Task
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="background: var(--bg-surface-elevated); color: var(--text-muted); border-bottom: 1px solid var(--border-subtle); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
                <th style="padding: 12px 18px; width: 40px;"></th>
                <th style="padding: 12px 18px;">Task Title</th>
                <th style="padding: 12px 18px;">Status</th>
                <th style="padding: 12px 18px;">Priority</th>
                <th style="padding: 12px 18px;">Due Date</th>
                <th style="padding: 12px 18px;">Tags</th>
                <th style="padding: 12px 18px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr>
                  <td colspan="7" style="padding: 48px; text-align: center; color: var(--text-muted);">
                    No tasks found matching current filters.
                  </td>
                </tr>
              ` : tasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;
                const tags = Array.isArray(task.tags) ? task.tags : [];

                return `
                  <tr class="task-table-row" data-task-id="${task.id}" style="border-bottom: 1px solid var(--border-subtle); transition: background var(--transition-fast); cursor: pointer;">
                    <td style="padding: 12px 18px;" onclick="event.stopPropagation();">
                      <input type="checkbox" class="list-toggle-complete" data-task-id="${task.id}" ${isCompleted ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;" />
                    </td>
                    <td style="padding: 12px 18px;">
                      <div style="font-weight: 600; color: ${isCompleted ? 'var(--text-muted)' : 'var(--text-primary)'}; ${isCompleted ? 'text-decoration: line-through;' : ''}">${task.title}</div>
                      ${task.description ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${task.description}</div>` : ''}
                    </td>
                    <td style="padding: 12px 18px;">
                      <span class="badge badge-status ${task.status}">${task.status.replace('_', ' ')}</span>
                    </td>
                    <td style="padding: 12px 18px;">
                      <span class="badge badge-${task.priority}">${task.priority}</span>
                    </td>
                    <td style="padding: 12px 18px;">
                      <span style="font-size: 0.8rem; color: ${isOverdue ? 'var(--danger)' : 'var(--text-secondary)'}; ${isOverdue ? 'font-weight: 600;' : ''}">
                        ${task.due_date ? task.due_date : '—'}
                      </span>
                    </td>
                    <td style="padding: 12px 18px;">
                      <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${tags.slice(0, 3).map(t => `<span class="card-tag-pill">${t}</span>`).join('')}
                        ${tags.length > 3 ? `<span class="card-tag-pill">+${tags.length - 3}</span>` : ''}
                      </div>
                    </td>
                    <td style="padding: 12px 18px; text-align: right;" onclick="event.stopPropagation();">
                      <div style="display: inline-flex; gap: 6px;">
                        <button class="btn-icon edit-task-row-btn" data-task-id="${task.id}" title="Edit" style="width: 30px; height: 30px;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn-icon delete-task-row-btn" data-task-id="${task.id}" title="Delete" style="width: 30px; height: 30px;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const addBtn = this.container.querySelector('#list-add-task-btn');
    if (addBtn) addBtn.onclick = () => taskModal.open();

    this.container.querySelectorAll('.task-table-row').forEach(row => {
      row.onclick = () => {
        const taskId = Number(row.dataset.taskId);
        const task = state.getState().tasks.find(t => t.id === taskId);
        if (task) taskModal.open(task);
      };
    });

    this.container.querySelectorAll('.edit-task-row-btn').forEach(btn => {
      btn.onclick = () => {
        const taskId = Number(btn.dataset.taskId);
        const task = state.getState().tasks.find(t => t.id === taskId);
        if (task) taskModal.open(task);
      };
    });

    this.container.querySelectorAll('.delete-task-row-btn').forEach(btn => {
      btn.onclick = async () => {
        const taskId = Number(btn.dataset.taskId);
        const task = state.getState().tasks.find(t => t.id === taskId);
        if (!task) return;
        if (confirm(`Delete task "${task.title}"?`)) {
          try {
            await api.delete(`/tasks/${taskId}`);
            state.removeTask(taskId);
            toast.success('Task deleted.');
          } catch (err) {
            toast.error(err.message || 'Failed to delete task.');
          }
        }
      };
    });

    this.container.querySelectorAll('.list-toggle-complete').forEach(chk => {
      chk.onchange = async () => {
        const taskId = Number(chk.dataset.taskId);
        const newStatus = chk.checked ? 'completed' : 'todo';
        try {
          const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
          state.updateTask(res.task);
          toast.success(`Task marked as ${newStatus}.`);
        } catch (err) {
          chk.checked = !chk.checked;
          toast.error(err.message || 'Failed to update status.');
        }
      };
    });
  }
}

export const taskList = new TaskList();
