import useAlertsSocket from '../hooks/useAlertsSocket';
import { useSocket } from '../context/SocketContext';
import SensorCard from '../components/SensorCard';
import FarmOverview from '../components/dashboard/FarmOverview';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardChartCard from './dashboard/DashboardChartCard';
import DashboardRightPanel from './dashboard/DashboardRightPanel';
import { useDashboardData } from './dashboard/useDashboardData';
import { getStatus, getThreshold } from './dashboard/dashboardUtils';

const Dashboard = () => {
  const { sensorData, alerts, connected } = useSocket();
  useAlertsSocket();

  const {
    chartData,
    mounted,
    isIotActive,
    devices,
    devicesLoading,
    devicesError,
    hasSensorData,
    recentAlerts,
    sensorConfigs,
    lastSeenWindowMs
  } = useDashboardData({ sensorData, connected, alerts });

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100 selection:bg-indigo-500/30 transition-colors duration-300">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute top-[20%] -right-[5%] w-[40%] h-[40%] bg-purple-500/20 blur-[100px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-500/20 blur-[80px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[10%] w-[20%] h-[20%] bg-cyan-500/10 blur-[60px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
        <DashboardHeader
          mounted={mounted}
          isIotActive={isIotActive}
          hasSensorData={hasSensorData}
          sensorData={sensorData}
        />

        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {sensorConfigs.map((config, i) => (
              <div
                key={config.type}
                style={{ transitionDelay: `${i * 80 + 100}ms` }}
                className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              >
                <SensorCard
                  type={config.type}
                  value={config.value}
                  unit={config.unit}
                  status={getStatus(config.type, config.value)}
                  threshold={getThreshold(config.type)}
                  lastReading={sensorData.lastUpdated}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <FarmOverview />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DashboardChartCard chartData={chartData} mounted={mounted} />
          <DashboardRightPanel
            mounted={mounted}
            recentAlerts={recentAlerts}
            devicesLoading={devicesLoading}
            devicesError={devicesError}
            devices={devices}
            lastSeenWindowMs={lastSeenWindowMs}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
