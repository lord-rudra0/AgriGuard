import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import useAlertsSocket from '../hooks/useAlertsSocket';
import SensorCard from '../components/SensorCard';
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

  // Simulate chart data generation
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      const now = new Date();
      
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        data.push({
          time: time.getHours() + ':00',
          temperature: Math.floor(Math.random() * 10) + 20 + (sensorData.temperature || 25),
          humidity: Math.floor(Math.random() * 20) + 40 + (sensorData.humidity || 60),
          co2: Math.floor(Math.random() * 100) + 300 + (sensorData.co2 || 400),
        });
      }
      
      setChartData(data);
    };

    generateChartData();
    const interval = setInterval(generateChartData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sensorData]);

  // Mount animations trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
      value: sensorData.temperature || 25, 
      unit: '°C' 
    },
    { 
      type: 'humidity', 
      value: sensorData.humidity || 65, 
      unit: '%' 
    },
    { 
      type: 'co2', 
      value: sensorData.co2 || 420, 
      unit: 'ppm' 
    },
    { 
      type: 'light', 
      value: sensorData.light || 450, 
      unit: 'lux' 
    },
    { 
      type: 'soilMoisture', 
      value: sensorData.soilMoisture || 55, 
      unit: '%' 
    }
  ];

  const recentAlerts = alerts.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
        {/* Header */}
        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
                Farm Dashboard
              </h1>
              <p className="mt-2 text-indigo-700/90 dark:text-indigo-300">
                Real-time monitoring of your agricultural environment
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection status */}
              <div className="flex items-center space-x-2">
                <span className="relative inline-flex items-center">
                  <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  {connected && (
                    <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  )}
                </span>
                {connected ? (
                  <Wifi className="w-5 h-5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm ${connected ? 'text-emerald-700' : 'text-red-600'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {/* Last update */}
              <div className="flex items-center space-x-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {formatDistanceToNow(sensorData.lastUpdated)} ago
                </span>
              </div>
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
                className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} hover:-translate-y-0.5`}
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

        {/* Charts and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Historical Chart */}
          <div className={`lg:col-span-2 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  24-Hour Trends
                </h2>
                <button className="flex items-center space-x-2 px-3 py-2 text-sm rounded-md bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.02] active:scale-[0.99] transition-all duration-200">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="time" 
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <YAxis className="text-gray-600 dark:text-gray-400" />
                    {/* Add a right-side Y axis to match the Line with yAxisId="right" */}
                    <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--tw-color-white)',
                        border: '1px solid var(--tw-color-gray-200)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ fill: '#f59e0b', r: 3 }}
                      name="Temperature (°C)"
                    />
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 3 }}
                      name="Humidity (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="co2"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: '#10b981', r: 3 }}
                      name="CO₂ (ppm)"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="space-y-6">
            <div className={`card p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-black/5 dark:ring-white/10`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Recent Alerts
              </h2>
              
              {recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {recentAlerts.map((alert, index) => (
                    <div
                      key={index}
                      style={{ transitionDelay: `${index * 100}ms` }}
                      className={`p-4 rounded-lg border-l-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'} ${
                        alert.severity === 'high'
                          ? 'alert-danger border-red-500/80'
                          : alert.severity === 'medium'
                          ? 'alert-warning border-yellow-500/80'
                          : 'alert-safe border-green-500/80'
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

            {/* System Status */}
            <div className={`card p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-black/5 dark:ring-white/10`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
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