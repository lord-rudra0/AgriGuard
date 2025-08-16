import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { SOCKET_URL } from '../config/api.js';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Explicit named export for the raw context (optional helper)
export { SocketContext };

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState(new Map()); // userId -> online
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    co2: 0,
    light: 0,
    soilMoisture: 0,
    lastUpdated: new Date()
  });
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Use configured socket URL for production, undefined for development (Vite proxy)
      const token = localStorage.getItem('token');
      const newSocket = io(
        // Use configured socket URL in production, undefined in dev (proxied by Vite)
        SOCKET_URL || undefined,
        {
          path: '/socket.io',
          transports: ['websocket'],
          withCredentials: true,
          // Only send auth payload if we actually have a token
          ...(token ? { auth: { token } } : {}),
        }
      );

      newSocket.on('connect', () => {
        setConnected(true);
        console.log('Connected to server');
      });

      newSocket.on('sensorData', (data) => {
        setSensorData({
          ...data,
          lastUpdated: new Date()
        });
      });

      newSocket.on('newAlert', (alert) => {
        setAlerts(prev => [alert, ...prev]);
      });

      // Weather alerts pushed from backend
      newSocket.on('weatherAlert', (alert) => {
        setAlerts(prev => [alert, ...prev]);
      });

      // Phase changes (Strain Recipes + Scheduler)
      newSocket.on('phaseChanged', ({ roomId, action, phase }) => {
        const title = action === 'completed'
          ? `Room ${roomId}: Recipe completed`
          : `Room ${roomId}: Phase ${action}`;
        const message = action === 'completed'
          ? 'All phases finished.'
          : `${phase?.active?.name ?? phase?.name ?? 'Phase'} started`;
        const alert = { type: 'phase', title, message, severity: 'info', timestamp: new Date() };
        setAlerts(prev => [alert, ...prev]);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
        console.log('Disconnected from server');
      });

      // Presence updates
      newSocket.on('presence:update', ({ userId, online }) => {
        setPresence(prev => {
          const next = new Map(prev);
          next.set(String(userId), online);
          return next;
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user]);

  const emitMessage = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  const joinChat = (chatId) => socket?.emit('chat:join', { chatId });
  const leaveChat = (chatId) => socket?.emit('chat:leave', { chatId });
  const setTyping = (chatId, typing) => socket?.emit('chat:typing', { chatId, typing });
  const clearAlerts = () => setAlerts([]);

  return (
    <SocketContext.Provider value={{ 
      socket,
      connected,
      presence,
      sensorData, 
      alerts,
      clearAlerts,
      emitMessage,
      joinChat,
      leaveChat,
      setTyping,
    }}>
      {children}
    </SocketContext.Provider>
  );
};