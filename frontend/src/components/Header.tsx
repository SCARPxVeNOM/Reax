'use client';

import { useState } from 'react';

interface HeaderProps {
  isConnected: boolean;
  onSearch?: (query: string) => void;
}

export function Header({ isConnected, onSearch }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getUserInitials = () => {
    return 'TR';
  };

  const getUserName = () => {
    return 'Trader';
  };

  const getUserRole = () => {
    return 'Trader';
  };

  return (
    <div className="glass border-b border-white/20 px-6 py-4 flex items-center justify-between backdrop-blur-xl">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Dashboard</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700 font-medium">Trading</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            style={{ color: '#1f2937' }}
            className="glass-input pl-10 pr-4 py-2 text-gray-800 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <span className="text-xl">🔔</span>
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </button>

        {/* Theme Toggle */}
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <span className="text-xl">☀️</span>
        </button>

        {/* User Profile */}
        <div className="relative pl-4 border-l border-gray-200">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getUserInitials()}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-700">{getUserName()}</div>
              <div className="text-xs text-gray-500">{getUserRole()}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 glass-panel rounded-lg shadow-lg py-1 z-50">
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDropdown(false);
                }}
              >
                Profile Settings
              </a>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  setShowDropdown(false);
                }}
              >
                Preferences
              </a>
              <hr className="my-1" />
              <button
                onClick={() => setShowDropdown(false)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            New Strategy
          </button>
        </div>
      </div>
    </div>
  );
}

