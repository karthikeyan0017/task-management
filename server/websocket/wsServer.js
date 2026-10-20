const { WebSocketServer, WebSocket } = require('ws');

let wss = null;
let clientCount = 0;

function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    clientCount++;
    console.log(`[WebSocket] Client connected. Total active clients: ${clientCount}`);

    // Notify all clients of new connection count
    broadcast('CLIENT_COUNT', { count: clientCount });

    // Send welcome message to newly connected client
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      payload: {
        message: 'Connected to TaskFlow Real-time sync engine',
        activeClients: clientCount
      },
      timestamp: Date.now()
    }));

    // Keepalive ping/pong
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch {
        // ignore malformed client messages
      }
    });

    ws.on('close', () => {
      clientCount = Math.max(0, clientCount - 1);
      console.log(`[WebSocket] Client disconnected. Active clients: ${clientCount}`);
      broadcast('CLIENT_COUNT', { count: clientCount });
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Socket error:', err.message);
    });
  });

  // Periodic heartbeat interval
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

function broadcast(type, payload) {
  if (!wss) return;

  const message = JSON.stringify({
    type,
    payload,
    timestamp: Date.now()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('[WebSocket] Failed to send message to client:', err.message);
      }
    }
  });
}

module.exports = {
  initWebSocketServer,
  broadcast
};
