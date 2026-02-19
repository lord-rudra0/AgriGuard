import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DashboardRightPanel = ({
  mounted,
  recentAlerts,
  devicesLoading,
  devicesError,
  devices,
  lastSeenWindowMs
}) => (
  <div className="space-y-6">
    <div className={`relative p-6 rounded-[32px] bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-stone-200 dark:border-slate-700/60 shadow-2xl shadow-stone-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">Recent Alerts</h2>
      {recentAlerts.length > 0 ? (
        <div className="space-y-4">
          {recentAlerts.map((alert, index) => (
            (() => {
              const severity = String(alert.severityLevel || alert.severity || '').toLowerCase();
              const isCritical = severity === 'critical' || severity === 'high';
              const isWarning = severity === 'warning' || severity === 'medium';
              return (
            <div
              key={index}
              style={{ transitionDelay: `${index * 100}ms` }}
              className={`p-4 rounded-2xl border border-stone-100 dark:border-white/5 transition-all duration-500 hover:bg-stone-50 dark:hover:bg-white/5 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} ${isCritical ? 'bg-rose-500/10 text-rose-300' : isWarning ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}
            >
              <div className="flex items-start space-x-3">
                {isCritical || isWarning ? <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 animate-pulse" /> : <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message || `${alert.type} Alert`}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                    {formatDistanceToNow(new Date(alert.timestamp || Date.now()))} ago
                  </p>
                </div>
              </div>
            </div>
              );
            })()
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-800 dark:text-gray-100 font-semibold">All systems operating normally</p>
        </div>
      )}
    </div>

    <div className={`relative p-6 rounded-[32px] bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-stone-200 dark:border-slate-700/60 shadow-2xl shadow-stone-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">Connected Hardware</h2>
      {devicesLoading ? (
        <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">Loading devices...</div>
      ) : devicesError ? (
        <div className="text-sm text-rose-600 font-medium">{devicesError}</div>
      ) : devices.length > 0 ? (
        <div className="space-y-3">
          {devices.map((d) => {
            const lastSeen = d.lastSeenAt ? new Date(d.lastSeenAt) : null;
            const isOnline = lastSeen && (Date.now() - lastSeen.getTime() < lastSeenWindowMs);
            return (
              <div key={d.deviceId} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/70 dark:bg-slate-800/60 ring-1 ring-black/5 dark:ring-white/10">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.name || d.deviceId}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium">{d.deviceId}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${isOnline ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-300'}`}>{isOnline ? 'Online' : 'Offline'}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">{lastSeen ? `${formatDistanceToNow(lastSeen)} ago` : 'Never'}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-700 dark:text-gray-200 font-medium">No devices yet.</div>
      )}
    </div>

    <div className={`relative p-6 rounded-[32px] bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-stone-200 dark:border-slate-700/60 shadow-2xl shadow-stone-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">System Status</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-200 font-medium">Sensors</span>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-sm text-emerald-600 dark:text-emerald-300 font-semibold">Online</span></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-200 font-medium">Database</span>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-sm text-emerald-600 dark:text-emerald-300 font-semibold">Connected</span></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-200 font-medium">AI Assistant</span>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-sm text-emerald-600 dark:text-emerald-300 font-semibold">Active</span></div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardRightPanel;
