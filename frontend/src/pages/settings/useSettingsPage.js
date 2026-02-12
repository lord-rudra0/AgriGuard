import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  DEFAULT_PROFILE_DATA,
  DEFAULT_SECURITY_DATA,
  DEFAULT_NOTIFICATION_DATA,
  DEFAULT_SYSTEM_DATA
} from './constants';
import { subscribeToPush, unsubscribeFromPush } from '../../push/registerPush';

export const useSettingsPage = ({ user, updateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pushStatus, setPushStatus] = useState('unknown');
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE_DATA);
  const [securityData, setSecurityData] = useState(DEFAULT_SECURITY_DATA);
  const [notificationData, setNotificationData] = useState(DEFAULT_NOTIFICATION_DATA);
  const [systemData, setSystemData] = useState(DEFAULT_SYSTEM_DATA);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const updateProfileField = (key, value) => {
    setProfileData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSecurityField = (key, value) => {
    setSecurityData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSystemField = (key, value) => {
    setSystemData((prev) => ({ ...prev, [key]: value }));
  };

  const fetchUserSettings = async () => {
    try {
      const response = await axios.get('/api/settings', getAuthConfig());
      if (!response.data.success) return;

      const { notifications, security, system } = response.data.settings;
      setNotificationData((prev) => (notifications ? { ...prev, ...notifications } : prev));
      setSecurityData((prev) => ({ ...prev, twoFactorEnabled: security?.twoFactorEnabled || false }));
      setSystemData((prev) => ({
        ...prev,
        ...(system || {}),
        alertDebounceMs: system?.alertDebounceMs ?? prev.alertDebounceMs
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

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

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setPushStatus('not-subscribed');
          return;
        }

        if (Notification.permission === 'denied') {
          setPushStatus('blocked');
          setNotificationData((prev) => ({ ...prev, pushNotifications: false }));
          return;
        }

        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          setPushStatus('not-subscribed');
          setNotificationData((prev) => ({ ...prev, pushNotifications: false }));
          return;
        }

        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setNotificationData((prev) => ({ ...prev, pushNotifications: true }));
          setPushStatus('subscribed');
        } else {
          setNotificationData((prev) => ({ ...prev, pushNotifications: false }));
          setPushStatus('not-subscribed');
        }
      } catch (err) {
        console.error('Failed to check push subscription', err);
      }
    };

    checkSubscription();
  }, []);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/api/settings/profile', profileData, getAuthConfig());
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
      const response = await axios.put(
        '/api/settings/security',
        {
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
          twoFactorEnabled: securityData.twoFactorEnabled
        },
        getAuthConfig()
      );

      if (response.data.success) {
        toast.success('Security settings updated successfully!');
        setSecurityData((prev) => ({
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
      const response = await axios.put('/api/settings/notifications', notificationData, getAuthConfig());
      if (response.data.success) toast.success('Notification preferences updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribePush = async () => {
    try {
      if (!('Notification' in window)) return toast.error('Notifications not supported in this browser');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return toast.error('Permission denied for notifications');

      const configResp = await axios.get('/api/config/push', getAuthConfig());
      const vapidKey = configResp.data?.vapidPublicKey;
      if (!vapidKey) return toast.error('VAPID key not configured on server');

      const sub = await subscribeToPush(vapidKey);
      await axios.post('/api/notifications/subscribe', { subscription: sub }, getAuthConfig());
      toast.success('Subscribed to push notifications');
      setNotificationData((prev) => ({ ...prev, pushNotifications: true }));
      setPushStatus('subscribed');
    } catch (err) {
      console.error('Subscribe error', err);
      toast.error(err.message || 'Failed to subscribe');
    }
  };

  const handleUnsubscribePush = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      const endpoint = sub?.endpoint;
      await unsubscribeFromPush();
      if (endpoint) {
        await axios.post('/api/notifications/unsubscribe', { endpoint }, getAuthConfig());
      }
      toast.success('Unsubscribed from push notifications');
      setNotificationData((prev) => ({ ...prev, pushNotifications: false }));
      setPushStatus('not-subscribed');
    } catch (err) {
      console.error('Unsubscribe error', err);
      toast.error('Failed to unsubscribe');
    }
  };

  const handleToggleNotification = async (key, checked) => {
    const nextNotificationData = { ...notificationData, [key]: checked };
    setNotificationData(nextNotificationData);

    try {
      if (key === 'pushNotifications') {
        if (checked) await handleSubscribePush();
        else await handleUnsubscribePush();
      }
      await axios.put('/api/settings/notifications', nextNotificationData, getAuthConfig());
    } catch (err) {
      console.error('Toggle notification error', err);
      toast.error(err?.response?.data?.message || err.message || 'Failed to update notification setting');
      setNotificationData((prev) => ({ ...prev, [key]: !checked }));
    }
  };

  const handleSendTestPush = async () => {
    try {
      const resp = await axios.post('/api/notifications/send-test', {}, getAuthConfig());
      if (resp.data.success) toast.success('Test notification sent (attempted)');
      else toast.error(resp.data.message || 'Failed to send test');
    } catch (err) {
      console.error('Send test error', err);
      toast.error(err.response?.data?.message || 'Failed to send test');
    }
  };

  const handleSaveNotificationPreferences = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (notificationData.pushNotifications && !sub) await handleSubscribePush();
      if (!notificationData.pushNotifications && sub) await handleUnsubscribePush();
      await handleNotificationUpdate();
    } finally {
      setLoading(false);
    }
  };

  const handleSystemUpdate = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/api/settings/system', systemData, getAuthConfig());
      if (response.data.success) toast.success('System preferences updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update system preferences');
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    showPassword,
    setShowPassword,
    pushStatus,
    showBlockedModal,
    setShowBlockedModal,
    profileData,
    securityData,
    notificationData,
    systemData,
    updateProfileField,
    updateSecurityField,
    updateSystemField,
    handleProfileUpdate,
    handleSecurityUpdate,
    handleToggleNotification,
    handleSubscribePush,
    handleUnsubscribePush,
    handleSendTestPush,
    handleSaveNotificationPreferences,
    handleSystemUpdate
  };
};
