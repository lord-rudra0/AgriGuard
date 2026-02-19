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
import { Clock, RefreshCw } from 'lucide-react';

const DashboardChartCard = ({ chartData, mounted }) => (
  <div className={`lg:col-span-2 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
    <div className="relative p-6 rounded-[32px] bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl border border-stone-200 dark:border-slate-700/60 shadow-2xl shadow-stone-200/50 dark:shadow-black/20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">Environmental Trends</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 transition-all hover:scale-105 active:scale-95">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync</span>
        </button>
      </div>

      <div className="h-80 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.12)" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} dx={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '16px',
                  color: '#ecfdf5',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#ecfdf5' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }} name="Temperature (°C)" animationDuration={1500} />
              <Line type="monotone" dataKey="humidity" stroke="#0ea5a4" strokeWidth={3} dot={{ fill: '#0ea5a4', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#0ea5a4', strokeWidth: 2 }} name="Humidity (%)" animationDuration={1700} />
              <Line type="monotone" dataKey="co2" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }} name="CO₂ (ppm)" yAxisId="right" animationDuration={1900} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-700 dark:text-gray-200">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-semibold">No historical data collected yet.</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Connect a sensor to start monitoring.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DashboardChartCard;
