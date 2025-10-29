'use client';

import { useState } from 'react';

interface Strategy {
  id: number;
  name: string;
  owner: string;
  strategy_type: any;
  active: boolean;
  created_at: number;
}

interface StrategyListProps {
  strategies: Strategy[];
  loading?: boolean;
  onActivate: (id: number) => Promise<void>;
  onDeactivate: (id: number) => Promise<void>;
  onRefresh?: () => void;
}

export function StrategyList({ strategies, loading = false, onActivate, onDeactivate, onRefresh }: StrategyListProps) {
  const [activatingIds, setActivatingIds] = useState<Set<number>>(new Set());

  const getStrategyType = (strategy: Strategy) => {
    if (strategy.strategy_type?.Form) return 'Form';
    if (strategy.strategy_type?.DSL) return 'DSL';
    if (typeof strategy.strategy_type === 'string') return 'DSL';
    return 'Unknown';
  };

  const handleToggle = async (strategy: Strategy) => {
    const id = strategy.id;
    setActivatingIds((prev) => new Set(prev).add(id));

    try {
      if (strategy.active) {
        await onDeactivate(id);
      } else {
        await onActivate(id);
      }
    } catch (error) {
      console.error('Error toggling strategy:', error);
      alert(`Failed to ${strategy.active ? 'deactivate' : 'activate'} strategy`);
    } finally {
      setActivatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Strategies</h2>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh strategies"
            >
              🔄 Refresh
            </button>
          )}
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading && strategies.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500">Loading strategies...</p>
          </div>
        ) : strategies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No strategies yet. Create one in the Strategy Builder!</p>
        ) : (
          strategies.map((strategy) => {
            const isActivating = activatingIds.has(strategy.id);
            return (
              <div
                key={strategy.id}
                className={`border rounded-lg p-4 transition-all ${
                  strategy.active
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:shadow-md'
                } ${isActivating ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                    <span className="text-xs text-gray-500">
                      {getStrategyType(strategy)} • Created{' '}
                      {new Date(strategy.created_at * 1000 || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={strategy.active}
                      onChange={() => handleToggle(strategy)}
                      disabled={isActivating}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                    {isActivating && (
                      <span className="ml-2 text-xs text-gray-500">Processing...</span>
                    )}
                  </label>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      strategy.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {strategy.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">Owner: {strategy.owner.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
