import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import useAlertsSocket from '../hooks/useAlertsSocket';
import SensorCard from '../components/SensorCard';
import FarmOverview from '../components/dashboard/FarmOverview';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { sensorData, alerts, connected } = useSocket();
  // Initialize toast notifications for incoming alerts (threshold + weather)
  useAlertsSocket();
  const [chartData, setChartData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isIotActive, setIsIotActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState(null);

  // Historical data management
  useEffect(() => {
    if (sensorData && sensorData.timestamp) {
      setChartData(prev => {
        const newData = [...prev, {
          time: new Date(sensorData.timestamp).getHours() + ':' + new Date(sensorData.timestamp).getMinutes().toString().padStart(2, '0'),
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          co2: sensorData.co2,
        }].slice(-24); // Keep last 24 readings
        return newData;
      });
    }
  }, [sensorData]);

  // Fetch devices and update last seen
  useEffect(() => {
    let active = true;

    const fetchDevices = async () => {
      try {
        setDevicesLoading(true);
        setDevicesError(null);
        const res = await axios.get('/api/devices');
        if (!active) return;
        setDevices(res.data?.devices || []);
      } catch (e) {
        if (!active) return;
        setDevicesError('Failed to load devices');
      } finally {
        if (active) setDevicesLoading(false);
      }
    };

    fetchDevices();
    const timer = setInterval(fetchDevices, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!sensorData?.deviceId) return;
    setDevices(prev => prev.map(d => (
      d.deviceId === sensorData.deviceId
        ? { ...d, lastSeenAt: new Date().toISOString() }
        : d
    )));
  }, [sensorData]);

  // Mount animations trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Heartbeat check for IoT connectivity
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Check every 10 seconds

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!connected) {
      setIsIotActive(false);
      return;
    }

    if (sensorData && sensorData.lastUpdated) {
      const lastUpdate = new Date(sensorData.lastUpdated).getTime();
      const now = currentTime.getTime();
      const twoMinutes = 2 * 60 * 1000;

      setIsIotActive(now - lastUpdate < twoMinutes);
    } else {
      setIsIotActive(false);
    }
  }, [sensorData, connected, currentTime]);

  const getThreshold = (type) => {
    const thresholds = {
      temperature: { min: 18, max: 28 },
      humidity: { min: 40, max: 80 },
      co2: { min: 300, max: 600 },
      light: { min: 200, max: 800 },
      soilMoisture: { min: 30, max: 70 }
    };
    return thresholds[type];
  };

  const getStatus = (type, value) => {
    if (value === undefined || value === null) return 'inactive';

    const threshold = getThreshold(type);
    if (!threshold) return 'unknown';

    if (value >= threshold.min && value <= threshold.max) {
      return 'safe';
    } else if (
      (value >= threshold.min * 0.8 && value < threshold.min) ||
      (value > threshold.max && value <= threshold.max * 1.2)
    ) {
      return 'warning';
    } else {
      return 'danger';
    }
  };

  const sensorConfigs = [
    {
      type: 'temperature',
      value: sensorData.temperature,
      unit: '°C'
    },
    {
      type: 'humidity',
      value: sensorData.humidity,
      unit: '%'
    },
    {
      type: 'co2',
      value: sensorData.co2,
      unit: 'ppm'
    },
    {
      type: 'light',
      value: sensorData.light,
      unit: 'lux'
    },
    {
      type: 'soilMoisture',
      value: sensorData.soilMoisture,
      unit: '%'
    }
  ];

  const hasSensorData = sensorData && sensorData.temperature !== undefined;
  const recentAlerts = alerts.slice(0, 3);
  const lastSeenWindowMs = 2 * 60 * 1000;

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
        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="flex items-center justify-between gap-8 md:gap-14">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent filter drop-shadow-lg">
                Farm Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-light">
                Real-time monitoring of your <span className="text-indigo-600 dark:text-indigo-400 font-medium">mycelium</span> environment
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <Link
                to="/analytics"
                className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-300 dark:border-white/10 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start pr-1">
                  <span className="text-[11px] font-bold text-gray-900 dark:text-white">Insights</span>
                </div>
              </Link>

              <div className="flex items-center space-x-4">
                <span className="relative inline-flex items-center">
                  <span className={`h-2.5 w-2.5 rounded-full ${isIotActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  {isIotActive && (
                    <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  )}
                </span>
                {isIotActive ? (
                  <Wifi className="w-5 h-5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm ${isIotActive ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isIotActive ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Last update */}
              {hasSensorData && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDistanceToNow(sensorData.lastUpdated)} ago
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sensor Cards */}
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

        {/* Farm Overview Section */}
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <FarmOverview />
        </div>

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Historical Chart */}
          <div className={`lg:col-span-2 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">
                  Environmental Trends
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-300 border border-gray-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
              </div>

              <div className="h-80 flex items-center justify-center">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="time"
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#6b7280"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dx={10}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.8)', // Keep dark for charts usually looks better
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          color: '#f3f4f6',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        dot={{ fill: '#fbbf24', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#fbbf24', strokeWidth: 2 }}
                        name="Temperature (°C)"
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="humidity"
                        stroke="#60a5fa"
                        strokeWidth={3}
                        dot={{ fill: '#60a5fa', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }}
                        name="Humidity (%)"
                        animationDuration={1700}
                      />
                      <Line
                        type="monotone"
                        dataKey="co2"
                        stroke="#34d399"
                        strokeWidth={3}
                        dot={{ fill: '#34d399', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: '#34d399', strokeWidth: 2 }}
                        name="CO₂ (ppm)"
                        yAxisId="right"
                        animationDuration={1900}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No historical data collected yet.</p>
                    <p className="text-sm">Connect a sensor to start monitoring.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="space-y-6">
            <div className={`relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">
                Recent Alerts
              </h2>

              {recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {recentAlerts.map((alert, index) => (
                    <div
                      key={index}
                      style={{ transitionDelay: `${index * 100}ms` }}
                      className={`p-4 rounded-2xl border border-gray-100 dark:border-white/5 transition-all duration-500 hover:bg-gray-50 dark:hover:bg-white/5 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} ${alert.severity === 'high'
                        ? 'bg-rose-500/10 text-rose-300'
                        : alert.severity === 'medium'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-emerald-500/10 text-emerald-300'
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        {alert.severity === 'high' ? (
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 animate-pulse" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {alert.message || `${alert.type} Alert`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(alert.timestamp || Date.now()))} ago
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    All systems operating normally
                  </p>
                </div>
              )}
            </div>

            {/* Devices */}
            <div className={`relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">
                Connected Hardware
              </h2>

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
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {d.name || d.deviceId}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {d.deviceId}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-gray-500'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {lastSeen ? `${formatDistanceToNow(lastSeen)} ago` : 'Never'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No devices yet.
                </div>
              )}
            </div>

            {/* System Status */}
            <div className={`relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide mb-6">
                System Status
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Sensors</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">AI Assistant</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
