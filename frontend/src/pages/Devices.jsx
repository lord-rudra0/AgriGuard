import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Copy, Plus, RefreshCw, Cpu, Wifi, WifiOff, Clock, ShieldCheck,
  Trash2, Terminal, QrCode, Smartphone, Settings2, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';

const Devices = () => {
  const { socket } = useSocket();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [factoryToken, setFactoryToken] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [lastToken, setLastToken] = useState(null);
  const [showClaim, setShowClaim] = useState(true);
  const [showFactory, setShowFactory] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [factoryName, setFactoryName] = useState('AgriGuard Device');
  const [factoryDeviceId, setFactoryDeviceId] = useState('');
  const [factoryResult, setFactoryResult] = useState(null);
  const [creatingFactory, setCreatingFactory] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/devices');
      setDevices(res.data?.devices || []);
    } catch (e) {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const onTalkAction = (payload = {}) => {
      if (
        payload.action === 'device_command_created'
        || payload.action === 'automation_rule_created'
        || payload.action === 'automation_rule_updated'
        || payload.action === 'automation_rule_deleted'
      ) {
        fetchDevices();
      }
    };
    socket.on('talk:action', onTalkAction);
    return () => socket.off('talk:action', onTalkAction);
  }, [socket]);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!factoryToken.trim()) {
      toast.error('Factory token is required');
      return;
    }
    try {
      setClaiming(true);
      const res = await axios.post('/api/devices/claim', {
        factoryToken: factoryToken.trim(),
        name: deviceName.trim() || undefined
      });
      const token = res.data?.deviceToken;
      setLastToken(token || null);
      setFactoryToken('');
      setDeviceName('');
      await fetchDevices();
      toast.success('Device claimed successfully');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to claim device');
    } finally {
      setClaiming(false);
    }
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/devices/${deviceId}`);
      await fetchDevices();
      toast.success('Device removed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete device');
    }
  };

  const handleCreateFactory = async (e) => {
    e.preventDefault();
    if (!adminSecret.trim()) {
      toast.error('Admin secret is required');
      return;
    }
    try {
      setCreatingFactory(true);
      const res = await axios.post('/api/devices/factory', {
        name: factoryName.trim() || 'AgriGuard Device',
        deviceId: factoryDeviceId.trim() || undefined
      }, {
        headers: { 'x-admin-secret': adminSecret.trim() }
      });
      setFactoryResult(res.data);
      toast.success('Factory device provisioned');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create factory device');
    } finally {
      setCreatingFactory(false);
    }
  };

  const copyToken = async () => {
    if (!lastToken) return;
    await navigator.clipboard.writeText(lastToken);
    toast.success('Device token copied to clipboard');
  };

  const isOnline = (lastSeenAt) => {
    if (!lastSeenAt) return false;
    const now = new Date();
    const lastSeen = new Date(lastSeenAt);
    return (now - lastSeen) < 5 * 60 * 1000; // Online if seen in last 5 minutes
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              Device Fleet
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">Provision, monitor, and manage your connected sensors</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">{devices.length} Active Node{devices.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={fetchDevices}
              className="p-2.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm text-gray-500 hover:text-emerald-500 transition-colors"
              title="Refresh Fleet"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Controls Panel (Left) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Claim Section */}
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl border border-white/20 dark:border-gray-800 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" /> Claim Node
                </h2>
                <button
                  onClick={() => setShowClaim(!showClaim)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
                >
                  <Settings2 className={`w-4 h-4 transition-transform duration-500 ${showClaim ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showClaim && (
                <form onSubmit={handleClaim} className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Factory Token</label>
                    <div className="relative group">
                      <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        value={factoryToken}
                        onChange={(e) => setFactoryToken(e.target.value)}
                        placeholder="Paste factory uuid..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-transparent focus:border-emerald-500/50 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Label Name</label>
                    <input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="e.g. North Greenhouse"
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-transparent focus:border-emerald-500/50 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={claiming}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {claiming ? 'Associating...' : 'Claim Device'}
                  </button>
                </form>
              )}
            </div>

            {/* Factory Section */}
            <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-xl border border-white/20 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-500" /> Provisioning Tool
                </h2>
                <button
                  onClick={() => setShowFactory(!showFactory)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
                >
                  <Plus className={`w-4 h-4 transition-transform duration-300 ${showFactory ? 'rotate-45' : ''}`} />
                </button>
              </div>

              {showFactory && (
                <form onSubmit={handleCreateFactory} className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Admin Authorization</label>
                    <input
                      type="password"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="Factory Secret Key"
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-transparent focus:border-indigo-500/50 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 placeholder:font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Inventory Name</label>
                    <input
                      value={factoryName}
                      onChange={(e) => setFactoryName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-transparent focus:border-indigo-500/50 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingFactory}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {creatingFactory ? 'Provisioning...' : 'Generate Factory Entry'}
                  </button>
                </form>
              )}

              {factoryResult && (
                <div className="mt-6 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center gap-4 animate-fade-up">
                  <div className="w-full">
                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Factory UUID</label>
                    <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all select-all">
                      {factoryResult.factoryToken}
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-xl shadow-lg border border-gray-100">
                    <img src={factoryResult.qrPngDataUrl} alt="Factory QR" className="w-32 h-32" />
                  </div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center">Scan to Claim Device</div>
                </div>
              )}
            </div>

            {/* New Token Alert */}
            {lastToken && (
              <div className="bg-emerald-600 rounded-[1.5rem] p-6 shadow-xl shadow-emerald-500/20 text-white animate-fade-up relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Secure Access Token</h2>
                </div>
                <p className="text-[10px] font-bold opacity-80 mb-4 leading-relaxed uppercase tracking-tight">Save this token immediately. It will only be displayed once.</p>
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 mb-4 font-mono text-[10px] break-all border border-white/10 select-all">
                  {lastToken}
                </div>
                <button
                  onClick={copyToken}
                  className="w-full py-2.5 bg-white text-emerald-700 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Secure Token
                </button>
              </div>
            )}
          </div>

          {/* Device List (Right) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h2 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-2">Hardware Inventory</h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-3xl p-6 h-32 animate-pulse border border-gray-100 dark:border-gray-800" />
                ))}
              </div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-800 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <WifiOff className="w-8 h-8 text-gray-400 opacity-50" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">No Active Nodes</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Claim a factory-prepared device to start monitoring.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((d) => {
                  const online = isOnline(d.lastSeenAt);
                  return (
                    <div key={d.deviceId} className="group relative bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-[1.8rem] p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                      {/* Status Accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${online ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-300 dark:bg-gray-700'}`} />

                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-2xl ${online ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            {online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {d.name || 'Anonymous Node'}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{d.deviceId}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(d.deviceId)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Remove Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
                            <Activity className="w-3 h-3" /> Status
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${online ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                            {online ? 'Connected' : 'Dormant'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
                            <Clock className="w-3 h-3" /> Pulse
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tight text-gray-700 dark:text-gray-300">
                            {d.lastSeenAt ? format(new Date(d.lastSeenAt), 'HH:mm:ss') : '--:--:--'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right italic opacity-60">
                        {d.lastSeenAt ? `Last update ${format(new Date(d.lastSeenAt), 'MMM d, yyyy')}` : 'No activity recorded'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-1">Security Note</h4>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-tight">Devices must be flashed with their unique Hardware Token to authorize data ingestion. Factory UUIDs are for association only.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Devices;
