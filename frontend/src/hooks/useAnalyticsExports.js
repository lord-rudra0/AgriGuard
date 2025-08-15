import axios from 'axios';

// Minimal export utilities for Analytics page
// - exportCSV triggers backend aggregation and downloads file
// - exportPDF prints a DOM section using a clean window
export default function useAnalyticsExports() {
  const exportCSV = async ({ timeframe = '24h' } = {}) => {
    const res = await axios.post('/api/reports/export', { timeframe }, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${timeframe}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Print a section to PDF via browser print dialog
  const exportPDF = (elementSelector = '#analytics-print-area', title = 'Analytics Report') => {
    const el = document.querySelector(elementSelector);
    if (!el) return;
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) return;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((n) => n.outerHTML)
      .join('\n');
    win.document.write(`<!doctype html><html><head><title>${title}</title>${styles}</head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.onload = () => win.print();
  };

  return { exportCSV, exportPDF };
}
