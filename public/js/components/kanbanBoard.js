import { state } from '../state.js';
import { api } from '../api.js';
import { taskModal } from './taskModal.js';
import { toast } from './toast.js';

class KanbanBoard {
  constructor() {
    this.container = null;
    this.columns = [
      { id: 'todo', title: 'To Do', color: 'todo' },
      { id: 'in_progress', title: 'In Progress', color: 'in_progress' },
      { id: 'review', title: 'Under Review', color: 'review' },
      { id: 'completed', title: 'Completed', color: 'completed' }
    ];
  }

  mount(containerEl) {
    this.container = containerEl;
    this.render();

    // Subscribe to task updates
    state.subscribe('filteredTasks', () => this.render());
  }

  render() {
    if (!this.container) return;

    const tasks = state.getState().filteredTasks;
    const todayStr = new Date().toISOString().split('T')[0];

    this.container.innerHTML = `
      <div class="kanban-board-wrapper">
        ${this.columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return `
            <div class="kanban-column" data-column-id="${col.id}">
              <div class="kanban-column-header">
                <div class="column-header-title">
                  <span class="column-dot ${col.color}"></span>
                  <span>${col.title}</span>
                  <span class="column-count-badge">${colTasks.length}</span>
                </div>
                <button class="btn-icon add-column-task-btn" data-status="${col.id}" title="Add task to ${col.title}" style="width: 28px; height: 28px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
                </button>
              </div>

              <div class="kanban-card-list" data-status="${col.id}">
                ${colTasks.length === 0 ? `
                  <div style="text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm);">
                    No tasks here
                  </div>
                ` : colTasks.map(task => this.renderCard(task, todayStr)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindEvents();
  }

  renderCard(task, todayStr) {
    const isCompleted = task.status === 'completed';
    const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;
    const isDueSoon = !isCompleted && task.due_date && task.due_date === todayStr;

    const checklist = Array.isArray(task.checklist) ? task.checklist : [];
    const completedCount = checklist.filter(c => c.completed).length;
    const totalChecklist = checklist.length;
    const checklistPercent = totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;

    const tags = Array.isArray(task.tags) ? task.tags : [];

    return `
      <div class="task-card animate-fade-in" draggable="true" data-task-id="${task.id}">
        <div class="card-top-row">
          <span class="badge badge-${task.priority}">${task.priority}</span>
          <div class="card-actions-quick">
            <button class="card-action-btn edit" data-task-id="${task.id}" title="Edit Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="card-action-btn delete" data-task-id="${task.id}" title="Delete Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <h4 class="card-title">${task.title}</h4>

        ${task.description ? `<p class="card-desc">${task.description}</p>` : ''}

        ${tags.length > 0 ? `
          <div class="card-tags">
            ${tags.map(t => `<span class="card-tag-pill">${t}</span>`).join('')}
          </div>
        ` : ''}

        ${totalChecklist > 0 ? `
          <div class="card-checklist-progress">
            <div class="card-mini-bar">
              <div class="card-mini-fill" style="width: ${checklistPercent}%;"></div>
            </div>
            <span>${completedCount}/${totalChecklist}</span>
          </div>
        ` : ''}

        <div class="card-footer">
          <div class="card-due-date ${isOverdue ? 'overdue' : (isDueSoon ? 'soon' : '')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${task.due_date ? task.due_date : 'No date'}</span>
          </div>

          <div class="card-avatar-pill" style="background-color: ${task.author_avatar || '#6366f1'};" title="Created by ${task.author_name || 'Member'}">
            ${(task.author_name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Add task buttons on column headers
    this.container.querySelectorAll('.add-column-task-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const status = btn.dataset.status;
        taskModal.open(null, status);
      };
    });

    // Card click opens edit modal
    this.container.querySelectorAll('.task-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.card-action-btn')) return;
        const taskId = Number(card.dataset.taskId);
        const task = state.getState().tasks.find(t => t.id === taskId);
        if (task) taskModal.open(task);
      };
    });

    // Quick edit
    this.container.querySelectorAll('.card-action-btn.edit').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const taskId = Number(btn.dataset.taskId);
        const task = state.getState().tasks.find(t => t.id === taskId);
        if (task) taskModal.open(task);
      };
    });

    // Quick delete
    this.container.querySelectorAll('.card-action-btn.delete').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
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

    // HTML5 Drag and Drop events
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    let draggedTaskId = null;
    let sourceStatus = null;

    const cards = this.container.querySelectorAll('.task-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedTaskId = Number(card.dataset.taskId);
        const task = state.getState().tasks.find(t => t.id === draggedTaskId);
        sourceStatus = task ? task.status : null;

        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(draggedTaskId));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.container.querySelectorAll('.kanban-card-list').forEach(list => {
          list.classList.remove('drag-over');
        });
      });
    });

    const dropzones = this.container.querySelectorAll('.kanban-card-list');
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', (e) => {
        if (!zone.contains(e.relatedTarget)) {
          zone.classList.remove('drag-over');
        }
      });

      zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        const targetStatus = zone.dataset.status;
        if (!draggedTaskId || targetStatus === sourceStatus) return;

        const task = state.getState().tasks.find(t => t.id === draggedTaskId);
        if (!task) return;

        // Optimistic UI update
        const updatedTask = { ...task, status: targetStatus };
        state.updateTask(updatedTask);

        try {
          const res = await api.patch(`/tasks/${draggedTaskId}/status`, {
            status: targetStatus,
            position: 0
          });
          state.updateTask(res.task);
        } catch (err) {
          // Revert on error
          state.updateTask(task);
          toast.error(err.message || 'Failed to update task status.');
        }
      });
    });
  }
}

export const kanbanBoard = new KanbanBoard();
