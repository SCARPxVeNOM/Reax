'use client';

import { SignalFeed } from './SignalFeed';
import { StrategyList } from './StrategyList';
import { OrdersList } from './OrdersList';
import { PerformanceChart } from './PerformanceChart';

// Dummy Data for Demo
const dummySignals = [
  {
    id: 1,
    influencer: 'CryptoWhale2024',
    token: 'BTC/USDT',
    contract: 'BTC',
    sentiment: 'bullish',
    confidence: 0.92,
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    tweet_url: 'https://twitter.com/example/status/1'
  },
  {
    id: 2,
    influencer: 'DeFiAnalyst',
    token: 'ETH/USDT',
    contract: 'ETH',
    sentiment: 'bullish',
    confidence: 0.85,
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    tweet_url: 'https://twitter.com/example/status/2'
  },
  {
    id: 3,
    influencer: 'SolanaInsider',
    token: 'SOL/USDC',
    contract: 'SOL',
    sentiment: 'bullish',
    confidence: 0.88,
    timestamp: Math.floor(Date.now() / 1000) - 900,
    tweet_url: 'https://twitter.com/example/status/3'
  },
  {
    id: 4,
    influencer: 'TradingAlerts',
    token: 'AVAX/USDT',
    contract: 'AVAX',
    sentiment: 'bearish',
    confidence: 0.72,
    timestamp: Math.floor(Date.now() / 1000) - 300,
    tweet_url: 'https://twitter.com/example/status/4'
  },
  {
    id: 5,
    influencer: 'CryptoWhale2024',
    token: 'MATIC/USDT',
    contract: 'MATIC',
    sentiment: 'bullish',
    confidence: 0.79,
    timestamp: Math.floor(Date.now() / 1000) - 120,
    tweet_url: 'https://twitter.com/example/status/5'
  },
];

const dummyStrategies = [
  {
    id: 101,
    name: 'RSI Momentum Strategy',
    owner: 'demo_user_1',
    strategy_type: { DSL: 'if rsi(14) < 30 then buy(token="SOL", qty=0.5, sl=2%, tp=5%)' },
    active: true,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
  {
    id: 102,
    name: 'Golden Cross Strategy',
    owner: 'demo_user_2',
    strategy_type: {
      Form: {
        token_pair: 'ETH/USDT',
        buy_price: 2000,
        sell_target: 2200,
        trailing_stop_pct: 2.0,
        take_profit_pct: 5.0,
        max_loss_pct: 2.0,
      }
    },
    active: false,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 3,
  },
  {
    id: 103,
    name: 'Volume Breakout Strategy',
    owner: 'demo_user_1',
    strategy_type: { DSL: 'if volume > 1000000 and price_up > 5% then buy' },
    active: true,
    created_at: Math.floor(Date.now() / 1000) - 86400 * 7,
  },
];

const dummyOrders: Array<{
  id: number;
  strategy_id: number;
  signal_id: number;
  order_type: string;
  token: string;
  quantity: number;
  status: string;
  tx_hash?: string;
  fill_price?: number;
  created_at: number;
  filled_at?: number;
}> = [
    {
      id: 1001,
      strategy_id: 101,
      signal_id: 1,
      order_type: 'BUY',
      token: 'BTC',
      quantity: 0.01,
      status: 'Filled',
      tx_hash: '0xabc123def4567890...',
      fill_price: 38005.20,
      created_at: Math.floor(Date.now() / 1000) - 3600,
      filled_at: Math.floor(Date.now() / 1000) - 3595,
    },
    {
      id: 1002,
      strategy_id: 102,
      signal_id: 2,
      order_type: 'SELL',
      token: 'ETH',
      quantity: 0.5,
      status: 'Pending',
      created_at: Math.floor(Date.now() / 1000) - 1800,
    },
    {
      id: 1003,
      strategy_id: 103,
      signal_id: 3,
      order_type: 'BUY',
      token: 'SOL',
      quantity: 10.0,
      status: 'Submitted',
      tx_hash: '0xdef456abc123...',
      created_at: Math.floor(Date.now() / 1000) - 900,
    },
    {
      id: 1004,
      strategy_id: 101,
      signal_id: 4,
      order_type: 'BUY',
      token: 'AVAX',
      quantity: 5.0,
      status: 'Filled',
      tx_hash: '0x789abc123def...',
      fill_price: 45.30,
      created_at: Math.floor(Date.now() / 1000) - 600,
      filled_at: Math.floor(Date.now() / 1000) - 595,
    },
  ];

const dummyPerformanceData = [
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 14, pnl: 5.20 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 13, pnl: -2.10 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 12, pnl: 8.50 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 11, pnl: 1.00 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 10, pnl: -3.50 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 9, pnl: 12.00 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 8, pnl: 0.50 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 7, pnl: -1.80 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 6, pnl: 7.00 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 5, pnl: 2.50 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 4, pnl: -0.90 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 3, pnl: 4.10 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 2, pnl: 6.30 },
  { timestamp: Math.floor(Date.now() / 1000) - 86400 * 1, pnl: -0.20 },
  { timestamp: Math.floor(Date.now() / 1000), pnl: 9.80 },
];

