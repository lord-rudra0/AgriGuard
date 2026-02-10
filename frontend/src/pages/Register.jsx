import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Mail, Lock, User, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    farmName: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData);
      if (result.success) {
        toast.success('Registration successful!');
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

      <div className="relative max-w-5xl w-full flex bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden min-h-[650px]">

        {/* Left Side: Greeting Panel */}
        <div className="hidden lg:flex w-[35%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 items-center justify-center p-10 text-center text-white">
          {/* Decorative elements for the panel */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -ml-20 -mt-20"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 blur-3xl rounded-full -mr-20 -mb-20"></div>

          <div className="relative z-10 flex flex-col items-center max-w-xs transition-all duration-500 transform hover:scale-105">
            <h3 className="text-4xl font-black mb-6 drop-shadow-lg leading-tight text-white">Welcome Back!</h3>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed mb-10 text-opacity-90">
              To keep connected with us please login with your personal info
            </p>
            <Link
              to="/login"
              className="group relative px-10 py-3.5 border-2 border-white/50 hover:border-white rounded-2xl text-sm font-black hover:bg-white hover:text-indigo-700 transition-all duration-300 shadow-lg active:scale-95"
            >
              SIGN IN
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-[inherit] transition-opacity"></div>
            </Link>
          </div>

          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 -mr-[1px] h-[60%] w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full lg:w-[65%] p-8 md:p-10 flex flex-col justify-center max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="mb-6 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 transform rotate-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              Create Account
            </h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400 font-medium text-sm">
              Start your journey with AgriGuard today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="johndoe123"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Phone
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              {/* Farm Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Farm Name
                </label>
                <input
                  name="farmName"
                  type="text"
                  required
                  value={formData.farmName}
                  onChange={handleChange}
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Green Valley Farms"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Location
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-11 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">
                  Confirm
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-11 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start py-1">
              <div className="flex items-center h-5">
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded bg-gray-50 dark:bg-gray-800 cursor-pointer"
                />
              </div>
              <div className="ml-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                I agree to the <Link to="/terms" className="text-indigo-600 hover:underline">Terms</Link> and <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-indigo-500/25'
                }`}
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>

            <div className="lg:hidden text-center text-sm font-medium">
              <span className="text-gray-500">Already member? </span>
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Sign In</Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;