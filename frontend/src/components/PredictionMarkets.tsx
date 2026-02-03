'use client';

import React, { useState, useEffect } from 'react';
import { predictionMarketApi, PredictionMarket } from '@/lib/api';

interface PredictionMarketsProps {
    userId: string;
}

export const PredictionMarkets: React.FC<PredictionMarketsProps> = ({ userId }) => {
    const [markets, setMarkets] = useState<PredictionMarket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMarket, setNewMarket] = useState({ question: '', description: '' });

    useEffect(() => {
        fetchMarkets();
    }, []);

    const fetchMarkets = async () => {
        setLoading(true);
        try {
            const data = await predictionMarketApi.list();
            setMarkets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch markets:', error);
            setMarkets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMarket = async () => {
        if (!newMarket.question.trim()) return;

        try {
            await predictionMarketApi.create({
                question: newMarket.question,
                description: newMarket.description,
                creator: userId,
            });
            setShowCreateModal(false);
            setNewMarket({ question: '', description: '' });
            fetchMarkets();
        } catch (error) {
            console.error('Failed to create market:', error);
        }
    };

    const handleResolve = async (marketId: number, outcome: boolean) => {
        try {
            await predictionMarketApi.resolve(marketId, outcome);
            fetchMarkets();
        } catch (error) {
            console.error('Failed to resolve market:', error);
        }
    };

    const getProbabilityColor = (prob: number) => {
        if (prob >= 0.7) return 'text-green-400';
        if (prob >= 0.4) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🔮</span> Prediction Markets
                </h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-medium text-white hover:opacity-90 transition-all"
                >
                    + New Market
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
                </div>
            ) : markets.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-4">📊</p>
                    <p>No prediction markets yet</p>
                    <p className="text-sm mt-2">Create one to get started</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {markets.map((market) => (
                        <div
                            key={market.id}
                            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-white font-medium">{market.question}</h4>
                                    {market.description && (
                                        <p className="text-gray-400 text-sm mt-1">{market.description}</p>
                                    )}
                                </div>
                                <div className="text-right ml-4">
                                    <div className={`text-2xl font-bold ${getProbabilityColor(market.probability || 0.5)}`}>
                                        {((market.probability || 0.5) * 100).toFixed(0)}%
                                    </div>
                                    <div className="text-xs text-gray-500">probability</div>
                                </div>
                            </div>

                            {/* Probability Bar */}
                            <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                                    style={{ width: `${(market.probability || 0.5) * 100}%` }}
                                />
                            </div>

                            {/* Actions */}
                            {market.outcome === undefined && market.creator === userId && (
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => handleResolve(market.id!, true)}
                                        className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
                                    >
                                        ✓ Resolve YES
                                    </button>
                                    <button
                                        onClick={() => handleResolve(market.id!, false)}
                                        className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                                    >
                                        ✗ Resolve NO
                                    </button>
                                </div>
                            )}

                            {market.outcome !== undefined && (
                                <div className={`mt-4 text-center py-2 rounded-lg ${market.outcome ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    Resolved: {market.outcome ? 'YES' : 'NO'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Create Prediction Market</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Question</label>
                                <input
                                    type="text"
                                    value={newMarket.question}
                                    onChange={(e) => setNewMarket(prev => ({ ...prev, question: e.target.value }))}
                                    placeholder="Will BTC reach $100k by end of year?"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Description (optional)</label>
                                <textarea
                                    value={newMarket.description}
                                    onChange={(e) => setNewMarket(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Additional context..."
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMarket}
                                disabled={!newMarket.question.trim()}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                Create Market
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionMarkets;
