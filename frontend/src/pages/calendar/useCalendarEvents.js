import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const initialForm = {
  title: '',
  description: '',
  roomId: '',
  startAt: '',
  endAt: '',
  reminders: []
};

export const useCalendarEvents = ({ user, socket }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadEvents = async () => {
    try {
      setLoading(true);
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
    return () => socket.off('talk:action', onTalkAction);
  }, [socket, user]);

  useEffect(() => {
    const onFocus = () => { if (user) loadEvents(); };
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
        reminders: (form.reminders || []).map((m) => ({ minutesBefore: m }))
      };
      if (editingId) await axios.put(`/api/calendar/events/${editingId}`, payload);
      else await axios.post('/api/calendar/events', payload);
      await loadEvents();
      resetForm();
    } catch (err) {
      console.error('Save failed', err);
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
      reminders: (ev.reminders || []).map((r) => Number(r.minutesBefore)).filter((n) => Number.isFinite(n))
    });
  };

  const deleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await axios.delete(`/api/calendar/events/${id}`);
      await loadEvents();
      if (editingId === id) resetForm();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((ev) => new Date(ev.startAt).getTime() >= now - 24 * 3600 * 1000)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
  }, [events]);

  return {
    loading,
    saving,
    editingId,
    form,
    setForm,
    upcoming,
    resetForm,
    upsertEvent,
    editEvent,
    deleteEvent
  };
};
