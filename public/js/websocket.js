import { CONFIG } from './config.js';
import { state } from './state.js';
import { toast } from './components/toast.js';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(CONFIG.WS_URL);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected to server.');
        this.reconnectAttempts = 0;
        state.setWsStatus(true);
      };

      this.ws.onclose = () => {
        console.warn('[WebSocket] Connection closed. Attempting reconnect...');
        state.setWsStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[WebSocket] Error occurred:', err);
        state.setWsStatus(false);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Failed to create WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  handleEvent(message) {
    const { type, payload } = message;
    const currentUserId = state.getState().user ? state.getState().user.id : null;

    switch (type) {
      case 'CLIENT_COUNT':
        state.setWsStatus(true, payload.count);
        break;

      case 'TASK_CREATED':
        state.addTask(payload.task);
        if (payload.actor && payload.actor.id !== currentUserId) {
          toast.live(`${payload.actor.name} created "${payload.task.title}"`);
        }
        break;

      case 'TASK_UPDATED':
        state.updateTask(payload.task);
        if (payload.actor && payload.actor.id !== currentUserId) {
          toast.live(`${payload.actor.name} updated "${payload.task.title}"`);
        }
        break;

      case 'TASK_STATUS_CHANGED':
        state.updateTask(payload.task);
        if (payload.actor && payload.actor.id !== currentUserId) {
          const readableStatus = payload.newStatus.replace('_', ' ');
          toast.live(`${payload.actor.name} moved "${payload.task.title}" to ${readableStatus}`);
        }
        break;

      case 'TASK_DELETED':
        state.removeTask(payload.taskId);
        if (payload.actor && payload.actor.id !== currentUserId) {
          toast.live(`${payload.actor.name} deleted task "${payload.taskTitle}"`);
        }
        break;

      default:
        break;
    }
  }
}

export const wsClient = new WebSocketClient();
