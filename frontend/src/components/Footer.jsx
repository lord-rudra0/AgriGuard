import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-fuchsia-500 bg-clip-text text-transparent">
                AgriGuard
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Advanced agricultural monitoring system with real-time sensor data, 
              AI-powered insights, and community collaboration for modern farming.
            </p>
            <div className="flex space-x-3">
              <a 
                href="#" 
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/40 ring-1 ring-black/5 dark:ring-white/10 hover:brightness-110 hover:scale-[1.02] hover:shadow-sm transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/40 ring-1 ring-black/5 dark:ring-white/10 hover:brightness-110 hover:scale-[1.02] hover:shadow-sm transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/40 ring-1 ring-black/5 dark:ring-white/10 hover:brightness-110 hover:scale-[1.02] hover:shadow-sm transition-all duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <nav className="space-y-2">
              <Link 
                to="/dashboard" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Dashboard
              </Link>
              <Link 
                to="/analytics" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Analytics
              </Link>
              <Link 
                to="/chat" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Community Chat
              </Link>
              <Link 
                to="/alerts" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Alerts
              </Link>
            </nav>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Features
            </h3>
            <nav className="space-y-2">
              <Link 
                to="/learning" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Learning Resources
              </Link>
              <Link 
                to="/maintenance" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Maintenance Logs
              </Link>
              <Link 
                to="/community" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Community Forum
              </Link>
              <Link 
                to="/ai-predictions" 
                className="block px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                AI Predictions
              </Link>
            </nav>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 text-primary-600" />
                <span className="text-sm">support@agriguard.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                <Phone className="w-4 h-4 text-primary-600" />
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span className="text-sm">Kochi, Kerala, India</span>
              </div>
            </div>
            
            <div className="pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Newsletter
              </h4>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <button className="px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-primary-600 to-indigo-600 shadow-sm ring-1 ring-black/5 hover:brightness-110 hover:scale-[1.01] transition-all duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              © {currentYear} AgriGuard. All rights reserved. Built with ❤️ for sustainable farming.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link 
                to="/privacy" 
                className="px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Terms of Service
              </Link>
              <Link 
                to="/support" 
                className="px-2 py-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800/40 transition-all duration-200 ring-1 ring-transparent hover:ring-black/5 dark:hover:ring-white/10"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;