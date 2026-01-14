'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { wsClient } from '@/lib/websocket';

export default function Home() {
  const [stats, setStats] = useState({
    activeStrategies: 342,
    totalVolume: 12500000,
    dexIntegrations: 3,
    socialFollowers: 1247,
    successRate: 73.2,
    totalTrades: 15420,
  });

  const [livePrice, setLivePrice] = useState({ symbol: 'BTC/USDT', price: 94935.50, change: 2.5 });
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  useEffect(() => {
    // Connect WebSocket for real-time updates
    wsClient.connect();

    // Simulate live price updates
    const priceInterval = setInterval(() => {
      setLivePrice(prev => ({
        ...prev,
        price: prev.price + (Math.random() - 0.5) * 100,
        change: prev.change + (Math.random() - 0.5) * 0.5,
      }));
    }, 3000);

    // Simulate recent trades
    setRecentTrades([
      { id: 1, strategy: 'Momentum Master', profit: '+$1,250', time: '2m ago', status: 'success' },
      { id: 2, strategy: 'Swing Trader Pro', profit: '+$890', time: '5m ago', status: 'success' },
      { id: 3, strategy: 'Scalping Bot', profit: '+$450', time: '8m ago', status: 'success' },
    ]);

    return () => clearInterval(priceInterval);
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center animate-slide-in">
            {/* Live Price Ticker */}
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-lg rounded-full px-6 py-3 mb-8 border border-white/10">
              <span className="text-sm text-gray-400">Live</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold">{livePrice.symbol}</span>
              <span className="text-xl font-bold">${livePrice.price.toFixed(2)}</span>
              <span className={`text-sm ${livePrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {livePrice.change >= 0 ? '+' : ''}{livePrice.change.toFixed(2)}%
              </span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="gradient-text">LineraTrade AI</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-4">
              Advanced Social Trading Platform
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
              Multi-DEX integration • AI-powered strategies • Social trading • Real-time execution on Linera Blockchain
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-12">
              <StatCard title="Strategies" value={stats.activeStrategies} icon="📊" />
              <StatCard title="Volume" value={`$${(stats.totalVolume / 1000000).toFixed(1)}M`} icon="💰" />
              <StatCard title="DEXes" value={stats.dexIntegrations} icon="🔄" />
              <StatCard title="Traders" value={stats.socialFollowers} icon="👥" />
              <StatCard title="Success" value={`${stats.successRate}%`} icon="🎯" />
              <StatCard title="Trades" value={stats.totalTrades} icon="⚡" />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/trading" className="btn-primary text-lg px-8 py-4">
                🚀 Start Trading
              </Link>
              <Link href="/strategies" className="btn-secondary text-lg px-8 py-4">
                🎨 Build Strategy
              </Link>
              <Link href="/social" className="btn-secondary text-lg px-8 py-4">
                👥 Social Trading
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades Ticker */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="animate-pulse">🔥</span> Recent Trades
            </h3>
            <Link href="/analytics" className="text-blue-400 hover:text-blue-300 text-sm">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{trade.strategy}</span>
                  <span className="badge badge-success">{trade.profit}</span>
                </div>
                <div className="text-xs text-gray-500">{trade.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
          <span className="gradient-text">Platform Features</span>
        </h2>
        <p className="text-center text-gray-400 mb-12 text-lg">
          Everything you need for successful trading
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group relative glass rounded-2xl p-8 card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>

              {/* Content */}
              <div className="relative">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-4 text-sm">
                  {feature.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="badge badge-primary">{feature.stats}</span>
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
        <h2 className="text-4xl font-bold text-center mb-12">
          Built on <span className="gradient-text">Cutting-Edge Technology</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <TechCard
            icon="⛓️"
            title="Linera Microchains"
            description="Deploy strategies on isolated microchains with guaranteed execution, state isolation, and automatic replication"
            features={['Isolated Execution', 'State Management', 'Auto Replication']}
          />
          <TechCard
            icon="🔄"
            title="Multi-DEX Routing"
            description="Intelligent routing across Raydium, Jupiter, and Binance with real-time quote comparison"
            features={['Best Price', 'Smart Routing', 'Low Latency']}
          />
          <TechCard
            icon="📊"
            title="PineScript v5"
            description="Full interpreter with technical indicators, backtesting engine, and real-time execution"
            features={['100+ Indicators', 'Backtesting', 'Live Trading']}
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="glass rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Trading?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of traders using LineraTrade AI
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/trading" className="btn-primary text-lg px-10 py-4">
              Get Started Now
            </Link>
            <Link href="/analytics" className="btn-secondary text-lg px-10 py-4">
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-400">
            <p className="font-semibold text-white mb-2">LineraTrade AI</p>
            <p className="text-sm">Advanced Social Trading Platform on Linera Blockchain</p>
            <p className="text-xs mt-4">Powered by Linera Microchains • Built with Next.js & Rust</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="glass rounded-xl p-4 text-center card-hover">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-400">{title}</div>
    </div>
  );
}

function TechCard({ icon, title, description, features }: {
  icon: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="glass rounded-xl p-8 card-hover">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-gray-400 mb-6 text-sm">{description}</p>
      <div className="space-y-2">
        {features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            <span className="text-gray-300">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
