import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush } from '../push/registerPush';
import toast from 'react-hot-toast';
import {
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pushStatus, setPushStatus] = useState('unknown'); // 'subscribed' | 'not-subscribed' | 'blocked' | 'unknown'
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: ''
  });

  // Security settings state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Notification settings state
  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weatherAlerts: true,
    systemUpdates: true,
    marketingEmails: false
  });

  // System preferences state
  const [systemData, setSystemData] = useState({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    temperatureUnit: 'celsius',
    alertDebounceMs: 5 * 60 * 1000,
    autoSave: true
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
    fetchUserSettings();
  }, [user]);

  // On load, check whether the browser already has a push subscription
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setPushStatus('not-subscribed');
          return;
        }

        if (Notification.permission === 'denied') {
          setPushStatus('blocked');
          setNotificationData(prev => ({ ...prev, pushNotifications: false }));
          return;
        }

        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          setPushStatus('not-subscribed');
          setNotificationData(prev => ({ ...prev, pushNotifications: false }));
          return;
        }

        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setNotificationData(prev => ({ ...prev, pushNotifications: true }));
          setPushStatus('subscribed');
        } else {
          setNotificationData(prev => ({ ...prev, pushNotifications: false }));
          setPushStatus('not-subscribed');
        }
      } catch (err) {
        console.error('Failed to check push subscription', err);
      }
    };

    checkSubscription();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const { notifications, security, system } = response.data.settings;
        setNotificationData(notifications || notificationData);
        setSecurityData(prev => ({ ...prev, twoFactorEnabled: security?.twoFactorEnabled || false }));
        setSystemData(prev => ({
          ...prev,
          ...(system || {}),
          alertDebounceMs: system?.alertDebounceMs ?? prev.alertDebounceMs
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/settings/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityUpdate = async () => {
    if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/settings/security', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        twoFactorEnabled: securityData.twoFactorEnabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Security settings updated successfully!');
        setSecurityData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/settings/notifications', notificationData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Notification preferences updated!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  // Handler for toggling notification preferences in the UI
  const handleToggleNotification = async (key, checked) => {
    // Optimistically update UI
    setNotificationData(prev => ({ ...prev, [key]: checked }));

    try {
      if (key === 'pushNotifications') {
        if (checked) {
          await handleSubscribePush();
        } else {
          await handleUnsubscribePush();
        }
      }

      // Persist preference to server
      const token = localStorage.getItem('token');
      await axios.put('/api/settings/notifications', { ...notificationData, [key]: checked }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Toggle notification error', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to update notification setting');
      // Revert UI on failure
      setNotificationData(prev => ({ ...prev, [key]: !checked }));
    }
  };

  // Push subscription helpers
  const handleSubscribePush = async () => {
    try {
      if (!('Notification' in window)) return toast.error('Notifications not supported in this browser');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return toast.error('Permission denied for notifications');

      // Get VAPID public key from server (optional endpoint)
      const token = localStorage.getItem('token');
      const configResp = await axios.get('/api/config/push', { headers: { Authorization: `Bearer ${token}` } });
      const vapidKey = configResp.data?.vapidPublicKey;
      if (!vapidKey) return toast.error('VAPID key not configured on server');

      const sub = await subscribeToPush(vapidKey);
      // Send subscription to server
      await axios.post('/api/notifications/subscribe', { subscription: sub }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Subscribed to push notifications');
      setNotificationData(prev => ({ ...prev, pushNotifications: true }));
    } catch (err) {
      console.error('Subscribe error', err);
      toast.error(err.message || 'Failed to subscribe');
    }
  };

  const handleUnsubscribePush = async () => {
    try {
      const token = localStorage.getItem('token');
      // get current subscription
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      const endpoint = sub?.endpoint;
      await unsubscribeFromPush();
      if (endpoint) {
        await axios.post('/api/notifications/unsubscribe', { endpoint }, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success('Unsubscribed from push notifications');
      setNotificationData(prev => ({ ...prev, pushNotifications: false }));
    } catch (err) {
      console.error('Unsubscribe error', err);
      toast.error('Failed to unsubscribe');
    }
  };

  const handleSendTestPush = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.post('/api/notifications/send-test', {}, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data.success) toast.success('Test notification sent (attempted)');
      else toast.error(resp.data.message || 'Failed to send test');
    } catch (err) {
      console.error('Send test error', err);
      toast.error(err.response?.data?.message || 'Failed to send test');
    }
  };

  const handleSystemUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/settings/system', systemData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('System preferences updated!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update system preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'system', name: 'System', icon: Globe }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value.replace(/\s+/g, '') }))}
              placeholder="letters, numbers, underscores"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white transition duration-200 ease-in-out hover:shadow-sm hover:brightness-110 active:scale-[0.99]"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">3–30 chars, a–z, A–Z, 0–9, _</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            rows={4}
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleProfileUpdate}
            disabled={loading}
            className="flex items-center px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={securityData.newPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={securityData.confirmPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">Push status: <span className="font-medium">{
              pushStatus === 'unknown' ? 'Checking...' : pushStatus === 'subscribed' ? 'Subscribed' : pushStatus === 'blocked' ? 'Blocked' : 'Not subscribed'
            }</span></p>
            {pushStatus === 'blocked' && (
              <button
                onClick={() => setShowBlockedModal(true)}
                className="text-sm px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 rounded-md ring-1 ring-black/5"
              >
                How to re-enable
              </button>
            )}
          </div>
        </div>

        {/* Blocked help modal */}
        {showBlockedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Re-enable Notifications</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your browser has blocked notifications for this site. Follow the steps below for common browsers to re-enable them.</p>

              <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <strong>Chrome (Desktop)</strong>
                  <ol className="list-decimal list-inside ml-3">
                    <li>Click the padlock icon next to the URL in the address bar.</li>
                    <li>Find "Notifications" and set it to "Allow".</li>
                    <li>Reload the page and try subscribing again.</li>
                  </ol>
                </div>

                <div>
                  <strong>Firefox (Desktop)</strong>
                  <ol className="list-decimal list-inside ml-3">
                    <li>Click the information icon (i) or padlock in the address bar.</li>
                    <li>Under Permissions, find Notifications and choose "Allow".</li>
                    <li>Reload the page.</li>
                  </ol>
                </div>

                <div>
                  <strong>Safari (macOS)</strong>
                  <ol className="list-decimal list-inside ml-3">
                    <li>Open Safari → Preferences → Websites → Notifications.</li>
                    <li>Find this site and change to "Allow".</li>
                    <li>Reload the page.</li>
                  </ol>
                </div>

                <div>
                  <strong>Mobile browsers</strong>
                  <p className="mt-1">Push support varies on mobile. For Android Chrome, open site settings from the address bar and enable notifications. iOS Safari has limited Web Push support.</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowBlockedModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white ring-1 ring-black/5 hover:brightness-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Add an extra layer of security to your account
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securityData.twoFactorEnabled}
              onChange={(e) => setSecurityData(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSecurityUpdate}
            disabled={loading}
            className="flex items-center px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Update Security
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          {Object.entries({
            emailNotifications: 'Email Notifications',
            pushNotifications: 'Push Notifications',
            smsNotifications: 'SMS Notifications',
            weatherAlerts: 'Weather Alerts',
            systemUpdates: 'System Updates',
            marketingEmails: 'Marketing Emails'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {key === 'emailNotifications' && 'Receive notifications via email'}
                  {key === 'pushNotifications' && 'Receive push notifications in your browser'}
                  {key === 'smsNotifications' && 'Receive notifications via SMS'}
                  {key === 'weatherAlerts' && 'Get alerts about weather conditions'}
                  {key === 'systemUpdates' && 'Notifications about system updates'}
                  {key === 'marketingEmails' && 'Promotional emails and newsletters'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationData[key]}
                  onChange={(e) => handleToggleNotification(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <div className="flex gap-3">
            <button
              onClick={handleSubscribePush}
              disabled={loading || notificationData.pushNotifications}
              className="flex items-center px-4 py-2 rounded-md text-white bg-green-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Subscribe
            </button>

            <button
              onClick={handleUnsubscribePush}
              disabled={loading || !notificationData.pushNotifications}
              className="flex items-center px-4 py-2 rounded-md text-white bg-red-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Unsubscribe
            </button>

            <button
              onClick={handleSendTestPush}
              disabled={loading}
              className="flex items-center px-4 py-2 rounded-md text-white bg-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Send Test
            </button>

            <button
              onClick={async () => {
                setLoading(true);
                try {
                  // If pushNotifications preference differs from actual subscription state, reconcile
                  const reg = await navigator.serviceWorker.getRegistration();
                  const sub = reg && (await reg.pushManager.getSubscription());
                  if (notificationData.pushNotifications && !sub) {
                    await handleSubscribePush();
                  }
                  if (!notificationData.pushNotifications && sub) {
                    await handleUnsubscribePush();
                  }
                  await handleNotificationUpdate();
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="flex items-center px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Preferences</h3>
        
        {(() => {
          const debounceOptions = [1, 5, 10, 30, 60];
          const currentMinutes = Math.max(1, Math.round((systemData.alertDebounceMs || 0) / 60000));
          return (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={systemData.language}
              onChange={(e) => setSystemData(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <select
              value={systemData.timezone}
              onChange={(e) => setSystemData(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Format
            </label>
            <select
              value={systemData.dateFormat}
              onChange={(e) => setSystemData(prev => ({ ...prev, dateFormat: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temperature Unit
            </label>
            <select
              value={systemData.temperatureUnit}
              onChange={(e) => setSystemData(prev => ({ ...prev, temperatureUnit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="celsius">Celsius (°C)</option>
              <option value="fahrenheit">Fahrenheit (°F)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alert Debounce
            </label>
            <select
              value={String(currentMinutes)}
              onChange={(e) => {
                const minutes = Number(e.target.value);
                setSystemData(prev => ({ ...prev, alertDebounceMs: minutes * 60 * 1000 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              {debounceOptions.map(m => (
                <option key={m} value={String(m)}>{m} minute{m === 1 ? '' : 's'}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Minimum time between alerts for the same sensor/device.
            </p>
          </div>
        </div>

          );
        })()}

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center px-4 py-2 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Auto Save</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Automatically save your work</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemData.autoSave}
                onChange={(e) => setSystemData(prev => ({ ...prev, autoSave: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSystemUpdate}
            disabled={loading}
            className="flex items-center px-4 py-2 rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-up">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">Settings</h1>
          <p className="mt-2 text-indigo-700/90 dark:text-indigo-300">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10 hover:bg-indigo-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'system' && renderSystemTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
