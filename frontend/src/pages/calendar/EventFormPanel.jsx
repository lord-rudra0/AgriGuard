import { Calendar as CalendarIcon, Save } from 'lucide-react';
import ReminderInput from './ReminderInput';

const EventFormPanel = ({
  editingId,
  form,
  setForm,
  saving,
  upsertEvent,
  resetForm
}) => (
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
              {saving ? <span className="animate-pulse">Saving...</span> : (<><Save className="w-3.5 h-3.5 mr-2" />{editingId ? 'Update' : 'Add Event'}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);

export const CalendarHeader = () => (
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
);

export default EventFormPanel;
