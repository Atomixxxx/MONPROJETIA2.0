import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types';
import { apiService } from './api';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;
  private callbacks = new Map<string, Function[]>();

  constructor(private userId: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = apiService.createWebSocket(this.userId);
        
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connection', { userId: this.userId });
          resolve();
        };

        this.socket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        // Fallback to mock connection for development
        this.simulateConnection();
        resolve();
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private simulateConnection() {
    this.isConnected = true;
    this.startHeartbeat();
    this.emit('connection', { userId: this.userId });
    
    // Simuler des événements de collaboration
    setTimeout(() => {
      this.emit('user_join', { userId: 'user-2', name: 'Collaborateur' });
    }, 2000);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({
          type: 'heartbeat',
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          userId: this.userId
        });
      }
    }, 5000);
  }

  sendMessage(message: WebSocketMessage) {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(message));
    } else if (this.isConnected) {
      console.log('📤 WebSocket Message:', message);
      // Simuler la réception du message
      setTimeout(() => {
        this.handleMessage(message);
      }, 50);
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.callbacks.get(message.type) || [];
    callbacks.forEach(callback => callback(message));
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }

  disconnect() {
    this.isConnected = false;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }
}