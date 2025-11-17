'use client';

import { useState } from 'react';

export interface SuggestedTrade {
  id: string;
  signalId: number;
  token: string;
  contract: string;
  entry: number;
  size: number;
  stopLoss: number;
  takeProfit: number;
  route: {
    type: 'Jupiter' | 'Raydium' | 'Serum' | 'CEX';
    estimatedGas: number;
    estimatedFee: number;
  };
  confidence: number;
  expectedSlippage: number;
  expectedPnL: number;
  rationale: string;
  createdAt: number;
}

interface SuggestionCardProps {
  suggestion: SuggestedTrade;
  signal?: {
    influencer: string;
    token: string;
    tweetUrl: string;
  };
  onExecute?: (suggestionId: string, paperTrade: boolean) => Promise<void>;
  onEdit?: (suggestion: SuggestedTrade) => void;
  userWallet?: string;
}

export function SuggestionCard({
  suggestion,
  signal,
  onExecute,
  onEdit,
  userWallet,
}: SuggestionCardProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [executionMode, setExecutionMode] = useState<'paper' | 'live'>('paper');

  const handleExecute = async (paperTrade: boolean) => {
    if (!onExecute) return;

    setIsExecuting(true);
    try {
      await onExecute(suggestion.id, paperTrade);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Execution error:', error);
      alert('Failed to execute trade. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  const riskRewardRatio = suggestion.takeProfit && suggestion.stopLoss
    ? ((suggestion.takeProfit - suggestion.entry) / (suggestion.entry - suggestion.stopLoss)).toFixed(2)
    : 'N/A';

  const expectedROI = ((suggestion.expectedPnL / suggestion.size) * 100).toFixed(2);

  return (
    <div className="glass-card rounded-xl p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {suggestion.token} Trade Suggestion
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                suggestion.confidence > 0.7
                  ? 'bg-green-100 text-green-800'
                  : suggestion.confidence > 0.5
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {Math.round(suggestion.confidence * 100)}% confidence
            </span>
          </div>
          {signal && (
            <p className="text-sm text-gray-600">
              Signal from <span className="font-medium">{signal.influencer}</span>
            </p>
          )}
        </div>
        {onEdit && (
          <button
            onClick={() => onEdit(suggestion)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Trade Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-500 mb-1">Entry Price</div>
          <div className="text-lg font-semibold text-gray-900">
            ${suggestion.entry.toFixed(4)}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs text-gray-500 mb-1">Position Size</div>
          <div className="text-lg font-semibold text-gray-900">
            ${suggestion.size.toFixed(2)}
          </div>
        </div>
        <div className="bg-red-50 rounded p-3">
          <div className="text-xs text-red-600 mb-1">Stop Loss</div>
          <div className="text-lg font-semibold text-red-700">
            ${suggestion.stopLoss.toFixed(4)}
          </div>
        </div>
        <div className="bg-green-50 rounded p-3">
          <div className="text-xs text-green-600 mb-1">Take Profit</div>
          <div className="text-lg font-semibold text-green-700">
            ${suggestion.takeProfit.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Route & Metrics */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Route:</span>
            {suggestion.route.type === 'Jupiter' && (
              <img src="/images/jupiter.jpg" alt="Jupiter" className="w-5 h-5 rounded" />
            )}
            {suggestion.route.type === 'Raydium' && (
              <img src="/images/radiyum.jpg" alt="Raydium" className="w-5 h-5 rounded" />
            )}
            {suggestion.route.type === 'CEX' && (
              <img src="/images/binance.jpg" alt="CEX" className="w-5 h-5 rounded" />
            )}
            <span className="font-medium text-gray-900">{suggestion.route.type}</span>
          </div>
          <div>
            <span className="text-gray-500">Slippage:</span>{' '}
            <span className="font-medium text-gray-900">
              {suggestion.expectedSlippage.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">R:R:</span>{' '}
            <span className="font-medium text-gray-900">{riskRewardRatio}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-500 text-xs">Expected P&L</div>
          <div
            className={`text-lg font-bold ${
              suggestion.expectedPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {suggestion.expectedPnL >= 0 ? '+' : ''}${suggestion.expectedPnL.toFixed(2)} ({expectedROI}%)
          </div>
        </div>
      </div>

      {/* Rationale */}
      <div className="bg-blue-50 rounded p-3 mb-4">
        <div className="text-xs text-blue-800 font-medium mb-1">Rationale</div>
        <div className="text-sm text-blue-900">{suggestion.rationale}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setExecutionMode('paper');
            setShowConfirmModal(true);
          }}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          📊 Paper Trade
        </button>
        <button
          onClick={() => {
            setExecutionMode('live');
            setShowConfirmModal(true);
          }}
          disabled={!userWallet}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          ⚡ Execute
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="glass-panel rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {executionMode === 'paper' ? 'Paper Trade' : 'Execute Trade'}
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-medium">{suggestion.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entry:</span>
                <span className="font-medium">${suggestion.entry.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">${suggestion.size.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-medium">{suggestion.route.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Fee:</span>
                <span className="font-medium">${suggestion.route.estimatedFee.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Slippage:</span>
                <span className="font-medium">{suggestion.expectedSlippage.toFixed(2)}%</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Total Cost:</span>
                  <span className="font-bold text-lg">
                    ${(suggestion.size + suggestion.route.estimatedFee).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            {executionMode === 'live' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <div className="text-sm text-yellow-800">
                  ⚠️ This will execute a real trade on-chain. Make sure you have sufficient funds
                  and understand the risks.
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecute(executionMode === 'paper')}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {isExecuting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

