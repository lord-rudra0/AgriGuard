import React, { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Clock,
    ArrowRight,
    Activity,
    Sparkles,
    Loader2,
    MessageSquarePlus
} from 'lucide-react';
import axios from 'axios';

const THRESHOLDS = {
    temperature: { min: 18, max: 28, label: 'Temperature', unit: '°C' },
    humidity: { min: 40, max: 80, label: 'Humidity', unit: '%' },
    co2: { min: 300, max: 600, label: 'CO2', unit: 'ppm' },
    soilMoisture: { min: 30, max: 70, label: 'Soil Moisture', unit: '%' }
};

const PredictiveAnalytics = ({ chartData = [] }) => {
    const [loadingAnalysis, setLoadingAnalysis] = React.useState({});
    const [aiAnalysis, setAiAnalysis] = React.useState({});

    const handleAskAI = async (forecast, e) => {
        e.stopPropagation();
        if (aiAnalysis[forecast.id]) return; // Already fetched

        setLoadingAnalysis(prev => ({ ...prev, [forecast.id]: true }));
        try {
            const prompt = `I have a predictive forecast for ${forecast.metric}. The current value is ${forecast.current}${forecast.unit} with a trend of ${forecast.slope > 0 ? '+' : ''}${forecast.slope.toFixed(2)}${forecast.unit}/hr. It is predicted to ${forecast.event} in ${forecast.hours ? forecast.hours.toFixed(1) + ' hours' : 'the near future'}. What preventive actions should I take now?`;
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/chat/ai', { message: prompt }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = res.data?.message || res.data?.reply || res.data?.text || 'Could not generate advice.';
            setAiAnalysis(prev => ({ ...prev, [forecast.id]: text }));
        } catch (err) {
            console.error(err);
            setAiAnalysis(prev => ({ ...prev, [forecast.id]: 'Failed to contact AI.' }));
        } finally {
            setLoadingAnalysis(prev => ({ ...prev, [forecast.id]: false }));
        }
    };

    const forecasts = useMemo(() => {
        if (!chartData || chartData.length < 5) return [];

        // 1. Group data by type
        const grouped = {};
        chartData.forEach(d => {
            Object.keys(THRESHOLDS).forEach(key => {
                if (d[key] !== undefined) {
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push({ val: d[key], time: new Date(d.name).getTime() }); // Assuming 'name' is ISO string or timestamp
                }
            });
        });

        const results = [];

        Object.keys(grouped).forEach(key => {
            const data = grouped[key];
            if (data.length < 5) return;

            // Use last 5 points for short-term trend
            const recent = data.slice(-5);
            const n = recent.length;

            // X is time in hours (relative to first point in slice for numerical stability)
            const startTime = recent[0].time;
            const points = recent.map(p => ({
                x: (p.time - startTime) / 3600000,
                y: p.val
            }));

            // Linear Regression: y = mx + b
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            points.forEach(p => {
                sumX += p.x;
                sumY += p.y;
                sumXY += p.x * p.y;
                sumXX += p.x * p.x;
            });

            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const currentVal = points[points.length - 1].y;
            const threshold = THRESHOLDS[key];

            // Analyze Slope & Risks
            // ---------------------

            // Significant Trend Check (filtering out noise)
            const isSignificant = Math.abs(slope) > (key === 'co2' ? 5 : 0.1);

            if (isSignificant) {
                let predictedEvent = null;
                let timeToEvent = null;
                let targetBoundary = null;

                // Project towards Max
                if (slope > 0 && currentVal < threshold.max) {
                    const diff = threshold.max - currentVal;
                    const hours = diff / slope;
                    if (hours > 0 && hours < 24) {
                        predictedEvent = 'High Limit Breach';
                        timeToEvent = hours;
                        targetBoundary = threshold.max;
                    }
                }
                // Project towards Min
                else if (slope < 0 && currentVal > threshold.min) {
                    const diff = currentVal - threshold.min;
                    const hours = diff / Math.abs(slope); // time = dist / speed
                    if (hours > 0 && hours < 24) {
                        predictedEvent = 'Low Limit Breach';
                        timeToEvent = hours;
                        targetBoundary = threshold.min;
                    }
                }

                if (predictedEvent) {
                    results.push({
                        id: key,
                        metric: threshold.label,
                        current: currentVal,
                        unit: threshold.unit,
                        slope: slope,
                        event: predictedEvent,
                        hours: timeToEvent,
                        boundary: targetBoundary,
                        severity: timeToEvent < 4 ? 'critical' : timeToEvent < 12 ? 'warning' : 'info'
                    });
                } else if (Math.abs(slope) > (key === 'co2' ? 20 : 0.5)) {
                    // Fast change but not hitting limit soon (or already outside)
                    results.push({
                        id: key + '-trend',
                        metric: threshold.label,
                        current: currentVal,
                        unit: threshold.unit,
                        slope: slope,
                        event: 'Rapid Trend',
                        hours: null,
                        boundary: null,
                        severity: 'info'
                    });
                }
            }
        });

        return results.sort((a, b) => (a.hours || 99) - (b.hours || 99)); // Sort by urgency (time)

    }, [chartData]);


    if (!forecasts.length) return null;

    return (
        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-violet-500" />
                    </div>
                    Predictive Analytics
                </h3>
                <div className="px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20 text-[10px] font-black text-violet-500 uppercase tracking-wider">
                    Future Forecast (24h)
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forecasts.map((f, idx) => (
                    <div key={idx} className={`relative overflow-hidden rounded-2xl p-[1px] ${f.severity === 'critical' ? 'bg-gradient-to-r from-rose-500 to-orange-500' :
                        f.severity === 'warning' ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
                            'bg-gradient-to-r from-blue-400 to-violet-400'
                        }`}>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 h-full relative">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    {f.slope > 0 ? <TrendingUp className="w-4 h-4 text-gray-400" /> : <TrendingDown className="w-4 h-4 text-gray-400" />}
                                    <span className="text-xs font-bold uppercase text-gray-500">{f.metric}</span>
                                </div>
                                {f.hours && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${f.severity === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                        f.severity === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                        }`}>
                                        In {f.hours.toFixed(1)} hrs
                                    </span>
                                )}
                            </div>

                            {/* Main Prediction */}
                            <div className="mb-3">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Current: <span className="text-gray-900 dark:text-white font-bold">{f.current} {f.unit}</span>
                                </div>
                                <div className="flex items-center gap-2 text-lg leading-tight font-black text-gray-900 dark:text-white">
                                    <span>{f.slope > 0 ? '+' : ''}{f.slope.toFixed(2)} {f.unit}/hr</span>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                    {f.boundary ? (
                                        <span className={f.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}>
                                            {f.boundary} {f.unit}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Stable</span>
                                    )}
                                </div>
                            </div>

                            {/* Context */}
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 mb-3">
                                <Activity className="w-3 h-3" />
                                {f.event === 'High Limit Breach' ? `Will exceed max limit` :
                                    f.event === 'Low Limit Breach' ? `Will drop below min limit` :
                                        `Rapid ${f.slope > 0 ? 'Increase' : 'Decrease'} Detected`}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={(e) => handleAskAI(f, e)}
                                    disabled={loadingAnalysis[f.id]}
                                    className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-500 hover:bg-violet-500 hover:text-white transition-all duration-300 shadow-sm border border-violet-100 dark:border-violet-500/20"
                                    title="Get AI Prediction Insights"
                                >
                                    {loadingAnalysis[f.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('open-chatbot', {
                                            detail: {
                                                prompt: `I have a predictive forecast for ${f.metric} showing a trend of ${f.slope > 0 ? '+' : ''}${f.slope.toFixed(2)}${f.unit}/hr towards a ${f.event}. What should I do to prevent this?`
                                            }
                                        }));
                                    }}
                                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm"
                                    title="Open Chat"
                                >
                                    <MessageSquarePlus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Inline AI Analysis */}
                            {(aiAnalysis[f.id] || loadingAnalysis[f.id]) && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                                                <Sparkles className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">AI Forecast Analysis</h5>
                                            {loadingAnalysis[f.id] ? (
                                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            ) : (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {aiAnalysis[f.id]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PredictiveAnalytics;
