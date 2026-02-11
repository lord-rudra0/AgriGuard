import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ExportButtons from '../components/analytics/ExportButtons';
import SavedViews from '../components/analytics/SavedViews';
import ReportScheduler from '../components/analytics/ReportScheduler';
import StabilityAnalytics from '../components/analytics/StabilityAnalytics';
import DeviationAnalytics from '../components/analytics/DeviationAnalytics';
import RiskAnalytics from '../components/analytics/RiskAnalytics';
import ActionAnalytics from '../components/analytics/ActionAnalytics';
import PredictiveAnalytics from '../components/analytics/PredictiveAnalytics';
import GrowthAnalytics from '../components/analytics/GrowthAnalytics';
import EfficiencyAnalytics from '../components/analytics/EfficiencyAnalytics';
import SystemHealthAnalytics from '../components/analytics/SystemHealthAnalytics';
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
import { BarChart3, Calendar, RefreshCw, TrendingUp, Activity, Filter, Download, Trash2, ShieldAlert } from 'lucide-react';

const TIMEFRAMES = [
	{ key: '1h', label: '1H' },
	{ key: '24h', label: '24H' },
	{ key: '7d', label: '7D' },
	{ key: '30d', label: '30D' },
];

const THRESHOLDS = {
	temperature: { min: 18, max: 28, ideal: 23 },
	humidity: { min: 40, max: 80, ideal: 60 },
	co2: { min: 300, max: 600, ideal: 450 },
	light: { min: 200, max: 800, ideal: 500 },
	soilMoisture: { min: 30, max: 70, ideal: 50 }
};

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
	const [fullData, setFullData] = useState(null);
	const [inserting, setInserting] = useState(false);
	const [purging, setPurging] = useState(false);
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

	// --- Processed Data using Backend Response ---
	const chartData = useMemo(() => {
		return rows.map((r) => ({
			...r,
			name: niceLabel(r.name),
		}));
	}, [rows]);

	const types = useMemo(() => {
		if (chartData.length === 0) return [];
		return Object.keys(chartData[0]).filter((k) => k !== 'name' && k !== 'timestamp');
	}, [chartData]);

	const summary = useMemo(() => {
		if (chartData.length === 0) return {};
		const result = {};
		types.forEach((type) => {
			const values = chartData.map((d) => d[type]).filter((v) => v !== undefined);
			result[type] = {
				min: Math.min(...values),
				max: Math.max(...values),
				avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
			};
		});
		return result;
	}, [chartData, types]);

	if (loading && !fullData) {
		return (
			<div className="min-h-screen pt-24 px-4 flex flex-col items-center justify-center">
				<div className="relative">
					<div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
					<Activity className="absolute inset-0 m-auto w-8 h-8 text-emerald-500 animate-pulse" />
				</div>
				<p className="mt-6 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest animate-pulse">
					Computing Analytical Insights...
				</p>
			</div>
		);
	}

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

						<ExportButtons data={chartData} timeframe={timeframe} />
					</div>
				</div>

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
								const make = (type, unit, base, noise, n = 30) =>
									Array.from({ length: n }, (_, i) => ({
										type,
										value: Math.round((base + (Math.random() - 0.5) * noise) * 10) / 10,
										unit,
										location: 'Greenhouse 1',
										metadata: { batteryLevel: 0.8, signalStrength: 0.9 },
									}));
								const readings = [
									...make('temperature', '°C', 23, 8),
									...make('humidity', '%', 60, 30),
									...make('co2', 'ppm', 450, 250),
									...make('light', 'lux', 500, 400),
									...make('soilMoisture', '%', 50, 20),
								];
								await axios.post('/api/sensors/data', { deviceId: 'dev-sim-1', readings });
								// Wait slightly longer for aggregation
								await new Promise((r) => setTimeout(r, 800));
								const res = await axios.get('/api/sensors/analytics', { params: { timeframe } });
								setRows(res.data?.analytics || []);
								if (res.data?.analytics?.length === 0) {
									setError('Data saved, but analytics hasn\'t aggregated yet. Please refresh in a moment.');
								}
							} catch (e) {
								if (e.response?.status === 429) {
									setError('Too many requests. Please wait a minute before generating more data.');
								} else {
									setError('Failed to generate simulation data. Check connection.');
								}
							} finally {
								setInserting(false);
							}
						}}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${inserting
							? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-wait'
							: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20'
							}`}
					>
						<RefreshCw className={`w-3.5 h-3.5 ${inserting ? 'animate-spin' : ''}`} />
						{inserting ? 'Synchronizing Pipeline...' : '✨ Generate Simulation Data'}
					</button>

					<button
						onClick={async () => {
							if (!window.confirm('Wipe all simulation data? This will clear dev-sim-1 readings.')) return;
							setPurging(true);
							setError('');
							try {
								const res = await axios.delete('/api/sensors/data', { params: { deviceId: 'dev-sim-1' } });
								// Refresh analytics after purge
								const analyticsRes = await axios.get('/api/sensors/analytics', { params: { timeframe } });
								setRows(analyticsRes.data?.analytics || []);
								alert(res.data?.message || 'Purged simulation data.');
							} catch (e) {
								setError('Failed to purge simulation data.');
							} finally {
								setPurging(false);
							}
						}}
						className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 ${purging
							? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-wait'
							: 'text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20'
							}`}
						title="Clear dev-sim-1 data"
					>
						<Trash2 className={`w-3.5 h-3.5 ${purging ? 'animate-pulse' : ''}`} />
						{purging ? 'Purging...' : 'Purge Simulation'}
					</button>
				</div>

				{error && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-900/50 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 font-medium">
						{error}
					</div>
				)}

				<div id="analytics-print-area" className="flex flex-col gap-6">
					{/* Action & Decision Section - Moved to Top */}
					<div className="flex flex-col gap-6">
						<ActionAnalytics recommendations={fullData?.recommendations || []} />
					</div>

					{/* Growth Stage Analysis */}
					<div className="flex flex-col gap-6">
						<GrowthAnalytics growthProfile={fullData?.growth} />
					</div>

					{/* Efficiency & Optimization */}
					<div className="flex flex-col gap-6">
						<EfficiencyAnalytics efficiencyProfile={fullData?.efficiency} />
					</div>

					{/* System Intelligence */}
					<div className="flex flex-col gap-6">
						<SystemHealthAnalytics healthProfile={fullData?.health} />
					</div>

					{/* Predictive Analytics Section */}
					<div className="flex flex-col gap-6">
						<PredictiveAnalytics predictions={fullData?.predictions || []} />
					</div>

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

					{/* Stability & Consistency Section */}
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
								<div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
									<Activity className="w-5 h-5 text-emerald-500" />
								</div>
								Stability & Consistency Profile
							</h2>
							<div className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
								Analysis Window: {timeframe}
							</div>
						</div>
						<StabilityAnalytics stabilityProfiles={fullData?.stability || {}} />
					</div>

					{/* Deviation & Drift Section */}
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
								<div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
									<TrendingUp className="w-5 h-5 text-indigo-500" />
								</div>
								Drift & Deviation Analysis
							</h2>
						</div>
						<DeviationAnalytics
							stabilityProfiles={fullData?.stability || {}}
							chartData={chartData}
							timeframe={timeframe}
						/>
					</div>

					{/* Risk & Threat Section */}
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
								<div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
									<ShieldAlert className="w-5 h-5 text-rose-500" />
								</div>
								Risk & Threat Assessment
							</h2>
						</div>
						<RiskAnalytics riskProfile={fullData?.risk} />
					</div>



					{/* Trends & Distribution charts removed as per request */}

					{/* Scheduler Section */}
					<div className="mt-4">
						<ReportScheduler />
					</div>
				</div>
			</div>
		</div>
	);
}
