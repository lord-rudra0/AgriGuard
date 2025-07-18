import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/features' },
    { name: 'Technology', path: '/technology' },
    { name: 'Benefits', path: '/benefits' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <header className="bg-black/80 backdrop-blur-xl shadow-2xl sticky top-0 z-40 border-b border-green-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 transform transition-all duration-1000 hover:scale-105">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl">
                <Leaf className="h-8 w-8 text-white animate-bounce" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent animate-pulse">
                AgroMesh
              </span>
              <div className="text-xs text-green-400/80 font-medium tracking-wider">SMART FARMING</div>
            </div>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item, index) => (
              <Link 
                key={item.name}
                to={item.path}
                className={`relative transition-all duration-500 hover:scale-110 group py-2 ${
                  location.pathname === item.path 
                    ? 'text-green-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300" />
                <div className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ${
                  location.pathname === item.path ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
          </nav>
          
          <button className="relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/50 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10 font-semibold flex items-center space-x-2">
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;