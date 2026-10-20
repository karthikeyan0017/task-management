const { getDb } = require('../config/db');

class TaskModel {
  static formatTask(raw) {
    if (!raw) return null;
    return {
      ...raw,
      tags: typeof raw.tags === 'string' ? JSON.parse(raw.tags || '[]') : (raw.tags || []),
      checklist: typeof raw.checklist === 'string' ? JSON.parse(raw.checklist || '[]') : (raw.checklist || [])
    };
  }

  static findAll({ userId = null, status, priority, search, tag, sortBy = 'position', sortOrder = 'ASC' } = {}) {
    const db = getDb();
    let query = `
      SELECT t.*, u.full_name as author_name, u.username as author_username, u.avatar_color as author_avatar
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ` AND t.user_id = ?`;
      params.push(userId);
    }

    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (priority && priority !== 'all') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (search && search.trim()) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (tag && tag !== 'all') {
      query += ` AND t.tags LIKE ?`;
      params.push(`%"${tag}"%`);
    }

    // Sort order validation
    const validSortFields = {
      position: 't.position',
      due_date: 't.due_date',
      priority: 'CASE t.priority WHEN "urgent" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END',
      created_at: 't.created_at',
      title: 't.title'
    };

    const orderClause = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const sortField = validSortFields[sortBy] || 't.position';

    query += ` ORDER BY ${sortField} ${orderClause}, t.id ASC`;

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(this.formatTask);
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT t.*, u.full_name as author_name, u.username as author_username, u.avatar_color as author_avatar
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `);
    const row = stmt.get(id);
    return this.formatTask(row);
  }

  static create({ title, description = '', status = 'todo', priority = 'medium', dueDate = null, tags = [], checklist = [], userId, position = 0 }) {
    const db = getDb();
    const tagsJson = JSON.stringify(tags);
    const checklistJson = JSON.stringify(checklist);

    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, due_date, tags, checklist, user_id, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(
      title.trim(),
      description.trim(),
      status,
      priority,
      dueDate || null,
      tagsJson,
      checklistJson,
      userId,
      position
    );

    return this.findById(Number(res.lastInsertRowid));
  }

  static update(id, updates) {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) return null;

    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const description = updates.description !== undefined ? updates.description.trim() : existing.description;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const priority = updates.priority !== undefined ? updates.priority : existing.priority;
    const dueDate = updates.due_date !== undefined ? updates.due_date : existing.due_date;
    const tags = updates.tags !== undefined ? JSON.stringify(updates.tags) : JSON.stringify(existing.tags);
    const checklist = updates.checklist !== undefined ? JSON.stringify(updates.checklist) : JSON.stringify(existing.checklist);
    const position = updates.position !== undefined ? updates.position : existing.position;

    const stmt = db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, tags = ?, checklist = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(title, description, status, priority, dueDate, tags, checklist, position, id);
    return this.findById(id);
  }

  static updateStatus(id, newStatus, newPosition = 0) {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE tasks
      SET status = ?, position = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(newStatus, newPosition, id);
    return this.findById(id);
  }

  static delete(id) {
    const db = getDb();
    const existing = this.findById(id);
    if (!existing) return null;

    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
    return existing;
  }
}

module.exports = TaskModel;
