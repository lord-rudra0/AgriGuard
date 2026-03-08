import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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
import SeasonalStrategyAnalytics from '../components/analytics/SeasonalStrategyAnalytics';
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

	const trendKeys = useMemo(
		() => ['temperature', 'humidity', 'co2'].filter((key) => rows.some((r) => typeof r[key] === 'number')),
		[rows]
	);

	const summary = fullData?.summary || {};
	const sampleCounts = fullData?.sampleCounts || {};
	const totalSamples = fullData?.totalSamples || 0;
	const lastSampleAt = fullData?.lastSampleAt ? new Date(fullData.lastSampleAt) : null;
	const types = Object.keys(summary);
	const MIN_SAMPLES_PER_TYPE = 10;
	const visibleTypes = activeTypes ?? types;
	const hasRecommendations = Array.isArray(fullData?.recommendations) && fullData.recommendations.length > 0;
	const hasGrowth = !!fullData?.growth;
	const hasEfficiency = !!fullData?.efficiency;
	const hasHealth = !!fullData?.health;
	const hasPredictions = Array.isArray(fullData?.predictions) && fullData.predictions.length > 0;

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
		<div className="relative min-h-screen bg-stone-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
			{/* Background Decorative Elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
				<div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
				<div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
				<div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-amber-500/10 dark:bg-amber-500/10 blur-[100px] rounded-full" />
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
										? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
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

				<div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex flex-col gap-1">
						<span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Data window</span>
						<span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
							{totalSamples > 0
								? `Analyzed ${totalSamples} readings in the last ${timeframe.toUpperCase()}`
								: 'No sensor data found for this timeframe yet.'}
						</span>
						{lastSampleAt && (
							<span className="text-[11px] text-gray-500 dark:text-gray-400">
								Last sample at {lastSampleAt.toLocaleTimeString()} on {lastSampleAt.toLocaleDateString()}
							</span>
						)}
					</div>

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

				{totalSamples === 0 && (
					<div className="bg-yellow-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200 font-medium">
						No readings in the selected window. Once your device has sent some data for this timeframe, these analytics will populate automatically.
					</div>
				)}

				<div id="analytics-print-area" className="flex flex-col gap-6">

					{/* Core Trends - always directly driven by your sensor data */}
					{chartData.length > 0 && trendKeys.length > 0 && (
						<div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/20 dark:border-gray-800">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-300 flex items-center gap-2">
										<span className="inline-flex w-6 h-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
											<TrendingUp className="w-4 h-4" />
										</span>
										Core Trends
									</h2>
									<p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
										Last {timeframe.toUpperCase()} · live averages per sensor
									</p>
								</div>
							</div>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
										<XAxis dataKey="name" tick={{ fontSize: 10 }} />
										<YAxis tick={{ fontSize: 10 }} />
										<Tooltip />
										<Legend />
										{trendKeys.map((key, idx) => {
											const colors = ['#10b981', '#3b82f6', '#f59e0b'];
											return (
												<Line
													key={key}
													type="monotone"
													dataKey={key}
													name={formatSensorName(key)}
													stroke={colors[idx % colors.length]}
													strokeWidth={2}
													dot={false}
													activeDot={{ r: 4 }}
												/>
											);
										})}
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>
					)}
					{/* Action & Decision Section - only when we have enough recent data */}
					{hasRecommendations && totalSamples > 50 ? (
						<ActionAnalytics recommendations={fullData?.recommendations || []} />
					) : null}

					{/* Growth Stage Analysis */}
					{hasGrowth && totalSamples > 50 ? (
						<GrowthAnalytics
							growthProfile={fullData?.growth}
							selectedStage={stage}
							onStageChange={setStage}
						/>
					) : null}

					{/* Efficiency & Optimization */}
					{hasEfficiency && totalSamples > 50 ? <EfficiencyAnalytics efficiencyProfile={fullData?.efficiency} /> : null}

					{/* System Intelligence */}
					{hasHealth && totalSamples > 50 ? <SystemHealthAnalytics healthProfile={fullData?.health} /> : null}

					{/* Seasonal Strategy */}
					<SeasonalStrategyAnalytics />

					{/* Predictive Analytics Section */}
					{hasPredictions ? <PredictiveAnalytics predictions={fullData?.predictions || []} /> : null}

					{/* Summary Cards - core metrics per sensor */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
						{(activeTypes ?? types).map((t) => {
							const s = summary[t] || {};
							const samplesForType = sampleCounts?.[t] || 0;
							const hasData = typeof s.avg === 'number' && samplesForType >= MIN_SAMPLES_PER_TYPE;

							return (
								<div key={t} className="group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[180px]">
									<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
									<div className="flex items-center justify-between mb-1.5">
										<span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">{formatSensorName(t)}</span>
										<span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500">
											{samplesForType > 0 ? `${samplesForType} samples` : 'No samples'}
										</span>
									</div>
									<div className="flex items-baseline gap-2 mb-3">
										<span className="text-3xl font-black text-gray-900 dark:text-white">
											{hasData ? s.avg.toFixed(1) : '—'}
										</span>
										<span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
											{hasData ? 'Avg' : 'Insufficient data'}
										</span>
									</div>
									<div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2">
										<div className="flex-1 flex flex-col">
											<span className="text-[8px] uppercase font-black text-gray-400 tracking-tighter">Min</span>
											<span className="text-xs font-black text-gray-900 dark:text-gray-300">
												{hasData && typeof s.min === 'number' ? s.min.toFixed(1) : '—'}
											</span>
										</div>
										<div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
										<div className="flex-1 flex flex-col text-right">
											<span className="text-[8px] uppercase font-black text-gray-400 tracking-tighter">Max</span>
											<span className="text-xs font-black text-gray-900 dark:text-gray-300">
												{hasData && typeof s.max === 'number' ? s.max.toFixed(1) : '—'}
											</span>
										</div>
									</div>
								</div>
							);
						})}
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
								<div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
									<TrendingUp className="w-5 h-5 text-emerald-500" />
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
