import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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
} from 'recharts';

const TIMEFRAMES = [
	{ key: '1h', label: '1H' },
	{ key: '24h', label: '24H' },
	{ key: '7d', label: '7D' },
	{ key: '30d', label: '30D' },
];

const niceLabel = (t) => {
	if (!t) return '';
	// Expect "YYYY-MM-DD HH:00"
	return t.slice(5); // "MM-DD HH:00" for compactness
};

export default function Analytics() {
	const [timeframe, setTimeframe] = useState('24h');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [rows, setRows] = useState([]); // backend analytics array
	const [inserting, setInserting] = useState(false);

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
		return () => {
			active = false;
		};
	}, [timeframe]);

	// Transform backend aggregation to time-series per sensorType
	const { chartData, types, summary, counts } = useMemo(() => {
		const timeMap = new Map(); // key -> { time, [type]: avgValue }
		const typeSet = new Set();
		const typeStats = {}; // type -> { min, max, sum, n }
		const typeCounts = {}; // type -> total count

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

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
				{/* Header */}
					<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">Analytics</h1>
						<p className="mt-2 text-indigo-700/90 dark:text-indigo-300">Trends, ranges, and activity over time</p>
					</div>
						<div className="flex gap-2 items-center">
						{TIMEFRAMES.map((tf) => (
							<button
								key={tf.key}
								onClick={() => setTimeframe(tf.key)}
								className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 will-change-transform ${
									timeframe === tf.key
										? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-sm ring-2 ring-primary-400/50 hover:brightness-110'
										: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-700 dark:hover:text-indigo-300 ring-1 ring-black/5 dark:ring-white/10 hover:scale-105'
									}`}
							>
								{tf.label}
							</button>
						))}
							{/* Dev helper: insert mock data if empty */}
							<button
								onClick={async () => {
									setInserting(true);
									setError('');
									try {
										// Create ~50 readings across last 24h
										const now = Date.now();
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
										await axios.post('/api/sensors/data', {
											deviceId: 'dev-sim-1',
											readings,
										});
										// Refresh
										await new Promise((r) => setTimeout(r, 300));
										const res = await axios.get('/api/sensors/analytics', { params: { timeframe } });
										setRows(res.data?.analytics || []);
									} catch (e) {
										setError(e.response?.data?.message || 'Failed to insert mock data');
									} finally {
										setInserting(false);
									}
								}}
								className="px-3 py-1.5 rounded-md text-sm font-medium bg-secondary-600 text-white hover:bg-secondary-700 disabled:opacity-60"
								disabled={inserting}
								title="Insert sample data for demo"
							>
								{inserting ? 'Adding…' : 'Add sample data'}
							</button>
					</div>
				</div>

				{error && (
					<div className="card p-4 mb-6 text-red-600 dark:text-red-400">{error}</div>
				)}

				{/* Summary cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						{types.map((t) => (
							<div key={t} className="card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-black/5 dark:ring-white/10">
								<div className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">{t}</div>
								<div className="mt-2 flex items-baseline gap-3">
									<div className="text-2xl font-semibold text-gray-900 dark:text-white">
										{summary[t]?.avg ?? '—'}
									</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">avg</div>
								</div>
								<div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
									min {summary[t]?.min ?? '—'} · max {summary[t]?.max ?? '—'}
								</div>
								<div className="mt-2 text-xs text-gray-500 dark:text-gray-400">records {counts[t] ?? 0}</div>
							</div>
						))}
				</div>

						{/* Empty state */}
						{rows.length === 0 && !loading && !error && (
							<div className="card p-8 text-center mb-8">
								<p className="text-gray-700 dark:text-gray-200">
									No analytics available for this timeframe. Add readings via your device
									or use “Add sample data”.
								</p>
							</div>
						)}

						{/* Charts */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Combined time-series */}
					<div className="lg:col-span-2">
						<div className="card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-black/5 dark:ring-white/10">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
								Averages over time
							</h2>
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
										<XAxis dataKey={(d) => niceLabel(d.time)} className="text-gray-600 dark:text-gray-400" />
										<YAxis className="text-gray-600 dark:text-gray-400" />
										<YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
										<Tooltip />
										<Legend />
										{types.includes('temperature') && (
											<Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Temperature" />
										)}
										{types.includes('humidity') && (
											<Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Humidity" />
										)}
										{types.includes('co2') && (
											<Line type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={2.5} dot={false} name="CO₂" yAxisId="right" />
										)}
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>

					{/* Counts per type */}
					<div>
						<div className="card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ring-1 ring-black/5 dark:ring-white/10">
							<h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Readings by type</h2>
							<div className="h-80">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={Object.keys(counts).map((k) => ({ type: k, count: counts[k] }))}>
										<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
										<XAxis dataKey="type" className="text-gray-600 dark:text-gray-400" />
										<YAxis className="text-gray-600 dark:text-gray-400" />
										<Tooltip />
										<Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>
				</div>

				{loading && (
					<div className="mt-6 text-center text-gray-600 dark:text-gray-300">Loading analytics…</div>
				)}
			</div>
		</div>
	);
}

