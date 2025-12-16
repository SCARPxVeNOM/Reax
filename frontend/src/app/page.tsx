'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { wsClient } from '@/lib/websocket';

export default function Home() {
  const [stats, setStats] = useState({
    activeStrategies: 0,
    totalVolume: 0,
    dexIntegrations: 3,
    socialFollowers: 0,
  });

  useEffect(() => {
    // Connect WebSocket for real-time updates
    wsClient.connect();
  }, []);

  const features = [
    {
      title: 'Multi-DEX Trading',
      description: 'Compare and execute trades across Raydium, Jupiter, and Binance with intelligent routing',
      icon: '🔄',
      href: '/trading',
      color: 'from-blue-500 to-cyan-500',
      stats: `${stats.dexIntegrations} DEXes`,
    },
    {
      title: 'PineScript Strategies',
      description: 'Write and backtest trading strategies using PineScript v5 with full technical indicator support',
      icon: '📊',
      href: '/strategies?mode=pinescript',
      color: 'from-purple-500 to-pink-500',
      stats: 'v5 Support',
    },
    {
      title: 'Visual Strategy Builder',
      description: 'Create strategies with drag-and-drop blocks - no coding required',
      icon: '🎨',
      href: '/strategies?mode=visual',
      color: 'from-green-500 to-emerald-500',
      stats: 'No Code',
    },
    {
      title: 'Social Trading',
      description: 'Follow top traders and automatically replicate their strategies on Linera microchains',
      icon: '👥',
      href: '/social',
      color: 'from-orange-500 to-red-500',
      stats: `${stats.socialFollowers} Followers`,
    },
    {
      title: 'Linera Microchains',
      description: 'Deploy strategies on isolated microchains with guaranteed execution and state management',
      icon: '⛓️',
      href: '/microchains',
      color: 'from-indigo-500 to-purple-500',
      stats: 'Decentralized',
    },
    {
      title: 'Real-time Analytics',
      description: 'Monitor performance, track signals, and view live market data with WebSocket updates',
      icon: '📈',
      href: '/analytics',
      color: 'from-yellow-500 to-orange-500',
      stats: 'Live Data',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6">
              LineraTrade AI
            </h1>
            <p className="text-2xl text-gray-300 mb-4">
              Advanced Trading Platform on Linera Microchains
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
              Multi-DEX integration • PineScript strategies • Visual builder • Social trading • Real-time execution
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white">{stats.activeStrategies}</div>
                <div className="text-sm text-gray-400 mt-1">Active Strategies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white">${stats.totalVolume.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Total Volume</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white">{stats.dexIntegrations}</div>
                <div className="text-sm text-gray-400 mt-1">DEX Integrations</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="text-3xl font-bold text-white">{stats.socialFollowers}</div>
                <div className="text-sm text-gray-400 mt-1">Social Followers</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/trading"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Trading
              </Link>
              <Link
                href="/strategies"
                className="px-8 py-4 bg-white/10 backdrop-blur-lg text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Build Strategy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Platform Features
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/30 transition-all hover:transform hover:scale-105"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}></div>

              {/* Content */}
              <div className="relative">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{feature.stats}</span>
                  <span className="text-blue-400 group-hover:translate-x-2 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Built on Cutting-Edge Technology
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">⛓️ Linera Microchains</h3>
            <p className="text-gray-400">
              Deploy strategies on isolated microchains with guaranteed execution, state isolation, and automatic replication
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">🔄 Multi-DEX Routing</h3>
            <p className="text-gray-400">
              Intelligent routing across Raydium, Jupiter, and Binance with real-time quote comparison and best price execution
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">📊 PineScript v5</h3>
            <p className="text-gray-400">
              Full interpreter with technical indicators, backtesting engine, and real-time strategy execution
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-400">
            <p>LineraTrade AI - Advanced Trading Platform</p>
            <p className="text-sm mt-2">Powered by Linera Microchains • Built with Next.js & Rust</p>
          </div>
        </div>
      </div>
    </div>
  );
}
