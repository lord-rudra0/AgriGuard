import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
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
      // Prefer same-origin connection so Vite proxy (/socket.io) can route to backend
      const token = localStorage.getItem('token');
      const newSocket = io(
        // Use same-origin in dev (proxied by Vite). Optionally override with VITE_SOCKET_URL.
        import.meta.env.VITE_SOCKET_URL || undefined,
        {
          path: '/socket.io',
          transports: ['websocket'],
          withCredentials: true,
          // Only send auth payload if we actually have a token
          ...(token ? { auth: { token } } : {}),
        }
      );

      newSocket.on('connect', () => {
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

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocket(newSocket);

  return () => {
        newSocket.close();
        setSocket(null);
      };
    }
  }, [user]);

  const emitMessage = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      sensorData, 
      alerts, 
      emitMessage 
    }}>
      {children}
    </SocketContext.Provider>
  );
};