import { useState, useEffect } from 'react';
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
  Camera,
  History,
  MoreHorizontal,
  LayoutDashboard,
  Cpu,
  Workflow,
  Plus,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import CameraNavbar from '../components/CameraNavbar';
import TalkAgent from './TalkAgent';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { alerts, clearAlerts } = useSocket();
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);

  // cleanup preview URL
  useEffect(() => {
    return () => { if (scanPreview) URL.revokeObjectURL(scanPreview); };
  }, [scanPreview]);

  const handleHeaderScan = (file) => {
    if (!file) return;
    if (scanPreview) URL.revokeObjectURL(scanPreview);
    setScanPreview(URL.createObjectURL(file));
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Scan', href: '/scan', icon: Camera },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'History', href: '/history', icon: History },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Thresholds', href: '/thresholds', icon: Workflow },
    { name: 'Recipes', href: '/recipes', icon: Cpu },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Devices', href: '/devices', icon: Shield },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  // Primary mobile tabs (high frequency actions)
  const primaryMobile = ['Dashboard', 'Analytics', 'Scan', 'Chat', 'Settings'];
  const mobileNav = navigation.filter(n => primaryMobile.includes(n.name));

  // Desktop categories
  const coreDesktop = ['Dashboard', 'Analytics', 'Scan', 'Chat'];
  const desktopCore = navigation.filter(n => coreDesktop.includes(n.name));
  const desktopMore = navigation.filter(n => !coreDesktop.includes(n.name));

  return (
    <header className="fixed top-0 inset-x-0 z-[100] transition-all duration-500">
      <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-800 shadow-sm" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-18">

          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/dashboard" className="group flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent uppercase tracking-tight leading-none">
                  AgriGuard
                </span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Mycology OS</span>
              </div>
            </Link>
          </div>

          {/* Center Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-50/50 dark:bg-gray-900/40 p-1.5 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
            {desktopCore.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active
                      ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-500' : ''}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Workspace Overflow */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isMoreOpen ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                Workspace <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMoreOpen && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setIsMoreOpen(false)} />
                  <div className="absolute top-full right-0 mt-3 w-52 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 p-2 z-10 animate-fade-in-up">
                    <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation Tools</div>
                    {desktopMore.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${active
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>

          {/* Right Action Stack */}
          <div className="flex items-center gap-2 md:gap-3">

            {/* Real-time Agent */}
            <div className="hidden md:block">
              <TalkAgent />
            </div>

            {/* Notification Center */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsBellOpen(!isBellOpen)}
                  className={`relative p-2.5 rounded-xl border border-transparent transition-all ${isBellOpen ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 border-indigo-200/50' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Bell className="w-5 h-5" />
                  {alerts?.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                      {Math.min(alerts.length, 9)}
                    </span>
                  )}
                </button>

                {isBellOpen && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setIsBellOpen(false)} />
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden z-10 animate-fade-in-up">
                      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Active Alerts</span>
                        <div className="flex gap-2">
                          <button onClick={() => clearAlerts()} className="text-[10px] font-black text-red-500 hover:brightness-110 uppercase">Clear</button>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                        {alerts?.length > 0 ? alerts.slice(0, 5).map((a, idx) => (
                          <div key={idx} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{a.title}</h4>
                            <p className="text-[10px] font-medium text-gray-500 line-clamp-2 mt-0.5 tracking-tight">{a.message}</p>
                          </div>
                        )) : (
                          <div className="py-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Active Alerts</div>
                        )}
                      </div>
                      <Link to="/alerts" onClick={() => setIsBellOpen(false)} className="block p-3 text-center text-[10px] font-black uppercase text-emerald-500 border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-colors">View All Logs</Link>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Theme & User Profile */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/60 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
              </button>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-1" />

              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 p-0.5 shadow-sm group-hover:scale-105 transition-all">
                    <div className="w-full h-full rounded-[10px] bg-white dark:bg-gray-950 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                  </div>
                  <span className="hidden sm:block text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute top-full right-0 mt-4 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 p-2 z-10 animate-fade-in-up">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700 mb-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Operator</div>
                        <div className="text-xs font-black text-gray-900 dark:text-white truncate">{user.email}</div>
                      </div>
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <User className="w-4 h-4" /> Profile Control
                      </Link>
                      <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        <Settings className="w-4 h-4" /> System Settings
                      </Link>
                      <hr className="my-1 border-gray-100 dark:border-gray-700 mx-2" />
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      >
                        <LogOut className="w-4 h-4" /> Terminate Session
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Burger (Limited items) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-500"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Only for overflow items) */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-auto right-4 mt-2 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-gray-800 p-3 z-50 animate-fade-in-scale">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-4">Advanced Management</div>
          <div className="space-y-1">
            {desktopMore.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${isActive(item.href)
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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

      {/* Floating Bottom Hub (Mobile Primary Tabs) */}
      <nav className="md:hidden fixed bottom-6 inset-x-4 z-50">
        <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl px-2 py-1.5 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800/50 flex items-center justify-between gap-1">
          {mobileNav.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all ${active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.name}</span>
              </Link>
            );
          })}

          {/* Central AI Scout Pulse */}
          <div className="px-2">
            <Link to="/scan" className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center border-4 border-white dark:border-gray-900 group active:scale-90 transition-transform -translate-y-4">
              <Camera className="w-6 h-6 text-white" />
            </Link>
          </div>

          {mobileNav.slice(3).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex-1 flex flex-col items-center justify-center h-12 rounded-full transition-all ${active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''}`} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </header>
  );
};

export default Header;
