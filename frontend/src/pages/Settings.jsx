import { User, Bell, Shield, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileTab from './settings/ProfileTab';
import SecurityTab from './settings/SecurityTab';
import NotificationsTab from './settings/NotificationsTab';
import SystemTab from './settings/SystemTab';
import SettingsShell from './settings/SettingsShell';
import { useSettingsPage } from './settings/useSettingsPage';

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'system', name: 'System', icon: Globe }
];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const state = useSettingsPage({ user, updateUser });

  const tabName = tabs.find((tab) => tab.id === state.activeTab)?.name || 'Settings';
  const activeTabContent = {
    profile: (
      <ProfileTab
        profileData={state.profileData}
        updateProfileField={state.updateProfileField}
        handleProfileUpdate={state.handleProfileUpdate}
        loading={state.loading}
      />
    ),
    security: (
      <SecurityTab
        securityData={state.securityData}
        updateSecurityField={state.updateSecurityField}
        handleSecurityUpdate={state.handleSecurityUpdate}
        loading={state.loading}
        showPassword={state.showPassword}
        setShowPassword={state.setShowPassword}
        pushStatus={state.pushStatus}
        showBlockedModal={state.showBlockedModal}
        setShowBlockedModal={state.setShowBlockedModal}
      />
    ),
    notifications: (
      <NotificationsTab
        notificationData={state.notificationData}
        handleToggleNotification={state.handleToggleNotification}
        handleSubscribePush={state.handleSubscribePush}
        handleUnsubscribePush={state.handleUnsubscribePush}
        handleSendTestPush={state.handleSendTestPush}
        handleSaveNotificationPreferences={state.handleSaveNotificationPreferences}
        loading={state.loading}
      />
    ),
    system: (
      <SystemTab
        systemData={state.systemData}
        updateSystemField={state.updateSystemField}
        theme={theme}
        toggleTheme={toggleTheme}
        handleSystemUpdate={state.handleSystemUpdate}
        loading={state.loading}
      />
    )
  }[state.activeTab];

  return (
    <SettingsShell
      tabs={tabs}
      activeTab={state.activeTab}
      setActiveTab={state.setActiveTab}
      user={user}
      tabName={tabName}
    >
      {activeTabContent}
    </SettingsShell>
  );
};

export default Settings;
