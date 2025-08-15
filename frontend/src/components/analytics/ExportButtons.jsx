import { Download, FileText } from 'lucide-react';
import useAnalyticsExports from '../../hooks/useAnalyticsExports';

export default function ExportButtons({ timeframe = '24h', printSelector = '#analytics-print-area' }) {
  const { exportCSV, exportPDF } = useAnalyticsExports();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => exportCSV({ timeframe })}
        className="px-3 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        title="Export CSV"
      >
        <Download className="w-4 h-4" /> CSV
      </button>
      <button
        onClick={() => exportPDF(printSelector, `Analytics_${timeframe}`)}
        className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-2"
        title="Export PDF"
      >
        <FileText className="w-4 h-4" /> PDF
      </button>
    </div>
  );
}
