import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Sun, Moon } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ScanProvider } from './context/ScanContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import Scan from './pages/Scan';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Recipes from './pages/Recipes';
import Thresholds from './pages/Thresholds';
import Alerts from './pages/Alerts';
import UserProfile from './pages/UserProfile';
import Calendar from './pages/Calendar';
import Devices from './pages/Devices';
import History from './pages/History';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

// App Layout Component
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isChat = location.pathname.startsWith('/chat');
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const PublicNav = () => (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-800 shadow-sm" />
      <div className="relative container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" aria-label="AgriGuard Home">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent uppercase tracking-tight leading-none">
              AgriGuard
            </span>
            <span className="hidden md:block text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">Mycology Platform</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-500 hover:text-emerald-500 hover:bg-white dark:hover:bg-gray-800 transition-all active:scale-95 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100 dark:border-gray-800">
            <Link to="/login" className="px-4 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-colors">
              Session
            </Link>
            <Link to="/register" className="px-5 md:px-7 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] md:text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
              Initialize
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );

  const PublicFooter = () => (
    <footer className="container mx-auto px-4 py-12 text-center">
      <div className="flex items-center justify-center gap-3 mb-4 opacity-50">
        <Shield className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Advanced OS Deployment</span>
      </div>
      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        © {new Date().getFullYear()} AgriGuard Mycology. Decentralized Intelligence for Modern Agriculture.
      </p>
    </footer>
  );

  return (
    <div className={`flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${(isChat || isAuthPage) ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {user ? <Header /> : <PublicNav />}
      {/* Spacer to prevent content from being hidden under the sticky header */}
      {user && <div className="h-16 md:h-16" aria-hidden="true" />}
      <main className={`flex-1 flex flex-col ${(isChat || isAuthPage) ? 'h-full overflow-hidden' : ''}`}>
        {children}
      </main>
      {/* Floating ChatBot only for authenticated users and not on Chat page */}
      {user && !isChat && <ChatBot />}
      {user ? (location.pathname === '/chat' ? null : <Footer />) : (!isAuthPage && <PublicFooter />)}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScanProvider>
            <SocketProvider>
              <AppLayout>
                <Routes>
                  {/* Public routes */}
                  <Route
                    path="/"
                    element={
                      <PublicRoute>
                        <Landing />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Auth initialMode="login" />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Auth initialMode="register" />
                      </PublicRoute>
                    }
                  />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Placeholder routes for future pages */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Analytics />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scan"
                    element={
                      <ProtectedRoute>
                        <Scan />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recipes"
                    element={
                      <ProtectedRoute>
                        <Recipes />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/alerts"
                    element={
                      <ProtectedRoute>
                        <Alerts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/thresholds"
                    element={
                      <ProtectedRoute>
                        <Thresholds />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <Calendar />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/devices"
                    element={
                      <ProtectedRoute>
                        <Devices />
                      </ProtectedRoute>
                    }
                  />

                  {/* Alias: Profile maps to Settings */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    }
                  />

                  {/* Root handled above as Landing (public) */}

                  {/* 404 fallback */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            404
                          </h1>
                          <p className="text-gray-600 dark:text-gray-300 mb-8">
                            Page not found
                          </p>
                          <a href="/" className="btn-primary">Go Home</a>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </AppLayout>
            </SocketProvider>
          </ScanProvider>
        </Router>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
