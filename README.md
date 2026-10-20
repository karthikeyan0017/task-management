# ⚡ TaskFlow — Full-Stack Real-Time Task Management Application

A full-stack task management web application built from scratch featuring **JWT User Authentication & Authorization**, **CRUD Operations with drag-and-drop Kanban**, **Real-Time WebSocket Synchronization**, **Analytics & Metrics Charts**, and a **Responsive Glassmorphism UI (Dark & Light Mode)**.

---

## 🚀 Key Features

### 1. 🔐 User Authentication & Authorization
- **Registration & Login**: Secure credential authentication with **bcryptjs** password salt hashing and stateless **JSON Web Tokens (JWT)**.
- **Protected Routes**: Middleware authorization enforcing user identity and ownership.
- **1-Click Demo Account**: Instant sign-in button for testing without manual sign-up (`demo@taskflow.dev` / `Demo123!`).
- **Profile & Presence**: Custom avatar badges with color generation and online peer counter.

### 2. 📋 Full Task CRUD Operations
- **Create**: Add tasks with title, description, priority (*Urgent*, *High*, *Medium*, *Low*), status (*To Do*, *In Progress*, *Under Review*, *Completed*), due date, multiple tags, and interactive checklist subtasks.
- **Read & Filter**:
  - Live full-text search with hotkey (`/` shortcut).
  - Quick filters: *All Tasks*, *Assigned to Me*, *Urgent Priority*.
  - Tags cloud: Instant tag-based filtering.
- **Update**:
  - Drag-and-drop column status transitions with optimistic UI feedback.
  - Comprehensive Edit modal for modifying descriptions, checklists, tags, and dates.
  - Subtask toggle progress with live completion bars.
- **Delete**: Confirmation dialogs with live audit logging.

### 3. ⚡ Real-Time WebSocket Synchronization
- Native WebSocket server integrated directly into the HTTP instance (`ws://localhost:3000/ws`).
- Multi-client live sync: When any user creates, edits, moves, or deletes a task, changes immediately propagate to all open browser windows without page reloads.
- Live toast notifications notifying collaborators of real-time actions.
- Connection heartbeat with automatic exponential backoff reconnection.

### 4. 📊 Analytics & Visual Productivity Metrics
- Workspace completion rate indicator.
- **Custom SVG Donut Chart** displaying task distribution across To Do, In Progress, Review, and Done.
- **SVG Bar Chart** visualizing workload breakdown across priority tiers.
- Overdue task alert metrics.

### 5. 📜 Live Activity Audit Feed
- Chronological timeline tracking every action taken in the workspace.
- Author avatars, timestamps, and action badges (*Created*, *Status Change*, *Updated*, *Deleted*).

### 6. 🎨 Responsive Design & Rich Aesthetics
- **Dark & Light Mode Toggle** with smooth transitions and persistent state.
- **Glassmorphism Styling**: Translucent panels, backdrop blur, elevation shadows, and clean modern typography (`Plus Jakarta Sans`).
- **Mobile First & Responsive**: Slide-out mobile drawer, bottom navigation bar, and touch-friendly drag-and-drop Kanban.
- **Keyboard Shortcuts**: `/` to search, `N` for new task, `Esc` to close modals.

---

## 📁 Project Directory Structure

