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
    <div className="relative p-6 rounded-[32px] bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">Environmental Trends</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-300 border border-gray-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync</span>
        </button>
      </div>

      <div className="h-80 flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} axisLine={false} dx={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  color: '#f3f4f6',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="temperature" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#fbbf24', strokeWidth: 2 }} name="Temperature (°C)" animationDuration={1500} />
              <Line type="monotone" dataKey="humidity" stroke="#60a5fa" strokeWidth={3} dot={{ fill: '#60a5fa', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#60a5fa', strokeWidth: 2 }} name="Humidity (%)" animationDuration={1700} />
              <Line type="monotone" dataKey="co2" stroke="#34d399" strokeWidth={3} dot={{ fill: '#34d399', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, stroke: '#34d399', strokeWidth: 2 }} name="CO₂ (ppm)" yAxisId="right" animationDuration={1900} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No historical data collected yet.</p>
            <p className="text-sm">Connect a sensor to start monitoring.</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DashboardChartCard;
