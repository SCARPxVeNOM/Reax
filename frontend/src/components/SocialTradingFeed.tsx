'use client';

import { useState, useEffect } from 'react';
import { socialTradingApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

interface Strategy {
  id: string;
  name: string;
  owner: string;
  type: string;
  status: string;
  performance: {
    totalReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    followers: number;
  };
  deployedAt?: string;
}

export default function SocialTradingFeed() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filter, setFilter] = useState<'all' | 'top' | 'new'>('all');
  const [followedStrategies, setFollowedStrategies] = useState<Set<string>>(new Set());
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [allocationAmount, setAllocationAmount] = useState('1000');
  const [riskLimit, setRiskLimit] = useState('10');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadStrategies();
    
    // Connect WebSocket for real-time updates
    wsClient.connect();

    // Subscribe to strategy deployment events
    wsClient.on('strategy:deployed', (data: any) => {
      console.log('🚀 New strategy deployed:', data);
      setNotification(`New strategy "${data.strategy?.name}" deployed!`);
      setTimeout(() => setNotification(null), 5000);
      loadStrategies(); // Refresh list
    });

    // Subscribe to follow/unfollow events
    wsClient.on('strategy:followed', (data: any) => {
      console.log('👥 Strategy followed:', data);
      setStrategies(prev => prev.map(s => 
        s.id === data.strategyId 
          ? { ...s, performance: { ...s.performance, followers: s.performance.followers + 1 } }
          : s
      ));
    });

    wsClient.on('strategy:unfollowed', (data: any) => {
      console.log('👋 Strategy unfollowed:', data);
      setStrategies(prev => prev.map(s => 
        s.id === data.strategyId 
          ? { ...s, performance: { ...s.performance, followers: Math.max(0, s.performance.followers - 1) } }
          : s
      ));
    });

    // Subscribe to trade replication events
    const handleTradeReplication = (replication: any) => {
      console.log('🔄 Trade replicated:', replication);
      setNotification(`Trade replicated for strategy #${replication.strategyId}`);
      setTimeout(() => setNotification(null), 5000);
    };

    wsClient.subscribeToTradeReplications(handleTradeReplication);

    return () => {
      wsClient.off('strategy:deployed');
      wsClient.off('strategy:followed');
      wsClient.off('strategy:unfollowed');
      wsClient.unsubscribeFromTradeReplications(handleTradeReplication);
    };
  }, []);

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const data = await socialTradingApi.getMarketplaceStrategies();
      console.log('Loaded strategies from marketplace:', data);
      setStrategies(data);
    } catch (error) {
      console.error('Failed to load strategies:', error);
      // Fallback to mock data
      const mockStrategies: Strategy[] = [
        {
          id: '1',
          name: 'SMA Crossover Pro',
          owner: 'trader_alpha',
          type: 'PINESCRIPT',
          status: 'ACTIVE',
          performance: {
            totalReturn: 45.2,
            winRate: 68.5,
            sharpeRatio: 2.1,
            maxDrawdown: 12.3,
            totalTrades: 234,
            followers: 45,
          },
        },
        {
          id: '2',
          name: 'RSI Momentum',
          owner: 'trader_beta',
          type: 'PINESCRIPT',
          status: 'ACTIVE',
          performance: {
            totalReturn: 32.8,
            winRate: 62.1,
            sharpeRatio: 1.8,
            maxDrawdown: 15.7,
            totalTrades: 189,
            followers: 32,
          },
        },
        {
          id: '3',
          name: 'MACD Trend Follower',
          owner: 'trader_gamma',
          type: 'VISUAL',
          status: 'ACTIVE',
          performance: {
            totalReturn: 28.5,
            winRate: 59.3,
            sharpeRatio: 1.6,
            maxDrawdown: 18.2,
            totalTrades: 156,
            followers: 28,
          },
        },
      ];
      setStrategies(mockStrategies);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setShowFollowModal(true);
  };

  const confirmFollow = async () => {
    if (!selectedStrategy) return;

    try {
      await socialTradingApi.followStrategy({
        strategyId: selectedStrategy.id,
        userId: 'user_' + Date.now(), // Would come from auth
        allocationAmount: parseFloat(allocationAmount),
        riskLimitPercent: parseFloat(riskLimit),
      });

      setFollowedStrategies(prev => new Set(prev).add(selectedStrategy.id));
      setShowFollowModal(false);
      setNotification(`Successfully following "${selectedStrategy.name}"!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('Failed to follow strategy:', error);
      alert('Failed to follow strategy');
    }
  };

  const handleUnfollow = async (strategyId: string) => {
    try {
      await socialTradingApi.unfollowStrategy(strategyId, 'user_' + Date.now());
      setFollowedStrategies(prev => {
        const newSet = new Set(prev);
        newSet.delete(strategyId);
        return newSet;
      });
      setNotification('Successfully unfollowed strategy');
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      console.error('Failed to unfollow strategy:', error);
      alert('Failed to unfollow strategy');
    }
  };

  const filteredStrategies = strategies.filter(s => {
    if (filter === 'top') return s.performance.totalReturn > 30;
    if (filter === 'new') return new Date(s.deployedAt || 0).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    return true;
  }).sort((a, b) => {
    if (filter === 'top') return b.performance.totalReturn - a.performance.totalReturn;
    if (filter === 'new') return new Date(b.deployedAt || 0).getTime() - new Date(a.deployedAt || 0).getTime();
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Social Trading</h1>
        <p className="text-gray-400">
          Follow top traders and automatically replicate their strategies on Linera microchains
        </p>
      </div>

      {/* Real-time Notification */}
      {notification && (
        <div className="mb-6 bg-blue-900 border border-blue-700 rounded-lg p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <span className="text-white font-medium">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-blue-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Strategies
        </button>
        <button
          onClick={() => setFilter('top')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'top'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🏆 Top Performers
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            filter === 'new'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ✨ New Strategies
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading strategies from Linera microchains...</p>
        </div>
      )}

      {/* Strategy Grid */}
      {!loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{strategy.name}</h3>
                  <p className="text-sm text-gray-400">by {strategy.owner}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  strategy.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                }`}>
                  {strategy.status}
                </span>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total Return</span>
                  <span className={`text-sm font-semibold ${
                    strategy.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {strategy.performance.totalReturn >= 0 ? '+' : ''}{strategy.performance.totalReturn.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Win Rate</span>
                  <span className="text-sm font-semibold text-white">
                    {strategy.performance.winRate.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Sharpe Ratio</span>
                  <span className="text-sm font-semibold text-white">
                    {strategy.performance.sharpeRatio.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Max Drawdown</span>
                  <span className="text-sm font-semibold text-red-400">
                    {strategy.performance.maxDrawdown.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total Trades</span>
                  <span className="text-sm font-semibold text-white">
                    {strategy.performance.totalTrades}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Followers</span>
                  <span className="text-sm font-semibold text-blue-400">
                    {strategy.performance.followers}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {followedStrategies.has(strategy.id) ? (
                <button
                  onClick={() => handleUnfollow(strategy.id)}
                  className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(strategy)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Follow Strategy
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStrategies.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Strategies Found</h3>
          <p className="text-gray-400 mb-6">Try adjusting your filters or check back later</p>
        </div>
      )}

      {/* Follow Modal */}
      {showFollowModal && selectedStrategy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Follow Strategy</h3>
            <p className="text-gray-400 mb-6">
              Configure your allocation and risk limits for "{selectedStrategy.name}"
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Allocation Amount ($)
                </label>
                <input
                  type="number"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Risk Limit (%)
                </label>
                <input
                  type="number"
                  value={riskLimit}
                  onChange={(e) => setRiskLimit(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum percentage of allocation to risk per trade
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmFollow}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Confirm Follow
              </button>
              <button
                onClick={() => setShowFollowModal(false)}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
