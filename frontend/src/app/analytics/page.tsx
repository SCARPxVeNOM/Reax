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
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Real-time Analytics</h1>
          <p className="text-gray-400">
            Monitor performance, track signals, and view live market data
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-6">
          {(['1H', '24H', '7D', '30D'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedTimeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-white">${(mockMetrics.totalVolume / 1000).toFixed(0)}K</p>
            <p className="text-xs text-green-400 mt-1">+12.5%</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.totalTrades.toLocaleString()}</p>
            <p className="text-xs text-green-400 mt-1">+8.3%</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Active Strategies</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.activeStrategies}</p>
            <p className="text-xs text-blue-400 mt-1">Live</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Avg Win Rate</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.avgWinRate}%</p>
            <p className="text-xs text-green-400 mt-1">+2.1%</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Total Return</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.totalReturn}%</p>
            <p className="text-xs text-green-400 mt-1">+5.2%</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">Sharpe Ratio</p>
            <p className="text-2xl font-bold text-white">{mockMetrics.sharpeRatio}</p>
            <p className="text-xs text-green-400 mt-1">Excellent</p>
          </div>
        </div>

        {/* Live Price Feeds */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Price Feeds
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {Array.from(priceFeeds.entries()).map(([symbol, feed]) => (
              <div key={symbol} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">{symbol}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(feed.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${feed.price.toFixed(2)}
                </div>
                {feed.change24h !== undefined && (
                  <div className={`text-sm ${feed.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {feed.change24h >= 0 ? '+' : ''}{feed.change24h.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}

            {priceFeeds.size === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-400">
                Connecting to price feeds...
              </div>
            )}
          </div>
        </div>

        {/* Strategy Events */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Recent Strategy Events</h2>

          <div className="space-y-3">
            {strategyEvents.length > 0 ? (
              strategyEvents.map((event, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        event.type === 'SIGNAL' ? 'bg-blue-900 text-blue-300' :
                        event.type === 'EXECUTION' ? 'bg-green-900 text-green-300' :
                        event.type === 'ERROR' ? 'bg-red-900 text-red-300' :
                        'bg-gray-700 text-gray-300'
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
              <div className="text-center py-8 text-gray-400">
                No recent events. Strategies will appear here when active.
              </div>
            )}
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Performance Overview</h2>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <p>Performance chart will be displayed here</p>
              <p className="text-sm mt-1">Integrate TradingView Lightweight Charts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
