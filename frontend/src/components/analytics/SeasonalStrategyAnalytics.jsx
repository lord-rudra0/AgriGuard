import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CalendarClock, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

const SeasonalStrategyAnalytics = () => {
  const [weeksAhead, setWeeksAhead] = useState(4);
  const [cropType, setCropType] = useState('');
  const [phaseName, setPhaseName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [strategy, setStrategy] = useState(null);
  const [creatingTasks, setCreatingTasks] = useState(false);

  const createWeeklyDate = (weekNumber) => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    d.setDate(d.getDate() + (Math.max(1, Number(weekNumber) || 1) - 1) * 7);
    return d;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/chat/seasonal-strategy',
        {
          weeksAhead,
          cropType: cropType || undefined,
          phaseName: phaseName || undefined,
          roomId: roomId || undefined,
          includeAiSummary: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(res.data?.summary || '');
      setStrategy(res.data?.strategy || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to generate seasonal strategy');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendarTasks = async () => {
    if (!strategy?.weeklyPlan?.length) return;
    setCreatingTasks(true);
    try {
      const token = localStorage.getItem('token');
      const planned = strategy.weeklyPlan.map((weekItem) => {
        const startAt = createWeeklyDate(weekItem.week);
        const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
        const title = `Week ${weekItem.week}: ${weekItem.theme} Strategy Check`;
        const description = [
          `Auto-generated from Seasonal Strategy Assistant.`,
          ``,
          `Planned actions:`,
          ...weekItem.actions.map((a) => `- ${a}`)
        ].join('\n');

        return {
          week: weekItem.week,
          title,
          startAt,
          endAt,
          description
        };
      });

      const earliest = new Date(Math.min(...planned.map((p) => p.startAt.getTime())));
      const latest = new Date(Math.max(...planned.map((p) => p.endAt.getTime())) + 24 * 60 * 60 * 1000);

      const existingRes = await axios.get('/api/calendar/events', {
        params: { start: earliest.toISOString(), end: latest.toISOString(), limit: 1000 },
        headers: { Authorization: `Bearer ${token}` }
      });
      const existing = existingRes.data?.events || [];
      const existingKeySet = new Set(
        existing.map((ev) => {
          const day = new Date(ev.startAt).toISOString().slice(0, 10);
          return `${String(ev.title || '').trim().toLowerCase()}|${day}`;
        })
      );

      const toCreate = planned.filter((p) => {
        const day = p.startAt.toISOString().slice(0, 10);
        const key = `${p.title.trim().toLowerCase()}|${day}`;
        return !existingKeySet.has(key);
      });

      const requests = toCreate.map((p) =>
        axios.post(
          '/api/calendar/events',
          {
            title: p.title,
            description: p.description,
            roomId: strategy?.context?.roomId || undefined,
            startAt: p.startAt.toISOString(),
            endAt: p.endAt.toISOString(),
            reminders: [{ minutesBefore: 60 }]
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(requests);
      const skipped = planned.length - toCreate.length;
      if (toCreate.length > 0 && skipped > 0) {
        toast.success(`Created ${toCreate.length} tasks, skipped ${skipped} duplicates`);
      } else if (toCreate.length > 0) {
        toast.success(`Created ${toCreate.length} calendar tasks`);
      } else {
        toast('No new tasks created (all duplicates already exist)');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create calendar tasks');
    } finally {
      setCreatingTasks(false);
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-teal-500" />
          </div>
          Seasonal Strategy Assistant
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-500/20 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Weeks (1-12)
          <input
            type="number"
            min={1}
            max={12}
            value={weeksAhead}
            onChange={(e) => setWeeksAhead(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Crop Type (optional)
          <input
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            placeholder="e.g. Oyster Mushroom"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Phase Focus (optional)
          <input
            type="text"
            value={phaseName}
            onChange={(e) => setPhaseName(e.target.value)}
            placeholder="e.g. Fruiting"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          Room ID (optional)
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="e.g. room-1"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-300/40 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-xl border border-teal-200/50 dark:border-teal-900/40 bg-teal-500/5 p-4 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{summary}</p>
        </div>
      ) : null}

      {strategy?.risks?.length ? (
        <div className="mb-4">
          <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 mb-2">Top Risks</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {strategy.risks.slice(0, 3).map((risk) => (
              <div key={risk.metric} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/50">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">{risk.metric}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                  {risk.deltaPct > 0 ? '+' : ''}{risk.deltaPct?.toFixed?.(1)}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{risk.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {strategy?.weeklyPlan?.length ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">Weekly Plan</h4>
            <button
              onClick={handleCreateCalendarTasks}
              disabled={creatingTasks}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 disabled:opacity-60"
            >
              {creatingTasks ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarClock className="w-3 h-3" />}
              Create Calendar Tasks
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {strategy.weeklyPlan.map((w) => (
              <div key={w.week} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/50">
                <p className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Week {w.week}: {w.theme}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  {w.actions.map((a, idx) => (
                    <li key={`${w.week}-${idx}`}>- {a}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SeasonalStrategyAnalytics;
