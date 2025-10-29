'use client';

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
}

export function SignalFeed({ signals, loading = false, onRefresh }: SignalFeedProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Live Signals</h2>
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
            <div
              key={signal.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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

              {signal.tweet_url && (
                <a
                  href={signal.tweet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                >
                  View Tweet →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
