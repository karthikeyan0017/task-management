class StateStore {
  constructor() {
    this.state = {
      user: null,
      token: localStorage.getItem('taskflow_token') || null,
      isAuthenticated: false,
      tasks: [],
      filteredTasks: [],
      filters: {
        status: 'all',
        priority: 'all',
        tag: 'all',
        search: '',
        scope: 'all',
        sortBy: 'position',
        sortOrder: 'ASC'
      },
      currentView: 'kanban',
      stats: {
        total: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        completed: 0,
        completionRate: 0,
        overdue: 0,
        priorityBreakdown: { urgent: 0, high: 0, medium: 0, low: 0 },
        tagBreakdown: {},
        recentActivities: []
      },
      onlineClients: 1,
      wsConnected: false
    };

    this.subscribers = new Map();
  }

  getState() {
    return this.state;
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.subscribers.get(key);
      if (set) set.delete(callback);
    };
  }

  notify(key) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(cb => {
        try {
          cb(this.state[key], this.state);
        } catch (err) {
          console.error(`[State] Error in subscriber for ${key}:`, err);
        }
      });
    }

    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(cb => {
        try {
          cb(this.state);
        } catch (err) {
          console.error('[State] Error in global subscriber:', err);
        }
      });
    }
  }

  setAuth(user, token) {
    this.state.user = user;
    this.state.token = token;
    this.state.isAuthenticated = !!(user && token);
    if (token) {
      localStorage.setItem('taskflow_token', token);
    } else {
      localStorage.removeItem('taskflow_token');
    }
    this.notify('user');
    this.notify('isAuthenticated');
  }

  setTasks(tasks) {
    this.state.tasks = tasks;
    this.applyFilters();
    this.notify('tasks');
  }

  addTask(task) {
    const existingIndex = this.state.tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      this.state.tasks[existingIndex] = task;
    } else {
      this.state.tasks.unshift(task);
    }
    this.applyFilters();
    this.notify('tasks');
  }

  updateTask(task) {
    const index = this.state.tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      this.state.tasks[index] = task;
      this.applyFilters();
      this.notify('tasks');
    }
  }

  removeTask(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    this.applyFilters();
    this.notify('tasks');
  }

  setFilter(filterKey, value) {
    this.state.filters[filterKey] = value;
    this.applyFilters();
    this.notify('filters');
  }

  applyFilters() {
    const { status, priority, tag, search, scope } = this.state.filters;
    const currentUserId = this.state.user ? this.state.user.id : null;

    let filtered = [...this.state.tasks];

    if (scope === 'me' && currentUserId) {
      filtered = filtered.filter(t => t.user_id === currentUserId);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter(t => t.status === status);
    }

    if (priority && priority !== 'all') {
      filtered = filtered.filter(t => t.priority === priority);
    }

    if (tag && tag !== 'all') {
      filtered = filtered.filter(t => Array.isArray(t.tags) && t.tags.includes(tag));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    this.state.filteredTasks = filtered;
    this.notify('filteredTasks');
  }

  setView(viewName) {
    this.state.currentView = viewName;
    this.notify('currentView');
  }

  setStats(stats) {
    this.state.stats = stats;
    this.notify('stats');
  }

  setWsStatus(connected, onlineClients = null) {
    this.state.wsConnected = connected;
    if (onlineClients !== null) {
      this.state.onlineClients = onlineClients;
    }
    this.notify('wsConnected');
  }
}

export const state = new StateStore();
