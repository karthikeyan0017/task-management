const { getDb } = require('../config/db');

class ActivityModel {
  static log({ taskId = null, userId, action, details }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO activities (task_id, user_id, action, details)
      VALUES (?, ?, ?, ?)
    `);
    const res = stmt.run(taskId, userId, action, details);
    return res.lastInsertRowid;
  }

  static getRecent(limit = 25) {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT a.*, u.full_name as user_name, u.username, u.avatar_color
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

module.exports = ActivityModel;
