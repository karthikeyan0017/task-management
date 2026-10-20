const { getDb } = require('../config/db');

class UserModel {
  static findByEmail(email) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email.toLowerCase().trim());
  }

  static findByUsername(username) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username.trim());
  }

  static findById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, email, full_name, avatar_color, role, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static create({ username, email, passwordHash, fullName, avatarColor, role = 'member' }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, avatar_color, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(username.trim(), email.toLowerCase().trim(), passwordHash, fullName.trim(), avatarColor || '#6366f1', role);
    return this.findById(Number(res.lastInsertRowid));
  }

  static getAllUsers() {
    const db = getDb();
    const stmt = db.prepare('SELECT id, username, email, full_name, avatar_color, role FROM users');
    return stmt.all();
  }
}

module.exports = UserModel;
