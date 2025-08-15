import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Play, SkipForward } from 'lucide-react';

const emptyPhase = () => ({ name: '', durationHours: 24, setpoints: { temperature: 24, humidity: 90, co2: 1000, light: 0 } });

export default function Recipes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Builder state
  const [name, setName] = useState('Oyster Standard');
  const [strain, setStrain] = useState('Pleurotus ostreatus');
  const [phases, setPhases] = useState([
    { name: 'Colonization', durationHours: 120, setpoints: { temperature: 24, humidity: 70, co2: 1200, light: 0 } },
    { name: 'Primordia', durationHours: 48, setpoints: { temperature: 18, humidity: 95, co2: 800, light: 300 } },
    { name: 'Flush', durationHours: 96, setpoints: { temperature: 20, humidity: 90, co2: 900, light: 400 } },
  ]);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/recipes');
      setItems(res.data?.recipes || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addPhase = () => setPhases((p) => [...p, emptyPhase()]);
  const removePhase = (idx) => setPhases((p) => p.filter((_, i) => i !== idx));

  const saveRecipe = async () => {
    setSaving(true);
    try {
      await axios.post('/api/recipes', { name, strain, phases, notes });
      await load();
    } finally { setSaving(false); }
  };

  // Apply & advance minimal controls
  const [roomId, setRoomId] = useState('room-1');
  const applyToRoom = async (recipeId) => {
    await axios.post('/api/phases/apply', { roomId, recipeId });
  };
  const advanceRoom = async () => {
    await axios.post('/api/phases/advance', { roomId });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">Strain Recipes</h1>
          <p className="mt-2 text-indigo-700/90 dark:text-indigo-300">Define climate phases and apply to rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-sm" placeholder="room id" />
          <button onClick={advanceRoom} className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary-600 text-white hover:bg-secondary-700 flex items-center gap-2" title="Advance room phase">
            <SkipForward className="w-4 h-4" /> Advance
          </button>
        </div>
      </div>

      {/* Builder */}
      <div className="card p-4 ring-1 ring-black/5 dark:ring-white/10 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Recipe name" className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10" />
          <input value={strain} onChange={(e) => setStrain(e.target.value)} placeholder="Strain" className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10" />
        </div>
        <div className="space-y-3">
          {phases.map((p, idx) => (
            <div key={idx} className="p-3 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center gap-2">
                <input value={p.name} onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} placeholder="Phase name" className="px-3 py-1.5 rounded-md bg-white/80 dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10" />
                <input type="number" min={1} value={p.durationHours} onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, durationHours: Number(e.target.value) } : it))} className="w-28 px-3 py-1.5 rounded-md bg-white/80 dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10" />
                <span className="text-sm text-gray-500">hours</span>
                <button onClick={() => removePhase(idx)} className="ml-auto px-2 py-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove phase">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                <label className="flex items-center gap-2">T°<input type="number" value={p.setpoints.temperature} onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, setpoints: { ...it.setpoints, temperature: Number(e.target.value) } } : it))} className="w-24 px-2 py-1 rounded-md bg-white/80 dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10" /></label>
                <label className="flex items-center gap-2">RH<input type="number" value={p.setpoints.humidity} onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, setpoints: { ...it.setpoints, humidity: Number(e.target.value) } } : it))} className="w-24 px-2 py-1 rounded-md bg-white/80 dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10" /></label>
                <label className="flex items-center gap-2">CO₂<input type="number" value={p.setpoints.co2} onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, setpoints: { ...it.setpoints, co2: Number(e.target.value) } } : it))} className="w-24 px-2 py-1 rounded-md bg-white/80 dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10" /></label>
                <label className="flex items-center gap-2">Lux<input type="number" value={p.setpoints.light} onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, setpoints: { ...it.setpoints, light: Number(e.target.value) } } : it))} className="w-24 px-2 py-1 rounded-md bg-white/80 dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10" /></label>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 justify-between">
          <button onClick={addPhase} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 flex items-center gap-2"><Plus className="w-4 h-4"/> Add phase</button>
          <button onClick={saveRecipe} disabled={saving} className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"><Save className="w-4 h-4"/> Save recipe</button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-600 dark:text-gray-300">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300">No recipes yet</div>
        ) : (
          items.map((r) => (
            <div key={r._id} className="card p-4 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{r.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{r.strain} · {r.phases?.length || 0} phases</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => applyToRoom(r._id)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2" title="Apply to room">
                    <Play className="w-4 h-4"/> Apply
                  </button>
                  <button onClick={async () => { await axios.delete(`/api/recipes/${r._id}`); await load(); }} className="px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2" title="Delete">
                    <Trash2 className="w-4 h-4"/> Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 text-sm">
                {r.phases?.map((p, i) => (
                  <div key={i} className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="font-medium">{i+1}. {p.name}</div>
                    <div className="text-gray-500 dark:text-gray-400">{p.durationHours} h · T° {p.setpoints.temperature} · RH {p.setpoints.humidity} · CO₂ {p.setpoints.co2} · Lux {p.setpoints.light}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
