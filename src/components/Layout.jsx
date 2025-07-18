import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Animated Cursor Follower */}
      <div 
        className="fixed w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full pointer-events-none z-50 mix-blend-difference transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: `scale(${mousePosition.x > 0 ? 1 : 0})`,
        }}
      />

      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Gradient Orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-500/30 via-emerald-400/20 to-teal-500/30 rounded-full blur-3xl animate-pulse" 
             style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/30 via-violet-400/20 to-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000"
             style={{ transform: `translateY(${-scrollY * 0.15}px)` }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 via-cyan-400/10 to-green-500/20 rounded-full blur-3xl animate-pulse delay-2000"
             style={{ transform: `translate(-50%, -50%) rotate(${scrollY * 0.1}deg)` }} />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10"
             style={{
               backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34, 197, 94, 0.3) 1px, transparent 0)`,
               backgroundSize: '50px 50px',
               transform: `translateY(${scrollY * 0.05}px)`,
             }} />
      </div>

      <Header />
      <main className="relative z-10">
        {children}
      </main>
      <Footer />

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #047857);
        }
      `}</style>
    </div>
  );
};

export default Layout;