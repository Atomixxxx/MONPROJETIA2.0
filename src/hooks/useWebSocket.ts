import { useEffect, useRef, useState } from 'react';
import { WebSocketService } from '../services/websocket';
import { WebSocketMessage, User } from '../types';

export const useWebSocket = (userId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    wsRef.current = new WebSocketService(userId);
    
    const ws = wsRef.current;
    
    ws.connect().then(() => {
      setIsConnected(true);
    });

    // Écouter les événements
    ws.on('connection', (data) => {
      console.log('✅ WebSocket Connected:', data);
      setIsConnected(true);
    });

    ws.on('user_join', (data) => {
      console.log('👤 User Joined:', data);
      setUsers(prev => [...prev, {
        id: data.userId,
        name: data.name || 'Utilisateur',
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        isActive: true,
        lastSeen: new Date()
      }]);
    });

    ws.on('user_leave', (data) => {
      console.log('👋 User Left:', data);
      setUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    ws.on('code_change', (message) => {
      console.log('📝 Code Change:', message);
      setMessages(prev => [...prev, message]);
    });

    ws.on('heartbeat', (message) => {
      console.log('💓 Heartbeat:', message.payload.timestamp);
    });

    return () => {
      ws.disconnect();
      setIsConnected(false);
    };
  }, [userId]);

  const sendMessage = (message: Omit<WebSocketMessage, 'timestamp' | 'userId'>) => {
    if (wsRef.current) {
      wsRef.current.sendMessage({
        ...message,
        timestamp: Date.now(),
        userId
      });
    }
  };

  return {
    isConnected,
    users,
    messages,
    sendMessage
  };
};