import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, Filter, AlertTriangle, CloudRain, Droplets, Sun, Thermometer, Wind, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const metrics = [
  { value: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { value: 'humidity', label: 'Humidity', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { value: 'co2', label: 'CO₂', icon: Wind, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  { value: 'light', label: 'Light', icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { value: 'soilMoisture', label: 'Soil Moisture', icon: CloudRain, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const severities = [
  { value: 'info', label: 'Info', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'warning', label: 'Warning', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'critical', label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
];

export default function Thresholds() {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterMetric, setFilterMetric] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

  const [form, setForm] = useState({
    name: '',
    metric: 'temperature',
    roomId: '',
    min: '',
    max: '',
    severity: 'warning',
    enabled: true,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMetric) params.metric = filterMetric;
      if (filterRoom) params.roomId = filterRoom;
      const res = await axios.get('/api/thresholds', { params });
      setItems(res.data?.thresholds || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onTalkAction = (payload = {}) => {
      if (payload.action === 'threshold_created' || payload.action === 'threshold_updated') {
        load();
      }
    };
    socket.on('talk:action', onTalkAction);
    return () => socket.off('talk:action', onTalkAction);
  }, [socket]);

  const filtered = useMemo(() => items, [items]);

  const createItem = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        min: form.min === '' ? null : Number(form.min),
        max: form.max === '' ? null : Number(form.max),
        roomId: form.roomId || null,
      };
      await axios.post('/api/thresholds', payload);
      setForm({ name: '', metric: form.metric, roomId: '', min: '', max: '', severity: 'warning', enabled: true, notes: '' });
      await load();
    } finally { setSaving(false); }
  };

  const toggleEnabled = async (id, enabled) => {
    await axios.put(`/api/thresholds/${id}`, { enabled: !enabled });
    await load();
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this threshold?')) return;
    await axios.delete(`/api/thresholds/${id}`);
    await load();
  };

  const getMetricIcon = (value) => {
    const m = metrics.find(x => x.value === value);
    return m ? <m.icon className={`w-5 h-5 ${m.color}`} /> : <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/10 dark:bg-emerald-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              Thresholds
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Configure alert triggers for your sensors</p>
          </div>

          <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="px-2">
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <select
              value={filterMetric}
              onChange={(e) => setFilterMetric(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none border-none cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-1"
            >
              <option value="">All Metrics</option>
              {metrics.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <input
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              placeholder="Filter by Room ID..."
              className="bg-transparent text-xs font-medium text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-32 md:w-40 px-1 py-1"
            />
            <button
              onClick={load}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg transition-colors ml-1"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-xl border border-white/20 dark:border-gray-800 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. High Temp Warning"
                className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Metric</label>
              <div className="relative">
                <select
                  value={form.metric}
                  onChange={(e) => setForm({ ...form, metric: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer dark:text-white"
                >
                  {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Room ID</label>
              <input
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Severity</label>
              <div className="relative">
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer dark:text-white"
                >
                  {severities.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Min Value</label>
                <input
                  type="number"
                  value={form.min}
                  onChange={(e) => setForm({ ...form, min: e.target.value })}
                  placeholder="-"
                  className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Max Value</label>
                <input
                  type="number"
                  value={form.max}
                  onChange={(e) => setForm({ ...form, max: e.target.value })}
                  placeholder="-"
                  className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional details (optional)"
                className="w-full px-3 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={createItem}
                disabled={saving || !form.name}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:grayscale uppercase tracking-widest flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="animate-pulse">Creating...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Set Threshold
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* List Grid */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 animate-pulse">
              <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Loading thresholds...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertTriangle className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">No thresholds set</p>
              <p className="text-sm mt-1 opacity-70 max-w-xs text-center">Create alert triggers above to monitor your sensors automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => {
                const metricInfo = metrics.find(m => m.value === t.metric) || metrics[0];
                const severityInfo = severities.find(s => s.value === t.severity) || severities[0];

                return (
                  <div key={t._id} className={`relative group bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${!t.enabled ? 'opacity-60 saturate-50' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${metricInfo.bg} ${metricInfo.color} shadow-sm`}>
                          {getMetricIcon(t.metric)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {t.name}
                          </h3>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                            {metricInfo.label}
                            {t.roomId && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="text-indigo-500 dark:text-indigo-400">{t.roomId}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${severityInfo.bg} ${severityInfo.color} border border-transparent`}>
                        {severityInfo.label}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {t.min != null && (
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700/50">
                          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Min</span>
                          <span className="block text-sm font-black text-gray-900 dark:text-white">{t.min}</span>
                        </div>
                      )}
                      {t.max != null && (
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700/50">
                          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Max</span>
                          <span className="block text-sm font-black text-gray-900 dark:text-white">{t.max}</span>
                        </div>
                      )}
                      {t.min == null && t.max == null && (
                        <div className="w-full text-center text-xs text-gray-400 italic py-2">
                          No range specified
                        </div>
                      )}
                    </div>

                    {t.notes && (
                      <div className="mb-4 text-xs text-gray-600 dark:text-gray-400 bg-emerald-50/50 dark:bg-emerald-900/10 p-2.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/20 italic">
                        "{t.notes}"
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 mt-auto">
                      <button
                        onClick={() => toggleEnabled(t._id, t.enabled)}
                        className={`flex items-center gap-2 text-xs font-bold transition-colors ${t.enabled ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                      >
                        {t.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        {t.enabled ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        onClick={() => deleteItem(t._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete Threshold"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
