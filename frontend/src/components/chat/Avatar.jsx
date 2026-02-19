import React from 'react';

const initialsOf = (name = '') => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?';
};

const Avatar = ({ name, src, size = 40, online = false, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold select-none shadow-sm ring-2 ring-white dark:ring-white/10 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900 ${online ? 'bg-emerald-500' : 'bg-gray-400'}`}
          style={{ width: size * 0.25, height: size * 0.25 }} />
      )}
    </div>
  );
};

export default Avatar;
