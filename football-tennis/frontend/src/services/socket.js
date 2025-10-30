/**
 * Socket.IO Client Service
 * Manages WebSocket connection for real-time gameplay
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  authenticate(userId, username) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.emit('authenticate', { userId, username });
  }

  joinMatch(matchId, userId) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.emit('join_match', { matchId, userId });
  }

  submitAnswer(matchId, rallyId, userId, answer) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('submit_answer', { matchId, rallyId, userId, answer });
  }

  sendTimeout(matchId, rallyId, userId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('timeout', { matchId, rallyId, userId });
  }

  // Event listeners
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.on(event, callback);

    // Store callback for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
