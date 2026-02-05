import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const messageBufferRef = useRef([]); // buffer outgoing emits while disconnected
  const [presence, setPresence] = useState(new Map()); // userId -> online
  const [sensorData, setSensorData] = useState({
    temperature: undefined,
    humidity: undefined,
    co2: undefined,
    light: undefined,
    soilMoisture: undefined,
    lastUpdated: null
  });
  const [alerts, setAlerts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    if (!user) {
      // if user logged out, ensure socket is closed
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
        setConnectionState('disconnected');
      }
      return;
    }

    // create socket with reconnection options and custom backoff
    const token = localStorage.getItem('token');
    setConnectionState('connecting');
    const newSocket = io(
      SOCKET_URL || undefined,
      {
        path: '/socket.io',
        transports: ['websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5,
        // Only send auth payload if we actually have a token
        ...(token ? { auth: { token } } : {}),
      }
    );

    // attach listeners
    newSocket.on('connect', () => {
      if (!mounted) return;
      setConnected(true);
      setConnectionState('connected');
      setReconnectAttempts(0);
      console.log('Socket connected');

      // flush buffered messages
      while (messageBufferRef.current.length > 0) {
        const { event, data } = messageBufferRef.current.shift();
        newSocket.emit(event, data);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connect_error', err?.message ?? err);
      setConnectionState('connecting');
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      setReconnectAttempts(attempt);
      setConnectionState('connecting');
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionState('disconnected');
      console.error('Socket reconnection failed');
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      setConnectionState('disconnected');
      console.log('Socket disconnected:', reason);
    });

    // App-specific events
    newSocket.on('sensorData', (data) => {
      setSensorData(prev => ({ ...data, lastUpdated: new Date() }));
    });

    newSocket.on('newAlert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

    newSocket.on('weatherAlert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });

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

    newSocket.on('presence:update', ({ userId, online }) => {
      setPresence(prev => {
        const next = new Map(prev);
        next.set(String(userId), online);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      mounted = false;
      newSocket.close();
      setSocket(null);
      setConnected(false);
      setConnectionState('disconnected');
    };
  }, [user]);

  const emitMessage = (event, data) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      // buffer message to send once reconnected
      messageBufferRef.current.push({ event, data });
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
      connectionState,
      reconnectAttempts,
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