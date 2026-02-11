import { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Trash2, Play } from 'lucide-react';

export default function SavedViews({ currentTimeframe = '24h', currentTypes = [], onApply }) {
  const [views, setViews] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchViews = async () => {
    const res = await axios.get('/api/analytics-views');
    setViews(res.data?.views || []);
  };

  useEffect(() => {
    fetchViews();
  }, []);

  const saveView = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await axios.post('/api/analytics-views', { name: name.trim(), timeframe: currentTimeframe, types: currentTypes });
      setName('');
      await fetchViews();
    } finally {
      setLoading(false);
    }
  };

  const removeView = async (id) => {
    await axios.delete(`/api/analytics-views/${id}`);
    await fetchViews();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Save view as…"
          className="min-w-0 flex-1 sm:w-48 px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 text-sm ring-1 ring-black/5 dark:ring-white/10"
        />
        <button
          onClick={saveView}
          disabled={loading}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary-600 text-white hover:bg-secondary-700 disabled:opacity-60 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <div key={v._id} className="flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-xs">
            <span className="truncate max-w-[8rem]" title={`${v.name} · ${v.timeframe}`}>{v.name}</span>
            <button
              className="p-1 hover:text-primary-600"
              title="Apply"
              onClick={() => onApply?.({ timeframe: v.timeframe, types: v.types || [] })}
            >
              <Play className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1 hover:text-red-600"
              title="Delete"
              onClick={() => removeView(v._id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
