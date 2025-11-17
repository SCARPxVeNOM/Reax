'use client';

import { useEffect, useState } from 'react';
import { useSignals, useStrategies, useOrders, useLinera } from '../lib/linera-hooks';
import { TradingDashboard } from './TradingDashboard';
import { VisitorDashboard } from './VisitorDashboard';

export function Dashboard() {
  const [showDemo, setShowDemo] = useState(false);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Use Linera hooks for real-time data (always call these, even in demo mode)
  const { client, isConnected, error: lineraError } = useLinera();
  const { signals, loading: signalsLoading, refetch: refetchSignals } = useSignals(50, 0);
  const { strategies, loading: strategiesLoading, refetch: refetchStrategies } = useStrategies(undefined, 50, 0);
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders(undefined, undefined, 50, 0);
  
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    if (lineraError) {
      setStatus('error');
    } else if (isConnected) {
      setStatus('connected');
    }
  }, [isConnected, lineraError]);

  // If demo mode is requested, show visitor dashboard (AFTER all hooks)
  if (showDemo) {
    return (
      <div>
        <div className="bg-white border-b shadow-sm p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">Demo Mode</h2>
            <button
              onClick={() => setShowDemo(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              ← Back to Live Dashboard
            </button>
          </div>
        </div>
        <VisitorDashboard />
      </div>
    );
  }

  const handleActivateStrategy = async (strategyId: number) => {
    if (!client) return;
    
    try {
      await client.activateStrategy(strategyId);
      // Refetch to get updated data
      refetchStrategies();
    } catch (error) {
      console.error('Error activating strategy:', error);
      alert('Failed to activate strategy. Please try again.');
    }
  };

  const handleDeactivateStrategy = async (strategyId: number) => {
    if (!client) return;
    
    try {
      await client.deactivateStrategy(strategyId);
      // Refetch to get updated data
      refetchStrategies();
    } catch (error) {
      console.error('Error deactivating strategy:', error);
      alert('Failed to deactivate strategy. Please try again.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-2">Connecting to Linera...</div>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl font-bold mb-2">Connection Error</div>
          <div className="text-gray-600 mb-4">Failed to connect to Linera network. Please check:</div>
          <ul className="text-left text-sm text-gray-500 space-y-1 mb-4">
            <li>• Linera network is running (linera net up)</li>
            <li>• Application ID is configured in .env.local</li>
            <li>• Network is accessible at http://localhost:8080</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <TradingDashboard />;
}
