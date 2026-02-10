import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth = ({ initialMode = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Integrated Form State
    const [formData, setFormData] = useState({
        // Login fields
        identifier: '',
        // Register fields
        name: '',
        username: '',
        email: '',
        phone: '',
        farmName: '',
        location: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(formData.identifier, formData.password);
            if (result.success) {
                toast.success('Welcome back!');
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

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        setLoading(true);
        try {
            const { confirmPassword, identifier, ...registerData } = formData;
            const result = await register(registerData);
            if (result.success) {
                toast.success('Account created successfully!');
                navigate('/dashboard');
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // Reset passwords for security when switching
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    };

    return (
        <div className="relative h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden flex items-center justify-center transition-colors duration-300 px-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/10 dark:bg-emerald-600/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-[10%] left-[20%] w-[20%] h-[20%] bg-teal-500/10 dark:bg-teal-500/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative max-w-5xl w-full bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden min-h-0 md:min-h-[650px] flex flex-col md:flex-row h-[95vh] md:h-auto max-h-[95vh] md:max-h-[90vh]">

                {/* Animated Background Overlay (The Sliding Part) */}
                <div
                    className={`absolute top-0 bottom-0 w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 z-20 transition-all duration-700 ease-in-out hidden lg:flex items-center justify-center px-12 text-center text-white
            ${isLogin ? 'left-1/2 rounded-l-[10rem]' : 'left-0 rounded-r-[10rem]'}
          `}
                >
                    {/* Inner Content for Sliding Panel */}
                    <div className="relative z-10 flex flex-col items-center max-w-xs animate-fade-in">
                        <h3 className="text-4xl font-black mb-6 drop-shadow-lg leading-tight uppercase tracking-tight">
                            {isLogin ? 'Hello, Friend!' : 'Welcome Back!'}
                        </h3>
                        <p className="text-emerald-50 text-lg font-medium leading-relaxed mb-10 text-opacity-90">
                            {isLogin
                                ? 'Enter your personal details and start your journey with AgriGuard today.'
                                : 'To keep connected with us please login with your personal info.'}
                        </p>
                        <button
                            onClick={toggleMode}
                            className="group relative px-10 py-3.5 border-2 border-white/50 hover:border-white rounded-2xl text-sm font-black hover:bg-white hover:text-emerald-700 transition-all duration-300 shadow-lg active:scale-95 uppercase tracking-widest"
                        >
                            {isLogin ? 'SIGN UP' : 'SIGN IN'}
                        </button>
                    </div>

                    {/* Decorative shapes for the panel */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 blur-3xl rounded-full -ml-20 -mb-20"></div>
                </div>

                {/* Form Container: Left Side (Login) */}
                <div className={`w-full lg:w-1/2 p-6 md:p-12 flex flex-col justify-center transition-all duration-700 ease-in-out z-10
          ${isLogin
                        ? 'opacity-100 translate-x-0 relative'
                        : 'opacity-0 -translate-x-full absolute pointer-events-none'
                    } lg:relative lg:translate-x-0`}>
                    <div className="mb-6 md:mb-10 text-center lg:text-left transition-all duration-500 delay-100">
                        <div className="flex items-center justify-center lg:justify-start mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transform rotate-3">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                            Sign In
                        </h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium truncate">
                            Access your AgriGuard dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 transition-all duration-500 delay-200">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-widest">
                                Email / Username / Phone
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    name="identifier"
                                    type="text"
                                    required
                                    value={formData.identifier}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 ml-1">
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                                    Password
                                </label>
                                <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 uppercase tracking-tighter">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input id="remember" type="checkbox" className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer" />
                            <label htmlFor="remember" className="ml-2 block text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer">Remember this device</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25'
                                }`}
                        >
                            {loading ? 'LOGGING IN...' : 'SIGN IN'}
                        </button>
                        <div className="lg:hidden text-center text-sm font-bold pt-4">
                            <span className="text-gray-500">NEW HERE? </span>
                            <button type="button" onClick={toggleMode} className="text-emerald-600 dark:text-emerald-400 hover:underline">CREATE ACCOUNT</button>
                        </div>
                    </form>
                </div>

                {/* Form Container: Right Side (Register) */}
                <div className={`w-full lg:w-1/2 p-5 md:p-10 flex flex-col justify-center transition-all duration-700 ease-in-out z-10
          ${!isLogin
                        ? 'opacity-100 translate-x-0 relative'
                        : 'opacity-0 translate-x-full absolute pointer-events-none'
                    } lg:relative lg:translate-x-0`}>
                    <div className="mb-4 md:mb-6 text-center lg:text-left transition-all duration-500 delay-100">
                        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                            Create Account
                        </h2>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3 md:space-y-4 transition-all duration-500 delay-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {/* Fields copied exactly as original but with emerald colors */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center bg-transparent"><User className="h-4 w-4 text-gray-400" /></div>
                                    <input name="name" required value={formData.name} onChange={handleChange} className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="John Doe" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><User className="h-4 w-4 text-gray-400" /></div>
                                    <input name="username" required value={formData.username} onChange={handleChange} className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="johndoe123" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Mail className="h-4 w-4 text-gray-400" /></div>
                                    <input name="email" type="email" value={formData.email} onChange={handleChange} className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="john@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Phone</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Phone className="h-4 w-4 text-gray-400" /></div>
                                    <input name="phone" required value={formData.phone} onChange={handleChange} className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="+1 234 567 890" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Farm Name</label>
                                <input name="farmName" required value={formData.farmName} onChange={handleChange} className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Green Valley Farms" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Location</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><MapPin className="h-4 w-4 text-gray-400" /></div>
                                    <input name="location" required value={formData.location} onChange={handleChange} className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="City, State" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="h-4 w-4 text-gray-400" /></div>
                                    <input name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} className="block w-full pl-11 pr-11 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center">{showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1.5 ml-1 uppercase tracking-widest">Confirm</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><Lock className="h-4 w-4 text-gray-400" /></div>
                                    <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} className="block w-full pl-11 pr-11 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white/50 dark:bg-gray-800/50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center">{showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}</button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/25'
                                }`}
                        >
                            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                        </button>
                        <div className="lg:hidden text-center text-sm font-bold pt-4">
                            <span className="text-gray-500">ALREADY MEMBER? </span>
                            <button type="button" onClick={toggleMode} className="text-emerald-600 dark:text-emerald-400 hover:underline uppercase">SIGN IN</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Auth;