export function VisitorDashboard() {
  const handleActivateDummy = async (id: number) => {
    alert(`Demo Mode: Strategy ${id} would be activated in a real implementation.\n\nThis is demonstration data only.`);
  };

  const handleDeactivateDummy = async (id: number) => {
    alert(`Demo Mode: Strategy ${id} would be deactivated in a real implementation.\n\nThis is demonstration data only.`);
  };

  const handleRefreshDummy = () => {
    alert('Demo Mode: Data would refresh from Linera blockchain.\n\nThis is demonstration data only.');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">✨ Demo Mode - Interactive Preview</h2>
              <p className="text-sm opacity-90">
                Explore the platform with sample data. All interactions are simulated for demonstration purposes.
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">ReaX Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time trading signals on Linera blockchain - Demo Version</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">Demo Mode Active</span>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Live Signal Feed */}
          <div className="col-span-4">
            <SignalFeed
              signals={dummySignals}
              loading={false}
              onRefresh={handleRefreshDummy}
            />
          </div>

          {/* Active Strategies */}
          <div className="col-span-4">
            <StrategyList
              strategies={dummyStrategies}
              loading={false}
              onActivate={handleActivateDummy}
              onDeactivate={handleDeactivateDummy}
              onRefresh={handleRefreshDummy}
            />
          </div>

          {/* Recent Orders */}
          <div className="col-span-4">
            <OrdersList
              orders={dummyOrders}
              loading={false}
              onRefresh={handleRefreshDummy}
            />
          </div>

          {/* Portfolio Performance */}
          <div className="col-span-12">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Portfolio Performance (Demo)</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">$150.75</p>
                  <p className="text-gray-500 mt-1">Total P&L</p>
                  <p className="text-xs text-green-600 mt-2">+12.5%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-800">47</p>
                  <p className="text-gray-500 mt-1">Total Trades</p>
                  <p className="text-xs text-blue-600 mt-2">This month</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">68.1%</p>
                  <p className="text-gray-500 mt-1">Win Rate</p>
                  <p className="text-xs text-green-700 mt-2">32 wins / 15 losses</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">$3.21</p>
                  <p className="text-gray-500 mt-1">Avg P&L per Trade</p>
                  <p className="text-xs text-purple-700 mt-2">Positive trend</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="col-span-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Last 20 Trades Visualization (Demo)</h2>
              <PerformanceChart data={dummyPerformanceData} />
            </div>
          </div>
        </div>

        {/* Demo Info Footer */}
        <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-bold text-yellow-900 mb-1">About This Demo</h3>
              <p className="text-sm text-yellow-800">
                This demo showcases the platform's features with simulated data. In the real implementation,
                all data comes from the Linera blockchain in real-time. Strategies can be created, activated,
                and orders are executed automatically based on AI-analyzed trading signals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

