'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { dexApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientText } from '@/components/ui/GradientText';
import { SafetyConfigPanel } from '@/components/SafetyConfigPanel';
import { PredictionMarkets } from '@/components/PredictionMarkets';
import { AdvancedOrderForm } from '@/components/AdvancedOrderForm';

interface Quote {
  dex: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  fee: number;
  route?: string[];
}

type TabType = 'swap' | 'safety' | 'advanced' | 'markets';

export default function TradingInterface() {
  const [activeTab, setActiveTab] = useState<TabType>('swap');
  const [inputToken, setInputToken] = useState('SOL');
  const [outputToken, setOutputToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [priorityFee, setPriorityFee] = useState<'vh' | 'h' | 'm' | 'custom'>('h');
  const [customFee, setCustomFee] = useState('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedDex, setSelectedDex] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [balance] = useState<number>(10.5432);
  const [currentPrice, setCurrentPrice] = useState<number>(145.23);

  const containerRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.trade-panel',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

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

      setQuotes(result.quotes || []);
      if (result.bestDex) {
        setSelectedDex(result.bestDex);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      // Mock data for demo
      setQuotes([
        { dex: 'Jupiter', inputAmount: parseFloat(amount), outputAmount: parseFloat(amount) * 145.23, priceImpact: 0.12, fee: 0.0025 },
        { dex: 'Raydium', inputAmount: parseFloat(amount), outputAmount: parseFloat(amount) * 144.98, priceImpact: 0.18, fee: 0.003 },
      ]);
      setSelectedDex('Jupiter');
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

      // Success animation
      gsap.fromTo('.swap-success',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );

      setAmount('');
      setQuotes([]);
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const swapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'swap', label: 'Swap', icon: '🔄' },
    { id: 'advanced', label: 'Advanced', icon: '⚡' },
    { id: 'safety', label: 'Safety', icon: '🛡️' },
    { id: 'markets', label: 'Markets', icon: '🔮' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050810]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[80px]" />
        <div className="grid-bg absolute inset-0 opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold gradient-text">ReaX</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/trading" className="text-white font-medium">Trading</Link>
              <Link href="/strategies" className="text-gray-400 hover:text-white transition-colors">Strategies</Link>
              <Link href="/social" className="text-gray-400 hover:text-white transition-colors">Social</Link>
              <Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">Analytics</Link>
            </div>
            <div className="badge badge-success">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Connected
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 trade-panel">
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Trading Terminal</GradientText>
            </h1>
            <p className="text-gray-400">Execute trades across multiple DEXs with advanced features</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8 trade-panel">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'glass text-gray-400 hover:text-white'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Panel */}
            <div className="lg:col-span-2">
              {activeTab === 'swap' && (
                <GlassCard className="p-8 trade-panel">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">🔄</span> Swap Tokens
                  </h2>

                  {/* Input Token */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-3">From</label>
                    <div className="glass rounded-xl p-4">
                      <div className="flex gap-4 mb-2">
                        <input
                          type="text"
                          value={inputToken}
                          onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                          className="w-24 bg-transparent text-xl font-bold text-white focus:outline-none"
                          placeholder="Token"
                        />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="flex-1 bg-transparent text-2xl text-right font-mono text-white focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Balance: {balance.toFixed(4)} {inputToken}</span>
                        <button
                          onClick={() => setAmount(balance.toString())}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="flex justify-center my-4">
                    <button
                      onClick={swapTokens}
                      className="p-3 glass rounded-full hover:bg-white/10 transition-colors group"
                    >
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* Output Token */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-3">To</label>
                    <div className="glass rounded-xl p-4">
                      <div className="flex gap-4 mb-2">
                        <input
                          type="text"
                          value={outputToken}
                          onChange={(e) => setOutputToken(e.target.value.toUpperCase())}
                          className="w-24 bg-transparent text-xl font-bold text-white focus:outline-none"
                          placeholder="Token"
                        />
                        <div className="flex-1 text-2xl text-right font-mono text-gray-400">
                          {quotes.length > 0 && selectedDex
                            ? quotes.find(q => q.dex === selectedDex)?.outputAmount.toFixed(4)
                            : '0.00'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        1 {inputToken} ≈ {currentPrice.toFixed(4)} {outputToken}
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="glass rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Settings</h3>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Slippage Tolerance</span>
                        <span className="text-white font-mono">{slippage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div>
                      <span className="text-sm text-gray-400 block mb-2">Priority Fee</span>
                      <div className="flex gap-2">
                        {(['vh', 'h', 'm'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setPriorityFee(level)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priorityFee === level
                              ? 'bg-purple-600 text-white'
                              : 'glass text-gray-400 hover:text-white'
                              }`}
                          >
                            {level === 'vh' ? 'Very High' : level === 'h' ? 'High' : 'Medium'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <GlowButton
                      variant="secondary"
                      size="lg"
                      onClick={fetchQuotes}
                      disabled={loading || !amount}
                      className="w-full"
                    >
                      {loading ? 'Loading...' : 'Get Quotes'}
                    </GlowButton>

                    {quotes.length > 0 && (
                      <GlowButton
                        variant="primary"
                        size="lg"
                        onClick={executeSwap}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Executing...' : `Swap on ${selectedDex}`}
                      </GlowButton>
                    )}
                  </div>
                </GlassCard>
              )}

              {activeTab === 'advanced' && (
                <div className="trade-panel">
                  <AdvancedOrderForm strategyId={1} />
                </div>
              )}

              {activeTab === 'safety' && (
                <div className="trade-panel">
                  <SafetyConfigPanel owner="default-user" />
                </div>
              )}

              {activeTab === 'markets' && (
                <div className="trade-panel">
                  <PredictionMarkets userId="default-user" />
                </div>
              )}
            </div>

            {/* Side Panel - DEX Comparison */}
            <div className="trade-panel">
              <GlassCard className="p-6 sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>📊</span> DEX Comparison
                </h3>

                {quotes.length > 0 ? (
                  <div className="space-y-3">
                    {quotes.map((quote, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDex(quote.dex)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedDex === quote.dex
                          ? 'bg-purple-600/20 border border-purple-500/50'
                          : 'glass hover:bg-white/5'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-white">{quote.dex}</div>
                          {index === 0 && (
                            <span className="badge badge-success text-xs">Best</span>
                          )}
                        </div>
                        <div className="text-xl font-mono text-white mb-1">
                          {quote.outputAmount.toFixed(4)}
                        </div>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>Impact: {quote.priceImpact.toFixed(2)}%</span>
                          <span>Fee: {(quote.fee * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-4">📈</p>
                    <p>Enter an amount to get quotes</p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-4">Market Info</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">24h Volume</span>
                      <span className="text-white font-mono">$2.4M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Liquidity</span>
                      <span className="text-white font-mono">$12.5M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trades (24h)</span>
                      <span className="text-white font-mono">1,247</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
