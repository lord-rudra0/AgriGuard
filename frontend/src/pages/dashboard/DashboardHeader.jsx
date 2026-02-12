import { Link } from 'react-router-dom';
import { Clock, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DashboardHeader = ({ mounted, isIotActive, hasSensorData, sensorData }) => (
  <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
    <div className="flex items-center justify-between gap-8 md:gap-14">
      <div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent filter drop-shadow-lg">
          Farm Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-light">
          Real-time monitoring of your <span className="text-indigo-600 dark:text-indigo-400 font-medium">mycelium</span> environment
        </p>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <Link
          to="/analytics"
          className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 border border-gray-300 dark:border-white/10 transition-all duration-300 shadow-sm"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col items-start pr-1">
            <span className="text-[11px] font-bold text-gray-900 dark:text-white">Insights</span>
          </div>
        </Link>

        <div className="flex items-center space-x-4">
          <span className="relative inline-flex items-center">
            <span className={`h-2.5 w-2.5 rounded-full ${isIotActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {isIotActive && (
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            )}
          </span>
          {isIotActive ? <Wifi className="w-5 h-5 text-emerald-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
          <span className={`text-sm ${isIotActive ? 'text-emerald-700' : 'text-red-600'}`}>
            {isIotActive ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {hasSensorData && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDistanceToNow(sensorData.lastUpdated)} ago</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default DashboardHeader;
