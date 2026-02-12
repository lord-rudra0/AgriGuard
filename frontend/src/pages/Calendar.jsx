import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash2, Clock, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

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
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${reminders.includes(p)
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-white/50 text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
              }`}
          >
            {p >= 1440 ? `${p / 1440}d` : `${p}m`}
          </button>
        ))}
      </div>
      {(reminders.length > 0) && (
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

export default function Calendar() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Fetch events starting from 7 days ago to include recent past events
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const res = await axios.get(`/api/calendar/events?start=${start.toISOString()}`);
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

  useEffect(() => {
    if (!socket) return;

    const onTalkAction = (data) => {
      const action = data?.action;
      if (action === 'calendar_event_created' || action === 'calendar_event_updated' || action === 'calendar_event_deleted') {
        loadEvents();
      }
    };

    socket.on('talk:action', onTalkAction);
    return () => {
      socket.off('talk:action', onTalkAction);
    };
  }, [socket, user]);

  useEffect(() => {
    const onFocus = () => {
      if (user) loadEvents();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
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
    <div className="relative h-[calc(100vh-7rem)] overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/10 dark:bg-emerald-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col py-3">
        {/* Compact Header */}
        <div className="flex-shrink-0 mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              Calendar
            </h1>
          </div>
        </div>

        {/* Main Content - Split Grid with separate scrolling */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          {/* Event Form Column - Scrollable */}
          <div className="lg:col-span-4 h-full overflow-hidden flex flex-col">
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.2rem] p-4 shadow-xl border border-white/20 dark:border-gray-800 h-full flex flex-col">
              <h2 className="text-base font-black text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
                {editingId ? 'Edit Event' : 'New Event'}
              </h2>

              <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 flex flex-col">
                <form onSubmit={upsertEvent} className="flex-1 flex flex-col gap-2.5 pb-2">
                  <div className="grid grid-cols-3 gap-2.5 flex-shrink-0">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-widest">Title</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        placeholder="Event Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-widest">Room</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        placeholder="Room"
                        value={form.roomId}
                        onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 flex-shrink-0">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-widest">Start</label>
                      <input
                        type="datetime-local"
                        className="w-full px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        value={form.startAt}
                        onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-widest">End</label>
                      <input
                        type="datetime-local"
                        className="w-full px-2.5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                        value={form.endAt}
                        onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-[100px]">
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-widest">Description</label>
                    <textarea
                      className="w-full h-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none"
                      placeholder="Details..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="pt-1 flex-shrink-0">
                    <ReminderInput
                      reminders={form.reminders}
                      setReminders={(reminders) => setForm({ ...form, reminders })}
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 flex-shrink-0">
                    {editingId && (
                      <button
                        type="button"
                        className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none disabled:opacity-50 uppercase tracking-widest"
                    >
                      {saving ? <span className="animate-pulse">Saving...</span> : (
                        <>
                          <Save className="w-3.5 h-3.5 mr-2" />
                          {editingId ? 'Update' : 'Add Event'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Upcoming list - Scrollable */}
          <div className="lg:col-span-8 h-full overflow-hidden flex flex-col">
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.2rem] p-5 md:p-6 shadow-xl border border-white/20 dark:border-gray-800 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Upcoming Schedule
                </h2>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {upcoming.length} Events
                </span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
                {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 animate-pulse">
                    <CalendarIcon className="w-10 h-10 mb-4 opacity-20" />
                    <p>Loading schedule...</p>
                  </div>
                ) : upcoming.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                      <CalendarIcon className="w-6 h-6 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">No upcoming events found</p>
                    <p className="text-xs mt-1 opacity-70">Add a new event to get started</p>
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                    {upcoming.map((ev) => (
                      <li key={ev._id} className="group relative bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 rounded-xl p-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col h-full min-h-[140px]">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate pr-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-1" title={ev.title}>
                            {ev.title}
                          </h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors"
                              onClick={() => editEvent(ev)}
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </button>
                            <button
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                              onClick={() => deleteEvent(ev._id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/30 px-2 py-1 rounded-lg w-fit">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            <span className="font-bold">
                              {format(parseISO(ev.startAt), 'MMM d, h:mm a')}
                            </span>
                          </div>

                          {ev.endAt && (
                            <div className="text-[10px] text-gray-400 pl-1">
                              to {format(parseISO(ev.endAt), 'h:mm a')}
                            </div>
                          )}

                          {ev.roomId && (
                            <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30">
                              {ev.roomId}
                            </span>
                          )}

                          {ev.description && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 mt-1 leading-relaxed opacity-80">
                              {ev.description}
                            </p>
                          )}
                        </div>

                        {(ev.reminders?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/30">
                            {ev.reminders.slice(0, 2).map((r, i) => (
                              <span key={i} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-900/20">
                                <Clock className="w-2 h-2" /> {r.minutesBefore}m
                              </span>
                            ))}
                            {ev.reminders.length > 2 && (
                              <span className="text-[9px] text-gray-400 font-medium px-1">+{ev.reminders.length - 2}</span>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
