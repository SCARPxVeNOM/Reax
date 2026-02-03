'use client';

import { useState, useEffect } from 'react';
import { useLineraContext } from '@/components/LineraProvider';
import { microchainService } from '@/lib/microchain-service';

interface LeaderboardEntry {
  id: string;
  name: string;
  winRate: number;
  roi: number;
  trades: number;
  volume: string;
}

interface NetworkStats {
  totalMicrochains: number;
  totalStrategies: number;
  totalVolume: string;
  activeTrades: number;
  leaderboard: LeaderboardEntry[];
}

export default function AnalyticsPage() {
  const { isConnected } = useLineraContext();
  const [sortBy, setSortBy] = useState<'roi' | 'winRate' | 'trades'>('roi');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<NetworkStats | null>(null);

  // Fetch analytics from Linera
  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const data = await microchainService.getNetworkAnalytics();
        // Remove chain field from leaderboard entries
        const cleanedData = {
          ...data,
          leaderboard: data.leaderboard.map((entry: any) => ({
            id: entry.id,
            name: entry.name,
            winRate: entry.winRate,
            roi: entry.roi,
            trades: entry.trades,
            volume: entry.volume,
          })),
        };
        setAnalytics(cleanedData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-float">📊</div>
          <p className="text-muted">Loading analytics from {isConnected ? 'Linera' : 'cache'}...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container section text-center">
        <p className="text-muted">Failed to load analytics</p>
      </div>
    );
  }

  const sortedLeaderboard = [...analytics.leaderboard].sort((a, b) => b[sortBy] - a[sortBy]);

  const networkStats = [
    { label: 'Total Microchains', value: analytics.totalMicrochains.toLocaleString(), icon: '⛓️' },
    { label: 'Total Strategies', value: analytics.totalStrategies.toLocaleString(), icon: '🧠' },
    { label: 'Total Volume', value: analytics.totalVolume, icon: '💰' },
    { label: 'Active Traders', value: analytics.activeTrades.toLocaleString(), icon: '👥' },
  ];

  return (
    <div className="container section">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Network Analytics</h1>
        <p className="text-muted">Performance metrics across all Microchains</p>
        <div className="mt-4">
          <span className={`stat-badge ${isConnected ? 'success' : ''}`}>
            {isConnected ? '🔗 Live from Linera' : '📝 Cached Data'}
          </span>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {networkStats.map(stat => (
          <div key={stat.label} className="card p-6 text-center">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Microchain Leaderboard</h2>
          <div className="flex gap-2">
            {[
              { key: 'roi', label: 'ROI' },
              { key: 'winRate', label: 'Win Rate' },
              { key: 'trades', label: 'Trades' },
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key as 'roi' | 'winRate' | 'trades')}
                className={`px-4 py-2 rounded-lg text-sm transition ${sortBy === option.key
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted border-b border-gray-800">
                <th className="pb-4 font-medium">Rank</th>
                <th className="pb-4 font-medium">Microchain</th>
                <th className="pb-4 font-medium text-right">Win Rate</th>
                <th className="pb-4 font-medium text-right">ROI</th>
                <th className="pb-4 font-medium text-right">Trades</th>
                <th className="pb-4 font-medium text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeaderboard.map((mc, index) => (
                <tr
                  key={mc.id}
                  className="border-b border-gray-800/50 hover:bg-gray-900/50 transition"
                >
                  <td className="py-4">
                    <span className={`w-8 h-8 rounded-lg inline-flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                        index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-800 text-gray-500'
                      }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                      <span className="font-semibold">{mc.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className={mc.winRate >= 70 ? 'text-green-400' : 'text-white'}>
                      {mc.winRate}%
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-green-400 font-bold">+{mc.roi}%</span>
                  </td>
                  <td className="py-4 text-right font-medium">{mc.trades}</td>
                  <td className="py-4 text-right text-muted">{mc.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Infrastructure Info */}
      <div className="card p-6 mt-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-3xl">⚡</span>
          <h3 className="text-xl font-bold">Powered by Linera Microchains</h3>
        </div>
        <p className="text-muted max-w-lg mx-auto">
          All strategies execute on isolated Linera microchains for verifiable, zero-latency performance.
          Trading is routed through Solana DEXs (Jupiter & Raydium).
        </p>
      </div>
    </div>
  );
}
