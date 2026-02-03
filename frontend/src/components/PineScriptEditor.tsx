'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { pineScriptApi, strategyApi, strategyMicrochainApi } from '@/lib/api';

interface PineScriptEditorProps {
  strategyId?: string;
  initialCode?: string;
  onSave?: (code: string) => void;
}

export default function PineScriptEditor({ strategyId, initialCode = '', onSave }: PineScriptEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [errors, setErrors] = useState<string[]>([]);
  const [compiling, setCompiling] = useState(false);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [showBacktest, setShowBacktest] = useState(false);

  const defaultCode = `//@version=5
strategy("My Strategy", overlay=true)

// Simple Moving Average Crossover Strategy
fastLength = 10
slowLength = 20

fastMA = ta.sma(close, fastLength)
slowMA = ta.sma(close, slowLength)

// Buy when fast MA crosses above slow MA
if ta.crossover(fastMA, slowMA)
    strategy.entry("Long", strategy.long)

// Sell when fast MA crosses below slow MA
if ta.crossunder(fastMA, slowMA)
    strategy.close("Long")

// Plot MAs
plot(fastMA, color=color.blue, title="Fast MA")
plot(slowMA, color=color.red, title="Slow MA")
`;

  useEffect(() => {
    if (!code) {
      setCode(defaultCode);
    }
  }, []);

  const validateCode = async () => {
    setCompiling(true);
    setErrors([]);

    try {
      const result = await pineScriptApi.validate(code);

      if (result.valid) {
        setErrors([]);
        alert('Code is valid!');
      } else {
        setErrors(result.errors);
      }
    } catch (error: any) {
      setErrors([error.message || 'Validation failed']);
    } finally {
      setCompiling(false);
    }
  };

  const compileCode = async () => {
    setCompiling(true);
    setErrors([]);

    try {
      const result = await pineScriptApi.compile(code);

      if (result.success) {
        setErrors([]);
        alert('Compilation successful!');
        if (onSave) {
          onSave(code);
        }
      } else {
        setErrors(result.errors);
      }
    } catch (error: any) {
      setErrors([error.message || 'Compilation failed']);
    } finally {
      setCompiling(false);
    }
  };

  const saveStrategy = async () => {
    if (!code) return;

    try {
      let savedStrategyId = strategyId;
      if (strategyId) {
        await strategyApi.update(strategyId, { code });
      } else {
        const result = await strategyApi.create({
          name: 'New PineScript Strategy',
          type: 'PINESCRIPT',
          code,
        });
        savedStrategyId = result.id;
      }
      alert('Strategy saved!');
      if (onSave) {
        onSave(code);
      }
      // Update strategyId for future operations
      if (!strategyId && savedStrategyId) {
        window.location.href = `/strategies?id=${savedStrategyId}&mode=pinescript`;
      }
    } catch (error) {
      console.error('Failed to save strategy:', error);
      alert('Failed to save strategy');
    }
  };

  const deployStrategy = async () => {
    if (!strategyId) {
      alert('Please save the strategy first');
      return;
    }

    setCompiling(true);
    try {
      // First deploy the strategy to Linera via the legacy endpoint
      const result = await strategyApi.deploy(strategyId);

      // Also register deployment with the microchain service so it can
      // track microchains, orders, and analytics for this (demo) user.
      const userId = 'demo_user';
      const microchainResult = await strategyMicrochainApi.deployToMicrochain(
        strategyId,
        userId
      );

      console.log('Deployment result:', result, microchainResult);
      alert('Strategy deployed to Linera microchain and registered with microchain service!');
    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed');
    } finally {
      setCompiling(false);
    }
  };

  const runBacktest = async () => {
    if (!strategyId) {
      alert('Please save the strategy first');
      return;
    }

    setCompiling(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 months back

      const results = await strategyApi.backtest(strategyId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        initialCapital: 10000,
      });

      setBacktestResults(results);
      setShowBacktest(true);
    } catch (error) {
      console.error('Backtest failed:', error);
      alert('Backtest failed');
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">PineScript Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={validateCode}
            disabled={compiling}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Validate
          </button>
          <button
            onClick={compileCode}
            disabled={compiling}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Compile
          </button>
          <button
            onClick={saveStrategy}
            disabled={compiling}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Save
          </button>
          <button
            onClick={runBacktest}
            disabled={compiling || !strategyId}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Backtest
          </button>
          <button
            onClick={deployStrategy}
            disabled={compiling || !strategyId}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-700 text-white rounded-lg transition-colors font-semibold"
          >
            🚀 Deploy to Microchain
          </button>
        </div>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-900 border-b border-red-700">
          <h3 className="text-sm font-medium text-red-200 mb-2">Errors:</h3>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-300">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Backtest Results */}
      {showBacktest && backtestResults && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Backtest Results</h3>
            <button
              onClick={() => setShowBacktest(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Total Trades</div>
              <div className="text-xl font-bold text-white">
                {backtestResults.performance.totalTrades}
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-xl font-bold text-green-400">
                {backtestResults.performance.winRate.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Total Return</div>
              <div className={`text-xl font-bold ${backtestResults.performance.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                {backtestResults.performance.totalReturn.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Sharpe Ratio</div>
              <div className="text-xl font-bold text-white">
                {backtestResults.performance.sharpeRatio.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Max Drawdown</div>
              <div className="text-xl font-bold text-red-400">
                {backtestResults.performance.maxDrawdown.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Winning Trades</div>
              <div className="text-xl font-bold text-green-400">
                {backtestResults.performance.winningTrades}
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Losing Trades</div>
              <div className="text-xl font-bold text-red-400">
                {backtestResults.performance.losingTrades}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
