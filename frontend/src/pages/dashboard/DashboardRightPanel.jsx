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
    <div className={`relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
              className={`p-4 rounded-2xl border border-gray-100 dark:border-white/5 transition-all duration-500 hover:bg-gray-50 dark:hover:bg-white/5 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} ${isCritical ? 'bg-rose-500/10 text-rose-300' : isWarning ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}
            >
              <div className="flex items-start space-x-3">
                {isCritical || isWarning ? <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 animate-pulse" /> : <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message || `${alert.type} Alert`}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">All systems operating normally</p>
        </div>
      )}
    </div>

    <div className={`relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">Connected Hardware</h2>
      {devicesLoading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading devices...</div>
      ) : devicesError ? (
        <div className="text-sm text-red-600">{devicesError}</div>
      ) : devices.length > 0 ? (
        <div className="space-y-3">
          {devices.map((d) => {
            const lastSeen = d.lastSeenAt ? new Date(d.lastSeenAt) : null;
            const isOnline = lastSeen && (Date.now() - lastSeen.getTime() < lastSeenWindowMs);
            return (
              <div key={d.deviceId} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/60 dark:bg-gray-800/60 ring-1 ring-black/5 dark:ring-white/10">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.name || d.deviceId}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{d.deviceId}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-gray-500'}`}>{isOnline ? 'Online' : 'Offline'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{lastSeen ? `${formatDistanceToNow(lastSeen)} ago` : 'Never'}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">No devices yet.</div>
      )}
    </div>

    <div className={`relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">System Status</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Sensors</span>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-sm text-green-600">Online</span></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">Database</span>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-sm text-green-600">Connected</span></div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300">AI Assistant</span>
          <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div><span className="text-sm text-green-600">Active</span></div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardRightPanel;
