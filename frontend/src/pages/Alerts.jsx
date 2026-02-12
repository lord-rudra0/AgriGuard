import { useSocket } from '../context/SocketContext';
import AlertsFilterBar from './alerts/AlertsFilterBar';
import AlertsList from './alerts/AlertsList';
import { AlertsHeader, AlertsPagination } from './alerts/AlertsHeaderAndPagination';
import { ALERTS_PAGE_LIMIT } from './alerts/constants';
import { useAlertsPage } from './alerts/useAlertsPage';

const Alerts = () => {
  const { alerts: liveAlerts, socket } = useSocket();
  const {
    loading,
    total,
    filters,
    setFilters,
    page,
    setPage,
    fetchAlerts,
    grouped,
    markRead,
    resolveAlert,
    deleteAlert,
    markAllRead,
    clearResolved
  } = useAlertsPage({ liveAlerts, socket });

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-500/5 dark:bg-red-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-orange-500/5 dark:bg-orange-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-emerald-500/5 dark:bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        <AlertsHeader total={total} markAllRead={markAllRead} clearResolved={clearResolved} />
        <AlertsFilterBar
          filters={filters}
          setFilters={setFilters}
          fetchAlerts={fetchAlerts}
          loading={loading}
        />
        <AlertsList
          loading={loading}
          items={grouped}
          markRead={markRead}
          resolveAlert={resolveAlert}
          deleteAlert={deleteAlert}
        />
        <AlertsPagination total={total} page={page} setPage={setPage} limit={ALERTS_PAGE_LIMIT} />
      </div>
    </div>
  );
};

export default Alerts;
