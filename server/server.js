const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./config/db');
const { initWebSocketServer } = require('./websocket/wsServer');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Database & WebSocket Server
initDatabase();
initWebSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TaskFlow API & WebSocket Server',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
  next();
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  TaskFlow Server running at http://localhost:${PORT}`);
  console.log(`  WebSocket live sync endpoint: ws://localhost:${PORT}/ws`);
  console.log(`  Default Demo User: demo@taskflow.dev / Demo123!`);
  console.log(`=======================================================`);
});
