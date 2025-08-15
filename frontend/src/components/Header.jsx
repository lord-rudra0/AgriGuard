import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  User, 
  LogOut,
  Settings,
  Bell,
  Home,
  MessageSquare,
  BarChart3,
  Shield,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { alerts, clearAlerts } = useSocket();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Thresholds', href: '/thresholds', icon: BarChart3 },
    { name: 'Recipes', href: '/recipes', icon: BarChart3 },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-800/70 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
                AgriGuard
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 h-10 px-3 rounded-md text-sm transition-colors ring-1 ${
                    isActive(item.href)
                      ? 'text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-black/5'
                      : 'text-gray-700 dark:text-gray-300 bg-transparent ring-transparent hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 hover:ring-black/5 dark:hover:ring-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center">
            <div className="flex items-center gap-1 bg-white/70 dark:bg-gray-900/40 ring-1 ring-black/5 dark:ring-white/10 rounded-md p-1">
            {/* Notifications bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsBellOpen(!isBellOpen)}
                  className="relative h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {alerts?.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-red-500 rounded-full">
                      {Math.min(alerts.length, 9)}{alerts.length > 9 ? '+' : ''}
                    </span>
                  )}
                </button>
                {isBellOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-white">Notifications</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { clearAlerts(); setIsBellOpen(false); }}
                          className="text-xs px-2 py-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                          title="Clear all"
                        >
                          Clear
                        </button>
                        <Link to="/alerts" onClick={() => setIsBellOpen(false)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-auto divide-y divide-gray-200 dark:divide-gray-700">
                      {(alerts?.slice(0, 8) || []).map((a, idx) => (
                        <div key={idx} className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{a.title || 'Notification'}</div>
                          {a.message && (
                            <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{a.message}</div>
                          )}
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                          </div>
                        </div>
                      ))}
                      {(!alerts || alerts.length === 0) && (
                        <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 h-9 px-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user.name}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700/60 transition-all duration-200"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700/60 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden ml-2 h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors ring-1 ${
                    isActive(item.href)
                      ? 'text-white bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-black/5'
                      : 'text-gray-700 dark:text-gray-300 bg-transparent ring-transparent hover:bg-indigo-50/70 dark:hover:bg-gray-800/60 hover:ring-black/5 dark:hover:ring-white/10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;