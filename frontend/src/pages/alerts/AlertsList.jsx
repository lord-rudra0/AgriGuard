import { Activity, AlertTriangle, Check, CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react';
import { severityColors, severityGlows } from './constants';

const AlertsList = ({
  loading,
  items,
  markRead,
  resolveAlert,
  deleteAlert
}) => (
  <div className="space-y-3 min-h-[300px]">
    {loading && items.length === 0 ? (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 animate-pulse">
        <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-50" />
        <p className="text-sm font-medium">Scanning system...</p>
      </div>
    ) : items.length === 0 ? (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">All Systems Normal</p>
        <p className="text-sm mt-1 opacity-70">No active alerts matching your filters.</p>
      </div>
    ) : (
      items.map((alert) => (
        (() => {
          const badgeSeverity = String(alert.severityLevel || alert.severity || 'warning').toLowerCase();
          const iconColor = badgeSeverity === 'critical'
            ? 'text-red-500'
            : badgeSeverity === 'high'
              ? 'text-orange-500'
              : badgeSeverity === 'warning' || badgeSeverity === 'medium'
                ? 'text-yellow-500'
                : 'text-blue-500';
          const confidence = Number(alert.confidence);
          const hasConfidence = Number.isFinite(confidence);
          return (
        <div
          key={alert._id}
          className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border rounded-2xl p-4 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${severityColors[badgeSeverity] || severityColors.warning} ${severityGlows[badgeSeverity] || severityGlows.warning} ${alert.isResolved ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${alert.isResolved ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                {alert.isResolved ? <Check className="w-5 h-5" /> : <AlertTriangle className={`w-5 h-5 ${iconColor}`} />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/50 dark:bg-gray-900/50">
                  {badgeSeverity}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  {alert.riskCategory || alert.type}
                </span>
                {hasConfidence && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    confidence {Math.round(confidence)}%
                  </span>
                )}
                <span className="text-[10px] text-gray-400 ml-auto">{new Date(alert.createdAt).toLocaleString()}</span>
              </div>

              <h3 className={`font-bold text-base mb-1 ${alert.isResolved ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                {alert.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{alert.message}</p>

              {alert.value != null && alert.threshold && (
                <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/50 dark:bg-gray-900/50 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-400 border border-black/5 dark:border-white/5">
                  <span>Val: <strong>{alert.value}</strong></span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>Range: <strong>{alert.threshold.min ?? '-'}</strong> - <strong>{alert.threshold.max ?? '-'}</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => markRead(alert._id, !alert.isRead)}
                className={`p-2 rounded-lg transition-colors ${alert.isRead ? 'bg-gray-100 text-gray-400 hover:text-gray-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                title={alert.isRead ? "Mark unread" : "Mark read"}
              >
                {alert.isRead ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => resolveAlert(alert._id, !alert.isResolved)}
                className={`p-2 rounded-lg transition-colors ${alert.isResolved ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                title={alert.isResolved ? "Reopen issue" : "Resolve issue"}
              >
                {alert.isResolved ? <Activity className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteAlert(alert._id)}
                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Delete alert"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!alert.isRead && (
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse md:hidden" />
          )}
        </div>
          );
        })()
      ))
    )}
  </div>
);

export default AlertsList;
