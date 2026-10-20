import { api } from '../api.js';
import { state } from '../state.js';
import { toast } from './toast.js';
import { authModal } from './authModal.js';

class TaskModal {
  constructor() {
    this.modalEl = null;
    this.currentTask = null; // null for Create, object for Edit
    this.checklist = [];
    this.tags = [];
    this.priority = 'medium';
    this.init();
  }

  init() {
    let modal = document.getElementById('task-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'task-modal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }
    this.modalEl = modal;

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
  }

  open(task = null, defaultStatus = 'todo') {
    // Check if user is logged in
    if (!state.getState().isAuthenticated) {
      authModal.open('login');
      toast.info('Please sign in or use the 1-Click Demo account to manage tasks.');
      return;
    }

    this.currentTask = task;
    this.checklist = task ? [...(task.checklist || [])] : [];
    this.tags = task ? [...(task.tags || [])] : [];
    this.priority = task ? task.priority : 'medium';
    this.defaultStatus = defaultStatus;

    this.render();
    this.modalEl.classList.add('open');
    setTimeout(() => {
      const titleInput = this.modalEl.querySelector('#task-title-input');
      if (titleInput) titleInput.focus();
    }, 50);
  }

  close() {
    this.modalEl.classList.remove('open');
    this.currentTask = null;
  }

