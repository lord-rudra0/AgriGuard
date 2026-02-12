import { ShieldAlert } from 'lucide-react';

export const AlertsHeader = ({ total, markAllRead, clearResolved }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        System Alerts
        {total > 0 && (
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {total}
          </span>
        )}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
        Real-time system monitoring and critical notifications
      </p>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={markAllRead}
        className="group px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all shadow-sm"
      >
        Mark all read
      </button>
      <button
        onClick={clearResolved}
        className="group px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all shadow-sm"
      >
        Clear resolved
      </button>
    </div>
  </div>
);

export const AlertsPagination = ({ total, page, setPage, limit }) => {
  if (total <= limit) return null;
  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        disabled={page === 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Previous
      </button>
      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
        Page {page} of {Math.ceil(total / limit)}
      </span>
      <button
        disabled={page * limit >= total}
        onClick={() => setPage((p) => p + 1)}
        className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next
      </button>
    </div>
  );
};
