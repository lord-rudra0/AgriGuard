import { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarClock, Trash2, Send } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function ReportScheduler() {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('Daily Report');
  const [email, setEmail] = useState('');
  const [timeframe, setTimeframe] = useState('24h');
  const [frequency, setFrequency] = useState('daily');
  const [hourLocal, setHourLocal] = useState(8);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await axios.get('/api/reports/schedules');
    setItems(res.data?.schedules || []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onTalkAction = (payload = {}) => {
      if (
        payload.action === 'report_schedule_created'
        || payload.action === 'report_schedule_deleted'
        || payload.action === 'report_sent'
      ) {
        load();
      }
    };
    socket.on('talk:action', onTalkAction);
    return () => socket.off('talk:action', onTalkAction);
  }, [socket]);

  const create = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await axios.post('/api/reports/schedules', { name, email, timeframe, frequency, hourLocal: Number(hourLocal) });
      setName('Daily Report');
      await load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await axios.delete(`/api/reports/schedules/${id}`);
    await load();
  };

  return (
    <div className="card p-4 space-y-3 ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <CalendarClock className="w-4 h-4" /> Scheduled reports
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <input className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-sm" placeholder="Report name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-sm" placeholder="Email to" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-sm" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
          <option value="1h">1H</option>
          <option value="24h">24H</option>
          <option value="7d">7D</option>
          <option value="30d">30D</option>
        </select>
        <select className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-sm" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <input type="number" min={0} max={23} className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 text-sm" value={hourLocal} onChange={(e) => setHourLocal(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={create}
          disabled={loading}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Schedule
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div key={it._id} className="flex items-center justify-between text-sm px-2 py-1 rounded-md bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10">
              <div className="truncate">
                <span className="font-medium">{it.name}</span>
                <span className="text-gray-500 dark:text-gray-400"> · {it.timeframe} · {it.frequency} · {it.hourLocal}:00</span>
              </div>
              <button className="p-1 hover:text-red-600" title="Delete" onClick={() => remove(it._id)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
