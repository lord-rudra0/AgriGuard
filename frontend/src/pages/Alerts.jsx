import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { AlertTriangle, CheckCircle2, Circle, Filter, Loader2, Trash2 } from 'lucide-react';

const severityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };

const Alerts = () => {
  const { alerts: liveAlerts } = useSocket();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ severity: '', type: '', status: 'open' });
  const [page, setPage] = useState(1);
  const limit = 20;

  // Merge live alerts to top of list
  useEffect(() => {
    if (liveAlerts.length > 0) {
      setItems(prev => {
        const existingIds = new Set(prev.map(a => String(a._id)));
        const merged = [...liveAlerts.filter(a => !existingIds.has(String(a._id))), ...prev];
        return merged;
      });
      setTotal(t => t + liveAlerts.length);
    }
  }, [liveAlerts]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
      };
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
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.severity, filters.type, filters.status]);

  const markRead = async (id, isRead = true) => {
    try {
      const { data } = await axios.put(`/api/alerts/${id}/read`, { isRead });
      if (data.success) {
        setItems(prev => prev.map(a => (a._id === id ? data.alert : a)));
      }
    } catch {
      toast.error('Failed to update read state');
    }
  };

  const resolveAlert = async (id, isResolved = true) => {
    try {
      const { data } = await axios.put(`/api/alerts/${id}/resolve`, { isResolved });
      if (data.success) {
        setItems(prev => prev.map(a => (a._id === id ? data.alert : a)));
      }
    } catch {
      toast.error('Failed to update resolve state');
    }
  };

  const deleteAlert = async (id) => {
    try {
      const { data } = await axios.delete(`/api/alerts/${id}`);
      if (data.success) {
        setItems(prev => prev.filter(a => a._id !== id));
        setTotal(t => Math.max(0, t - 1));
      }
    } catch {
      toast.error('Failed to delete alert');
    }
  };

  const markAllRead = async () => {
    try {
      const { data } = await axios.put('/api/alerts/actions/read-all');
      if (data.success) {
        setItems(prev => prev.map(a => ({ ...a, isRead: true })));
      }
    } catch {
      toast.error('Failed to mark all read');
    }
  };

  const clearResolved = async () => {
    try {
      const { data } = await axios.delete('/api/alerts/actions/clear-resolved');
      if (data.success) {
        setItems(prev => prev.filter(a => !a.isResolved));
      }
    } catch {
      toast.error('Failed to clear resolved');
    }
  };

  const grouped = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const s = severityOrder[b.severity] - severityOrder[a.severity];
      if (s !== 0) return s;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return sorted;
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-up">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">Alerts</h1>
            <p className="mt-2 text-indigo-700/90 dark:text-indigo-300">Monitor and manage system alerts in real time</p>
          </div>
          <div className="flex gap-2">
            <button onClick={markAllRead} className="px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200">
              Mark all read
            </button>
            <button onClick={clearResolved} className="px-3 py-2 text-sm rounded-md text-white bg-gradient-to-r from-rose-600 to-red-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200">
              Clear resolved
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Severity</label>
            <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">All</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="co2">CO₂</option>
              <option value="light">Light</option>
              <option value="soilMoisture">Soil Moisture</option>
              <option value="system">System</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchAlerts} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200">
              <Filter className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-700 ring-1 ring-black/5 dark:ring-white/10">
          {loading ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : grouped.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No alerts found</div>
          ) : (
            grouped.map(alert => (
              <div key={alert._id} className="p-4 flex items-start gap-4 transition-colors duration-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/30">
                <div className="relative mt-1">
                  {!alert.isRead && (
                    <span className="absolute -inset-1 rounded-full bg-emerald-400/50 animate-ping"></span>
                  )}
                  <span className={`relative block w-2 h-2 rounded-full ${alert.isRead ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500'}`}></span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${severityColors[alert.severity]}`}>{alert.severity}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                    <h3 className="font-medium text-gray-900 dark:text-white bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
                      {alert.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">• {alert.type}</span>
                    {alert.value != null && alert.threshold && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">• value {alert.value}, threshold {alert.threshold.min ?? '-'}-{alert.threshold.max ?? '-'}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{alert.message}</p>
                  {alert.isResolved && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => markRead(alert._id, !alert.isRead)} className="px-2 py-1 text-xs rounded ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200">
                    {alert.isRead ? 'Mark unread' : 'Mark read'}
                  </button>
                  <button onClick={() => resolveAlert(alert._id, !alert.isResolved)} className="px-2 py-1 text-xs rounded ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200">
                    {alert.isResolved ? 'Reopen' : 'Resolve'}
                  </button>
                  <button onClick={() => deleteAlert(alert._id)} className="px-2 py-1 text-xs rounded text-white bg-gradient-to-r from-rose-600 to-red-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="mt-4 flex justify-end items-center gap-2 text-sm">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700/60 disabled:opacity-50 transition-all duration-200">Prev</button>
            <span className="text-gray-600 dark:text-gray-300">Page {page}</span>
            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700/60 disabled:opacity-50 transition-all duration-200">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
