'use client';

import { useState, useEffect } from 'react';
import { dexApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

interface Quote {
  dex: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  route?: string[];
}

export default function TradingInterface() {
  const [inputToken, setInputToken] = useState('SOL');
  const [outputToken, setOutputToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [priorityFee, setPriorityFee] = useState<'vh' | 'h' | 'm' | 'custom'>('h');
  const [customFee, setCustomFee] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedDex, setSelectedDex] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    wsClient.connect();
    
    const handlePriceUpdate = (feed: any) => {
      setCurrentPrice(feed.price);
    };

    wsClient.subscribeToPrice(`${inputToken}/${outputToken}`, handlePriceUpdate);

    return () => {
      wsClient.unsubscribeFromPrice(`${inputToken}/${outputToken}`, handlePriceUpdate);
    };
  }, [inputToken, outputToken]);

  const fetchQuotes = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      const result = await dexApi.compareQuotes({
        inputToken,
        outputToken,
        amount: parseFloat(amount),
        slippageBps: slippage * 100,
      });

      setQuotes(result.quotes);
      if (result.bestDex) {
        setSelectedDex(result.bestDex);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!selectedDex || !amount) return;

    setLoading(true);
    try {
      const priorityFeeValue = priorityFee === 'custom' 
        ? parseInt(customFee) 
        : undefined;

      await dexApi.executeSwap({
        dex: selectedDex as any,
        inputToken,
        outputToken,
        amount: parseFloat(amount),
        slippageBps: slippage * 100,
        priorityFee: priorityFeeValue,
      });

      alert('Swap executed successfully!');
      setAmount('');
      setQuotes([]);
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Swap Tokens</h2>

      {/* Input Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          From
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="Token symbol"
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            placeholder="Amount"
          />
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Balance: {balance.toFixed(4)} {inputToken}
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={swapTokens}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          To
        </label>
        <input
          type="text"
          value={outputToken}
          onChange={(e) => setOutputToken(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          placeholder="Token symbol"
        />
        {currentPrice > 0 && (
          <div className="text-sm text-gray-400 mt-1">
            Current Price: {currentPrice.toFixed(6)}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Settings</h3>
        
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">
            Slippage Tolerance: {slippage}%
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Priority Fee
          </label>
          <div className="flex gap-2">
            {(['vh', 'h', 'm'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setPriorityFee(level)}
                className={`px-3 py-1 rounded ${
                  priorityFee === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => setPriorityFee('custom')}
              className={`px-3 py-1 rounded ${
                priorityFee === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Custom
            </button>
          </div>
          {priorityFee === 'custom' && (
            <input
              type="number"
              value={customFee}
              onChange={(e) => setCustomFee(e.target.value)}
              className="mt-2 w-full px-3 py-1 bg-gray-700 text-white rounded border border-gray-600"
              placeholder="Enter fee in lamports"
            />
          )}
        </div>
      </div>

      {/* Get Quotes Button */}
      <button
        onClick={fetchQuotes}
        disabled={loading || !amount}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors mb-4"
      >
        {loading ? 'Loading...' : 'Get Quotes'}
      </button>

      {/* Quotes Comparison */}
      {quotes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-white mb-3">DEX Comparison</h3>
          <div className="space-y-2">
            {quotes.map((quote, index) => (
              <div
                key={index}
                onClick={() => setSelectedDex(quote.dex)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedDex === quote.dex
                    ? 'bg-blue-600 border-2 border-blue-400'
                    : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-white">{quote.dex}</div>
                    <div className="text-sm text-gray-400">
                      {quote.route && `Route: ${quote.route.join(' → ')}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {quote.outputAmount.toFixed(6)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Impact: {quote.priceImpact.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-400">
                      Fee: {quote.fee.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execute Swap Button */}
      {selectedDex && (
        <button
          onClick={executeSwap}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Executing...' : `Swap on ${selectedDex}`}
        </button>
      )}
    </div>
  );
}