```
task-management-app/
├── package.json               # NPM configuration & dependencies
├── README.md                  # Comprehensive application documentation
├── .env.example               # Environment variables template
├── .env                       # Local environment configuration
├── data/                      # Persistent SQLite storage
│   └── tasks.db               # SQLite database file (created automatically)
├── server/                    # Node.js backend
│   ├── config/
│   │   └── db.js              # SQLite initialization, schema creation & demo seeding
│   ├── controllers/
│   │   ├── authController.js  # Register, login, profile check
│   │   ├── taskController.js  # Task CRUD & WebSocket broadcasts
│   │   └── statsController.js # Productivity metrics & activity feed
│   ├── middleware/
│   │   ├── auth.js            # JWT bearer token verification
│   │   └── errorHandler.js    # Centralized error handler
│   ├── models/
│   │   ├── userModel.js       # User database queries
│   │   ├── taskModel.js       # Task queries & filters
│   │   └── activityModel.js   # Audit trail logger
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth routes
│   │   ├── taskRoutes.js      # /api/tasks routes
│   │   └── statsRoutes.js     # /api/stats routes
│   ├── websocket/
│   │   └── wsServer.js        # WebSocket server & event broadcaster
│   └── server.js              # Express app & HTTP/WebSocket bootstrap
└── public/                    # Frontend client (Vanilla JS, HTML5, Modern CSS)
    ├── index.html             # Single-Page Application entry point
    ├── assets/
    │   └── favicon.svg        # Custom brand SVG icon
    ├── css/
    │   ├── variables.css      # Design tokens (dark/light themes, typography, colors)
    │   ├── reset.css          # Modern base resets & scrollbars
    │   ├── layout.css         # Sidebar, header, view containers
    │   ├── components.css     # Buttons, badges, modals, forms, toasts
    │   ├── kanban.css         # Drag-and-drop columns & task cards
    │   ├── animations.css     # Keyframes, shimmer, pulse animations
    │   └── responsive.css     # Breakpoints for tablet and mobile
    └── js/
        ├── config.js          # Client configurations & endpoints
        ├── state.js           # Central reactive state management
        ├── api.js             # Fetch client with JWT authorization
        ├── websocket.js       # Live WebSocket client & sync handlers
        ├── app.js             # Application bootstrap & event binding
        └── components/
            ├── authModal.js   # Sign in & registration modal
            ├── kanbanBoard.js # Drag-and-drop Kanban board
            ├── taskList.js    # Interactive table view
            ├── taskModal.js   # Task Create & Edit dialog
            ├── analyticsView.js # SVG charts & metric cards
            ├── activityFeed.js  # Live activity feed timeline
            └── toast.js       # Floating toast notifications
```

---

## 🛠️ Prerequisites & Installation

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v22 with native SQLite support)
- **NPM**: v9+

### Setup Instructions

1. Navigate to the project directory:
   ```bash
   cd task-management-app
   ```

2. Install dependencies (already included in this folder):
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```
   Or for development mode with automatic reload on changes:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## 🔑 Default Credentials

A pre-configured demo user is seeded automatically upon first launch:

| Field | Value |
|---|---|
| **Email** | `demo@taskflow.dev` |
| **Password** | `Demo123!` |
| **Role** | Admin / Workspace Lead |

*(You can also click the **"⚡ Quick Sign In as Demo User"** button inside the sign-in modal for 1-click access).*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account (`{ fullName, username, email, password }`)
- `POST /api/auth/login` — Sign in with email & password (`{ email, password }`)
- `GET /api/auth/me` — Get authenticated user details *(Bearer token required)*
- `GET /api/auth/users` — List workspace users

### Tasks (`/api/tasks`)
- `GET /api/tasks` — List tasks with optional query filters:
  - `?status=todo|in_progress|review|completed`
  - `?priority=urgent|high|medium|low`
  - `?search=<text>`
  - `?tag=<tag>`
  - `?scope=all|me`
- `GET /api/tasks/:id` — Get single task details
- `POST /api/tasks` — Create new task *(Bearer token required)*
- `PUT /api/tasks/:id` — Update task details *(Bearer token required)*
- `PATCH /api/tasks/:id/status` — Quick status & position update for Kanban drag *(Bearer token required)*
- `DELETE /api/tasks/:id` — Delete task *(Bearer token required)*

### Analytics & Activity (`/api/stats`)
- `GET /api/stats/overview` — Get workspace completion rate, status distribution, and priority metrics
- `GET /api/stats/activities` — Get recent workspace activity log

### WebSockets (`/ws`)
- `TASK_CREATED` — Broadcast when any user creates a task
- `TASK_UPDATED` — Broadcast when a task is edited
- `TASK_STATUS_CHANGED` — Broadcast when a task moves columns
- `TASK_DELETED` — Broadcast when a task is deleted
- `CLIENT_COUNT` — Broadcast active peer count