  render() {
    const isEdit = !!this.currentTask;
    const task = this.currentTask || {
      title: '',
      description: '',
      status: this.defaultStatus || 'todo',
      due_date: ''
    };

    const presetTags = ['Frontend', 'Backend', 'Design', 'DevOps', 'Security', 'Bug', 'Feature'];

    this.modalEl.innerHTML = `
      <div class="modal-dialog animate-fade-in" style="max-width: 580px;">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Task' : 'Create New Task'}</h3>
          <button class="btn-icon" id="task-modal-close-btn" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form id="task-form" class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="task-title-input">Task Title *</label>
            <input class="form-input" id="task-title-input" type="text" placeholder="e.g. Implement user dashboard widgets" required value="${task.title || ''}" />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="task-desc-input">Description</label>
            <textarea class="form-textarea" id="task-desc-input" placeholder="Provide background details, requirements, or acceptance criteria...">${task.description || ''}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="task-status-select">Status</label>
              <select class="form-select" id="task-status-select">
                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                <option value="review" ${task.status === 'review' ? 'selected' : ''}>Under Review</option>
                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" for="task-due-date">Due Date</label>
              <input class="form-input" id="task-due-date" type="date" value="${task.due_date || ''}" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Priority</label>
            <div class="priority-selector">
              <div class="priority-option urgent ${this.priority === 'urgent' ? 'selected' : ''}" data-priority="urgent">Urgent</div>
              <div class="priority-option high ${this.priority === 'high' ? 'selected' : ''}" data-priority="high">High</div>
              <div class="priority-option medium ${this.priority === 'medium' ? 'selected' : ''}" data-priority="medium">Medium</div>
              <div class="priority-option low ${this.priority === 'low' ? 'selected' : ''}" data-priority="low">Low</div>
            </div>
          </div>

          <!-- Tags -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Tags</label>
            <div id="selected-tags-container" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
              ${this.tags.map(tag => `
                <span class="card-tag-pill" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--bg-surface-elevated); color: var(--text-primary);">
                  ${tag}
                  <button type="button" class="remove-tag-btn" data-tag="${tag}" style="color: var(--text-muted);">&times;</button>
                </span>
              `).join('')}
            </div>
            <div style="display: flex; gap: 8px;">
              <input class="form-input" id="new-tag-input" type="text" placeholder="Add custom tag (press Enter)" style="height: 34px; font-size: 0.8rem;" />
              <button type="button" class="btn btn-secondary" id="add-tag-btn" style="height: 34px; padding: 0 12px; font-size: 0.8rem;">Add</button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
              <span style="font-size: 0.72rem; color: var(--text-muted); margin-right: 4px;">Suggestions:</span>
              ${presetTags.map(p => `
                <button type="button" class="preset-tag-chip" data-tag="${p}" style="font-size: 0.7rem; padding: 2px 7px; border-radius: 4px; background: var(--bg-surface-elevated); color: var(--text-secondary); border: 1px solid var(--border-subtle);">+ ${p}</button>
              `).join('')}
            </div>
          </div>

          <!-- Checklist / Subtasks -->
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Checklist / Subtasks (${this.checklist.filter(c => c.completed).length}/${this.checklist.length})</label>
            <div id="checklist-items-container" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
              ${this.checklist.map((item, idx) => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--bg-surface-elevated); border-radius: var(--radius-sm);">
                  <input type="checkbox" class="checklist-item-check" data-idx="${idx}" ${item.completed ? 'checked' : ''} />
                  <span style="flex: 1; font-size: 0.82rem; ${item.completed ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: var(--text-primary);'}">${item.title}</span>
                  <button type="button" class="remove-checklist-item" data-idx="${idx}" style="color: var(--text-muted); font-size: 1rem;">&times;</button>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; gap: 8px;">
              <input class="form-input" id="new-checklist-input" type="text" placeholder="Add a checklist item (press Enter)..." style="height: 34px; font-size: 0.8rem;" />
              <button type="button" class="btn btn-secondary" id="add-checklist-btn" style="height: 34px; padding: 0 12px; font-size: 0.8rem;">Add</button>
            </div>
          </div>
        </form>

        <div class="modal-footer">
          ${isEdit ? `
            <button type="button" class="btn btn-danger" id="task-delete-btn" style="margin-right: auto;">
              Delete Task
            </button>
          ` : ''}
          <button type="button" class="btn btn-secondary" id="task-cancel-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="task-save-btn">
            ${isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.modalEl.querySelector('#task-modal-close-btn').onclick = () => this.close();
    this.modalEl.querySelector('#task-cancel-btn').onclick = () => this.close();

    // Priority Selection
    this.modalEl.querySelectorAll('.priority-option').forEach(el => {
      el.onclick = () => {
        this.priority = el.dataset.priority;
        this.modalEl.querySelectorAll('.priority-option').forEach(opt => opt.classList.remove('selected'));
        el.classList.add('selected');
      };
    });

    // Preset Tags
    this.modalEl.querySelectorAll('.preset-tag-chip').forEach(chip => {
      chip.onclick = () => {
        const tag = chip.dataset.tag;
        if (!this.tags.includes(tag)) {
          this.tags.push(tag);
          this.render();
        }
      };
    });

    // Remove Tag
    this.modalEl.querySelectorAll('.remove-tag-btn').forEach(btn => {
      btn.onclick = () => {
        const tag = btn.dataset.tag;
        this.tags = this.tags.filter(t => t !== tag);
        this.render();
      };
    });

    // Add Tag Input
    const tagInput = this.modalEl.querySelector('#new-tag-input');
    const addTagBtn = this.modalEl.querySelector('#add-tag-btn');
    const handleAddTag = () => {
      const val = tagInput.value.trim();
      if (val && !this.tags.includes(val)) {
        this.tags.push(val);
        this.render();
      }
    };
    if (addTagBtn) addTagBtn.onclick = handleAddTag;
    if (tagInput) {
      tagInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddTag();
        }
      };
    }

    // Checklist toggling
    this.modalEl.querySelectorAll('.checklist-item-check').forEach(chk => {
      chk.onchange = () => {
        const idx = Number(chk.dataset.idx);
        if (this.checklist[idx]) {
          this.checklist[idx].completed = chk.checked;
          this.render();
        }
      };
    });

    // Remove checklist item
    this.modalEl.querySelectorAll('.remove-checklist-item').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        this.checklist.splice(idx, 1);
        this.render();
      };
    });

    // Add checklist item
    const checkInput = this.modalEl.querySelector('#new-checklist-input');
    const addCheckBtn = this.modalEl.querySelector('#add-checklist-btn');
    const handleAddChecklist = () => {
      const val = checkInput.value.trim();
      if (val) {
        this.checklist.push({
          id: Date.now(),
          title: val,
          completed: false
        });
        this.render();
      }
    };
    if (addCheckBtn) addCheckBtn.onclick = handleAddChecklist;
    if (checkInput) {
      checkInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddChecklist();
        }
      };
    }

    // Save Task
    this.modalEl.querySelector('#task-save-btn').onclick = () => this.handleSave();

    // Delete Task
    const deleteBtn = this.modalEl.querySelector('#task-delete-btn');
    if (deleteBtn) {
      deleteBtn.onclick = () => this.handleDelete();
    }
  }

  async handleSave() {
    const title = this.modalEl.querySelector('#task-title-input').value.trim();
    if (!title) {
      toast.error('Task title is required.');
      return;
    }

    const description = this.modalEl.querySelector('#task-desc-input').value.trim();
    const status = this.modalEl.querySelector('#task-status-select').value;
    const dueDate = this.modalEl.querySelector('#task-due-date').value || null;

    const payload = {
      title,
      description,
      status,
      priority: this.priority,
      due_date: dueDate,
      tags: this.tags,
      checklist: this.checklist
    };

    const saveBtn = this.modalEl.querySelector('#task-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      if (this.currentTask) {
        const res = await api.put(`/tasks/${this.currentTask.id}`, payload);
        state.updateTask(res.task);
        toast.success(`Task "${res.task.title}" updated.`);
      } else {
        const res = await api.post('/tasks', payload);
        state.addTask(res.task);
        toast.success(`Task "${res.task.title}" created.`);
      }
      this.close();
    } catch (err) {
      toast.error(err.message || 'Failed to save task.');
    } finally {
      saveBtn.disabled = false;
    }
  }

  async handleDelete() {
    if (!this.currentTask) return;
    if (!confirm(`Are you sure you want to delete task "${this.currentTask.title}"?`)) {
      return;
    }

    const taskId = this.currentTask.id;
    try {
      await api.delete(`/tasks/${taskId}`);
      state.removeTask(taskId);
      toast.success('Task deleted successfully.');
      this.close();
    } catch (err) {
      toast.error(err.message || 'Failed to delete task.');
    }
  }
}

export const taskModal = new TaskModal();
