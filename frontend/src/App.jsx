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
    <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 md:gap-2 group" aria-label="AgriGuard Home">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            AgriGuard
          </span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 md:p-2.5 rounded-lg md:rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <div className="flex items-center gap-1.5 md:gap-2 pl-1.5 md:pl-2 border-l border-gray-200 dark:border-gray-800">
            <Link to="/login" className="px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-indigo-400 transition-colors">
              Log in
            </Link>
            <Link to="/register" className="px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl bg-primary-600 text-white text-[10px] md:text-sm font-semibold hover:bg-primary-700 shadow-md shadow-primary-600/20 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );

  const PublicFooter = () => (
    <footer className="container mx-auto px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      © {new Date().getFullYear()} AgriGuard Mycology. All rights reserved.
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
      {user ? (location.pathname === '/chat' ? null : <Footer />) : <PublicFooter />}
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
