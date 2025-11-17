'use client';

import { useState } from 'react';
import { SuggestionCard, SuggestedTrade } from './SuggestionCard';

interface Signal {
  id: number;
  influencer: string;
  token: string;
  sentiment: string;
  confidence: number;
  timestamp: number;
  tweet_url: string;
}

interface SignalFeedProps {
  signals: Signal[];
  loading?: boolean;
  onRefresh?: () => void;
  userWallet?: string;
}

export function SignalFeed({ signals, loading = false, onRefresh, userWallet }: SignalFeedProps) {
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Map<number, SuggestedTrade[]>>(new Map());
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<number>>(new Set());
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish':
        return 'bg-green-100 text-green-800';
      case 'bearish':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const loadSuggestions = async (signalId: number) => {
    if (suggestions.has(signalId) || loadingSuggestions.has(signalId)) {
      return;
    }

    setLoadingSuggestions((prev) => new Set(prev).add(signalId));

    try {
      const response = await fetch(`/api/suggestions?signal_id=${signalId}`);
      if (!response.ok) throw new Error('Failed to load suggestions');
      const data = await response.json();
      setSuggestions((prev) => new Map(prev).set(signalId, data));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoadingSuggestions((prev) => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
    }
  };

  const handleSignalClick = (signalId: number) => {
    if (expandedSignal === signalId) {
      setExpandedSignal(null);
    } else {
      setExpandedSignal(signalId);
      loadSuggestions(signalId);
    }
  };

  const handleExecute = async (suggestionId: string, paperTrade: boolean) => {
    const signalId = expandedSignal;
    if (!signalId) return;

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/execute?signal_id=${signalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_wallet: userWallet,
          execution_mode: 'wallet_signed',
          paper_trade: paperTrade,
        }),
      });

      if (!response.ok) throw new Error('Execution failed');
      const result = await response.json();

      if (paperTrade) {
        alert('Paper trade recorded successfully!');
      } else {
        alert(`Order created! Order ID: ${result.orderId}`);
      }
    } catch (error) {
      console.error('Execution error:', error);
      throw error;
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Live Signals</h2>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh signals"
            >
              🔄 Refresh
            </button>
          )}
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading && signals.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500">Loading signals...</p>
          </div>
        ) : signals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No signals yet</p>
        ) : (
          signals.map((signal) => (
            <div key={signal.id} className="space-y-2">
              <div
                onClick={() => handleSignalClick(signal.id)}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">@{signal.influencer}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(
                      signal.sentiment
                    )}`}
                  >
                    {signal.sentiment}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{signal.token}</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(signal.confidence)}`}>
                    {(signal.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  {signal.tweet_url && (
                    <a
                      href={signal.tweet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View Tweet →
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignalClick(signal.id);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {expandedSignal === signal.id ? '▼ Hide Suggestions' : '▶ View Suggestions'}
                  </button>
                </div>
              </div>

              {/* Suggestions Panel */}
              {expandedSignal === signal.id && (
                <div className="ml-4 border-l-2 border-purple-200 pl-4 space-y-3">
                  {loadingSuggestions.has(signal.id) ? (
                    <div className="text-center py-4">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Generating suggestions...</p>
                    </div>
                  ) : suggestions.has(signal.id) ? (
                    suggestions.get(signal.id)!.length > 0 ? (
                      suggestions.get(signal.id)!.map((suggestion) => (
                        <SuggestionCard
                          key={suggestion.id}
                          suggestion={suggestion}
                          signal={{
                            influencer: signal.influencer,
                            token: signal.token,
                            tweetUrl: signal.tweet_url,
                          }}
                          onExecute={handleExecute}
                          userWallet={userWallet}
                        />
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 py-4 text-center">
                        No trading suggestions available for this signal
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      Click to load suggestions
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
