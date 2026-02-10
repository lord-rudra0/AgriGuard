import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Play, SkipForward, ChefHat, Clock, Thermometer, Droplets, Wind, Sun, ArrowRight, Activity, Leaf } from 'lucide-react';

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
    if (!name || phases.length === 0) return;
    setSaving(true);
    try {
      await axios.post('/api/recipes', { name, strain, phases, notes });
      await load();
      // Reset form optionally or keep it? Let's keep it for now as a "studio" feel
    } finally { setSaving(false); }
  };

  // Apply & advance minimal controls
  const [roomId, setRoomId] = useState('');
  const applyToRoom = async (recipeId) => {
    if (!roomId) return alert('Please enter a Room ID');
    try {
      await axios.post('/api/phases/apply', { roomId, recipeId });
      alert(`Recipe applied to ${roomId}`);
    } catch (e) {
      alert('Failed to apply recipe');
    }
  };

  const advanceRoom = async () => {
    if (!roomId) return alert('Please enter a Room ID');
    try {
      await axios.post('/api/phases/advance', { roomId });
      alert(`Advanced phase for ${roomId}`);
    } catch (e) {
      alert('Failed to advance phase');
    }
  };

  const deleteRecipe = async (id) => {
    if (!confirm('Delete this recipe?')) return;
    await axios.delete(`/api/recipes/${id}`);
    await load();
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/10 dark:bg-emerald-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              Strain Recipes
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Design and manage growth cycles for your mushrooms</p>
          </div>

          <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="bg-transparent text-xs font-medium text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none w-24 px-2 py-1"
              placeholder="Room ID..."
            />
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={advanceRoom}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors"
              title="Advance Room Phase"
            >
              <SkipForward className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              Advance
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Recipe Builder (Left Panel) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl border border-white/20 dark:border-gray-800 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Recipe Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Golden Teacher Flush"
                    className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Strain Type</label>
                  <input
                    value={strain}
                    onChange={(e) => setStrain(e.target.value)}
                    placeholder="e.g. Psilocybe cubensis"
                    className="w-full px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Growth Phases</label>
                  <button onClick={addPhase} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Phase
                  </button>
                </div>

                <div className="space-y-3">
                  {phases.map((p, idx) => (
                    <div key={idx} className="group relative bg-white/50 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-500/30 transition-all">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <input
                          value={p.name}
                          onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                          placeholder="Phase Name"
                          className="flex-1 min-w-[120px] bg-transparent font-bold text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none border-b border-transparent focus:border-emerald-500 px-1 py-0.5 transition-colors"
                        />
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/30 px-2 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <input
                            type="number"
                            min={1}
                            value={p.durationHours}
                            onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, durationHours: Number(e.target.value) } : it))}
                            className="w-12 bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none text-center"
                          />
                          <span className="text-[10px] uppercase font-bold text-gray-400">Hrs</span>
                        </div>
                        <button onClick={() => removePhase(idx)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { icon: Thermometer, label: 'Temp', key: 'temperature', unit: '°C', color: 'text-orange-500' },
                          { icon: Droplets, label: 'RH', key: 'humidity', unit: '%', color: 'text-blue-500' },
                          { icon: Wind, label: 'CO2', key: 'co2', unit: 'ppm', color: 'text-gray-500' },
                          { icon: Sun, label: 'Light', key: 'light', unit: 'lux', color: 'text-yellow-500' },
                        ].map((metric) => (
                          <div key={metric.key} className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700/30">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase">
                              <metric.icon className={`w-3 h-3 ${metric.color}`} /> {metric.label}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <input
                                type="number"
                                value={p.setpoints[metric.key]}
                                onChange={(e) => setPhases((arr) => arr.map((it, i) => i === idx ? { ...it, setpoints: { ...it.setpoints, [metric.key]: Number(e.target.value) } } : it))}
                                className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this recipe..."
                  className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 focus:outline-none mr-4"
                />
                <button
                  onClick={saveRecipe}
                  disabled={saving || !name || phases.length === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:grayscale uppercase tracking-widest flex items-center gap-2"
                >
                  {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Recipe</>}
                </button>
              </div>
            </div>
          </div>

          {/* Saved Recipes (Right/Bottom Panel) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                Saved Recipes <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500">{items.length}</span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 pb-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 animate-pulse">
                  <ChefHat className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Loading cookbook...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center bg-white/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-gray-500">No recipes saved yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {items.map((r) => (
                    <div key={r._id} className="group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {r.name}
                          </h3>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{r.strain}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => applyToRoom(r._id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Apply to Room"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRecipe(r._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {r.phases?.length || 0} Phases</span>
                        <span className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.phases?.reduce((acc, p) => acc + (p.durationHours || 0), 0)} Hrs Total</span>
                      </div>

                      <div className="space-y-1">
                        {r.phases?.slice(0, 3).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-white/50 dark:bg-gray-800/30">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{i + 1}. {p.name}</span>
                            <span className="text-gray-400 font-medium">{p.durationHours}h</span>
                          </div>
                        ))}
                        {(r.phases?.length || 0) > 3 && (
                          <div className="text-[9px] text-center text-gray-400 pt-1">+{r.phases.length - 3} more phases</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
