import React from 'react';

const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?';
};

const Avatar = ({ name, src, size = 40, online = false, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500/80 to-primary-700/80 text-white font-semibold select-none shadow-sm ${className}`}
         style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span className="text-sm">{initialsOf(name)}</span>
      )}
      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
    </div>
  );
};

export default Avatar;
