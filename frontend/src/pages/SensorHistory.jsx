import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import {
    BarChart3,
    Calendar,
    RefreshCw,
    TrendingUp,
    Activity,
    ArrowLeft,
    Settings,
    Shield,
    Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getApiUrl } from '../config/api';

const SENSOR_TYPES = [
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'humidity', label: 'Humidity', unit: '%' },
    { key: 'co2', label: 'CO₂', unit: 'ppm' },
    { key: 'light', label: 'Light', unit: 'lux' },
    { key: 'soilMoisture', label: 'Soil Moisture', unit: '%' },
];

const INTERVAL_TYPES = [
    { key: 'hourly', label: 'Hourly' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 text-xs font-bold mb-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
                            <span className="text-gray-500 uppercase tracking-tighter">{p.name}:</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-black">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const SensorHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSensor, setSelectedSensor] = useState(SENSOR_TYPES[0]);
    const [interval, setInterval] = useState('hourly');
    const navigate = useNavigate();

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(getApiUrl('/api/sensors/history'), {
                params: {
                    sensorType: selectedSensor.key,
                    interval
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setHistory(response.data.history);
            }
        } catch (err) {
            console.error('Failed to fetch sensor history:', err);
            setError('System could not retrieve historical data streams.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedSensor, interval]);

    const chartData = useMemo(() => {
        return history.map(item => ({
            time: format(
                new Date(item.startTime),
                interval === 'hourly' ? 'MMM d, HH:mm' : interval === 'weekly' ? 'MMM d' : 'MMM d'
            ),
            avg: item.metrics.avg,
            min: item.metrics.min,
            max: item.metrics.max,
            range: [item.metrics.min, item.metrics.max]
        }));
    }, [history, interval]);

    const stats = useMemo(() => {
        if (!history.length) return null;
        const values = history.map(h => h.metrics.avg);
        const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
        const lastValue = values[values.length - 1];
        const prevValue = values[values.length - 2] || lastValue;
        const change = ((lastValue - prevValue) / prevValue) * 100;

        return {
            avg: avgValue.toFixed(1),
            last: lastValue.toFixed(1),
            change: change.toFixed(1)
        };
    }, [history]);

    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            {/* Background Mesh Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[10%] left-[-5%] w-[50%] h-[50%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-800 shadow-sm hover:scale-105 active:scale-95 transition-all text-gray-500 hover:text-emerald-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 uppercase tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                Environmental Archive
                            </h1>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-white/50 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 p-3 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Avg</span>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{stats.avg}{selectedSensor.unit}</span>
                            </div>
                            <div className="bg-white/50 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 p-3 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Latest Log</span>
                                <span className="text-lg font-black text-gray-900 dark:text-white">{stats.last}{selectedSensor.unit}</span>
                            </div>
                            <div className="hidden sm:block bg-white/50 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800 p-3 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Delta (24h)</span>
                                <span className={`text-lg font-black ${Number(stats.change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stats.change}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Center */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-3 space-y-3 lg:space-y-4">
                        
                        <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 items-stretch">
                            {/* Sensor Selection */}
                            <div className="flex-[3] bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-[1.5rem] p-2.5 lg:p-4 shadow-lg flex flex-col">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 lg:mb-4 lg:ml-2">Node Type</span>
                                <div className="flex flex-wrap lg:flex-col gap-1.5 flex-1 content-start">
                                    {SENSOR_TYPES.map(sensor => (
                                        <button
                                            key={sensor.key}
                                            onClick={() => setSelectedSensor(sensor)}
                                            className={`flex-1 min-w-[45%] lg:w-full flex items-center justify-center lg:justify-between px-1.5 py-2 lg:py-3 lg:px-4 rounded-xl lg:rounded-2xl text-[9px] lg:text-xs font-black uppercase tracking-wider transition-all ${
                                                selectedSensor.key === sensor.key
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 scale-[1.02]'
                                                : 'text-gray-500 bg-white/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <span className="truncate">{sensor.label === 'Soil Moisture' ? 'Soil' : sensor.label}</span>
                                            <Activity className={`hidden lg:block w-4 h-4 ${selectedSensor.key === sensor.key ? 'opacity-100' : 'opacity-30'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interval Selection */}
                            <div className="flex-[2] bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-[1.5rem] p-2.5 lg:p-4 shadow-lg flex flex-col">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 lg:mb-4 lg:ml-2">Time</span>
                                <div className="flex flex-col lg:flex-row p-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-gray-700 flex-1 justify-center gap-1">
                                    {INTERVAL_TYPES.map(type => (
                                        <button
                                            key={type.key}
                                            onClick={() => setInterval(type.key)}
                                            className={`flex-1 flex items-center justify-center py-2 lg:py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all ${interval === type.key
                                                ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Chart Card */}
                    <div className="lg:col-span-9 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden h-[500px] md:h-[600px]">
                        {/* Visual Accents */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Zap className="w-48 h-48 text-emerald-500" />
                        </div>

                        <div className="relative flex flex-col h-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        {selectedSensor.label} Spectrum Analysis
                                    </h2>
                                </div>
                                <button
                                    onClick={fetchHistory}
                                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all border border-transparent hover:border-emerald-200/50"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Synchronizing Flux...</span>
                                </div>
                            ) : error ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                                        <Activity className="w-10 h-10 text-red-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Signal Interrupted</h3>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">{error}</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-300">
                                        <BarChart3 className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Vault Empty</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">No historical records synchronized for this timeframe.</p>
                                </div>
                            ) : (
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                            <defs>
                                                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-800" />
                                            <XAxis
                                                dataKey="time"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 800, textAnchor: 'middle' }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 800 }}
                                                tickFormatter={(val) => `${val}${selectedSensor.unit}`}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                iconType="circle"
                                                verticalAlign="top"
                                                align="right"
                                                wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            />

                                            {/* Range visualization (Min-Max) */}
                                            <Area
                                                name="Range (Min-Max)"
                                                type="monotone"
                                                dataKey="range"
                                                stroke="none"
                                                fill="url(#colorRange)"
                                                activeDot={false}
                                            />

                                            {/* Average Line */}
                                            <Area
                                                name="Hourly Average"
                                                type="monotone"
                                                dataKey="avg"
                                                stroke="#10b981"
                                                strokeWidth={4}
                                                fill="url(#colorAvg)"
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }}
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Legend Footer */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Average Value</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20" />
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Safe Envelope (Min-Max)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-900" />
                                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Data Points</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Footer */}
                <div className="mt-4 flex items-center justify-between text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span>Subsystems Synchronized</span>
                    </div>
                    <span>AgriGuard Mycology OS // Archives v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default SensorHistory;
