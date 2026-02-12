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
import { BarChart3, Activity, TrendingUp, ShieldAlert } from 'lucide-react';

const TIMEFRAMES = [
	{ key: '1h', label: '1H' },
	{ key: '24h', label: '24H' },
	{ key: '7d', label: '7D' },
	{ key: '30d', label: '30D' },
];

const STAGES = [
	{ key: 'spawnRun', label: 'Spawn Run' },
	{ key: 'fruiting', label: 'Fruiting' },
];



const formatTimeLabel = (t) => {
	if (!t) return '';
	return t.slice(5); // "MM-DD HH:00"
};

const formatSensorName = (t) => {
	if (!t) return '';
	if (t === 'temperature') return 'Temperature';
	if (t === 'humidity') return 'Humidity';
	if (t === 'co2') return 'CO2';
	if (t === 'soilMoisture') return 'Soil Moisture';
	if (t === 'light') return 'Light Level';
	return t.charAt(0).toUpperCase() + t.slice(1);
};



export default function Analytics() {
	const [timeframe, setTimeframe] = useState('24h');
	const [stage, setStage] = useState('fruiting');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]);
	const [fullData, setFullData] = useState(null);
	const [activeTypes, setActiveTypes] = useState(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError('');
		axios
			.get('/api/sensors/analytics/full', { params: { timeframe, stage } })
			.then((res) => {
				if (!active) return;
				setFullData(res.data?.data || null);
				setRows(res.data?.history || []);
			})
			.catch((e) => {
				if (!active) return;
				setError(e.response?.data?.message || 'Failed to load analytics');
			})
			.finally(() => active && setLoading(false));
		return () => { active = false; };
	}, [timeframe, stage]);

	// --- Processed Data using Backend Response ---
	const chartData = useMemo(() => {
		return rows.map((r) => ({
			...r,
			name: formatTimeLabel(r.name),
		}));
	}, [rows]);

	const summary = fullData?.summary || {};
	const types = Object.keys(summary);

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
						<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm flex items-center">
							{STAGES.map((st) => (
								<button
									key={st.key}
									onClick={() => setStage(st.key)}
									className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${stage === st.key
										? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
										: 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
										}`}
								>
									{st.label}
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
						<GrowthAnalytics
							growthProfile={fullData?.growth}
							selectedStage={stage}
							onStageChange={setStage}
						/>
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
							<div key={t} className="group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[180px]">
								<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
								<div className="flex items-center justify-between mb-2">
									<span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">{formatSensorName(t)}</span>
									<Activity className="w-4 h-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
								</div>
								<div className="flex items-baseline gap-2 mb-3">
									<span className="text-3xl font-black text-gray-900 dark:text-white">
										{typeof summary[t]?.avg === 'number' ? summary[t].avg.toFixed(1) : '—'}
									</span>
									<span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Avg</span>
								</div>
								<div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
									<div className="flex-1 flex flex-col">
										<span className="text-[8px] uppercase font-black text-gray-400 tracking-tighter">Min</span>
										<span className="text-xs font-black text-gray-900 dark:text-gray-300">
											{typeof summary[t]?.min === 'number' ? summary[t].min.toFixed(1) : '-'}
										</span>
									</div>
									<div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
									<div className="flex-1 flex flex-col text-right">
										<span className="text-[8px] uppercase font-black text-gray-400 tracking-tighter">Max</span>
										<span className="text-xs font-black text-gray-900 dark:text-gray-300">
											{typeof summary[t]?.max === 'number' ? summary[t].max.toFixed(1) : '-'}
										</span>
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
							idealByMetric={fullData?.growth?.meta?.ideal || {}}
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
