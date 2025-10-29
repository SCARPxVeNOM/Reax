'use client';

import { useState } from 'react';

interface BacktestResult {
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
}

export function BacktestingUI() {
  const [strategyId, setStrategyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    if (!strategyId || !startDate || !endDate) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: parseInt(strategyId),
          startDate,
          endDate,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Backtest error:', error);
      alert('Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-800 font-semibold">
          ⚠️ SIMULATED RESULTS - FOR EDUCATIONAL PURPOSES ONLY
        </p>
        <p className="text-yellow-700 text-sm mt-1">
          Backtesting results do not guarantee future performance. Past performance is not indicative of future results.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Strategy Backtesting</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Strategy ID</label>
            <input
              type="number"
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="Enter strategy ID"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={runBacktest}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
          >
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </button>
        </div>

        {result && (
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold mb-4">Backtest Results (SIMULATED)</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Return</p>
                <p className={`text-2xl font-bold ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.totalReturn.toFixed(2)}%
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.winRate.toFixed(2)}%
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-800">
                  {result.totalTrades}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Max Drawdown</p>
                <p className="text-2xl font-bold text-red-600">
                  {result.maxDrawdown.toFixed(2)}%
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {result.sharpeRatio.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 These are simulated results based on historical data. Actual trading results may vary significantly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
