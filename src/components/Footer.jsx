import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-20 relative overflow-hidden border-t border-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="animate-fade-in">
            <div className="flex items-center space-x-3 mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-2xl">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  AgroMesh
                </span>
                <div className="text-xs text-green-400/80 font-medium tracking-wider">SMART FARMING</div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Revolutionizing agriculture with intelligent technology, bringing the future of farming to every village worldwide.
            </p>
          </div>
          
          {/* Links */}
          {[
            {
              title: "Product",
              links: [
                { name: "Features", path: "/features" },
                { name: "Technology", path: "/technology" },
                { name: "Benefits", path: "/benefits" },
                { name: "Contact", path: "/contact" }
              ]
            },
            {
              title: "Support", 
              links: [
                { name: "Help Center", path: "#" },
                { name: "Documentation", path: "#" },
                { name: "Training", path: "#" },
                { name: "Community", path: "#" }
              ]
            },
            {
              title: "Company",
              links: [
                { name: "About Us", path: "#" },
                { name: "Blog", path: "#" },
                { name: "Careers", path: "#" },
                { name: "Contact", path: "/contact" }
              ]
            }
          ].map((section, index) => (
            <div key={section.title} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 200}ms` }}>
              <h4 className="text-xl font-bold mb-6 text-white">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path} 
                      className="text-gray-400 hover:text-green-400 transition-all duration-300 hover:translate-x-2 inline-block group"
                    >
                      <span className="relative">
                        {link.name}
                        <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-400 group-hover:w-full transition-all duration-300" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400 animate-fade-in">
            &copy; 2025 AgroMesh. All rights reserved. Empowering farmers with revolutionary smart technology.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </footer>
  );
};

export default Footer;