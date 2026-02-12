import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';

const UpcomingEventsPanel = ({
  loading,
  upcoming,
  editEvent,
  deleteEvent
}) => (
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
                    <span className="font-bold">{format(parseISO(ev.startAt), 'MMM d, h:mm a')}</span>
                  </div>

                  {ev.endAt && (
                    <div className="text-[10px] text-gray-400 pl-1">to {format(parseISO(ev.endAt), 'h:mm a')}</div>
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
);

export default UpcomingEventsPanel;
