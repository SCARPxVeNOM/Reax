'use client';

import { useState, useEffect } from 'react';
import { wsClient, PriceFeed, StrategyEvent } from '@/lib/websocket';

export default function AnalyticsPage() {
  const [priceFeeds, setPriceFeeds] = useState<Map<string, PriceFeed>>(new Map());
  const [strategyEvents, setStrategyEvents] = useState<StrategyEvent[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');

  useEffect(() => {
    wsClient.connect();

    // Subscribe to price feeds
    const symbols = ['SOL/USDC', 'BTC/USDT', 'ETH/USDC'];
    symbols.forEach(symbol => {
      wsClient.subscribeToPrice(symbol, (feed) => {
        setPriceFeeds(prev => new Map(prev).set(symbol, feed));
      });
    });

    return () => {
      symbols.forEach(symbol => {
        wsClient.unsubscribeFromPrice(symbol, () => {});
      });
    };
  }, []);

  const mockMetrics = {
    totalVolume: 1250000,
    totalTrades: 3456,
    activeStrategies: 12,
    avgWinRate: 68.5,
    totalReturn: 45.2,
    sharpeRatio: 2.1,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-in">
          <h1 className="text-5xl font-bold gradient-text mb-3">Real-time Analytics</h1>
          <p className="text-gray-400 text-lg">
            Monitor performance, track signals, and view live market data
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-6">
          {(['1H', '24H', '7D', '30D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                selectedTimeframe === tf
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass rounded-xl p-6 card-hover">
            <p className="text-sm text-gray-400 mb-1">💰 Total Volume</p>
            <p className="text-2xl font-bold text-white">${(mockMetrics.totalVolume / 1000).toFixed(0)}K</p>
            <p className="text-xs text-green-400 mt-1">+12.5%</p>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <p className="text-sm text-gray-400 mb-1">⚡ Total Trades</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.totalTrades.toLocaleString()}</p>
            <p className="text-xs text-green-400 mt-1">+8.3%</p>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <p className="text-sm text-gray-400 mb-1">📊 Active Strategies</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.activeStrategies}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-blue-400">Live</p>
            </div>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <p className="text-sm text-gray-400 mb-1">🎯 Avg Win Rate</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.avgWinRate}%</p>
            <p className="text-xs text-green-400 mt-1">+2.1%</p>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <p className="text-sm text-gray-400 mb-1">📈 Total Return</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.totalReturn}%</p>
            <p className="text-xs text-green-400 mt-1">+5.2%</p>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <p className="text-sm text-gray-400 mb-1">⭐ Sharpe Ratio</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.sharpeRatio}</p>
            <p className="text-xs text-green-400 mt-1">Excellent</p>
          </div>
        </div>

        {/* Live Price Feeds */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Live Price Feeds
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {Array.from(priceFeeds.entries()).map(([symbol, feed]) => (
              <div key={symbol} className="bg-white/5 rounded-xl p-5 border border-white/10 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-bold text-lg">{symbol}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(feed.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${feed.price.toFixed(2)}
                </div>
                {feed.change24h !== undefined && (
                  <div className={`badge ${feed.change24h >= 0 ? 'badge-success' : 'badge-danger'}`}>
                    {feed.change24h >= 0 ? '↗' : '↘'} {feed.change24h >= 0 ? '+' : ''}{feed.change24h.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}

            {priceFeeds.size === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🔌</div>
                <p>Connecting to price feeds...</p>
              </div>
            )}
          </div>
        </div>

        {/* Strategy Events */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Strategy Events</h2>

          <div className="space-y-3">
            {strategyEvents.length > 0 ? (
              strategyEvents.map((event, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-5 border border-white/10 flex items-center justify-between card-hover">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${
                        event.type === 'SIGNAL' ? 'badge-primary' :
                        event.type === 'EXECUTION' ? 'badge-success' :
                        event.type === 'ERROR' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {event.type}
                      </span>
                      <span className="text-white font-mono text-sm">{event.strategyId}</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {JSON.stringify(event.data)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📊</div>
                <p>No recent events. Strategies will appear here when active.</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="glass rounded-xl p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Performance Overview</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-4">📈</div>
              <p className="text-lg mb-2">Performance chart will be displayed here</p>
              <p className="text-sm text-gray-500">Integrate TradingView Lightweight Charts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
