import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, ToggleLeft, ToggleRight, Filter } from 'lucide-react';

const metrics = [
  { value: 'temperature', label: 'Temperature' },
  { value: 'humidity', label: 'Humidity' },
  { value: 'co2', label: 'CO₂' },
  { value: 'light', label: 'Light' },
  { value: 'soilMoisture', label: 'Soil Moisture' },
];

const severities = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

export default function Thresholds() {
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
    await axios.delete(`/api/thresholds/${id}`);
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">Thresholds</h1>
          <p className="mt-2 text-indigo-700/90 dark:text-indigo-300">Set alert thresholds for each metric and room</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterMetric}
              onChange={(e) => setFilterMetric(e.target.value)}
              className="input !px-2 !py-1 !h-9 !w-auto text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            >
              <option value="">All metrics</option>
              {metrics.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              placeholder="room id"
              className="input !px-2 !py-1 !h-9 text-sm"
            />
            <button onClick={load} className="btn-secondary !py-1.5 !px-3 text-sm">Apply</button>
          </div>
        </div>
      </div>

      {/* Create */}
      <div className="card p-4 ring-1 ring-black/5 dark:ring-white/10 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input" />
          <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="input">
            {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <input value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} placeholder="Room (optional)" className="input" />
          <input type="number" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} placeholder="Min (optional)" className="input" />
          <input type="number" value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })} placeholder="Max (optional)" className="input" />
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="input">
            {severities.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="input sm:col-span-2 lg:col-span-3" />
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={createItem} disabled={saving || !form.name} className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"><Plus className="w-4 h-4"/> Create threshold</button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-600 dark:text-gray-300">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300">No thresholds yet</div>
        ) : (
          filtered.map((t) => (
            <div key={t._id} className="card p-4 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{t.name} <span className="text-sm text-gray-500">· {t.metric}{t.roomId ? ` · ${t.roomId}` : ''}</span></div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Min: {t.min ?? '—'} · Max: {t.max ?? '—'} · Severity: {t.severity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleEnabled(t._id, t.enabled)} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${t.enabled ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-gray-700 dark:text-gray-300'}`} title="Toggle enabled">
                    {t.enabled ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                    {t.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button onClick={() => deleteItem(t._id)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2" title="Delete">
                    <Trash2 className="w-4 h-4"/> Delete
                  </button>
                </div>
              </div>
              {t.notes && <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t.notes}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
