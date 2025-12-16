'use client';

import { useState, useEffect } from 'react';
import { useLinera } from '@/lib/linera-hooks';

interface Microchain {
  id: string;
  owner: string;
  strategyCount: number;
  orderCount: number;
  followerCount: number;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  createdAt: Date;
}

export default function MicchainsPage() {
  const { chainId, applicationId } = useLinera();
  const [microchains, setMicrochains] = useState<Microchain[]>([]);
  const [selectedChain, setSelectedChain] = useState<Microchain | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Load microchains from Linera
    loadMicrochains();
  }, []);

  const loadMicrochains = async () => {
    // Mock data for now - will be replaced with actual Linera queries
    const mockChains: Microchain[] = [
      {
        id: 'chain_1',
        owner: 'trader_1',
        strategyCount: 3,
        orderCount: 45,
        followerCount: 12,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
      {
        id: 'chain_2',
        owner: 'trader_2',
        strategyCount: 1,
        orderCount: 23,
        followerCount: 8,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    ];
    setMicrochains(mockChains);
  };

  const createMicrochain = async () => {
    // TODO: Call Linera contract to create new microchain
    alert('Creating new microchain...');
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Linera Microchains</h1>
          <p className="text-gray-400">
            Manage your isolated microchains for strategy deployment and execution
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Linera Connection</h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Chain ID: <span className="text-blue-400 font-mono">{chainId || 'Not connected'}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Application: <span className="text-blue-400 font-mono">{applicationId || 'Not deployed'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${chainId ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {chainId ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            + Create Microchain
          </button>
          <button
            onClick={loadMicrochains}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Microchains Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {microchains.map((chain) => (
            <div
              key={chain.id}
              onClick={() => setSelectedChain(chain)}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Microchain</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  chain.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                }`}>
                  {chain.status}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Chain ID</p>
                  <p className="text-sm text-white font-mono truncate">{chain.id}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Strategies</p>
                    <p className="text-lg font-bold text-white">{chain.strategyCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Orders</p>
                    <p className="text-lg font-bold text-white">{chain.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Followers</p>
                    <p className="text-lg font-bold text-white">{chain.followerCount}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Owner</p>
                  <p className="text-sm text-white font-mono truncate">{chain.owner}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {microchains.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⛓️</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Microchains Yet</h3>
            <p className="text-gray-400 mb-6">Create your first microchain to deploy strategies</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Create Microchain
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4">Create Microchain</h3>
              <p className="text-gray-400 mb-6">
                Deploy a new isolated microchain for your trading strategies
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Microchain Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder="My Trading Chain"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Initial Capital (optional)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createMicrochain}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedChain && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full border border-gray-800 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Microchain Details</h3>
                <button
                  onClick={() => setSelectedChain(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Chain ID</h4>
                  <p className="text-white font-mono bg-gray-800 p-3 rounded">{selectedChain.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Status</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedChain.status === 'ACTIVE' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {selectedChain.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Created</h4>
                    <p className="text-white">{selectedChain.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-4 rounded">
                      <p className="text-2xl font-bold text-white">{selectedChain.strategyCount}</p>
                      <p className="text-sm text-gray-400">Strategies</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded">
                      <p className="text-2xl font-bold text-white">{selectedChain.orderCount}</p>
                      <p className="text-sm text-gray-400">Orders</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded">
                      <p className="text-2xl font-bold text-white">{selectedChain.followerCount}</p>
                      <p className="text-sm text-gray-400">Followers</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Actions</h4>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                      Deploy Strategy
                    </button>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors">
                      View Orders
                    </button>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors">
                      Manage Followers
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
