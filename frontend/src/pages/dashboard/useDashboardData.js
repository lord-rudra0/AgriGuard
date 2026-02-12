import { useEffect, useState } from 'react';
import axios from 'axios';
import { buildSensorConfigs } from './dashboardUtils';

const LAST_SEEN_WINDOW_MS = 2 * 60 * 1000;

export const useDashboardData = ({ sensorData, connected, alerts }) => {
  const [chartData, setChartData] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [isIotActive, setIsIotActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState(null);

  useEffect(() => {
    if (!sensorData?.timestamp) return;
    setChartData((prev) => (
      [...prev, {
        time: `${new Date(sensorData.timestamp).getHours()}:${new Date(sensorData.timestamp).getMinutes().toString().padStart(2, '0')}`,
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        co2: sensorData.co2
      }].slice(-24)
    ));
  }, [sensorData]);

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
        if (active) setDevicesError('Failed to load devices');
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
    setDevices((prev) => prev.map((d) => (
      d.deviceId === sensorData.deviceId ? { ...d, lastSeenAt: new Date().toISOString() } : d
    )));
  }, [sensorData]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!connected) return setIsIotActive(false);
    if (sensorData?.lastUpdated) {
      const lastUpdate = new Date(sensorData.lastUpdated).getTime();
      setIsIotActive(currentTime.getTime() - lastUpdate < LAST_SEEN_WINDOW_MS);
      return;
    }
    setIsIotActive(false);
  }, [sensorData, connected, currentTime]);

  return {
    chartData,
    mounted,
    isIotActive,
    devices,
    devicesLoading,
    devicesError,
    hasSensorData: !!(sensorData && sensorData.temperature !== undefined),
    recentAlerts: alerts.slice(0, 3),
    sensorConfigs: buildSensorConfigs(sensorData),
    lastSeenWindowMs: LAST_SEEN_WINDOW_MS
  };
};
