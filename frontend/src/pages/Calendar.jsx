import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Clock, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  title: '',
  description: '',
  roomId: '',
  startAt: '',
  endAt: '',
  reminders: [], // numbers in minutes
};

const ReminderInput = ({ reminders, setReminders }) => {
  const [value, setValue] = useState('');
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reminders (minutes before)</label>
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          className="input flex-1"
          placeholder="e.g., 60 for 1 hour before"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addReminder()}
        />
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={addReminder}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {reminders.map((r) => (
          <span key={r} className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800">
            <Clock className="w-3 h-3" /> {r} min
            <button type="button" onClick={() => removeReminder(r)} className="ml-1 text-indigo-700 dark:text-indigo-300 hover:opacity-80">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default function Calendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/calendar/events');
      setEvents(res.data.events || []);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadEvents();
  }, [user]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const upsertEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startAt) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        roomId: form.roomId || undefined,
        startAt: form.startAt,
        endAt: form.endAt || undefined,
        reminders: (form.reminders || []).map((m) => ({ minutesBefore: m })),
      };
      if (editingId) {
        await axios.put(`/api/calendar/events/${editingId}`, payload);
      } else {
        await axios.post('/api/calendar/events', payload);
      }
      await loadEvents();
      resetForm();
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  const editEvent = (ev) => {
    setEditingId(ev._id);
    setForm({
      title: ev.title,
      description: ev.description || '',
      roomId: ev.roomId || '',
      startAt: new Date(ev.startAt).toISOString().slice(0, 16),
      endAt: ev.endAt ? new Date(ev.endAt).toISOString().slice(0, 16) : '',
      reminders: (ev.reminders || []).map((r) => Number(r.minutesBefore)).filter((n) => Number.isFinite(n)),
    });
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await axios.delete(`/api/calendar/events/${id}`);
      await loadEvents();
      if (editingId === id) resetForm();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((ev) => new Date(ev.startAt).getTime() >= now - 24 * 3600 * 1000)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }, [events]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" /> Calendar
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8">
        <form onSubmit={upsertEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., Irrigation cycle check"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              className="input w-full min-h-[80px]"
              placeholder="Optional details"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., Room-2"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <ReminderInput
              reminders={form.reminders}
              setReminders={(reminders) => setForm({ ...form, reminders })}
            />
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            )}
            <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={saving}>
              <Save className="w-4 h-4" /> {editingId ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>

      {/* Upcoming list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{upcoming.length} events</span>
        </div>
        {loading ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : upcoming.length === 0 ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">No events scheduled.</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcoming.map((ev) => (
              <li key={ev._id} className="px-4 py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{ev.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {format(parseISO(ev.startAt), 'PPpp')}
                    {ev.endAt ? ` - ${format(parseISO(ev.endAt), 'PPpp')}` : ''}
                    {ev.roomId ? ` · ${ev.roomId}` : ''}
                  </div>
                  {ev.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ev.description}</div>
                  )}
                  {(ev.reminders?.length || 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ev.reminders.map((r) => (
                        <span key={r.minutesBefore} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-600">
                          <Clock className="w-3 h-3" /> {r.minutesBefore} min before
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={() => editEvent(ev)}>Edit</button>
                  <button className="btn-danger inline-flex items-center gap-2" onClick={() => deleteEvent(ev._id)}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
