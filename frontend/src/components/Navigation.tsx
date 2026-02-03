'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, LineChart, Cpu, Users, BarChart3, Menu, X, Wallet } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { href: '/trading', label: 'Trading', icon: <LineChart size={18} /> },
    { href: '/strategies', label: 'Strategies', icon: <Cpu size={18} /> },
    { href: '/social', label: 'Social', icon: <Users size={18} /> },
    { href: '/microchains', label: 'Microchains', icon: <Wallet size={18} /> },
    { href: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 glass-header transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
                R
              </div>
              <div className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
                ReaX
              </div>
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-sm">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                Conway Testnet
              </div>

              {/* Wallet Button Placeholder - could be a component */}
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-400 hover:text-white">
                <Wallet size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">R</div>
              <span className="font-bold text-lg text-white">ReaX</span>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="pb-6 animate-in">
              <div className="flex flex-col gap-1 p-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                        ${isActive
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-20 max-md:h-16"></div>
    </>
  );
}
