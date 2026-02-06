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
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Recipes from './pages/Recipes';
import Thresholds from './pages/Thresholds';
import Alerts from './pages/Alerts';
import UserProfile from './pages/UserProfile';
import Calendar from './pages/Calendar';
import Devices from './pages/Devices';

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

  const PublicNav = () => (
    <header className="container mx-auto px-4 py-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2" aria-label="AgriGuard Home">
        <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <span className="text-xl font-semibold text-gray-900 dark:text-white">AgriGuard</span>
      </Link>
      <nav className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <a href="/login" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800">Log in</a>
        <a href="/register" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm">Sign up</a>
      </nav>
    </header>
  );

  const PublicFooter = () => (
    <footer className="container mx-auto px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      © {new Date().getFullYear()} AgroNex. All rights reserved.
    </footer>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${isChat ? 'h-screen overflow-hidden' : ''}`}>
      {user ? <Header /> : <PublicNav />}
      {/* Spacer to prevent content from being hidden under the sticky header */}
      {user && <div className="h-16 md:h-16" aria-hidden="true" />}
      <main className={`flex-1 ${isChat ? 'overflow-hidden' : ''}`}>
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
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
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
