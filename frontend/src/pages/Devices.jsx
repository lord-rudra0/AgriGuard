import { useEffect, useState } from 'react';
import axios from 'axios';
import { Copy, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [factoryToken, setFactoryToken] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [lastToken, setLastToken] = useState(null);
  const [showClaim, setShowClaim] = useState(true);

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
      toast.success('Device claimed');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to claim device');
    } finally {
      setClaiming(false);
    }
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('Delete this device? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/devices/${deviceId}`);
      await fetchDevices();
      toast.success('Device deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete device');
    }
  };

  const copyToken = async () => {
    if (!lastToken) return;
    await navigator.clipboard.writeText(lastToken);
    toast.success('Token copied');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
            Devices
          </h1>
          <p className="mt-2 text-indigo-700/90 dark:text-indigo-300">
            Claim and manage your IoT devices
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Claim Device
                </h2>
                <button
                  onClick={() => setShowClaim(v => !v)}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:underline"
                >
                  {showClaim ? 'Hide' : 'Show'}
                </button>
              </div>
              {showClaim && (
                <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Factory Token
                  </label>
                  <input
                    value={factoryToken}
                    onChange={(e) => setFactoryToken(e.target.value)}
                    placeholder="Scan or paste factory token"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Name (optional)
                  </label>
                  <input
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Greenhouse ESP32"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={claiming}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 transition-all duration-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {claiming ? 'Claiming...' : 'Claim Device'}
                </button>
                </form>
              )}
            </div>

            {lastToken && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Device Token (save now)
                </h2>
                <div className="text-xs break-all bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                  {lastToken}
                </div>
                <button
                  onClick={copyToken}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                >
                  <Copy className="w-4 h-4" />
                  Copy Token
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Devices
                </h2>
                <button
                  onClick={fetchDevices}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading devices...</div>
              ) : devices.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">No devices yet.</div>
              ) : (
                <div className="space-y-3">
                  {devices.map((d) => (
                    <div key={d.deviceId} className="flex items-center justify-between rounded-lg px-3 py-2 bg-white/60 dark:bg-gray-800/60 ring-1 ring-black/5 dark:ring-white/10">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {d.name || d.deviceId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {d.deviceId}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                        {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Never'}
                        <div>
                          <button
                            onClick={() => handleDelete(d.deviceId)}
                            className="mt-1 text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Devices;
