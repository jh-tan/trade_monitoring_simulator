import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  connect() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:3001';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.emit('connect')
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;

      this.emit('disconnect')
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    // Listen for market data updates
    this.socket.on('market_update', (data) => {
      this.emit('market_update', data);
    });

    // Listen for margin alerts
    this.socket.on('margin_call_alert', (data) => {
      this.emit('margin_alert', data);
    });

    // Listen for position updates
    this.socket.on('position_update', (data) => {
      this.emit('position_update', data);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  subscribeToClient(clientId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('register', clientId);
    }
  }

  unsubscribeFromClient(clientId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('deregister', clientId);
    }
  }
}

export default new WebSocketService();
