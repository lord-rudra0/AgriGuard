import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '', // email, username, or phone
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.identifier, formData.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden flex items-center justify-center transition-colors duration-300 px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-pink-500/10 dark:bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-4xl w-full flex bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden min-h-[600px]">
        {/* Left Side: Login Form */}
        <div className="w-full lg:w-3/5 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform rotate-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              Sign In
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">
              Access your AgriGuard dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest text-[10px]">
                Email / Username / Phone
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest text-[10px]">
                  Password
                </label>
                <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 uppercase tracking-tighter">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-indigo-500/25'
                }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                'SIGN IN'
              )}
            </button>

            <div className="lg:hidden text-center text-sm font-medium pt-4">
              <span className="text-gray-500">New here? </span>
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Create Account</Link>
            </div>
          </form>
        </div>

        {/* Right Side: Greeting Panel */}
        <div className="hidden lg:flex w-2/5 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 items-center justify-center p-12 text-center text-white">
          {/* Decorative elements for the panel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full -ml-20 -mb-20"></div>

          <div className="relative z-10 flex flex-col items-center max-w-xs transition-all duration-500 transform hover:scale-105">
            <h3 className="text-4xl font-black mb-6 drop-shadow-lg leading-tight">Hello, Friend!</h3>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed mb-10 text-opacity-90">
              Enter your personal details and start your journey with us today.
            </p>
            <Link
              to="/register"
              className="group relative px-10 py-3.5 border-2 border-white/50 hover:border-white rounded-2xl text-sm font-black hover:bg-white hover:text-indigo-700 transition-all duration-300 shadow-lg active:scale-95"
            >
              SIGN UP
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-[inherit] transition-opacity"></div>
            </Link>
          </div>

          {/* The "Sliding" indicator / decoration */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -ml-[1px] h-[60%] w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;