import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import EventFormPanel, { CalendarHeader } from './calendar/EventFormPanel';
import UpcomingEventsPanel from './calendar/UpcomingEventsPanel';
import { useCalendarEvents } from './calendar/useCalendarEvents';

export default function Calendar() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
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
  } = useCalendarEvents({ user, socket });

  return (
    <div className="relative h-[calc(100vh-7rem)] overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/10 dark:bg-emerald-600/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col py-3">
        <CalendarHeader />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          <EventFormPanel
            editingId={editingId}
            form={form}
            setForm={setForm}
            saving={saving}
            upsertEvent={upsertEvent}
            resetForm={resetForm}
          />
          <UpcomingEventsPanel
            loading={loading}
            upcoming={upcoming}
            editEvent={editEvent}
            deleteEvent={deleteEvent}
          />
        </div>
      </div>
    </div>
  );
}
