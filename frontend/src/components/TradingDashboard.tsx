'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSignals, useStrategies, useOrders, useLinera } from '../lib/linera-hooks';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MetricCard } from './MetricCard';
import { ActivityLog } from './ActivityLog';
import { SignalFeed } from './SignalFeed';
import { StrategyList } from './StrategyList';
import { OrdersList } from './OrdersList';
import { PerformanceChart } from './PerformanceChart';
import { SignalsByTokenChart } from './SignalsByTokenChart';
import { ImportTweetsButton } from './ImportTweetsButton';
import { MonitoredUsers } from './MonitoredUsers';
import { DexIntegrations } from './DexIntegrations';

export function TradingDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { client, isConnected } = useLinera();
  const { signals, loading: signalsLoading, refetch: refetchSignals } = useSignals(50, 0);
  const { strategies, loading: strategiesLoading, refetch: refetchStrategies } = useStrategies(undefined, 50, 0);
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders(undefined, undefined, 50, 0);

  // Calculate metrics
  const metrics = useMemo(() => {
    const bullishSignals = signals.filter(s => s.sentiment === 'bullish').length;
    const activeStrategies = strategies.filter(s => s.active).length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const completedOrders = orders.filter(o => o.status === 'Filled' || o.status === 'Completed').length;
    
    // Calculate percentage changes (mock for now, can be enhanced with historical data)
    const signalChange = signals.length > 0 ? 12.5 : 0;
    const strategyChange = strategies.length > 0 ? 8.2 : 0;
    const orderChange = orders.length > 0 ? 15.7 : 0;

    return {
      totalSignals: signals.length,
      bullishSignals,
      activeStrategies,
      pendingOrders,
      completedOrders,
      totalOrders: orders.length,
      signalChange,
      strategyChange,
      orderChange,
    };
  }, [signals, strategies, orders]);

  // Generate activity logs from signals and orders
  const activityLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      type: 'signal' | 'order' | 'strategy' | 'system';
      message: string;
      user?: string;
      role?: string;
      timestamp: number;
      status?: 'success' | 'warning' | 'error';
    }> = [];

    // Add signal activities
    signals.slice(0, 5).forEach((signal) => {
      logs.push({
        id: `signal-${signal.id}`,
        type: 'signal',
        message: `New ${signal.sentiment} signal detected: ${signal.token} by @${signal.influencer}`,
        timestamp: signal.timestamp * 1000,
        status: signal.sentiment === 'bullish' ? 'success' : 'warning',
      });
    });

    // Add order activities
    orders.slice(0, 3).forEach((order) => {
      logs.push({
        id: `order-${order.id}`,
        type: 'order',
        message: `Order ${order.status}: ${order.order_type} ${order.token}`,
        timestamp: order.created_at * 1000,
        status: order.status === 'Filled' ? 'success' : 'warning',
      });
    });

    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [signals, orders]);

  const systemLogs = useMemo(() => {
    return [
      {
        id: 'sys-1',
        type: 'system' as const,
        message: 'Auto-order service enabled. Monitoring buy signals',
        user: 'System',
        timestamp: Date.now() - 10 * 60000,
        status: 'success' as const,
      },
      {
        id: 'sys-2',
        type: 'system' as const,
        message: 'Twitter ingestion service started. Monitoring @Crypto_Arki, @OverTradess, @Anubhav06_2004',
        user: 'System',
        timestamp: Date.now() - 25 * 60000,
        status: 'success' as const,
      },
      {
        id: 'sys-3',
        type: 'system' as const,
        message: 'Database connection established',
        user: 'System',
        timestamp: Date.now() - 60 * 60000,
        status: 'success' as const,
      },
    ];
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">ReaX Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Real-time trading signals on Linera blockchain. Monitor Twitter influencers and execute trades automatically.
                </p>
              </div>
              <ImportTweetsButton onImport={refetchSignals} />
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard
                title="Total Signals"
                value={metrics.totalSignals}
                change={metrics.signalChange}
                trend="up"
                icon="📡"
              />
              <MetricCard
                title="Bullish Signals"
                value={metrics.bullishSignals}
                change={metrics.signalChange}
                trend="up"
                icon="📈"
              />
              <MetricCard
                title="Active Strategies"
                value={metrics.activeStrategies}
                change={metrics.strategyChange}
                trend="up"
                icon="⚙️"
              />
              <MetricCard
                title="Pending Orders"
                value={metrics.pendingOrders}
                change={metrics.orderChange}
                trend="up"
                icon="⏳"
              />
              <MetricCard
                title="Completed Orders"
                value={metrics.completedOrders}
                change={metrics.orderChange}
                trend="up"
                icon="✅"
              />
              <MetricCard
                title="Total Orders"
                value={metrics.totalOrders}
                change={metrics.orderChange}
                trend="up"
                icon="📋"
              />
            </div>

            {/* DEX Integrations */}
            <DexIntegrations />

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Trading Performance</h3>
                  <select 
                    style={{ color: '#1f2937' }}
                    className="glass-input text-sm text-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option style={{ color: '#1f2937', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>Last 12 months</option>
                    <option style={{ color: '#1f2937', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>Last 6 months</option>
                    <option style={{ color: '#1f2937', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>Last 30 days</option>
                  </select>
                </div>
                <PerformanceChart orders={orders} />
              </div>

              {/* Signals by Token Chart */}
              <div className="glass-panel rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Signals by Token</h3>
                  <select 
                    style={{ color: '#1f2937' }}
                    className="glass-input text-sm text-gray-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option style={{ color: '#1f2937', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>This year</option>
                    <option style={{ color: '#1f2937', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>This month</option>
                    <option style={{ color: '#1f2937', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>This week</option>
                  </select>
                </div>
                <SignalsByTokenChart signals={signals} />
              </div>
            </div>

            {/* Activity Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityLog
                title="Signal Activity"
                items={activityLogs}
                onViewAll={() => setActiveSection('signals')}
              />
              <ActivityLog
                title="System History"
                items={systemLogs}
              />
            </div>

            {/* Recent Signals Feed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Trading Signals</h3>
                <button
                  onClick={refetchSignals}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
              {signalsLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading signals...</p>
                </div>
              ) : signals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No signals yet. Click "Import Recent Tweets" to fetch and analyze tweets.</p>
                </div>
              ) : (
                <SignalFeed
                  signals={signals}
                  loading={signalsLoading}
                  onRefresh={refetchSignals}
                />
              )}
            </div>
          </div>
        );
      case 'signals':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Trading Signals</h1>
              <p className="text-gray-600 mt-1">Real-time signals from monitored Twitter accounts</p>
            </div>
            <SignalFeed
              signals={signals}
              loading={signalsLoading}
              onRefresh={refetchSignals}
            />
          </div>
        );
      case 'strategies':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Trading Strategies</h1>
              <p className="text-gray-600 mt-1">Manage your automated trading strategies</p>
            </div>
            <StrategyList
              strategies={strategies}
              loading={strategiesLoading}
              onActivate={async (id) => client?.activateStrategy(id)}
              onDeactivate={async (id) => client?.deactivateStrategy(id)}
              onRefresh={refetchStrategies}
            />
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
              <p className="text-gray-600 mt-1">View and manage your trading orders</p>
            </div>
            <OrdersList
              orders={orders}
              loading={ordersLoading}
              onRefresh={refetchOrders}
            />
          </div>
        );
      case 'settings':
        return <MonitoredUsers />;
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700">Coming Soon</h2>
            <p className="text-gray-500 mt-2">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        {/* Header */}
        <Header isConnected={isConnected} />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

