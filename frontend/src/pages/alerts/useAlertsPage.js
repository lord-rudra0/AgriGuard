import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { severityOrder, ALERTS_PAGE_LIMIT } from './constants';

export const useAlertsPage = ({ liveAlerts, socket }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ severity: '', type: '', status: 'open' });
  const [page, setPage] = useState(1);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: ALERTS_PAGE_LIMIT };
      if (filters.severity) params.severity = filters.severity;
      if (filters.type) params.type = filters.type;
      if (filters.status === 'open') params.isResolved = false;
      if (filters.status === 'resolved') params.isResolved = true;

      const { data } = await axios.get('/api/alerts', { params });
      if (data.success) {
        setItems(data.items);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (liveAlerts.length === 0) return;
    setItems((prev) => {
      const existingIds = new Set(prev.map((a) => String(a._id)));
      return [...liveAlerts.filter((a) => !existingIds.has(String(a._id))), ...prev];
    });
    setTotal((t) => t + liveAlerts.length);
  }, [liveAlerts]);

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.severity, filters.type, filters.status]);

  useEffect(() => {
    if (!socket) return;
    const onTalkAction = (data) => {
      const action = data?.action;
      const incomingAlert = data?.alert;
      if ((action === 'alert_resolved' || action === 'alert_escalated') && incomingAlert?.id) {
        setItems((prev) => {
          const idx = prev.findIndex((a) => String(a._id) === String(incomingAlert.id));
          if (idx === -1) {
            fetchAlerts();
            return prev;
          }
          const next = [...prev];
          next[idx] = { ...next[idx], ...incomingAlert, _id: next[idx]._id || incomingAlert.id };
          return next;
        });
      }
    };
    socket.on('talk:action', onTalkAction);
    return () => socket.off('talk:action', onTalkAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const markRead = async (id, isRead = true) => {
    try {
      const { data } = await axios.put(`/api/alerts/${id}/read`, { isRead });
      if (data.success) {
        setItems((prev) => prev.map((a) => (a._id === id ? data.alert : a)));
        toast.success(isRead ? 'Marked as read' : 'Marked as unread');
      }
    } catch {
      toast.error('Failed to update read state');
    }
  };

  const resolveAlert = async (id, isResolved = true) => {
    try {
      const { data } = await axios.put(`/api/alerts/${id}/resolve`, { isResolved });
      if (data.success) {
        setItems((prev) => prev.map((a) => (a._id === id ? data.alert : a)));
        toast.success(isResolved ? 'Alert resolved' : 'Alert reopened');
      }
    } catch {
      toast.error('Failed to update resolve state');
    }
  };

  const deleteAlert = async (id) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    try {
      const { data } = await axios.delete(`/api/alerts/${id}`);
      if (data.success) {
        setItems((prev) => prev.filter((a) => a._id !== id));
        setTotal((t) => Math.max(0, t - 1));
        toast.success('Alert deleted');
      }
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  const markAllRead = async () => {
    try {
      const { data } = await axios.put('/api/alerts/actions/read-all');
      if (data.success) {
        setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
        toast.success('All alerts marked as read');
      }
    } catch {
      toast.error('Failed to mark all read');
    }
  };

  const clearResolved = async () => {
    if (!confirm('Clear all resolved alerts?')) return;
    try {
      const { data } = await axios.delete('/api/alerts/actions/clear-resolved');
      if (data.success) {
        setItems((prev) => prev.filter((a) => !a.isResolved));
        toast.success('Resolved alerts cleared');
      }
    } catch {
      toast.error('Failed to clear resolved');
    }
  };

  const grouped = useMemo(() => (
    [...items].sort((a, b) => {
      const s = severityOrder[b.severity] - severityOrder[a.severity];
      if (s !== 0) return s;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
  ), [items]);

  return {
    loading,
    items,
    total,
    filters,
    setFilters,
    page,
    setPage,
    fetchAlerts,
    grouped,
    markRead,
    resolveAlert,
    deleteAlert,
    markAllRead,
    clearResolved
  };
};
