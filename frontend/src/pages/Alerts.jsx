import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { AlertTriangle, CheckCircle2, Filter, Loader2, Trash2, Bell, Check, X, Search, RefreshCw, ShieldAlert, Activity } from 'lucide-react';

const severityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
};

const severityGlows = {
  low: 'group-hover:shadow-blue-500/10',
  medium: 'group-hover:shadow-yellow-500/10',
  high: 'group-hover:shadow-orange-500/10',
  critical: 'shadow-red-500/20 group-hover:shadow-red-500/30 animate-pulse-slow',
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
        setItems(prev => prev.map(a => (a._id === id ? data.alert : a)));
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
        setItems(prev => prev.filter(a => a._id !== id));
        setTotal(t => Math.max(0, t - 1));
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
        setItems(prev => prev.map(a => ({ ...a, isRead: true })));
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
        setItems(prev => prev.filter(a => !a.isResolved));
        toast.success('Resolved alerts cleared');
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
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-500/5 dark:bg-red-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-orange-500/5 dark:bg-orange-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-emerald-500/5 dark:bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg shadow-red-500/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              System Alerts
              {total > 0 && <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{total}</span>}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Real-time system monitoring and critical notifications</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="group px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-sm"
            >
              Mark all read
            </button>
            <button
              onClick={clearResolved}
              className="group px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm"
            >
              Clear resolved
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-white/20 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-20">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-gray-700/50">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filters.severity}
                onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none border-none cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-gray-700/50">
              <Activity className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filters.type}
                onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none border-none cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <option value="">All Types</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="co2">CO₂</option>
                <option value="light">Light</option>
                <option value="soilMoisture">Soil Moisture</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {['open', 'resolved', 'all'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilters(f => ({ ...f, status }))}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filters.status === status
                      ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchAlerts}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 min-h-[300px]">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 animate-pulse">
              <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-50" />
              <p className="text-sm font-medium">Scanning system...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">All Systems Normal</p>
              <p className="text-sm mt-1 opacity-70">No active alerts matching your filters.</p>
            </div>
          ) : (
            items.map(alert => (
              <div
                key={alert._id}
                className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border rounded-2xl p-4 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${severityColors[alert.severity]} ${severityGlows[alert.severity]} ${alert.isResolved ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.isResolved ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                      {alert.isResolved ? <Check className="w-5 h-5" /> : <AlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-500' :
                          alert.severity === 'high' ? 'text-orange-500' :
                            alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/50 dark:bg-gray-900/50`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        {alert.type}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className={`font-bold text-base mb-1 ${alert.isResolved ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                      {alert.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                      {alert.message}
                    </p>

                    {alert.value != null && alert.threshold && (
                      <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/50 dark:bg-gray-900/50 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/5">
                        <span>Val: <strong>{alert.value}</strong></span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span>Range: <strong>{alert.threshold.min ?? '-'}</strong> - <strong>{alert.threshold.max ?? '-'}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => markRead(alert._id, !alert.isRead)}
                      className={`p-2 rounded-lg transition-colors ${alert.isRead ? 'bg-gray-100 text-gray-400 hover:text-gray-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      title={alert.isRead ? "Mark unread" : "Mark read"}
                    >
                      {alert.isRead ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => resolveAlert(alert._id, !alert.isResolved)}
                      className={`p-2 rounded-lg transition-colors ${alert.isResolved ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      title={alert.isResolved ? "Reopen issue" : "Resolve issue"}
                    >
                      {alert.isResolved ? <Activity className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteAlert(alert._id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {!alert.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse md:hidden" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
