import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

// Minimal hook to surface websocket alerts as toasts
// Keeps Dashboard clean; can be reused in other pages
export default function useAlertsSocket(options = {}) {
  const { showToast = true } = options;
  const { alerts } = useSocket();
  const lastKeyRef = useRef(null);

  useEffect(() => {
    if (!showToast || !alerts || alerts.length === 0) return;

    const a = alerts[0]; // latest first per SocketContext push order
    const key = a.id || `${a.type}-${new Date(a.timestamp).getTime()}-${a.message}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    const title = a.title || (a.type === 'weather' ? 'Weather Alert' : 'Threshold Breach');
    const msg = a.message || `${a.type} alert`;

    if (a.severity === 'high') {
      toast.error(`${title}: ${msg}`);
    } else if (a.severity === 'medium') {
      toast(`${title}: ${msg}`, { icon: '⚠️' });
    } else {
      toast.success(`${title}: ${msg}`);
    }
  }, [alerts, showToast]);
}
