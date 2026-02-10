import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ExportButtons from '../components/analytics/ExportButtons';
import SavedViews from '../components/analytics/SavedViews';
import ReportScheduler from '../components/analytics/ReportScheduler';
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	BarChart,
	Bar,
	AreaChart,
	Area,
} from 'recharts';
import { BarChart3, Calendar, RefreshCw, TrendingUp, Activity, Filter, Download } from 'lucide-react';

const TIMEFRAMES = [
	{ key: '1h', label: '1H' },
	{ key: '24h', label: '24H' },
	{ key: '7d', label: '7D' },
	{ key: '30d', label: '30D' },
];

const niceLabel = (t) => {
	if (!t) return '';
	return t.slice(5); // "MM-DD HH:00"
};

const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl">
				<p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
				{payload.map((p, i) => (
					<div key={i} className="flex items-center gap-2 text-xs font-medium mb-1">
						<span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
						<span className="text-gray-700 dark:text-gray-300 capitalize">{p.name}:</span>
						<span className="font-bold text-gray-900 dark:text-white">{p.value}</span>
					</div>
				))}
			</div>
		);
	}
	return null;
};

export default function Analytics() {
	const [timeframe, setTimeframe] = useState('24h');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]);
	const [inserting, setInserting] = useState(false);
	const [activeTypes, setActiveTypes] = useState(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError('');
		axios
			.get('/api/sensors/analytics', { params: { timeframe } })
			.then((res) => {
				if (!active) return;
				setRows(res.data?.analytics || []);
			})
			.catch((e) => {
				if (!active) return;
				setError(e.response?.data?.message || 'Failed to load analytics');
			})
			.finally(() => active && setLoading(false));
		return () => { active = false; };
	}, [timeframe]);

	const { chartData, types, summary, counts } = useMemo(() => {
		const timeMap = new Map();
		const typeSet = new Set();
		const typeStats = {};
		const typeCounts = {};

		for (const r of rows) {
			const { sensorType, hour, date } = r._id || {};
			if (!sensorType || hour == null || !date) continue;
			typeSet.add(sensorType);

			const key = `${date} ${String(hour).padStart(2, '0')}:00`;
			const entry = timeMap.get(key) || { time: key };
			entry[sensorType] = r.avgValue;
			timeMap.set(key, entry);

			const stat = typeStats[sensorType] || { min: Infinity, max: -Infinity, sum: 0, n: 0 };
			stat.min = Math.min(stat.min, r.minValue);
			stat.max = Math.max(stat.max, r.maxValue);
			stat.sum += r.avgValue;
			stat.n += 1;
			typeStats[sensorType] = stat;

			typeCounts[sensorType] = (typeCounts[sensorType] || 0) + (r.count || 0);
		}

		const sortedTimes = Array.from(timeMap.keys()).sort();
		const data = sortedTimes.map((k) => timeMap.get(k));

		const summary = {};
		for (const t of Object.keys(typeStats)) {
			const s = typeStats[t];
			summary[t] = {
				min: isFinite(s.min) ? Number(s.min.toFixed(2)) : null,
				max: isFinite(s.max) ? Number(s.max.toFixed(2)) : null,
				avg: s.n ? Number((s.sum / s.n).toFixed(2)) : null,
			};
		}

		return { chartData: data, types: Array.from(typeSet), summary, counts: typeCounts };
	}, [rows]);

	useEffect(() => {
		if (!types || types.length === 0) return;
		if (activeTypes === null) return;
		const filtered = activeTypes.filter((t) => types.includes(t));
		if (filtered.length !== activeTypes.length) setActiveTypes(filtered);
	}, [types]);

	return (
		<div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
			{/* Background Decorative Elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
				<div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
				<div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
				<div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-cyan-500/10 dark:bg-cyan-500/5 blur-[100px] rounded-full" />
			</div>

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
							<div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
								<BarChart3 className="w-6 h-6 text-white" />
							</div>
							Analytics
						</h1>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Deep insights into your environmental data</p>
					</div>

					<div className="flex items-center gap-3">
						{/* Timeframe Selector */}
						<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm flex items-center">
							{TIMEFRAMES.map((tf) => (
								<button
									key={tf.key}
									onClick={() => setTimeframe(tf.key)}
									className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${timeframe === tf.key
											? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
											: 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
										}`}
								>
									{tf.label}
								</button>
							))}
						</div>

						<ExportButtons timeframe={timeframe} printSelector="#analytics-print-area" />
					</div>
				</div>

				{/* Saved Views & Controls */}
				<div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
					<SavedViews
						currentTimeframe={timeframe}
						currentTypes={activeTypes ?? types}
						onApply={({ timeframe: tf, types: ty = [] }) => {
							if (tf) setTimeframe(tf);
							setActiveTypes(ty.length ? ty : null);
						}}
					/>
					<button
						onClick={async () => {
							setInserting(true);
							setError('');
							try {
								// Mock data insertion logic...
								const make = (type, unit, base, noise, n = 50) =>
									Array.from({ length: n }, (_, i) => ({
										type,
										value: Math.round((base + (Math.random() - 0.5) * noise) * 10) / 10,
										unit,
										location: 'Greenhouse 1',
										metadata: { batteryLevel: 0.8, signalStrength: 0.9 },
									}));
								const readings = [
									...make('temperature', '°C', 25, 4),
									...make('humidity', '%', 60, 20),
									...make('co2', 'ppm', 450, 200),
									...make('light', 'lux', 500, 300),
									...make('soilMoisture', '%', 55, 15),
								];
								await axios.post('/api/sensors/data', { deviceId: 'dev-sim-1', readings });
								await new Promise((r) => setTimeout(r, 300));
								const res = await axios.get('/api/sensors/analytics', { params: { timeframe } });
								setRows(res.data?.analytics || []);
							} catch (e) {
								setError('Failed to insert mock data');
							} finally {
								setInserting(false);
							}
						}}
						className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
					>
						<RefreshCw className={`w-3.5 h-3.5 ${inserting ? 'animate-spin' : ''}`} />
						{inserting ? 'Generating...' : 'Demo Data'}
					</button>
				</div>

				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 font-medium">
						{error}
					</div>
				)}

				<div id="analytics-print-area" className="flex flex-col gap-6">
					{/* Summary Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
						{(activeTypes ?? types).map((t) => (
							<div key={t} className="group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
								<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t}</span>
									<Activity className="w-4 h-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
								</div>
								<div className="flex items-baseline gap-2 mb-3">
									<span className="text-3xl font-black text-gray-900 dark:text-white">{summary[t]?.avg ?? '—'}</span>
									<span className="text-xs font-medium text-gray-400 uppercase">Avg</span>
								</div>
								<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
									<div className="flex flex-col">
										<span className="text-[10px] uppercase font-bold text-gray-400">Min</span>
										<span className="font-bold text-gray-700 dark:text-gray-300">{summary[t]?.min ?? '-'}</span>
									</div>
									<div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
									<div className="flex flex-col text-right">
										<span className="text-[10px] uppercase font-bold text-gray-400">Max</span>
										<span className="font-bold text-gray-700 dark:text-gray-300">{summary[t]?.max ?? '-'}</span>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Charts Row */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

						{/* Main Trend Chart */}
						<div className="lg:col-span-2 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-6 shadow-lg">
							<h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
								<TrendingUp className="w-5 h-5 text-emerald-500" />
								Trends Analysis
							</h2>
							<div className="h-[350px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<defs>
											<linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
												<stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
											</linearGradient>
											<linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
												<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
											</linearGradient>
											<linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
												<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-800" />
										<XAxis
											dataKey={(d) => niceLabel(d.time)}
											axisLine={false}
											tickLine={false}
											tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
											dy={10}
										/>
										<YAxis
											axisLine={false}
											tickLine={false}
											tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
										/>
										<YAxis
											yAxisId="right"
											orientation="right"
											axisLine={false}
											tickLine={false}
											tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
										/>
										<Tooltip content={<CustomTooltip />} />
										<Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

										{(activeTypes ?? types).includes('temperature') && (
											<Area type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={3} fill="url(#colorTemp)" name="Temperature" activeDot={{ r: 6, strokeWidth: 0 }} />
										)}
										{(activeTypes ?? types).includes('humidity') && (
											<Area type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={3} fill="url(#colorHum)" name="Humidity" activeDot={{ r: 6, strokeWidth: 0 }} />
										)}
										{(activeTypes ?? types).includes('co2') && (
											<Area type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={3} fill="url(#colorCo2)" name="CO₂" yAxisId="right" activeDot={{ r: 6, strokeWidth: 0 }} />
										)}
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</div>

						{/* Distribution Chart */}
						<div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col">
							<h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
								<BarChart3 className="w-5 h-5 text-indigo-500" />
								Data Distribution
							</h2>
							<div className="flex-1 min-h-[300px]">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={Object.keys(counts).filter((k) => (activeTypes ?? types).includes(k)).map((k) => ({ type: k, count: counts[k] }))}>
										<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-800" />
										<XAxis
											dataKey="type"
											axisLine={false}
											tickLine={false}
											tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
											dy={10}
										/>
										<YAxis
											axisLine={false}
											tickLine={false}
											tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
										/>
										<Tooltip content={<CustomTooltip />} />
										<Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>

					</div>

					{/* Scheduler Section */}
					<div className="mt-4">
						<ReportScheduler />
					</div>
				</div>
			</div>
		</div>
	);
}
