import { useState } from 'react';
import { Plus, Clock, X } from 'lucide-react';

const ReminderInput = ({ reminders, setReminders }) => {
  const [value, setValue] = useState('');
  const presets = [5, 10, 15, 30, 60, 120, 24 * 60];

  const addReminder = () => {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 0 && !reminders.includes(n)) {
      setReminders([...reminders, n].sort((a, b) => a - b));
      setValue('');
    }
  };

  const removeReminder = (n) => setReminders(reminders.filter((r) => r !== n));

  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Reminders</label>
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          min="0"
          className="w-full px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
          placeholder="Min before..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addReminder()}
        />
        <button
          type="button"
          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          onClick={addReminder}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => !reminders.includes(p) && setReminders([...reminders, p].sort((a, b) => a - b))}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
              reminders.includes(p)
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-white/50 text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
            }`}
          >
            {p >= 1440 ? `${p / 1440}d` : `${p}m`}
          </button>
        ))}
      </div>

      {reminders.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {reminders.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30">
              <Clock className="w-2.5 h-2.5" /> {r}m
              <button type="button" onClick={() => removeReminder(r)} className="ml-1 hover:text-red-500 transition-colors">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderInput;
