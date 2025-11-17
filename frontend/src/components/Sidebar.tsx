'use client';

import { useState } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      section: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      badge: null,
    },
    {
      section: 'signals',
      label: 'Signals',
      icon: '📡',
      badge: null,
    },
    {
      section: 'strategies',
      label: 'Strategies',
      icon: '⚙️',
      badge: null,
    },
    {
      section: 'orders',
      label: 'Orders',
      icon: '📋',
      badge: null,
    },
    {
      section: 'analytics',
      label: 'Analytics',
      icon: '📈',
      badge: null,
    },
    {
      section: 'backtesting',
      label: 'Backtesting',
      icon: '🧪',
      badge: null,
    },
    {
      section: 'settings',
      label: 'Settings',
      icon: '⚙️',
      badge: null,
    },
  ];

  return (
    <div className={`glass-panel text-white h-screen fixed left-0 top-0 z-50 transition-all duration-300 backdrop-blur-xl ${collapsed ? 'w-16' : 'w-64'}`} style={{ background: 'rgba(31, 41, 55, 0.4)' }}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold">ReaX</h1>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            {collapsed ? '☰' : '✕'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.section}
            onClick={() => onSectionChange(item.section)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeSection === item.section
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <button
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors ${
            activeSection === 'help' ? 'bg-gray-700' : ''
          }`}
          onClick={() => onSectionChange('help')}
        >
          <span>❓</span>
          {!collapsed && <span>Help</span>}
        </button>
      </div>
    </div>
  );
}

