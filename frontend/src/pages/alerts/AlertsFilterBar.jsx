import { Filter, RefreshCw, Activity } from 'lucide-react';

const AlertsFilterBar = ({ filters, setFilters, fetchAlerts, loading }) => (
  <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-3 shadow-lg border border-white/20 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-20">
    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-gray-700/50">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <select
          value={filters.severity}
          onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
          className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none border-none cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <option value="">All Severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1.5 border border-gray-100 dark:border-gray-700/50">
        <Activity className="w-3.5 h-3.5 text-gray-400" />
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none border-none cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <option value="">All Types</option>
          <option value="temperature">Temperature</option>
          <option value="humidity">Humidity</option>
          <option value="co2">CO₂</option>
          <option value="light">Light</option>
          <option value="soilMoisture">Soil Moisture</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

      <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {['open', 'resolved', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilters((f) => ({ ...f, status }))}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
              filters.status === status
                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>

    <button
      onClick={fetchAlerts}
      className="flex-shrink-0 p-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
      title="Refresh"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </button>
  </div>
);

export default AlertsFilterBar;
