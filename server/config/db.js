const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db;

function initDatabase() {
  const dbDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = process.env.DB_PATH
    ? path.resolve(__dirname, '../../', process.env.DB_PATH)
    : path.join(dbDir, 'tasks.db');

  try {
    const { DatabaseSync } = require('node:sqlite');
    db = new DatabaseSync(dbPath);
    console.log(`[Database] Connected to SQLite database at: ${dbPath}`);
  } catch (err) {
    console.error('[Database] Failed to load node:sqlite module:', err);
    throw err;
  }

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#6366f1',
      role TEXT DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date TEXT DEFAULT NULL,
      tags TEXT DEFAULT '[]',
      checklist TEXT DEFAULT '[]',
      user_id INTEGER NOT NULL,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedDefaultData();
  return db;
}

function seedDefaultData() {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countStmt.get();

  if (result && result.count === 0) {
    console.log('[Database] Seeding initial demo user and default tasks...');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Demo123!', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, avatar_color, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const userRes = insertUser.run('demo_user', 'demo@taskflow.dev', passwordHash, 'Alex Rivers', '#6366f1', 'admin');
    const userId = Number(userRes.lastInsertRowid);

    const insertTask = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, due_date, tags, checklist, user_id, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const fmt = (daysOffset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysOffset);
      return d.toISOString().split('T')[0];
    };

    const demoTasks = [
      {
        title: 'Design system tokens & glassmorphism theme',
        description: 'Define CSS custom properties for vibrant dark/light modes, gradients, elevation shadows, and responsive layout grids.',
        status: 'completed',
        priority: 'high',
        due_date: fmt(-2),
        tags: JSON.stringify(['Design', 'Frontend', 'Theme']),
        checklist: JSON.stringify([
          { id: 1, title: 'Color palette definition', completed: true },
          { id: 2, title: 'Typography & scale', completed: true },
          { id: 3, title: 'Dark mode variables', completed: true }
        ]),
        position: 0
      },
      {
        title: 'Setup JWT authentication & password hashing',
        description: 'Create secure registration and login endpoints using bcryptjs for salt hashing and jsonwebtoken for stateless auth.',
        status: 'completed',
        priority: 'high',
        due_date: fmt(-1),
        tags: JSON.stringify(['Backend', 'Security', 'Auth']),
        checklist: JSON.stringify([
          { id: 1, title: 'User registration route', completed: true },
          { id: 2, title: 'Login with bcrypt validation', completed: true },
          { id: 3, title: 'Auth middleware token verify', completed: true }
        ]),
        position: 1
      },
      {
        title: 'Implement real-time WebSocket sync',
        description: 'Broadcast task creation, status updates, and drag-and-drop movement across all connected browser clients instantly.',
        status: 'in_progress',
        priority: 'urgent',
        due_date: fmt(1),
        tags: JSON.stringify(['Backend', 'Realtime', 'WebSockets']),
        checklist: JSON.stringify([
          { id: 1, title: 'WebSocket server initialization', completed: true },
          { id: 2, title: 'Client connection heartbeat', completed: true },
          { id: 3, title: 'Live toast notifications', completed: false }
        ]),
        position: 0
      },
      {
        title: 'Kanban drag-and-drop board interaction',
        description: 'Enable smooth HTML5 drag-and-drop cards between To Do, In Progress, Review, and Completed columns with live feedback.',
        status: 'in_progress',
        priority: 'medium',
        due_date: fmt(2),
        tags: JSON.stringify(['Frontend', 'UI', 'Interactivity']),
        checklist: JSON.stringify([
          { id: 1, title: 'Card dragstart & dragend listeners', completed: true },
          { id: 2, title: 'Dropzone highlight styling', completed: true },
          { id: 3, title: 'Position reordering logic', completed: false }
        ]),
        position: 1
      },
      {
        title: 'Productivity metrics & analytics charts',
        description: 'Calculate real-time completion rates, priority distribution, and weekly throughput visualized in custom SVG charts.',
        status: 'review',
        priority: 'medium',
        due_date: fmt(3),
        tags: JSON.stringify(['Analytics', 'Frontend']),
        checklist: JSON.stringify([
          { id: 1, title: 'API statistics aggregator', completed: true },
          { id: 2, title: 'Donut chart component', completed: true },
          { id: 3, title: 'Metric card animations', completed: false }
        ]),
        position: 0
      },
      {
        title: 'Automated integration & security testing',
        description: 'Validate authorization boundaries, task ownership filters, and WebSocket broadcast safety against malformed payloads.',
        status: 'todo',
        priority: 'low',
        due_date: fmt(5),
        tags: JSON.stringify(['Testing', 'DevOps', 'Security']),
        checklist: JSON.stringify([
          { id: 1, title: 'Auth endpoint tests', completed: false },
          { id: 2, title: 'Task CRUD tests', completed: false }
        ]),
        position: 0
      },
      {
        title: 'Mobile responsive drawer & touch gestures',
        description: 'Optimize navigation for mobile screens with slide-out sidebar drawer and bottom quick-action navigation bar.',
        status: 'todo',
        priority: 'medium',
        due_date: fmt(4),
        tags: JSON.stringify(['Mobile', 'UX', 'Responsive']),
        checklist: JSON.stringify([
          { id: 1, title: 'Hamburger drawer toggle', completed: false },
          { id: 2, title: 'Touch card swipe action', completed: false }
        ]),
        position: 1
      }
    ];

    demoTasks.forEach((t) => {
      const taskRes = insertTask.run(
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.tags,
        t.checklist,
        userId,
        t.position
      );
      const taskId = Number(taskRes.lastInsertRowid);

      db.prepare(`
        INSERT INTO activities (task_id, user_id, action, details)
        VALUES (?, ?, ?, ?)
      `).run(taskId, userId, 'created', `Created task "${t.title}"`);
    });

    console.log('[Database] Seeded 7 demo tasks successfully!');
  }
}

function getDb() {
  if (!db) {
    initDatabase();
  }
  return db;
}

module.exports = {
  initDatabase,
  getDb
};
